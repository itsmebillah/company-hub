import "server-only";

import { CurrentCompanyContextService } from "@/features/auth/services/current-company-context.service";
import { CurrentEmployeeContextService } from "@/features/auth/services/current-employee-context.service";
import type { CelebrationPreferenceValues } from "@/features/company-settings/types/company-settings.types";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAppTimeZone,
  getTimeZoneDateString,
  getTimeZoneHour,
  normalizeTimeZone,
} from "@/lib/datetime";
import type {
  CelebrationCompanyContext,
  CelebrationDashboardData,
  CelebrationItem,
  CelebrationSchedulerResult,
} from "@/features/celebrations/types/celebration.types";

const CELEBRATION_PROCESSING_HOUR = 0;
const CELEBRATION_NOTIFICATION_PRIORITY = "high" as const;

type CelebrationCompanySettingsRow = {
  company_id: string;
  company_name: string | null;
  timezone: string | null;
  notification_preferences: unknown;
};

type CelebrationRpcRow = {
  employee_uuid: string;
  employee_code: string;
  employee_name: string;
  company_uuid: string;
  event_type: CelebrationItem["eventType"];
  source_date: string;
  years_completed: number | null;
};

type CelebrationNotificationChannels = {
  browserEnabled: boolean;
  realtimeEnabled: boolean;
  nativeEnabled: boolean;
};

function getDefaultCelebrationSettings(): CelebrationPreferenceValues {
  return {
    enableBirthdays: true,
    enableWorkAnniversaries: true,
    notifyCompany: false,
    notifyEmployee: true,
    enableBrowserNotification: true,
    enableRealtimeNotification: true,
    enableNativeNotification: true,
  };
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCelebrationSettings(
  value: unknown,
): CelebrationPreferenceValues {
  const defaults = getDefaultCelebrationSettings();
  const input =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    enableBirthdays: toBoolean(input.enableBirthdays, defaults.enableBirthdays),
    enableWorkAnniversaries: toBoolean(
      input.enableWorkAnniversaries,
      defaults.enableWorkAnniversaries,
    ),
    notifyCompany: toBoolean(input.notifyCompany, defaults.notifyCompany),
    notifyEmployee: toBoolean(input.notifyEmployee, defaults.notifyEmployee),
    enableBrowserNotification: toBoolean(
      input.enableBrowserNotification,
      defaults.enableBrowserNotification,
    ),
    enableRealtimeNotification: toBoolean(
      input.enableRealtimeNotification,
      defaults.enableRealtimeNotification,
    ),
    enableNativeNotification: toBoolean(
      input.enableNativeNotification,
      defaults.enableNativeNotification,
    ),
  };
}

function getCelebrationSettingsFromPreferences(
  value: unknown,
): CelebrationPreferenceValues {
  if (!value || typeof value !== "object") {
    return getDefaultCelebrationSettings();
  }

  const input = value as Record<string, unknown>;

  return normalizeCelebrationSettings(input.celebrations);
}

function toCelebrationDashboardData(
  celebrations: CelebrationItem[],
): CelebrationDashboardData {
  return {
    birthdays: celebrations.filter((item) => item.eventType === "birthday"),
    workAnniversaries: celebrations.filter(
      (item) => item.eventType === "work_anniversary",
    ),
  };
}

function buildNotificationChannels(
  settings: CelebrationPreferenceValues,
): CelebrationNotificationChannels {
  const browserEnabled = settings.enableBrowserNotification;
  const nativeEnabled = settings.enableNativeNotification;

  return {
    browserEnabled,
    nativeEnabled,
    realtimeEnabled:
      settings.enableRealtimeNotification || browserEnabled || nativeEnabled,
  };
}

function getEmployeeCelebrationNotification(celebration: CelebrationItem) {
  if (celebration.eventType === "birthday") {
    return {
      title: "Happy Birthday!",
      message: `Happy Birthday, ${celebration.employeeName}! Have a wonderful year ahead!`,
    };
  }

  const yearsLabel =
    celebration.yearsCompleted === 1
      ? "1 successful year"
      : `${celebration.yearsCompleted} successful years`;

  return {
    title: "Happy Work Anniversary!",
    message: `Congratulations on ${yearsLabel} with Company Hub!`,
  };
}

function getCompanyCelebrationNotification(
  celebration: CelebrationItem,
  companyName: string,
) {
  if (celebration.eventType === "birthday") {
    return {
      title: "Birthday Celebration",
      message: `Today is ${celebration.employeeName}'s birthday at ${companyName}. Send your wishes!`,
    };
  }

  const yearsLabel =
    celebration.yearsCompleted === 1
      ? "1 year"
      : `${celebration.yearsCompleted} years`;

  return {
    title: "Work Anniversary",
    message: `${celebration.employeeName} is celebrating ${yearsLabel} with ${companyName} today.`,
  };
}

