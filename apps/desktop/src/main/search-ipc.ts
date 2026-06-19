import type { SearchResultDto } from "@linkatlas/contracts";
import { ContractParseError, parseSearchQuery } from "@linkatlas/contracts";
import type { EmbeddingProvider, VectorHit, VectorIndex } from "@linkatlas/domain";
import { reciprocalRankFusion } from "@linkatlas/search";
import type { ChunkRepository, KeywordSearchHit } from "@linkatlas/storage";
import { ipcMain } from "electron";

export type SearchIpcOptions = {
  readonly chunkRepository: ChunkRepository;
  readonly embeddingProvider?: EmbeddingProvider;
  readonly vectorIndex?: VectorIndex;
  readonly embeddingModel?: string;
};

export const searchIpcChannels = {
  search: "linkAtlas:search:query",
} as const;

export function registerSearchIpc(options: SearchIpcOptions): void {
  ipcMain.handle(searchIpcChannels.search, (_event, input: unknown) => search(options, input));
}

export async function search(
  options: SearchIpcOptions,
  input: unknown,
): Promise<readonly SearchResultDto[]> {
  try {
    const query = parseSearchQuery(input);
    const limit = query.limit ?? 12;
    const keywordHits = options.chunkRepository.searchKeyword({ limit: 30, query: query.query });
    const semanticHits = await semanticSearch(options, query.query);
    const keywordDtos = new Map<string, SearchResultDto>(
      keywordHits.map((hit) => [hit.chunk.id, keywordHitToDto(hit)]),
    );
    const semanticDtos = new Map<string, SearchResultDto>(
      semanticHits.map((hit) => [hit.id, vectorHitToDto(hit)]),
    );
    return reciprocalRankFusion({
      keywordIds: keywordHits.map((hit) => hit.chunk.id),
      limit,
      semanticIds: semanticHits.map((hit) => hit.id),
    }).map((hit) => {
      const dto = keywordDtos.get(hit.id) ?? semanticDtos.get(hit.id);
      if (dto === undefined) {
        throw new Error(`Missing search DTO for ${hit.id}`);
      }
      return { ...dto, score: hit.score, source: hit.source };
    });
  } catch (error: unknown) {
    if (error instanceof ContractParseError) {
      return [];
    }
    throw error;
  }
}

async function semanticSearch(
  options: SearchIpcOptions,
  query: string,
): Promise<readonly VectorHit[]> {
  if (
    options.embeddingProvider === undefined ||
    options.vectorIndex === undefined ||
    options.embeddingModel === undefined
  ) {
    return [];
  }
  try {
    const [embedding] = await options.embeddingProvider.embed({
      input: [query],
      model: options.embeddingModel,
    });
    return await options.vectorIndex.search(embedding ?? [], { limit: 30 });
  } catch {
    return [];
  }
}

function keywordHitToDto(hit: KeywordSearchHit): SearchResultDto {
  return {
    chunkId: hit.chunk.id,
    documentId: hit.chunk.documentId,
    headingPath: [...hit.chunk.headingPath],
    score: hit.score,
    source: "keyword",
    text: hit.chunk.text,
  };
}

function vectorHitToDto(hit: VectorHit): SearchResultDto {
  const metadata = hit.metadata as {
    readonly documentId?: string;
    readonly headingPath?: string;
    readonly text?: string;
  };
  return {
    chunkId: hit.id,
    documentId: metadata.documentId ?? "doc_unknown",
    headingPath: parseHeadingPath(metadata.headingPath),
    score: hit.score,
    source: "semantic",
    text: metadata.text ?? "",
  };
}

function parseHeadingPath(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
}
