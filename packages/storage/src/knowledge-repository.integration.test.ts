import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DocumentId } from "@linkatlas/domain";
import { DocumentStatus } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import { createSqliteConnection } from "./connection.js";
import { createSqliteDocumentRepository } from "./document-repository.js";
import { createSqliteKnowledgeRepository } from "./knowledge-repository.js";
import { migrateDatabase } from "./migrate.js";

describe("SqliteKnowledgeRepository", () => {
  it("normalizes duplicate topic labels and merges entity aliases", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(database);
        saveDocument(database, "doc_kg", "KG");
        const repository = createSqliteKnowledgeRepository(database);

        repository.upsertDocumentTopics({
          documentId: "doc_kg",
          now: new Date("2026-06-19T04:01:00.000Z"),
          topics: [
            { confidence: 0.9, description: "Unity content", label: "Unity Addressables" },
            { confidence: 0.7, description: "duplicate", label: " unity   addressables " },
          ],
        });
        const entities = repository.upsertDocumentEntities({
          documentId: "doc_kg",
          entities: [
            {
              aliases: ["Asset Bundles"],
              blockIds: ["block_kg1"],
              confidence: 0.8,
              name: "AssetBundle",
              type: "TECHNOLOGY",
            },
            {
              aliases: ["AssetBundle"],
              blockIds: ["block_kg1"],
              confidence: 0.7,
              name: " assetbundle ",
              type: "technology",
            },
          ],
          now: new Date("2026-06-19T04:01:00.000Z"),
        });

        expect(repository.listTopics()).toEqual([
          expect.objectContaining({
            documentCount: 1,
            label: "Unity Addressables",
            normalizedLabel: "unity addressables",
          }),
        ]);
        expect(repository.listDocumentTopics("doc_kg")).toHaveLength(1);
        expect(new Set(entities.map((entity) => entity.id)).size).toBe(1);
      } finally {
        database.close();
      }
    });
  });

  it("limits related documents and preserves user removals", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(database);
        const repository = createSqliteKnowledgeRepository(database);
        saveDocument(database, "doc_source", "Source");
        for (let index = 0; index < 6; index += 1) {
          saveDocument(database, `doc_target${index}`, `Target ${index}`);
        }
        for (const documentId of [
          "doc_source",
          "doc_target0",
          "doc_target1",
          "doc_target2",
          "doc_target3",
          "doc_target4",
          "doc_target5",
        ] as const) {
          repository.upsertDocumentTopics({
            documentId,
            now: new Date("2026-06-19T05:00:00.000Z"),
            topics: [{ confidence: 0.8, description: "", label: "Unity Addressables" }],
          });
        }

        const related = repository.refreshDocumentRelations({
          documentId: "doc_source",
          limit: 5,
          now: new Date("2026-06-19T05:01:00.000Z"),
        });

        expect(related).toHaveLength(5);
        expect(related.map((document) => document.title)).toEqual([
          "Target 0",
          "Target 1",
          "Target 2",
          "Target 3",
          "Target 4",
        ]);

        repository.removeDocumentRelation({
          sourceDocumentId: "doc_source",
          targetDocumentId: "doc_target0",
        });
        repository.refreshDocumentRelations({
          documentId: "doc_source",
          limit: 5,
          now: new Date("2026-06-19T05:02:00.000Z"),
        });

        expect(
          repository
            .listRelatedDocuments({ documentId: "doc_source", limit: 5 })
            .map((document) => document.documentId),
        ).not.toContain("doc_target0");
      } finally {
        database.close();
      }
    });
  });
});

function saveDocument(
  database: ReturnType<typeof createSqliteConnection>,
  documentId: DocumentId,
  title: string,
): void {
  const suffix = documentId.replace("doc_", "");
  createSqliteDocumentRepository(database).saveDocumentSnapshot({
    blocks: [
      {
        blockType: "paragraph",
        documentVersionId: `docver_${suffix}`,
        headingPath: [],
        id: `block_${suffix}`,
        ordinal: 0,
        text: `${title} uses AssetBundle.`,
      },
    ],
    document: {
      createdAt: new Date("2026-06-19T04:00:00.000Z"),
      id: documentId,
      originalUrl: `https://example.com/${suffix}`,
      status: DocumentStatus.Ready,
      title,
      updatedAt: new Date("2026-06-19T04:00:00.000Z"),
    },
    version: {
      contentHash: `${suffix}_hash`,
      createdAt: new Date("2026-06-19T04:00:00.000Z"),
      documentId,
      id: `docver_${suffix}`,
    },
  });
}

async function withTempDatabase<T>(test: (databasePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-knowledge-"));
  try {
    return await test(join(directory, "vault.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}
