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

export const IngestUrlResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    finalUrl: z.string().url(),
    title: z.string(),
    byteLength: z.number().int().nonnegative(),
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
