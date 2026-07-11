import "server-only";

import { cache } from "react";

import { getAttendancePolicyOption } from "@/features/attendance/constants/attendance-policy-options";
import { AttendancePolicyRepository } from "@/features/attendance/repositories/attendance-policy.repository";
import { AttendanceRepository } from "@/features/attendance/repositories/attendance.repository";
import { findNearestCompanyLocation } from "@/features/attendance/utils/gps";
import type {
  AttendanceActionState,
  AttendanceAllowedLocation,
  AttendanceGpsInput,
  AttendancePolicyMode,
  AttendancePolicySummary,
  AttendanceType,
  AttendanceSettingsValues,
  CompanyLocation,
  EmployeeWorkMode,
} from "@/features/attendance/types/attendance.types";

type AttendancePolicyEvaluation = AttendanceActionState & {
  gps: AttendanceGpsInput | null;
  location: CompanyLocation | null;
};

type StrategyContext = {
  companyId: string;
  employeeId: string;
  settings: AttendanceSettingsValues;
  gps: AttendanceGpsInput | undefined;
  getAssignedLocations: () => Promise<CompanyLocation[]>;
  getCompanyLocations: () => Promise<CompanyLocation[]>;
};

type AttendancePolicyStrategy = {
  summarize: (context: StrategyContext) => Promise<AttendanceAllowedLocation[]>;
  validate: (context: StrategyContext) => Promise<AttendancePolicyEvaluation>;
};

function dedupeLocations(
  locations: CompanyLocation[],
  assignedLocationIds: Set<string> = new Set(),
) {
  const seen = new Set<string>();

  return locations.flatMap((location) => {
    if (seen.has(location.id)) {
      return [];
    }

    seen.add(location.id);

    return [
      {
        id: location.id,
        name: location.name,
        radiusMeters: location.radiusMeters,
        isAssigned: assignedLocationIds.has(location.id),
      },
    ];
  });
}

function assertGpsCoordinates(gps: AttendanceGpsInput | undefined) {
  if (!gps) {
    return null;
  }

  if (
    !Number.isFinite(gps.latitude) ||
    !Number.isFinite(gps.longitude) ||
    !Number.isFinite(gps.accuracy)
  ) {
    throw new Error("Unable to read your current location.");
  }

  if (gps.latitude < -90 || gps.latitude > 90) {
    throw new Error("Unable to read your current location.");
  }

  if (gps.longitude < -180 || gps.longitude > 180) {
    throw new Error("Unable to read your current location.");
  }

  return gps;
}

function getLocationSource(gps: AttendanceGpsInput | null | undefined) {
  if (gps?.source) {
    return gps.source;
  }

  if (!gps) {
    return undefined;
  }

  if (gps.accuracy <= 50) {
    return "gps" as const;
  }

  if (gps.accuracy <= 150) {
    return "hybrid" as const;
  }

  return "network" as const;
}

function getEffectiveRadiusMeters(
  settings: AttendanceSettingsValues,
  location: CompanyLocation,
) {
  return Math.min(location.radiusMeters, settings.allowedRadiusMeters);
}

function createSuccessResult(input: {
  message: string;
  modeLabel: string;
  workMode?: EmployeeWorkMode;
  attendanceType?: AttendanceType;
  allowedLocations: AttendanceAllowedLocation[];
  gps: AttendanceGpsInput | null;
  location?: CompanyLocation | null;
  distanceMeters?: number;
}): AttendancePolicyEvaluation {
  return {
    ok: true,
    message: input.message,
    locationName: input.location?.name,
    distanceMeters: input.distanceMeters,
    accuracyMeters: input.gps?.accuracy,
    modeLabel: input.modeLabel,
    workMode: input.workMode,
    attendanceType: input.attendanceType,
    allowedLocations: input.allowedLocations,
      requiresSelfie: false,
      gps: input.gps,
      location: input.location ?? null,
  };
}

function assertRequiredGps(
  gps: AttendanceGpsInput | undefined,
  settings: AttendanceSettingsValues,
) {
  const nextGps = assertGpsCoordinates(gps);

  if (!nextGps) {
    throw new Error("Current GPS location is required for attendance.");
  }

  if (
    settings.requireHighAccuracy &&
    nextGps.accuracy > settings.gpsAccuracyThresholdMeters
  ) {
    throw new Error(
      "GPS accuracy is too low. Move to an open area and try again.",
    );
  }

  return {
    ...nextGps,
    source: getLocationSource(nextGps),
  };
}

