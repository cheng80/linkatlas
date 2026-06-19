import { z } from "zod";

import { parseContract } from "./errors.js";

export const IngestUrlRequestSchema = z.object({
  url: z.string().min(1),
});

export type IngestUrlRequestDto = z.infer<typeof IngestUrlRequestSchema>;

export const IngestUrlErrorCodeSchema = z.enum([
  "INVALID_URL",
  "UNSUPPORTED_PROTOCOL",
  "LOCAL_NETWORK_BLOCKED",
  "REDIRECT_LIMIT_EXCEEDED",
  "RESPONSE_TOO_LARGE",
  "REQUEST_TIMEOUT",
  "HTTP_STATUS_ERROR",
  "UNKNOWN_FETCH_ERROR",
]);

export type IngestUrlErrorCode = z.infer<typeof IngestUrlErrorCodeSchema>;

export const SummaryTextDtoSchema = z.object({
  text: z.string().min(1),
  evidenceBlockIds: z.array(z.string().min(1)),
});

export const DocumentSummaryDtoSchema = z.object({
  headline: z.string().min(1),
  abstract: z.string().min(1),
  keyPoints: z.array(SummaryTextDtoSchema),
  modelName: z.string().min(1),
  promptVersion: z.string().min(1),
});

export type DocumentSummaryDto = z.infer<typeof DocumentSummaryDtoSchema>;

export const IngestUrlResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    documentId: z.string().min(1),
    jobId: z.string().min(1),
    jobStatus: z.enum(["QUEUED", "RUNNING", "BLOCKED", "FAILED", "COMPLETED", "CANCELLED"]),
    finalUrl: z.string().url(),
    title: z.string(),
    byteLength: z.number().int().nonnegative(),
    blockCount: z.number().int().nonnegative(),
    excerpt: z.string().nullable(),
    language: z.string().nullable(),
    summary: DocumentSummaryDtoSchema.nullable(),
  }),
  z.object({
    ok: z.literal(false),
    errorCode: IngestUrlErrorCodeSchema,
    message: z.string().min(1),
  }),
]);

export type IngestUrlResultDto = z.infer<typeof IngestUrlResultSchema>;

export function parseIngestUrlRequest(input: unknown): IngestUrlRequestDto {
  return parseContract(IngestUrlRequestSchema, input);
}

export function parseIngestUrlResult(input: unknown): IngestUrlResultDto {
  return parseContract(IngestUrlResultSchema, input);
}
