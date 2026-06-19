import { createRequire } from "node:module";

import type { Database as SqliteDatabase } from "better-sqlite3";

const require = createRequire(import.meta.url);
const DatabaseConstructor: typeof import("better-sqlite3") = require("better-sqlite3");

export type SqliteConnectionOptions = {
  readonly databasePath: string;
};

export type LinkAtlasDatabase = SqliteDatabase;

export function createSqliteConnection(options: SqliteConnectionOptions): LinkAtlasDatabase {
  const database = new DatabaseConstructor(options.databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  return database;
}

export function runInTransaction<T>(database: LinkAtlasDatabase, operation: () => T): T {
  return database.transaction(operation).immediate();
}
