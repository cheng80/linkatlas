import type { ContentBlockId, DocumentId, DocumentVersionId } from "./brand.js";

export const DocumentStatus = {
  Inbox: "inbox",
  Ready: "ready",
  Failed: "failed",
  Archived: "archived",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export type Document = {
  readonly id: DocumentId;
  readonly originalUrl: string;
  readonly title: string;
  readonly status: DocumentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type DocumentVersion = {
  readonly id: DocumentVersionId;
  readonly documentId: DocumentId;
  readonly contentHash: string;
  readonly createdAt: Date;
};

export type ContentBlock = {
  readonly id: ContentBlockId;
  readonly documentVersionId: DocumentVersionId;
  readonly ordinal: number;
  readonly blockType: "heading" | "paragraph" | "code" | "table" | "quote";
  readonly text: string;
  readonly headingPath: readonly string[];
};
