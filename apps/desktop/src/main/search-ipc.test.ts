import type { ChunkRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { search } from "./search-ipc.js";

describe("search IPC handlers", () => {
  it("returns keyword chunk results through a renderer-safe DTO", async () => {
    const chunkRepository: ChunkRepository = {
      listDocumentChunks: () => [],
      rebuildDocumentChunks: () => undefined,
      searchKeyword: () => [
        {
          chunk: {
            blockIds: ["block_1"],
            createdAt: new Date("2026-06-19T03:00:00.000Z"),
            documentId: "doc_a",
            documentVersionId: "docver_a",
            embeddingIndexVersion: null,
            headingPath: ["Intro"],
            id: "chunk_a",
            ordinal: 0,
            text: "local-first search",
          },
          score: -1.2,
        },
      ],
    };

    await expect(search({ chunkRepository }, { query: "local" })).resolves.toEqual([
      {
        chunkId: "chunk_a",
        documentId: "doc_a",
        headingPath: ["Intro"],
        score: expect.any(Number),
        source: "keyword",
        text: "local-first search",
      },
    ]);
    await expect(search({ chunkRepository }, { query: "" })).resolves.toEqual([]);
  });

  it("fuses keyword and semantic hits when embeddings are available", async () => {
    const chunkRepository: ChunkRepository = {
      listDocumentChunks: () => [],
      rebuildDocumentChunks: () => undefined,
      searchKeyword: () => [
        {
          chunk: {
            blockIds: ["block_1"],
            createdAt: new Date("2026-06-19T03:00:00.000Z"),
            documentId: "doc_a",
            documentVersionId: "docver_a",
            embeddingIndexVersion: null,
            headingPath: ["Intro"],
            id: "chunk_shared",
            ordinal: 0,
            text: "keyword text",
          },
          score: -1,
        },
      ],
    };

    await expect(
      search(
        {
          chunkRepository,
          embeddingModel: "embeddinggemma",
          embeddingProvider: {
            dimensions: async () => 2,
            embed: async () => [[1, 0]],
          },
          vectorIndex: {
            activateVersion: async () => undefined,
            createVersion: async () => "v1",
            remove: async () => undefined,
            search: async () => [
              {
                id: "chunk_shared",
                metadata: {
                  documentId: "doc_a",
                  headingPath: JSON.stringify(["Intro"]),
                  text: "semantic text",
                },
                score: 0.9,
              },
            ],
            upsert: async () => undefined,
          },
        },
        { query: "local" },
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        chunkId: "chunk_shared",
        source: "hybrid",
      }),
    ]);
  });
});
