import { z } from "zod";

export const OllamaModelSchema = z.object({
  name: z.string(),
  digest: z.string().nullable().optional(),
});

export const OllamaTagsResponseSchema = z.object({
  models: z.array(OllamaModelSchema),
});

export const OllamaGenerateResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
  done: z.boolean().optional(),
});

export const OllamaChatChunkSchema = z.object({
  message: z
    .object({
      content: z.string(),
    })
    .optional(),
  done: z.boolean().optional(),
  error: z.string().optional(),
});

export const OllamaEmbedResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())),
});

export const OllamaErrorResponseSchema = z.object({
  error: z.string(),
});
