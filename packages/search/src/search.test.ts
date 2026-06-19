import { describe, expect, it } from "vitest";
import { InMemoryVectorIndex } from "./in-memory-vector-index.js";
import { reciprocalRankFusion } from "./rrf.js";

describe("InMemoryVectorIndex", () => {
  it("returns semantic hits with metadata filters", async () => {
    const index = new InMemoryVectorIndex();
    await index.createVersion({ dimensions: 3, model: "embeddinggemma" });
    await index.upsert([
      { id: "chunk_a", metadata: { documentId: "doc_a" }, vector: [1, 0, 0] },
      { id: "chunk_b", metadata: { documentId: "doc_b" }, vector: [0, 1, 0] },
      { id: "chunk_c", metadata: { documentId: "doc_a" }, vector: [0.8, 0.2, 0] },
    ]);

    await expect(
      index.search([1, 0, 0], { filter: { documentId: "doc_a" }, limit: 5 }),
    ).resolves.toMatchObject([{ id: "chunk_a" }, { id: "chunk_c" }]);
  });
});

describe("reciprocalRankFusion", () => {
  it("combines keyword and semantic ranks into hybrid order", () => {
    expect(
      reciprocalRankFusion({
        keywordIds: ["chunk_a", "chunk_b"],
        limit: 3,
        semanticIds: ["chunk_b", "chunk_c"],
      }),
    ).toEqual([
      expect.objectContaining({ id: "chunk_b", source: "hybrid" }),
      expect.objectContaining({ id: "chunk_a", source: "keyword" }),
      expect.objectContaining({ id: "chunk_c", source: "semantic" }),
    ]);
  });
});
