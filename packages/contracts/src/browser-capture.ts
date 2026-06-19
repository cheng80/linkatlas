import { z } from "zod";

import { parseContract } from "./errors.js";

export const BrowserCaptureKindSchema = z.enum(["page", "selection"]);

export type BrowserCaptureKindDto = z.infer<typeof BrowserCaptureKindSchema>;

export const BrowserCaptureRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("page"),
    url: z.string().url(),
    title: z.string().min(1).max(500),
    html: z.string().min(1),
  }),
  z.object({
    kind: z.literal("selection"),
    url: z.string().url(),
    title: z.string().min(1).max(500),
    selectionText: z.string().min(1).max(100_000),
  }),
]);

export type BrowserCaptureRequestDto = z.infer<typeof BrowserCaptureRequestSchema>;

export const BrowserCaptureResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    status: z.enum(["saved", "duplicate"]),
    documentId: z.string().regex(/^doc_/u),
    title: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    errorCode: z.enum(["APP_UNAVAILABLE", "INVALID_MESSAGE", "UNSUPPORTED_URL", "CAPTURE_FAILED"]),
    message: z.string().min(1),
  }),
]);

export type BrowserCaptureResponseDto = z.infer<typeof BrowserCaptureResponseSchema>;

export function parseBrowserCaptureRequest(input: unknown): BrowserCaptureRequestDto {
  return parseContract(BrowserCaptureRequestSchema, input);
}

export function parseBrowserCaptureResponse(input: unknown): BrowserCaptureResponseDto {
  return parseContract(BrowserCaptureResponseSchema, input);
}
