import { z } from "zod";

import { parseContract } from "./errors.js";

export const TopicDtoSchema = z.object({
  id: z.string().regex(/^topic_/u),
  label: z.string().min(1),
  description: z.string().nullable(),
  documentCount: z.number().int().nonnegative(),
});

export type TopicDto = z.infer<typeof TopicDtoSchema>;

export const RelatedDocumentDtoSchema = z.object({
  documentId: z.string().regex(/^doc_/u),
  title: z.string().min(1),
  score: z.number().min(0),
  semanticScore: z.number().nullable(),
  topicScore: z.number().nullable(),
  entityScore: z.number().nullable(),
  isPinned: z.boolean(),
  reason: z.string().min(1),
  sharedTopics: z.array(z.string().min(1)),
  sharedEntities: z.array(z.string().min(1)),
});

export type RelatedDocumentDto = z.infer<typeof RelatedDocumentDtoSchema>;

export const ListTopicsResultSchema = z.object({
  topics: z.array(TopicDtoSchema),
});

export type ListTopicsResultDto = z.infer<typeof ListTopicsResultSchema>;

export const ListRelatedDocumentsRequestSchema = z.object({
  documentId: z.string().regex(/^doc_/u),
  limit: z.number().int().min(1).max(20).optional(),
});

export type ListRelatedDocumentsRequestDto = z.infer<typeof ListRelatedDocumentsRequestSchema>;

export const ListRelatedDocumentsResultSchema = z.object({
  related: z.array(RelatedDocumentDtoSchema),
});

export type ListRelatedDocumentsResultDto = z.infer<typeof ListRelatedDocumentsResultSchema>;

export const RelationCommandRequestSchema = z.object({
  sourceDocumentId: z.string().regex(/^doc_/u),
  targetDocumentId: z.string().regex(/^doc_/u),
});

export type RelationCommandRequestDto = z.infer<typeof RelationCommandRequestSchema>;

export const RelationCommandResultSchema = z.object({
  ok: z.boolean(),
});

export type RelationCommandResultDto = z.infer<typeof RelationCommandResultSchema>;

export function parseListRelatedDocumentsRequest(input: unknown): ListRelatedDocumentsRequestDto {
  return parseContract(ListRelatedDocumentsRequestSchema, input);
}

export function parseRelationCommandRequest(input: unknown): RelationCommandRequestDto {
  return parseContract(RelationCommandRequestSchema, input);
}
