import type {
  ListRelatedDocumentsResultDto,
  ListTopicsResultDto,
  RelationCommandResultDto,
} from "@linkatlas/contracts";
import {
  ContractParseError,
  parseListRelatedDocumentsRequest,
  parseRelationCommandRequest,
} from "@linkatlas/contracts";
import type { DocumentId } from "@linkatlas/domain";
import type { KnowledgeRepository, RelatedDocumentRecord, TopicRecord } from "@linkatlas/storage";
import { ipcMain } from "electron";

export type KnowledgeIpcOptions = {
  readonly knowledgeRepository: KnowledgeRepository;
};

export const knowledgeIpcChannels = {
  listRelated: "linkAtlas:knowledge:related:list",
  listTopics: "linkAtlas:knowledge:topics:list",
  pinRelation: "linkAtlas:knowledge:relation:pin",
  removeRelation: "linkAtlas:knowledge:relation:remove",
} as const;

export function registerKnowledgeIpc(options: KnowledgeIpcOptions): void {
  ipcMain.handle(knowledgeIpcChannels.listTopics, () => listTopics(options));
  ipcMain.handle(knowledgeIpcChannels.listRelated, (_event, input: unknown) =>
    listRelated(options, input),
  );
  ipcMain.handle(knowledgeIpcChannels.pinRelation, (_event, input: unknown) =>
    pinRelation(options, input),
  );
  ipcMain.handle(knowledgeIpcChannels.removeRelation, (_event, input: unknown) =>
    removeRelation(options, input),
  );
}

export function listTopics(options: KnowledgeIpcOptions): ListTopicsResultDto {
  return { topics: options.knowledgeRepository.listTopics().map(topicToDto) };
}

export function listRelated(
  options: KnowledgeIpcOptions,
  input: unknown,
): ListRelatedDocumentsResultDto {
  try {
    const request = parseListRelatedDocumentsRequest(input);
    return {
      related: options.knowledgeRepository
        .listRelatedDocuments({
          documentId: request.documentId as DocumentId,
          limit: request.limit ?? 5,
        })
        .map(relatedToDto),
    };
  } catch (error: unknown) {
    if (error instanceof ContractParseError) {
      return { related: [] };
    }
    throw error;
  }
}

export function pinRelation(
  options: KnowledgeIpcOptions,
  input: unknown,
): RelationCommandResultDto {
  try {
    const request = parseRelationCommandRequest(input);
    options.knowledgeRepository.setDocumentRelationPinned({
      pinned: true,
      sourceDocumentId: request.sourceDocumentId as DocumentId,
      targetDocumentId: request.targetDocumentId as DocumentId,
    });
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof ContractParseError) {
      return { ok: false };
    }
    throw error;
  }
}

export function removeRelation(
  options: KnowledgeIpcOptions,
  input: unknown,
): RelationCommandResultDto {
  try {
    const request = parseRelationCommandRequest(input);
    options.knowledgeRepository.removeDocumentRelation({
      sourceDocumentId: request.sourceDocumentId as DocumentId,
      targetDocumentId: request.targetDocumentId as DocumentId,
    });
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof ContractParseError) {
      return { ok: false };
    }
    throw error;
  }
}

function topicToDto(topic: TopicRecord): ListTopicsResultDto["topics"][number] {
  return {
    description: topic.description,
    documentCount: topic.documentCount,
    id: topic.id,
    label: topic.label,
  };
}

function relatedToDto(
  related: RelatedDocumentRecord,
): ListRelatedDocumentsResultDto["related"][number] {
  return {
    documentId: related.documentId,
    entityScore: related.entityScore,
    isPinned: related.isPinned,
    reason: related.reason,
    score: related.score,
    semanticScore: related.semanticScore,
    sharedEntities: [...related.sharedEntities],
    sharedTopics: [...related.sharedTopics],
    title: related.title,
    topicScore: related.topicScore,
  };
}
