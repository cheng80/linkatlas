import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ContentBlock, Document, DocumentVersion } from "@linkatlas/domain";
import { DocumentStatus } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";

import {
  createSqliteConnection,
  createSqliteDocumentRepository,
  migrateDatabase,
  runInTransaction,
} from "./index.js";

async function withTempDatabase<T>(test: (databasePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-storage-"));
  try {
    return await test(join(directory, "vault.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

describe("SQLite migration runner", () => {
  it("creates a new database with WAL and foreign keys when migrations rerun", async () => {
    await withTempDatabase(async (databasePath) => {
      const connection = createSqliteConnection({ databasePath });

      try {
        migrateDatabase(connection);
        migrateDatabase(connection);

        expect(connection.pragma("journal_mode", { simple: true })).toBe("wal");
        expect(connection.pragma("foreign_keys", { simple: true })).toBe(1);
        expect(connection.prepare("select count(*) from documents").pluck().get()).toBe(0);
      } finally {
        connection.close();
      }
    });
  });
});

describe("SQLite document repository", () => {
  it("round trips a document version and content blocks after reopening the database", async () => {
    await withTempDatabase(async (databasePath) => {
      const createdAt = new Date("2026-06-19T00:00:00.000Z");
      const updatedAt = new Date("2026-06-19T00:01:00.000Z");
      const document: Document = {
        id: "doc_fixture",
        originalUrl: "https://example.com/article",
        title: "Example Article",
        status: DocumentStatus.Inbox,
        createdAt,
        updatedAt,
      };
      const version: DocumentVersion = {
        id: "docver_fixture",
        documentId: document.id,
        contentHash: "sha256:fixture",
        createdAt,
      };
      const blocks: readonly ContentBlock[] = [
        {
          id: "block_heading",
          documentVersionId: version.id,
          ordinal: 0,
          blockType: "heading",
          text: "Intro",
          headingPath: ["Intro"],
        },
        {
          id: "block_body",
          documentVersionId: version.id,
          ordinal: 1,
          blockType: "paragraph",
          text: "Body text",
          headingPath: ["Intro"],
        },
      ];

      const firstConnection = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(firstConnection);
        const repository = createSqliteDocumentRepository(firstConnection);
        repository.saveDocumentSnapshot({ document, version, blocks });
      } finally {
        firstConnection.close();
      }

      const secondConnection = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(secondConnection);
        const repository = createSqliteDocumentRepository(secondConnection);

        expect(repository.getDocumentSnapshot(document.id)).toEqual({ document, version, blocks });
        expect(repository.listRecent({ limit: 5 })).toEqual([document]);
      } finally {
        secondConnection.close();
      }
    });
  });

  it("rolls back writes when a transaction fails", async () => {
    await withTempDatabase(async (databasePath) => {
      const connection = createSqliteConnection({ databasePath });

      try {
        migrateDatabase(connection);

        expect(() =>
          runInTransaction(connection, () => {
            connection
              .prepare(
                "insert into documents (id, original_url, title, status, captured_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
              )
              .run(
                "doc_rollback",
                "https://example.com/rollback",
                "Rollback",
                DocumentStatus.Inbox,
                "2026-06-19T00:00:00.000Z",
                "2026-06-19T00:00:00.000Z",
                "2026-06-19T00:00:00.000Z",
              );
            throw new Error("force rollback");
          }),
        ).toThrow("force rollback");

        expect(
          connection
            .prepare("select count(*) from documents where id = ?")
            .pluck()
            .get("doc_rollback"),
        ).toBe(0);
      } finally {
        connection.close();
      }
    });
  });
});
