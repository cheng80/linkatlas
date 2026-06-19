import type {
  ContentBlock,
  ContentBlockId,
  Document,
  DocumentId,
  DocumentVersion,
  DocumentVersionId,
} from "@linkatlas/domain";
import { DocumentStatus } from "@linkatlas/domain";
import { z } from "zod";
import type { LinkAtlasDatabase } from "./connection.js";
import { StorageError, StorageErrorCode } from "./errors.js";

const DocumentIdSchema = z.custom<DocumentId>(
  (value) => typeof value === "string" && value.startsWith("doc_"),
);
const DocumentVersionIdSchema = z.custom<DocumentVersionId>(
  (value) => typeof value === "string" && value.startsWith("docver_"),
);
const ContentBlockIdSchema = z.custom<ContentBlockId>(
  (value) => typeof value === "string" && value.startsWith("block_"),
);

const DocumentRowSchema = z.object({
  id: DocumentIdSchema,
  original_url: z.string().min(1),
  title: z.string().min(1),
  status: z.enum([
    DocumentStatus.Inbox,
    DocumentStatus.Ready,
    DocumentStatus.Failed,
    DocumentStatus.Archived,
  ]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const DocumentVersionRowSchema = z.object({
  id: DocumentVersionIdSchema,
  document_id: DocumentIdSchema,
  content_hash: z.string().min(1),
  created_at: z.string().datetime(),
});

const ContentBlockRowSchema = z.object({
  id: ContentBlockIdSchema,
  document_version_id: DocumentVersionIdSchema,
  ordinal: z.number().int().nonnegative(),
  block_type: z.enum(["heading", "paragraph", "code", "table", "quote"]),
  heading_path: z.string(),
  text: z.string(),
});

export type DocumentSnapshot = {
  readonly document: Document;
  readonly version: DocumentVersion;
  readonly blocks: readonly ContentBlock[];
};

export type SaveDocumentSnapshotInput = DocumentSnapshot;

export interface DocumentRepository {
  saveDocumentSnapshot(input: SaveDocumentSnapshotInput): void;
  getDocumentSnapshot(documentId: DocumentId): DocumentSnapshot | null;
}

export function createSqliteDocumentRepository(database: LinkAtlasDatabase): DocumentRepository {
  return {
    saveDocumentSnapshot(input: SaveDocumentSnapshotInput): void {
      const transaction = database.transaction(() => {
        database
          .prepare<{
            readonly id: DocumentId;
            readonly originalUrl: string;
            readonly title: string;
            readonly status: string;
            readonly capturedAt: string;
            readonly createdAt: string;
            readonly updatedAt: string;
          }>(
            `
insert into documents (id, original_url, title, status, captured_at, created_at, updated_at)
values (@id, @originalUrl, @title, @status, @capturedAt, @createdAt, @updatedAt)
on conflict(id) do update set
  original_url = excluded.original_url,
  title = excluded.title,
  status = excluded.status,
  updated_at = excluded.updated_at
`,
          )
          .run({
            id: input.document.id,
            originalUrl: input.document.originalUrl,
            title: input.document.title,
            status: input.document.status,
            capturedAt: input.document.createdAt.toISOString(),
            createdAt: input.document.createdAt.toISOString(),
            updatedAt: input.document.updatedAt.toISOString(),
          });

        database
          .prepare<{
            readonly id: DocumentVersionId;
            readonly documentId: DocumentId;
            readonly contentHash: string;
            readonly createdAt: string;
          }>(
            `
insert into document_versions (
  id,
  document_id,
  content_hash,
  extraction_method,
  created_at
)
values (@id, @documentId, @contentHash, 'bootstrap', @createdAt)
on conflict(id) do update set
  content_hash = excluded.content_hash
`,
          )
          .run({
            id: input.version.id,
            documentId: input.version.documentId,
            contentHash: input.version.contentHash,
            createdAt: input.version.createdAt.toISOString(),
          });

        database
          .prepare<[DocumentVersionId]>("delete from content_blocks where document_version_id = ?")
          .run(input.version.id);

        const insertBlock = database.prepare<{
          readonly id: ContentBlockId;
          readonly documentVersionId: DocumentVersionId;
          readonly ordinal: number;
          readonly blockType: string;
          readonly headingPath: string;
          readonly text: string;
        }>(
          `
insert into content_blocks (
  id,
  document_version_id,
  ordinal,
  block_type,
  heading_path,
  text
)
values (@id, @documentVersionId, @ordinal, @blockType, @headingPath, @text)
`,
        );

        for (const block of input.blocks) {
          insertBlock.run({
            id: block.id,
            documentVersionId: block.documentVersionId,
            ordinal: block.ordinal,
            blockType: block.blockType,
            headingPath: JSON.stringify(block.headingPath),
            text: block.text,
          });
        }

        database
          .prepare<{ readonly documentId: DocumentId; readonly versionId: DocumentVersionId }>(
            "update documents set current_version_id = @versionId where id = @documentId",
          )
          .run({ documentId: input.document.id, versionId: input.version.id });
      });

      transaction.immediate();
    },

    getDocumentSnapshot(documentId: DocumentId): DocumentSnapshot | null {
      const documentRow = database
        .prepare<[DocumentId]>(
          "select id, original_url, title, status, created_at, updated_at from documents where id = ?",
        )
        .get(documentId);

      if (documentRow === undefined) {
        return null;
      }

      const versionRow = database
        .prepare<[DocumentId]>(
          `
select document_versions.id, document_versions.document_id, document_versions.content_hash, document_versions.created_at
from document_versions
join documents on documents.current_version_id = document_versions.id
where documents.id = ?
`,
        )
        .get(documentId);

      if (versionRow === undefined) {
        throw new StorageError({
          errorCode: StorageErrorCode.RowParseFailed,
          message: "Document is missing a current version.",
        });
      }

      const document = parseDocument(documentRow);
      const version = parseDocumentVersion(versionRow);
      const blocks = database
        .prepare<[DocumentVersionId]>(
          `
select id, document_version_id, ordinal, block_type, heading_path, text
from content_blocks
where document_version_id = ?
order by ordinal asc
`,
        )
        .all(version.id)
        .map(parseContentBlock);

      return { document, version, blocks };
    },
  };
}

function parseDocument(input: unknown): Document {
  const row = DocumentRowSchema.parse(input);
  return {
    id: row.id,
    originalUrl: row.original_url,
    title: row.title,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function parseDocumentVersion(input: unknown): DocumentVersion {
  const row = DocumentVersionRowSchema.parse(input);
  return {
    id: row.id,
    documentId: row.document_id,
    contentHash: row.content_hash,
    createdAt: new Date(row.created_at),
  };
}

function parseContentBlock(input: unknown): ContentBlock {
  const row = ContentBlockRowSchema.parse(input);
  const parsedHeadingPath: unknown = JSON.parse(row.heading_path);
  return {
    id: row.id,
    documentVersionId: row.document_version_id,
    ordinal: row.ordinal,
    blockType: row.block_type,
    text: row.text,
    headingPath: z.array(z.string()).parse(parsedHeadingPath),
  };
}
