import type { SearchResultDto } from "@linkatlas/contracts";
import { ContractParseError, parseSearchQuery } from "@linkatlas/contracts";
import type { ChunkRepository } from "@linkatlas/storage";
import { ipcMain } from "electron";

export type SearchIpcOptions = {
  readonly chunkRepository: ChunkRepository;
};

export const searchIpcChannels = {
  search: "linkAtlas:search:query",
} as const;

export function registerSearchIpc(options: SearchIpcOptions): void {
  ipcMain.handle(searchIpcChannels.search, (_event, input: unknown) => search(options, input));
}

export function search(options: SearchIpcOptions, input: unknown): readonly SearchResultDto[] {
  try {
    const query = parseSearchQuery(input);
    return options.chunkRepository
      .searchKeyword({ limit: query.limit ?? 12, query: query.query })
      .map((hit) => ({
        chunkId: hit.chunk.id,
        documentId: hit.chunk.documentId,
        headingPath: [...hit.chunk.headingPath],
        score: hit.score,
        source: "keyword",
        text: hit.chunk.text,
      }));
  } catch (error: unknown) {
    if (error instanceof ContractParseError) {
      return [];
    }
    throw error;
  }
}
