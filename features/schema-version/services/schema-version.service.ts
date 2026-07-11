import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";

export type SchemaVersionStatus = {
  state: "current" | "pending" | "unknown";
  currentVersion: string | null;
  latestVersion: string | null;
  pendingMigrations: string[];
  message: string | null;
};

type MigrationFile = {
  fileName: string;
  version: string;
  normalizedVersion: string;
};

function normalizeVersion(version: string) {
  return version.replace(/^0+/, "") || "0";
}

async function getLocalMigrationFiles() {
  const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations");
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .map((fileName) => {
      const match = fileName.match(/^(\d+)_.*\.sql$/);

      if (!match) {
        return null;
      }

      return {
        fileName,
        version: match[1],
        normalizedVersion: normalizeVersion(match[1]),
      } satisfies MigrationFile;
    })
    .filter((entry): entry is MigrationFile => entry !== null)
    .sort((left, right) => left.version.localeCompare(right.version));
}

async function getAppliedMigrationVersions() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .schema("supabase_migrations")
    .from("schema_migrations")
    .select("version")
    .order("version", { ascending: true });

  if (error) {
    throw error;
  }

  return new Set(
    (data ?? []).map((row) =>
      normalizeVersion(String((row as { version: string | number }).version)),
    ),
  );
}

const getCachedSchemaVersionStatus = unstable_cache(
  async (): Promise<SchemaVersionStatus> => {
    const localMigrations = await getLocalMigrationFiles();
    const latestVersion =
      localMigrations.length > 0 ? localMigrations[localMigrations.length - 1].version : null;

    if (localMigrations.length === 0) {
      return {
        state: "current",
        currentVersion: null,
        latestVersion: null,
        pendingMigrations: [],
        message: null,
      };
    }

    try {
      const appliedVersions = await getAppliedMigrationVersions();
      const pendingMigrations = localMigrations
        .filter((migration) => !appliedVersions.has(migration.normalizedVersion))
        .map((migration) => migration.fileName);
      const appliedLocalMigrations = localMigrations.filter((migration) =>
        appliedVersions.has(migration.normalizedVersion),
      );
      const currentVersion =
        appliedLocalMigrations.length > 0
          ? appliedLocalMigrations[appliedLocalMigrations.length - 1].version
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
      console.error(
        "[SchemaVersionService] Unable to verify database schema.",
        error,
      );

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
