import type { KnowledgeRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { listRelated, listTopics, pinRelation, removeRelation } from "./knowledge-ipc.js";

describe("knowledge IPC handlers", () => {
  it("returns renderer-safe topic and related document DTOs", () => {
    const repository = fakeKnowledgeRepository();

    expect(listTopics({ knowledgeRepository: repository })).toEqual({
      topics: [
        {
          description: "Unity content delivery",
          documentCount: 2,
          id: "topic_unity",
          label: "Unity Addressables",
        },
      ],
    });
    expect(
      listRelated({ knowledgeRepository: repository }, { documentId: "doc_source", limit: 5 }),
    ).toEqual({
      related: [
        expect.objectContaining({
          documentId: "doc_target",
          reason: "공유 주제 Unity Addressables",
          title: "Target",
        }),
      ],
    });
    expect(listRelated({ knowledgeRepository: repository }, { documentId: "bad" })).toEqual({
      related: [],
    });
  });

  it("validates relation commands before mutating state", () => {
    const calls: string[] = [];
    const repository: KnowledgeRepository = {
      ...fakeKnowledgeRepository(),
      removeDocumentRelation: (input) => {
        calls.push(`remove:${input.targetDocumentId}`);
      },
      setDocumentRelationPinned: (input) => {
        calls.push(`pin:${input.targetDocumentId}:${String(input.pinned)}`);
      },
    };

    expect(
      pinRelation(
        { knowledgeRepository: repository },
        { sourceDocumentId: "doc_source", targetDocumentId: "doc_target" },
      ),
    ).toEqual({ ok: true });
    expect(
      removeRelation({ knowledgeRepository: repository }, { sourceDocumentId: "bad" }),
    ).toEqual({
      ok: false,
    });
    expect(calls).toEqual(["pin:doc_target:true"]);
  });
});

function fakeKnowledgeRepository(): KnowledgeRepository {
  return {
    listDocumentTopics: () => [],
    listRelatedDocuments: () => [
      {
        documentId: "doc_target",
        entityScore: 0,
        isPinned: false,
        reason: "공유 주제 Unity Addressables",
        score: 0.25,
        semanticScore: null,
        sharedEntities: [],
        sharedTopics: ["Unity Addressables"],
        title: "Target",
        topicScore: 1,
      },
    ],
    listTopics: () => [
      {
        description: "Unity content delivery",
        documentCount: 2,
        id: "topic_unity",
        label: "Unity Addressables",
        normalizedLabel: "unity addressables",
      },
    ],
    refreshDocumentRelations: () => [],
    removeDocumentRelation: () => undefined,
    setDocumentRelationPinned: () => undefined,
    upsertDocumentEntities: () => [],
    upsertDocumentTopics: () => [],
  };
}
