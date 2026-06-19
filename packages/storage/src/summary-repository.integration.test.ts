import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DocumentStatus, type SummaryId } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import { createSqliteConnection } from "./connection.js";
import { createSqliteDocumentRepository } from "./document-repository.js";
import { migrateDatabase } from "./migrate.js";
import { createSqliteSummaryRepository } from "./summary-repository.js";

describe("SqliteSummaryRepository", () => {
  it("stores generated summary metadata and detects user-edited summaries", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(database);
        createSqliteDocumentRepository(database).saveDocumentSnapshot({
          blocks: [
            {
              blockType: "paragraph",
              documentVersionId: "docver_a",
              headingPath: [],
              id: "block_0001",
              ordinal: 0,
              text: "본문",
            },
          ],
          document: {
            createdAt: new Date("2026-06-19T02:00:00.000Z"),
            id: "doc_a",
            originalUrl: "https://example.com/a",
            status: DocumentStatus.Ready,
            title: "A",
            updatedAt: new Date("2026-06-19T02:00:00.000Z"),
          },
          version: {
            contentHash: "hash_a",
            createdAt: new Date("2026-06-19T02:00:00.000Z"),
            documentId: "doc_a",
            id: "docver_a",
          },
        });

        const repository = createSqliteSummaryRepository(database);
        repository.save({
          content: { headline: "요약", keyPoints: [] },
          createdAt: new Date("2026-06-19T02:01:00.000Z"),
          documentId: "doc_a",
          documentVersionId: "docver_a",
          id: "summary_generated" as SummaryId,
          inputHash: "input-hash",
          isUserEdited: false,
          kind: "document-analysis",
          modelName: "gemma4:12b",
          promptName: "document-analysis",
          promptVersion: "v1",
          updatedAt: new Date("2026-06-19T02:01:00.000Z"),
        });

        expect(repository.getLatestForDocument("doc_a")).toMatchObject({
          content: { headline: "요약", keyPoints: [] },
          inputHash: "input-hash",
          isUserEdited: false,
          modelName: "gemma4:12b",
          promptVersion: "v1",
        });
        expect(repository.hasUserEditedSummary("doc_a")).toBe(false);

        repository.save({
          content: { headline: "사용자 요약" },
          createdAt: new Date("2026-06-19T02:02:00.000Z"),
          documentId: "doc_a",
          documentVersionId: "docver_a",
          id: "summary_user" as SummaryId,
          inputHash: "manual",
          isUserEdited: true,
          kind: "document-analysis",
          modelName: "manual",
          promptName: "document-analysis",
          promptVersion: "v1",
          updatedAt: new Date("2026-06-19T02:02:00.000Z"),
        });

        expect(repository.hasUserEditedSummary("doc_a")).toBe(true);
        expect(repository.getLatestForDocument("doc_a")).toMatchObject({
          content: { headline: "사용자 요약" },
          isUserEdited: true,
        });
      } finally {
        database.close();
      }
    });
  });
});

async function withTempDatabase<T>(test: (databasePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-summary-"));
  try {
    return await test(join(directory, "vault.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}
