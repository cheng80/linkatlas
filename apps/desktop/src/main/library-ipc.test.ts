import { type Document, DocumentStatus } from "@linkatlas/domain";
import type { DocumentRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { listLibraryDocuments } from "./library-ipc.js";

const document: Document = {
  createdAt: new Date("2026-06-19T08:00:00.000Z"),
  id: "doc_library",
  originalUrl: "https://example.com/library",
  status: DocumentStatus.Ready,
  title: "Library document",
  updatedAt: new Date("2026-06-19T09:00:00.000Z"),
};

describe("library IPC handlers", () => {
  it("lists recent documents as library DTOs", () => {
    const repository = createRepository({ listRecent: () => [document] });

    expect(listLibraryDocuments({ documentRepository: repository })).toEqual({
      documents: [
        {
          id: "doc_library",
          originalUrl: "https://example.com/library",
          status: "ready",
          title: "Library document",
          updatedAt: "2026-06-19T09:00:00.000Z",
        },
      ],
    });
  });
});

function createRepository(overrides: Partial<DocumentRepository>): DocumentRepository {
  return {
    getDocumentSnapshot: () => null,
    listRecent: () => [],
    saveDocumentSnapshot: () => undefined,
    ...overrides,
  };
}
