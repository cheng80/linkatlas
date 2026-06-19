import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DocumentStatus } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import { createSqliteChunkRepository } from "./chunk-repository.js";
import { createSqliteConnection } from "./connection.js";
import type { DocumentSnapshot } from "./document-repository.js";
import { createSqliteDocumentRepository } from "./document-repository.js";
import { migrateDatabase } from "./migrate.js";

describe("SqliteChunkRepository", () => {
  it("indexes Korean and English chunks through FTS5 and rebuilds deterministically", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });
      try {
        migrateDatabase(database);
        const snapshot = snapshotFixture();
        createSqliteDocumentRepository(database).saveDocumentSnapshot(snapshot);
        const repository = createSqliteChunkRepository(database);

        repository.rebuildDocumentChunks({
          now: new Date("2026-06-19T03:00:00.000Z"),
          snapshot,
        });
        const koreanHit = repository.searchKeyword({ limit: 5, query: "로컬 우선" });
        const englishHit = repository.searchKeyword({ limit: 5, query: "evidence blocks" });

        expect(koreanHit[0]?.chunk.text).toContain("로컬 우선");
        expect(englishHit[0]?.chunk.text).toContain("evidence blocks");

        const before = repository.listDocumentChunks("doc_search").map((chunk) => chunk.id);
        repository.rebuildDocumentChunks({
          now: new Date("2026-06-19T03:01:00.000Z"),
          snapshot,
        });
        const after = repository.listDocumentChunks("doc_search").map((chunk) => chunk.id);

        expect(after).toEqual(before);
      } finally {
        database.close();
      }
    });
  });
});

function snapshotFixture(): DocumentSnapshot {
  const createdAt = new Date("2026-06-19T03:00:00.000Z");
  return {
    blocks: [
      {
        blockType: "heading",
        documentVersionId: "docver_search",
        headingPath: ["개요"],
        id: "block_1000",
        ordinal: 0,
        text: "LinkAtlas 검색",
      },
      {
        blockType: "paragraph",
        documentVersionId: "docver_search",
        headingPath: ["개요"],
        id: "block_1001",
        ordinal: 1,
        text: "로컬 우선 지식 관리자는 한국어 자료를 검색한다.",
      },
      {
        blockType: "paragraph",
        documentVersionId: "docver_search",
        headingPath: ["Evidence"],
        id: "block_1002",
        ordinal: 2,
        text: "Hybrid search returns evidence blocks for English notes.",
      },
    ],
    document: {
      createdAt,
      id: "doc_search",
      originalUrl: "https://example.com/search",
      status: DocumentStatus.Ready,
      title: "Search Fixture",
      updatedAt: createdAt,
    },
    version: {
      contentHash: "search_hash",
      createdAt,
      documentId: "doc_search",
      id: "docver_search",
    },
  };
}

async function withTempDatabase<T>(test: (databasePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-chunks-"));
  try {
    return await test(join(directory, "vault.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}
