import { createHash } from "node:crypto";
import { analyzeDocument, type DocumentAnalysis } from "@linkatlas/analysis";
import type { DocumentSummaryDto } from "@linkatlas/contracts";
import type { ContentBlock, GenerationProvider } from "@linkatlas/domain";
import type { KnowledgeRepository, SummaryRepository } from "@linkatlas/storage";

export async function maybeAnalyzeDocument(input: {
  readonly blocks: readonly ContentBlock[];
  readonly documentId: `doc_${string}`;
  readonly versionId: `docver_${string}`;
  readonly generationProvider: GenerationProvider | undefined;
  readonly knowledgeRepository: KnowledgeRepository | undefined;
  readonly summaryRepository: SummaryRepository | undefined;
  readonly model: string | undefined;
  readonly now: Date;
}): Promise<DocumentSummaryDto | null> {
  if (
    input.generationProvider === undefined ||
    input.summaryRepository === undefined ||
    input.model === undefined
  ) {
    return null;
  }
  try {
    const result = await analyzeDocument({
      blocks: input.blocks,
      existingUserEditedSummary: input.summaryRepository.hasUserEditedSummary(input.documentId),
      generationProvider: input.generationProvider,
      model: input.model,
    });
    if (result.skipped) {
      return null;
    }
    input.summaryRepository.save({
      content: result.analysis,
      createdAt: input.now,
      documentId: input.documentId,
      documentVersionId: input.versionId,
      id: `summary_${sha256(`${input.versionId}:${result.metadata.inputHash}`).slice(0, 24)}`,
      inputHash: result.metadata.inputHash,
      isUserEdited: false,
      kind: "document-analysis",
      modelName: result.metadata.modelName,
      promptName: result.metadata.promptName,
      promptVersion: result.metadata.promptVersion,
      updatedAt: input.now,
    });
    input.knowledgeRepository?.upsertDocumentTopics({
      documentId: input.documentId,
      now: input.now,
      topics: result.analysis.topics.map((topic) => ({
        confidence: topic.confidence,
        description: topic.description,
        label: topic.label,
      })),
    });
    input.knowledgeRepository?.upsertDocumentEntities({
      documentId: input.documentId,
      entities: result.analysis.entities.map((entity) => ({
        aliases: entity.aliases,
        blockIds: entity.evidenceBlockIds,
        confidence: entity.confidence,
        name: entity.name,
        type: entity.type,
      })),
      now: input.now,
    });
    input.knowledgeRepository?.refreshDocumentRelations({
      documentId: input.documentId,
      limit: 5,
      now: input.now,
    });
    return toSummaryDto(result.analysis, result.metadata.modelName, result.metadata.promptVersion);
  } catch {
    return null;
  }
}

function toSummaryDto(
  analysis: DocumentAnalysis,
  modelName: string,
  promptVersion: string,
): DocumentSummaryDto {
  return {
    abstract: analysis.abstract,
    headline: analysis.headline,
    keyPoints: analysis.keyPoints.map((point) => ({
      evidenceBlockIds: point.evidenceBlockIds,
      text: point.text,
    })),
    modelName,
    promptVersion,
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
