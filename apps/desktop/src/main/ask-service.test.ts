import type {
  ChatRequest,
  ChunkId,
  DocumentId,
  StreamSink,
  StructuredRequest,
} from "@linkatlas/domain";
import type { ChunkRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { answerQuestion, classifyIntent, validateAnswer } from "./ask-service.js";

describe("ask service", () => {
  it("classifies compare questions and answers with validated citations", async () => {
    const streamed: string[] = [];
    const answer = await answerQuestion(
      {
        chunkRepository: fakeChunkRepository(),
        generationModel: "gemma4:e4b-it-qat",
        generationProvider: {
          generateStructured: async <T>(_request: StructuredRequest<T>): Promise<T> =>
            ({
              answerMarkdown: "Addressables는 원격 카탈로그를 다룹니다 [c1].",
              citations: [
                {
                  blockIds: ["block_a"],
                  chunkId: "chunk_a",
                  citationId: "c1",
                  claim: "Addressables 원격 카탈로그",
                  documentId: "doc_a",
                },
                {
                  blockIds: ["block_missing"],
                  chunkId: "chunk_a",
                  citationId: "c2",
                  claim: "invalid",
                  documentId: "doc_a",
                },
              ],
              confidence: "medium",
              unsupportedQuestions: [],
            }) as T,
          generateText: async () => ({ model: "gemma4:e4b-it-qat", text: "" }),
          health: async () => ({ message: "ok", ok: true }),
          listModels: async () => [],
          streamChat: async (_request: ChatRequest, _sink: StreamSink) => undefined,
        },
      },
      { limit: 4, question: "Addressables와 AssetBundle 차이를 비교해줘" },
      {
        onStatus: () => undefined,
        onToken: (token) => {
          streamed.push(token);
        },
      },
    );

    expect(classifyIntent("A와 B를 비교")).toBe("compare");
    expect(answer.citations).toHaveLength(1);
    expect(answer.citations[0]?.citationId).toBe("c1");
    expect(streamed.join("")).toContain("[c1]");
  });

  it("returns an unsupported answer when retrieval has no context", async () => {
    const answer = await answerQuestion(
      { chunkRepository: emptyChunkRepository() },
      { limit: 4, question: "저장되지 않은 가격은?" },
      { onStatus: () => undefined, onToken: () => undefined },
    );

    expect(answer.answerMarkdown).toBe("저장된 자료에서 확인 불가합니다.");
    expect(answer.citations).toEqual([]);
    expect(answer.unsupportedQuestions).toEqual(["저장되지 않은 가격은?"]);
  });

  it("rejects citations that are not referenced by the answer text", () => {
    const answer = validateAnswer(
      {
        answerMarkdown: "근거 마커가 없는 문장입니다.",
        citations: [
          {
            blockIds: ["block_a"],
            chunkId: "chunk_a",
            citationId: "c1",
            claim: "claim",
            documentId: "doc_a",
          },
        ],
        confidence: "high",
        unsupportedQuestions: [],
      },
      [
        {
          blockIds: ["block_a"],
          chunkId: "chunk_a",
          citationId: "c1",
          documentId: "doc_a",
          headingPath: [],
          text: "text",
        },
      ],
      "질문",
    );

    expect(answer.confidence).toBe("low");
    expect(answer.citations).toEqual([]);
  });
});

function fakeChunkRepository(): ChunkRepository {
  return {
    listDocumentChunks: () => [],
    rebuildDocumentChunks: () => undefined,
    searchKeyword: () => [
      {
        chunk: {
          blockIds: ["block_a"],
          createdAt: new Date("2026-06-19T06:00:00.000Z"),
          documentId: "doc_a" as DocumentId,
          documentVersionId: "docver_a",
          embeddingIndexVersion: null,
          headingPath: ["Unity"],
          id: "chunk_a" as ChunkId,
          ordinal: 0,
          text: "Addressables manages remote catalogs.",
        },
        score: -1,
      },
    ],
  };
}

function emptyChunkRepository(): ChunkRepository {
  return {
    listDocumentChunks: () => [],
    rebuildDocumentChunks: () => undefined,
    searchKeyword: () => [],
  };
}