async function getOfficeCandidateLocations(context: StrategyContext) {
  const assigned = await context.getAssignedLocations();

  if (context.settings.attendanceMode === "assigned_location_only") {
    return {
      assigned,
      locations: assigned,
    };
  }

  const company = await context.getCompanyLocations();

  if (context.settings.attendanceMode === "company_location") {
    return {
      assigned,
      locations: assigned.length > 0 ? assigned : company,
    };
  }

  if (context.settings.attendanceMode === "any_company_location") {
    return {
      assigned,
      locations: company,
    };
  }

  if (context.settings.attendanceMode === "hybrid") {
    return {
      assigned,
      locations: [...assigned, ...company],
    };
  }

  return {
    assigned,
    locations: [] as CompanyLocation[],
  };
}

async function validateAgainstLocations(
  context: StrategyContext,
  locations: CompanyLocation[],
  emptyMessage: string,
  successMessage: string,
) {
  const gps = assertGpsCoordinates(context.gps);

  if (!gps) {
    throw new Error("Current location is required for this attendance mode.");
  }

  if (
    context.settings.requireHighAccuracy &&
    gps.accuracy > context.settings.gpsAccuracyThresholdMeters
  ) {
    throw new Error(
      "GPS accuracy is too low. Move to an open area and try again.",
    );
  }

  if (locations.length === 0) {
    throw new Error(emptyMessage);
  }

  const nearest = findNearestCompanyLocation(gps, locations);

  if (!nearest) {
    throw new Error(emptyMessage);
  }

  if (context.settings.enableGeofence) {
    const allowedRadius = getEffectiveRadiusMeters(
      context.settings,
      nearest.location,
    );

    if (nearest.distanceMeters > allowedRadius) {
      throw new Error("Outside the allowed attendance radius.");
    }
  }

  const assignedLocationIds = new Set(
    (await context.getAssignedLocations()).map((location) => location.id),
  );

  return createSuccessResult({
        message: `${successMessage} ${nearest.location.name}.`,
        modeLabel: getAttendancePolicyOption(context.settings.attendanceMode).label,
        allowedLocations: dedupeLocations(locations, assignedLocationIds),
        gps: {
          ...gps,
          source: getLocationSource(gps),
        },
        location: nearest.location,
        distanceMeters: nearest.distanceMeters,
  });
}

const attendancePolicyStrategies: Record<
  AttendancePolicyMode,
  AttendancePolicyStrategy
