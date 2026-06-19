import type { ChunkRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { search } from "./search-ipc.js";

describe("search IPC handlers", () => {
  it("returns keyword chunk results through a renderer-safe DTO", () => {
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

    expect(search({ chunkRepository }, { query: "local" })).toEqual([
      {
        chunkId: "chunk_a",
        documentId: "doc_a",
        headingPath: ["Intro"],
        score: -1.2,
        source: "keyword",
        text: "local-first search",
      },
    ]);
    expect(search({ chunkRepository }, { query: "" })).toEqual([]);
  });
});
