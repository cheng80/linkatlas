import { z } from "zod";

import { parseContract } from "./errors.js";

export const AskQuestionRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  limit: z.number().int().min(1).max(12).optional(),
});

export type AskQuestionRequestDto = z.infer<typeof AskQuestionRequestSchema>;

export const AskStartResultSchema = z.object({
  ok: z.boolean(),
  requestId: z.string().regex(/^ask_/u).optional(),
  message: z.string().optional(),
});

export type AskStartResultDto = z.infer<typeof AskStartResultSchema>;

export const AskCitationDtoSchema = z.object({
  citationId: z.string().min(1),
  documentId: z.string().regex(/^doc_/u),
  chunkId: z.string().regex(/^chunk_/u),
  blockIds: z.array(z.string().regex(/^block_/u)).min(1),
  claim: z.string().min(1),
  previewText: z.string().optional(),
});

export type AskCitationDto = z.infer<typeof AskCitationDtoSchema>;

export const AskAnswerDtoSchema = z.object({
  answerMarkdown: z.string().min(1),
  citations: z.array(AskCitationDtoSchema),
  unsupportedQuestions: z.array(z.string().min(1)),
  confidence: z.enum(["low", "medium", "high"]),
});

export type AskAnswerDto = z.infer<typeof AskAnswerDtoSchema>;

export const AskStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("status"),
    requestId: z.string().regex(/^ask_/u),
    message: z.string().min(1),
  }),
  z.object({
    type: z.literal("token"),
    requestId: z.string().regex(/^ask_/u),
    text: z.string(),
  }),
  z.object({
    type: z.literal("done"),
    requestId: z.string().regex(/^ask_/u),
    answer: AskAnswerDtoSchema,
  }),
  z.object({
    type: z.literal("error"),
    requestId: z.string().regex(/^ask_/u),
    message: z.string().min(1),
  }),
]);

export type AskStreamEventDto = z.infer<typeof AskStreamEventSchema>;

export function parseAskQuestionRequest(input: unknown): AskQuestionRequestDto {
  return parseContract(AskQuestionRequestSchema, input);
}