> = {
  assigned_location_only: {
    summarize: async (context) => {
      const assigned = await context.getAssignedLocations();
      return dedupeLocations(
        assigned,
        new Set(assigned.map((location) => location.id)),
      );
    },
    validate: async (context) =>
      validateAgainstLocations(
        context,
        await context.getAssignedLocations(),
        "No assigned office location is available for attendance.",
        "Inside assigned location",
      ),
  },
  company_location: {
    summarize: async (context) => {
      const assigned = await context.getAssignedLocations();

      if (assigned.length > 0) {
        return dedupeLocations(
          assigned,
          new Set(assigned.map((location) => location.id)),
        );
      }

      return dedupeLocations(await context.getCompanyLocations(), new Set());
    },
    validate: async (context) => {
      const assigned = await context.getAssignedLocations();
      const locations =
        assigned.length > 0 ? assigned : await context.getCompanyLocations();

      return validateAgainstLocations(
        context,
        locations,
        "No active company location is configured for attendance.",
        assigned.length > 0
          ? "Inside assigned location"
          : "Inside company location",
      );
    },
  },
  any_company_location: {
    summarize: async (context) =>
      dedupeLocations(await context.getCompanyLocations(), new Set()),
    validate: async (context) =>
      validateAgainstLocations(
        context,
        await context.getCompanyLocations(),
        "No active company location is configured for attendance.",
        "Inside company location",
      ),
  },
  remote: {
    summarize: async () => [],
    validate: async (context) => {
      const gps = assertGpsCoordinates(context.gps);

      return createSuccessResult({
        message: gps
          ? "Remote attendance allowed. GPS captured."
          : "Remote attendance allowed. GPS is optional.",
        modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
          .label,
        allowedLocations: [],
        gps: gps
          ? {
              ...gps,
              source: getLocationSource(gps),
            }
          : null,
        location: null,
      });
    },
  },
  hybrid: {
    summarize: async (context) => {
      const assigned = await context.getAssignedLocations();
      const company = await context.getCompanyLocations();

      return dedupeLocations(
        [...assigned, ...company],
        new Set(assigned.map((location) => location.id)),
      );
    },
    validate: async (context) => {
      const gps = assertGpsCoordinates(context.gps);
      const assigned = await context.getAssignedLocations();
      const company = await context.getCompanyLocations();
      const allowedLocations = dedupeLocations(
        [...assigned, ...company],
        new Set(assigned.map((location) => location.id)),
      );

      if (!gps) {
        return createSuccessResult({
          message: "Hybrid attendance allows remote check-in without GPS.",
          modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
            .label,
          allowedLocations,
          gps: null,
          location: null,
        });
      }

      if (
        context.settings.requireHighAccuracy &&
        gps.accuracy > context.settings.gpsAccuracyThresholdMeters
      ) {
        return createSuccessResult({
          message:
            "Hybrid attendance allows remote check-in. GPS accuracy is below the office threshold.",
          modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
            .label,
          allowedLocations,
          gps: {
            ...gps,
            source: getLocationSource(gps),
          },
          location: null,
        });
      }

      const nearest = findNearestCompanyLocation(gps, [
        ...assigned,
        ...company,
      ]);

      if (!nearest || !context.settings.enableGeofence) {
        return createSuccessResult({
          message: nearest
            ? `Hybrid attendance validated near ${nearest.location.name}.`
            : "Hybrid attendance allows remote check-in from any location.",
          modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
            .label,
          allowedLocations,
          gps: {
            ...gps,
            source: getLocationSource(gps),
          },
          location: nearest?.location ?? null,
          distanceMeters: nearest?.distanceMeters,
        });
      }

      if (
        nearest.distanceMeters <=
        getEffectiveRadiusMeters(context.settings, nearest.location)
      ) {
        return createSuccessResult({
          message: `Inside approved location ${nearest.location.name}.`,
          modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
            .label,
          allowedLocations,
          gps: {
            ...gps,
            source: getLocationSource(gps),
          },
          location: nearest.location,
          distanceMeters: nearest.distanceMeters,
        });
      }

      return createSuccessResult({
        message: "Outside office radius, but hybrid attendance allows remote check-in.",
        modeLabel: getAttendancePolicyOption(context.settings.attendanceMode)
          .label,
        allowedLocations,
        gps: {
          ...gps,
          source: getLocationSource(gps),
        },
        location: null,
        distanceMeters: nearest.distanceMeters,
      });
    },
  },
};

const loadAttendanceSettings = cache(async (companyId: string) =>
  AttendancePolicyRepository.getSettings(companyId),
);

