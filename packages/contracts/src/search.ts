import { z } from "zod";
import { parseContract } from "./errors.js";

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().positive().max(50).optional(),
});

export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;

export const SearchResultSchema = z.object({
  chunkId: z.string().min(1),
  documentId: z.string().min(1),
  text: z.string(),
  headingPath: z.array(z.string()),
  score: z.number(),
  source: z.enum(["keyword", "semantic", "hybrid"]),
});

export type SearchResultDto = z.infer<typeof SearchResultSchema>;

export function parseSearchQuery(input: unknown): SearchQueryDto {
  return parseContract(SearchQuerySchema, input);
}
