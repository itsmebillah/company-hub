import "server-only";

import { notFound } from "next/navigation";

import { requireCurrentCompanyId } from "@/features/auth/services/current-company-context.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  FeatureDefinition,
  FeatureKey,
  FeatureState,
  CompanyFeatureState,
} from "@/features/platform-control/types/platform.types";

function toCurrentState(value: string): FeatureState {
  return value === "enabled" ? "enabled" : "disabled";
}

function toCompanyState(value: string | null | undefined): CompanyFeatureState {
  return value === "enabled" || value === "disabled" ? value : "inherit";
}

export const FeatureAccessService = {
  async listForCompany(companyId: string): Promise<FeatureDefinition[]> {
    const supabase = createSupabaseAdminClient();
    const [
      { data: features, error },
      { data: overrides, error: overrideError },
      { data: company, error: companyError },
    ] = await Promise.all([
      supabase
        .from("platform_features")
        .select(
          "feature_key, display_name, description, state, allow_company_override, display_order",
        )
        .order("display_order"),
      supabase
        .from("company_features")
        .select("feature_key, company_state")
        .eq("company_id", companyId),
      supabase
        .from("companies")
        .select("platform_status")
        .eq("id", companyId)
        .maybeSingle(),
    ]);

    if (error || overrideError || companyError || !company) {
      console.error("[FeatureAccessService] Unable to load feature state.", {
        error,
        overrideError,
        companyError,
      });
      throw new Error("Unable to load feature availability.");
    }

    const companyStates = new Map(
      overrides.map((item) => [
        item.feature_key,
        toCompanyState(item.company_state),
      ]),
    );

    return features.map((feature) => {
      const state = toCurrentState(feature.state);
      const companyState = companyStates.get(feature.feature_key) ?? "inherit";
      const companyConfigurable =
        state === "enabled" && feature.allow_company_override;
      return {
        key: feature.feature_key as FeatureKey,
        name: feature.display_name,
        description: feature.description,
        state,
        companyState,
        allowCompanyOverride: feature.allow_company_override,
        companyConfigurable,
        effectiveState:
          state === "enabled" &&
          company.platform_status === "active" &&
          (!feature.allow_company_override || companyState !== "disabled")
            ? "enabled"
            : "disabled",
        displayOrder: feature.display_order,
      };
    });
  },

  async getCurrentCompanyStates() {
    const companyId = await requireCurrentCompanyId();
    return this.listForCompany(companyId);
  },

  async isEnabled(companyId: string, featureKey: FeatureKey) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc(
      "is_feature_enabled_for_company",
      {
        target_company_id: companyId,
        target_feature_key: featureKey,
      },
    );

    if (error) {
      console.error("[FeatureAccessService] Feature check failed.", error);
      return false;
    }

    return data === true;
  },

  async requireForCurrentCompany(featureKey: FeatureKey) {
    const companyId = await requireCurrentCompanyId();
    const enabled = await this.isEnabled(companyId, featureKey);

    if (!enabled) {
      throw new Error("This feature is unavailable.");
    }

    return { companyId, featureKey };
  },

  async requirePage(featureKey: FeatureKey) {
    try {
      return await this.requireForCurrentCompany(featureKey);
    } catch {
      notFound();
    }
  },
};
