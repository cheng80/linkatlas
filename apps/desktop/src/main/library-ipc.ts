import type { LibraryDocumentDto, ListLibraryDocumentsResultDto } from "@linkatlas/contracts";
import type { Document } from "@linkatlas/domain";
import type { DocumentRepository } from "@linkatlas/storage";
import { ipcMain } from "electron";

export type LibraryIpcOptions = {
  readonly documentRepository: DocumentRepository;
};

export const libraryIpcChannels = {
  list: "linkAtlas:library:list",
} as const;

export function registerLibraryIpc(options: LibraryIpcOptions): void {
  ipcMain.handle(libraryIpcChannels.list, () => listLibraryDocuments(options));
}

export function listLibraryDocuments(options: LibraryIpcOptions): ListLibraryDocumentsResultDto {
  return {
    documents: options.documentRepository.listRecent({ limit: 50 }).map(toLibraryDocumentDto),
  };
}

function toLibraryDocumentDto(document: Document): LibraryDocumentDto {
  return {
    id: document.id,
    originalUrl: document.originalUrl,
    title: document.title,
    status: document.status,
    updatedAt: document.updatedAt.toISOString(),
  };
}
