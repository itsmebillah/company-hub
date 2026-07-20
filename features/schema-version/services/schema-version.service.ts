import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import { SCHEMA_MIGRATION_MANIFEST } from "@/features/schema-version/constants/schema-migrations";
import { getSupabaseAdminEnv } from "@/lib/env";

export type SchemaVersionStatus = {
  state: "current" | "pending" | "unknown";
  currentVersion: string | null;
  latestVersion: string | null;
  pendingMigrations: string[];
  message: string | null;
};

function normalizeVersion(version: string) {
  return version.replace(/^0+/, "") || "0";
}

function toManifestEntry(fileName: string) {
  const match = fileName.match(/^(\d+)_.*\.sql$/);

  if (!match) {
    return null;
  }

  return {
    fileName,
    version: match[1],
    normalizedVersion: normalizeVersion(match[1]),
  };
}

async function getLiveSchemaVersion() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.rpc("get_app_schema_version");

  if (error) {
    throw error;
  }

  return normalizeVersion(String(data));
}

const getCachedSchemaVersionStatus = unstable_cache(
  async (): Promise<SchemaVersionStatus> => {
    const manifestMigrations = SCHEMA_MIGRATION_MANIFEST.map(
      toManifestEntry,
    ).filter(
      (entry): entry is NonNullable<ReturnType<typeof toManifestEntry>> =>
        entry !== null,
    );
    const latestVersion =
      manifestMigrations.length > 0
        ? manifestMigrations[manifestMigrations.length - 1].version
        : null;

    if (manifestMigrations.length === 0) {
      return {
        state: "current",
        currentVersion: null,
        latestVersion: null,
        pendingMigrations: [],
        message: null,
      };
    }

    try {
      const liveVersion = await getLiveSchemaVersion();
      const pendingMigrations = manifestMigrations
        .filter(
          (migration) =>
            Number(migration.normalizedVersion) > Number(liveVersion),
        )
        .map((migration) => migration.fileName);
      const appliedManifestMigrations = manifestMigrations.filter(
        (migration) =>
          Number(migration.normalizedVersion) <= Number(liveVersion),
      );
      const currentVersion =
        appliedManifestMigrations.length > 0
          ? appliedManifestMigrations[appliedManifestMigrations.length - 1]
              .version
          : null;

      if (pendingMigrations.length === 0) {
        return {
          state: "current",
          currentVersion,
          latestVersion,
          pendingMigrations: [],
          message: null,
        };
      }

      return {
        state: "pending",
        currentVersion,
        latestVersion,
        pendingMigrations,
        message: "Database schema is outdated.",
      };
    } catch (error) {
      console.error("[SchemaVersionService] Schema verification failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });

      return {
        state: "unknown",
        currentVersion: null,
        latestVersion,
        pendingMigrations: [],
        message: "Unable to verify database schema.",
      };
    }
  },
  ["schema-version-status"],
  { revalidate: 300 },
);

export const SchemaVersionService = {
  async getStatus() {
    return getCachedSchemaVersionStatus();
  },
};
