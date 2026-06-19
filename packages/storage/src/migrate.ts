import type { LinkAtlasDatabase } from "./connection.js";
import { StorageError, StorageErrorCode } from "./errors.js";
import { sqliteMigrations } from "./migrations.js";

export function migrateDatabase(database: LinkAtlasDatabase): void {
  database.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`);

  const applyMigrations = database.transaction(() => {
    for (const migration of sqliteMigrations) {
      const alreadyApplied = database
        .prepare<[string], number>("select 1 from schema_migrations where id = ?")
        .pluck()
        .get(migration.id);

      if (alreadyApplied === 1) {
        continue;
      }

      database.exec(migration.sql);
      database
        .prepare<{ readonly id: string; readonly appliedAt: string }>(
          "insert into schema_migrations (id, applied_at) values (@id, @appliedAt)",
        )
        .run({ id: migration.id, appliedAt: new Date().toISOString() });
    }
  });

  try {
    applyMigrations.immediate();
  } catch (error) {
    throw new StorageError({
      errorCode: StorageErrorCode.MigrationFailed,
      message: "SQLite migration failed.",
      cause: error,
    });
  }
}
