import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DocumentStatus } from "@linkatlas/domain";
import {
  createSqliteConnection,
  createSqliteDocumentRepository,
  migrateDatabase,
} from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import {
  createVaultBackup,
  exportVaultJsonl,
  exportVaultMarkdown,
  restoreVaultBackup,
} from "./vault-export.js";

describe("vault export and backup", () => {
  it("exports markdown/jsonl and restores a searchable backup into a new vault", async () => {
    await withTempDatabases(async (sourcePath, restoredPath) => {
      const source = createSqliteConnection({ databasePath: sourcePath });
      const restored = createSqliteConnection({ databasePath: restoredPath });
      try {
        migrateDatabase(source);
        migrateDatabase(restored);
        createSqliteDocumentRepository(source).saveDocumentSnapshot({
          blocks: [
            {
              blockType: "heading",
              documentVersionId: "docver_export",
              headingPath: ["Export"],
              id: "block_export_heading",
              ordinal: 0,
              text: "Export",
            },
            {
              blockType: "paragraph",
              documentVersionId: "docver_export",
              headingPath: ["Export"],
              id: "block_export_body",
              ordinal: 1,
              text: "Markdown export and ZIP backup round trip.",
            },
          ],
          document: {
            createdAt: new Date("2026-06-19T07:00:00.000Z"),
            id: "doc_export",
            originalUrl: "https://example.com/export",
            status: DocumentStatus.Ready,
            title: "Export Doc",
            updatedAt: new Date("2026-06-19T07:00:00.000Z"),
          },
          version: {
            contentHash: "export_hash",
            createdAt: new Date("2026-06-19T07:00:00.000Z"),
            documentId: "doc_export",
            id: "docver_export",
          },
        });

        expect(exportVaultMarkdown(source)).toContain("# Export Doc");
        expect(exportVaultJsonl(source)).toContain('"id":"doc_export"');

        const result = restoreVaultBackup({
          backup: createVaultBackup(source),
          database: restored,
          now: new Date("2026-06-19T07:05:00.000Z"),
        });

        expect(result).toEqual({ documentCount: 1, rebuiltChunkCount: 2 });
        expect(
          restored.prepare("select count(*) as count from chunk_fts").get() as {
            readonly count: number;
          },
        ).toEqual({ count: 2 });
      } finally {
        source.close();
        restored.close();
      }
    });
  });
});

async function withTempDatabases(
  test: (sourcePath: string, restoredPath: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-export-"));
  try {
    await test(join(directory, "source.sqlite3"), join(directory, "restored.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}