function isCelebrationEnabled(
  celebration: CelebrationItem,
  settings: CelebrationPreferenceValues,
) {
  if (celebration.eventType === "birthday") {
    return settings.enableBirthdays;
  }

  return settings.enableWorkAnniversaries;
}

async function getCompanyCelebrationContext(
  companyId: string,
  companyNameFallback?: string,
): Promise<CelebrationCompanyContext> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("company_id, company_name, timezone, notification_preferences")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.error(
      "[CelebrationService] Unable to load company celebration settings.",
      error,
    );
    throw new Error("Unable to load celebration settings.");
  }

  const row = data as CelebrationCompanySettingsRow | null;

  return {
    companyId,
    companyName: row?.company_name ?? companyNameFallback ?? "Company Hub",
    timezone: normalizeTimeZone(row?.timezone ?? getAppTimeZone()),
    settings: getCelebrationSettingsFromPreferences(row?.notification_preferences),
  };
}

async function listCelebrationsForCompany(
  companyId: string,
  localDate: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("get_company_celebrants", {
    target_company_id: companyId,
    target_date: localDate,
  });

  if (error) {
    console.error("[CelebrationService] Unable to load company celebrants.", error);
    throw new Error("Unable to load celebrations.");
  }

  return (data as CelebrationRpcRow[]).map(
    (row): CelebrationItem => ({
      employeeId: row.employee_uuid,
      employeeCode: row.employee_code,
      employeeName: row.employee_name,
      eventType: row.event_type,
      sourceDate: row.source_date,
      yearsCompleted: row.years_completed,
    }),
  );
}

async function listActiveCompanyRecipients(companyId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (error) {
    console.error("[CelebrationService] Unable to load company recipients.", error);
    throw new Error("Unable to load celebration recipients.");
  }

  return data;
}

async function getExistingCelebrationKeys(
  companyId: string,
  eventYear: number,
  celebrations: CelebrationItem[],
) {
  if (celebrations.length === 0) {
    return new Set<string>();
  }

  const supabase = createSupabaseAdminClient();
  const employeeIds = Array.from(
    new Set(celebrations.map((celebration) => celebration.employeeId)),
  );

  const { data, error } = await supabase
    .from("employee_celebration_events")
    .select("employee_id, event_type")
    .eq("company_id", companyId)
    .eq("event_year", eventYear)
    .in("employee_id", employeeIds);

  if (error) {
    console.error(
      "[CelebrationService] Unable to load existing celebration events.",
      error,
    );
    throw new Error("Unable to load celebration events.");
  }

  return new Set(
    data.map((row) => `${row.employee_id}:${row.event_type}:${eventYear}`),
  );
}

