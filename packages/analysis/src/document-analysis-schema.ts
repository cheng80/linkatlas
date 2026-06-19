import type { JsonSchemaObject } from "@linkatlas/domain";
import { z } from "zod";

const EvidenceTextSchema = z.object({
  text: z.string().min(1).max(800),
  evidenceBlockIds: z
    .array(z.string().regex(/^block_/u))
    .min(1)
    .max(12),
});

export const DocumentAnalysisSchema = z.object({
  language: z.string().min(2).max(16),
  contentType: z.enum([
    "tutorial",
    "reference",
    "news",
    "opinion",
    "research",
    "documentation",
    "announcement",
    "discussion",
    "other",
  ]),
  headline: z.string().min(1).max(240),
  abstract: z.string().min(1).max(4000),
  keyPoints: z.array(EvidenceTextSchema).max(8),
  actionItems: z.array(EvidenceTextSchema).max(8),
  caveats: z.array(EvidenceTextSchema).max(8),
  topics: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        description: z.string().max(300),
        confidence: z.number().min(0).max(1),
        evidenceBlockIds: z.array(z.string().regex(/^block_/u)).max(12),
      }),
    )
    .min(1)
    .max(7),
  entities: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        type: z.enum([
          "PERSON",
          "ORGANIZATION",
          "PRODUCT",
          "TECHNOLOGY",
          "PROJECT",
          "PLACE",
          "EVENT",
          "CONCEPT",
          "STANDARD",
          "VERSION",
          "OTHER",
        ]),
        aliases: z.array(z.string().max(160)).max(8),
        confidence: z.number().min(0).max(1),
        evidenceBlockIds: z.array(z.string().regex(/^block_/u)).max(12),
      }),
    )
    .max(40),
  claims: z
    .array(
      z.object({
        text: z.string().min(1).max(600),
        stance: z.enum(["assertion", "recommendation", "warning", "hypothesis", "opinion"]),
        confidence: z.number().min(0).max(1),
        evidenceBlockIds: z
          .array(z.string().regex(/^block_/u))
          .min(1)
          .max(12),
      }),
    )
    .max(20),
});

export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;

export const documentAnalysisJsonSchema: JsonSchemaObject = {
  type: "object",
  additionalProperties: false,
  required: [
    "language",
    "contentType",
    "headline",
    "abstract",
    "keyPoints",
    "actionItems",
    "caveats",
    "topics",
    "entities",
    "claims",
  ],
};