export const AttendancePolicyService = {
  async getSettings(companyId: string) {
    return loadAttendanceSettings(companyId);
  },

  async getSummary(
    companyId: string,
    employeeId: string,
  ): Promise<AttendancePolicySummary> {
    const settings = await loadAttendanceSettings(companyId);
    let assignedLocationsPromise: Promise<CompanyLocation[]> | undefined;
    let companyLocationsPromise: Promise<CompanyLocation[]> | undefined;

    const context: StrategyContext = {
      companyId,
      employeeId,
      settings,
      gps: undefined,
      getAssignedLocations: async () => {
        assignedLocationsPromise ??= AttendanceRepository.getAssignedCompanyLocations(
          companyId,
          employeeId,
        );
        return assignedLocationsPromise;
      },
      getCompanyLocations: async () => {
        companyLocationsPromise ??= AttendanceRepository.getActiveCompanyLocations(
          companyId,
        );
        return companyLocationsPromise;
      },
    };
    const strategy = attendancePolicyStrategies[settings.attendanceMode];
    const modeOption = getAttendancePolicyOption(settings.attendanceMode);

    return {
      ...settings,
      modeLabel: modeOption.label,
      modeDescription: modeOption.description,
      allowedLocations: await strategy.summarize(context),
    };
  },

  async validate(
    companyId: string,
    employeeId: string,
    gps?: AttendanceGpsInput,
    settingsOverride?: AttendanceSettingsValues,
  ): Promise<AttendancePolicyEvaluation> {
    const settings =
      settingsOverride ?? (await loadAttendanceSettings(companyId));
    let assignedLocationsPromise: Promise<CompanyLocation[]> | undefined;
    let companyLocationsPromise: Promise<CompanyLocation[]> | undefined;

    const context: StrategyContext = {
      companyId,
      employeeId,
      settings,
      gps,
      getAssignedLocations: async () => {
        assignedLocationsPromise ??= AttendanceRepository.getAssignedCompanyLocations(
          companyId,
          employeeId,
        );
        return assignedLocationsPromise;
      },
      getCompanyLocations: async () => {
        companyLocationsPromise ??= AttendanceRepository.getActiveCompanyLocations(
          companyId,
        );
        return companyLocationsPromise;
      },
    };

    const result = await attendancePolicyStrategies[settings.attendanceMode].validate(
      context,
    );

    return {
      ...result,
      requiresSelfie: settings.requireSelfie,
    };
  },

  async validateForWorkMode(
    companyId: string,
    employeeId: string,
    workMode: EmployeeWorkMode,
    gps?: AttendanceGpsInput,
    settingsOverride?: AttendanceSettingsValues,
  ): Promise<AttendancePolicyEvaluation> {
    const settings =
      settingsOverride ?? (await loadAttendanceSettings(companyId));

    if (workMode === "office") {
      const result = await this.validate(companyId, employeeId, gps, settings);

      return {
        ...result,
        workMode,
        attendanceType: "office",
      };
    }

    let assignedLocationsPromise: Promise<CompanyLocation[]> | undefined;
    let companyLocationsPromise: Promise<CompanyLocation[]> | undefined;
    const context: StrategyContext = {
      companyId,
      employeeId,
      settings,
      gps,
      getAssignedLocations: async () => {
        assignedLocationsPromise ??= AttendanceRepository.getAssignedCompanyLocations(
          companyId,
          employeeId,
        );
        return assignedLocationsPromise;
      },
      getCompanyLocations: async () => {
        companyLocationsPromise ??= AttendanceRepository.getActiveCompanyLocations(
          companyId,
        );
        return companyLocationsPromise;
      },
    };
    const modeLabel = getAttendancePolicyOption(settings.attendanceMode).label;
    const normalizedGps = assertRequiredGps(gps, settings);
    const { assigned, locations } = await getOfficeCandidateLocations(context);
    const allowedLocations = dedupeLocations(
      locations,
      new Set(assigned.map((location) => location.id)),
    );
    const nearest =
      locations.length > 0
        ? findNearestCompanyLocation(normalizedGps, locations)
        : null;

    if (workMode === "field") {
      return createSuccessResult({
        message: "Field attendance allowed. GPS captured.",
        modeLabel,
        workMode,
        attendanceType: "field",
        allowedLocations,
        gps: normalizedGps,
        location: null,
        distanceMeters: nearest?.distanceMeters,
      });
    }

    if (nearest && settings.enableGeofence) {
      const allowedRadius = getEffectiveRadiusMeters(settings, nearest.location);

      if (nearest.distanceMeters <= allowedRadius) {
        return createSuccessResult({
          message: `Inside approved location ${nearest.location.name}.`,
          modeLabel,
          workMode,
          attendanceType: "office",
          allowedLocations,
          gps: normalizedGps,
          location: nearest.location,
          distanceMeters: nearest.distanceMeters,
        });
      }
    }

    return createSuccessResult({
      message: nearest
        ? "Outside office radius, but hybrid work mode allows field attendance."
        : "Hybrid work mode allows field attendance from this location.",
      modeLabel,
      workMode,
      attendanceType: "hybrid",
      allowedLocations,
      gps: normalizedGps,
      location: null,
      distanceMeters: nearest?.distanceMeters,
    });
  },

  async updateSettings(
    companyId: string,
    companyName: string,
    values: AttendanceSettingsValues,
  ) {
    return AttendancePolicyRepository.updateSettings(
      companyId,
      companyName,
      values,
    );
  },
};