export const CelebrationService = {
  async getEmployeeDashboardCelebrations(): Promise<CelebrationDashboardData> {
    const employee = await CurrentEmployeeContextService.requireCurrentEmployeeContext();
    const companyContext = await getCompanyCelebrationContext(employee.companyId);
    const localDate = getTimeZoneDateString(companyContext.timezone);
    const celebrations = (await listCelebrationsForCompany(
      employee.companyId,
      localDate,
    )).filter((celebration) =>
      isCelebrationEnabled(celebration, companyContext.settings),
    );

    return toCelebrationDashboardData(celebrations);
  },

  async getAdminDashboardCelebrations(
    companyIdOverride?: string,
  ): Promise<CelebrationDashboardData> {
    const companyId =
      companyIdOverride ??
      (await CurrentCompanyContextService.requireCurrentCompanyId());
    const companyContext = await getCompanyCelebrationContext(companyId);
    const localDate = getTimeZoneDateString(companyContext.timezone);
    const celebrations = (await listCelebrationsForCompany(
      companyId,
      localDate,
    )).filter((celebration) =>
      isCelebrationEnabled(celebration, companyContext.settings),
    );

    return toCelebrationDashboardData(celebrations);
  },

  async runScheduledCelebrations(
    executionTime: Date = new Date(),
  ): Promise<CelebrationSchedulerResult> {
    const supabase = createSupabaseAdminClient();
    const [companiesResult, settingsResult] = await Promise.all([
      supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active"),
      supabase
        .from("company_settings")
        .select("company_id, company_name, timezone, notification_preferences")
        .eq("status", "active"),
    ]);

    if (companiesResult.error || settingsResult.error) {
      console.error("[CelebrationService] Unable to load scheduler companies.", {
        companiesError: companiesResult.error,
        settingsError: settingsResult.error,
      });
      throw new Error("Unable to schedule celebrations.");
    }

    const settingsByCompanyId = new Map(
      settingsResult.data.map((row) => [row.company_id, row]),
    );

    const result: CelebrationSchedulerResult = {
      processedCompanies: 0,
      skippedCompanies: 0,
      createdEvents: 0,
      createdNotifications: 0,
    };

    for (const company of companiesResult.data) {
      const settingsRow = settingsByCompanyId.get(company.id);
      const companyContext: CelebrationCompanyContext = {
        companyId: company.id,
        companyName: settingsRow?.company_name ?? company.name,
        timezone: normalizeTimeZone(settingsRow?.timezone ?? getAppTimeZone()),
        settings: getCelebrationSettingsFromPreferences(
          settingsRow?.notification_preferences,
        ),
      };

      if (
        getTimeZoneHour(companyContext.timezone, executionTime) !==
        CELEBRATION_PROCESSING_HOUR
      ) {
        result.skippedCompanies += 1;
        continue;
      }

      result.processedCompanies += 1;

      const localDate = getTimeZoneDateString(companyContext.timezone, executionTime);
      const localYear = Number(localDate.slice(0, 4));
      const celebrations = (await listCelebrationsForCompany(
        companyContext.companyId,
        localDate,
      )).filter((celebration) =>
        isCelebrationEnabled(celebration, companyContext.settings),
      );

      if (celebrations.length === 0) {
        continue;
      }

      const existingKeys = await getExistingCelebrationKeys(
        companyContext.companyId,
        localYear,
        celebrations,
      );
      const recipients = companyContext.settings.notifyCompany
        ? await listActiveCompanyRecipients(companyContext.companyId)
        : [];
      const eventRows: Array<{
        company_id: string;
        employee_id: string;
        event_type: CelebrationItem["eventType"];
        event_year: number;
        celebration_date: string;
        notification_count: number;
      }> = [];

      for (const celebration of celebrations) {
        const celebrationKey = `${celebration.employeeId}:${celebration.eventType}:${localYear}`;

        if (existingKeys.has(celebrationKey)) {
          continue;
        }

        const channels = buildNotificationChannels(companyContext.settings);
        let createdNotifications = 0;

        if (companyContext.settings.notifyEmployee) {
          const notification = getEmployeeCelebrationNotification(celebration);

          await NotificationService.create({
            companyId: companyContext.companyId,
            employeeId: celebration.employeeId,
            type: "celebration",
            priority: CELEBRATION_NOTIFICATION_PRIORITY,
            title: notification.title,
            message: notification.message,
            actionUrl: "/dashboard",
            browserEnabled: channels.browserEnabled,
            realtimeEnabled: channels.realtimeEnabled,
            nativeEnabled: channels.nativeEnabled,
          });
          createdNotifications += 1;
        }

        if (companyContext.settings.notifyCompany) {
          const companyRecipients = recipients
            .filter((recipient) => recipient.id !== celebration.employeeId)
            .map((recipient) => ({ id: recipient.id }));

          if (companyRecipients.length > 0) {
            const notification = getCompanyCelebrationNotification(
              celebration,
              companyContext.companyName,
            );

            await NotificationService.createForRecipients(
              {
                companyId: companyContext.companyId,
                type: "celebration",
                priority: CELEBRATION_NOTIFICATION_PRIORITY,
                title: notification.title,
                message: notification.message,
                actionUrl: "/dashboard",
                browserEnabled: channels.browserEnabled,
                realtimeEnabled: channels.realtimeEnabled,
                nativeEnabled: channels.nativeEnabled,
              },
              companyRecipients,
            );
            createdNotifications += companyRecipients.length;
          }
        }

        if (createdNotifications === 0) {
          continue;
        }

        eventRows.push({
          company_id: companyContext.companyId,
          employee_id: celebration.employeeId,
          event_type: celebration.eventType,
          event_year: localYear,
          celebration_date: localDate,
          notification_count: createdNotifications,
        });
        result.createdEvents += 1;
        result.createdNotifications += createdNotifications;
      }

      if (eventRows.length > 0) {
        const { error } = await supabase
          .from("employee_celebration_events")
          .insert(eventRows);

        if (error) {
          console.error(
            "[CelebrationService] Unable to store celebration events.",
            error,
          );
          throw new Error("Unable to save celebration events.");
        }
      }
    }

    return result;
  },
};
