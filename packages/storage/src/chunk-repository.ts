import { createHash } from "node:crypto";
import type { ChunkId, DocumentId, DocumentVersionId } from "@linkatlas/domain";
import type { LinkAtlasDatabase } from "./connection.js";
import type { DocumentSnapshot } from "./document-repository.js";

export type ChunkRecord = {
  readonly id: ChunkId;
  readonly documentId: DocumentId;
  readonly documentVersionId: DocumentVersionId;
  readonly ordinal: number;
  readonly headingPath: readonly string[];
  readonly text: string;
  readonly blockIds: readonly string[];
  readonly embeddingIndexVersion: string | null;
  readonly createdAt: Date;
};

export type KeywordSearchHit = {
  readonly chunk: ChunkRecord;
  readonly score: number;
};

export interface ChunkRepository {
  rebuildDocumentChunks(input: { readonly snapshot: DocumentSnapshot; readonly now: Date }): void;
  searchKeyword(input: {
    readonly query: string;
    readonly limit: number;
    readonly documentId?: DocumentId;
  }): readonly KeywordSearchHit[];
  listDocumentChunks(documentId: DocumentId): readonly ChunkRecord[];
}

export function createSqliteChunkRepository(database: LinkAtlasDatabase): ChunkRepository {
  return {
    rebuildDocumentChunks(input): void {
      const transaction = database.transaction(() => {
        database
          .prepare<[DocumentVersionId]>("delete from chunks where document_version_id = ?")
          .run(input.snapshot.version.id);
        database
          .prepare<[DocumentId]>("delete from chunk_fts where document_id = ?")
          .run(input.snapshot.document.id);

        const insertChunk = database.prepare<{
          readonly id: ChunkId;
          readonly documentId: DocumentId;
          readonly documentVersionId: DocumentVersionId;
          readonly ordinal: number;
          readonly headingPath: string;
          readonly text: string;
          readonly blockIdsJson: string;
          readonly createdAt: string;
        }>(
          `
insert into chunks (
  id, document_id, document_version_id, ordinal, heading_path, text, block_ids_json, created_at
)
values (@id, @documentId, @documentVersionId, @ordinal, @headingPath, @text, @blockIdsJson, @createdAt)
`,
        );
        const insertFts = database.prepare<{
          readonly chunkId: ChunkId;
          readonly documentId: DocumentId;
          readonly title: string;
          readonly headingPath: string;
          readonly body: string;
        }>(
          "insert into chunk_fts (chunk_id, document_id, title, heading_path, body) values (@chunkId, @documentId, @title, @headingPath, @body)",
        );

        for (const block of input.snapshot.blocks) {
          const chunk: ChunkRecord = {
            blockIds: [block.id],
            createdAt: input.now,
            documentId: input.snapshot.document.id,
            documentVersionId: input.snapshot.version.id,
            embeddingIndexVersion: null,
            headingPath: block.headingPath,
            id: chunkIdFor(input.snapshot.version.id, block.ordinal),
            ordinal: block.ordinal,
            text: block.text,
          };
          insertChunk.run({
            id: chunk.id,
            documentId: chunk.documentId,
            documentVersionId: chunk.documentVersionId,
            ordinal: chunk.ordinal,
            headingPath: JSON.stringify(chunk.headingPath),
            text: chunk.text,
            blockIdsJson: JSON.stringify(chunk.blockIds),
            createdAt: chunk.createdAt.toISOString(),
          });
          insertFts.run({
            body: chunk.text,
            chunkId: chunk.id,
            documentId: chunk.documentId,
            headingPath: chunk.headingPath.join(" > "),
            title: input.snapshot.document.title,
          });
        }
      });
      transaction.immediate();
    },

    searchKeyword(input): readonly KeywordSearchHit[] {
      if (input.query.trim().length === 0) {
        return [];
      }
      const rows = database
        .prepare<{
          readonly query: string;
          readonly limit: number;
          readonly documentId: DocumentId | null;
        }>(
          `
select chunks.*, bm25(chunk_fts) as score
from chunk_fts
join chunks on chunks.id = chunk_fts.chunk_id
where chunk_fts match @query
  and (@documentId is null or chunks.document_id = @documentId)
order by score asc
limit @limit
`,
        )
        .all({
          query: quoteFts(input.query),
          limit: input.limit,
          documentId: input.documentId ?? null,
        });
      return rows.map(parseKeywordHit);
    },

    listDocumentChunks(documentId): readonly ChunkRecord[] {
      return database
        .prepare<[DocumentId]>("select * from chunks where document_id = ? order by ordinal asc")
        .all(documentId)
        .map(parseChunk);
    },
  };
}

function parseChunk(row: unknown): ChunkRecord {
  const input = row as {
    readonly id: ChunkId;
    readonly document_id: DocumentId;
    readonly document_version_id: DocumentVersionId;
    readonly ordinal: number;
    readonly heading_path: string;
    readonly text: string;
    readonly block_ids_json: string;
    readonly embedding_index_version: string | null;
    readonly created_at: string;
  };
  return {
    id: input.id,
    documentId: input.document_id,
    documentVersionId: input.document_version_id,
    ordinal: input.ordinal,
    headingPath: JSON.parse(input.heading_path) as readonly string[],
    text: input.text,
    blockIds: JSON.parse(input.block_ids_json) as readonly string[],
    embeddingIndexVersion: input.embedding_index_version,
    createdAt: new Date(input.created_at),
  };
}

function parseKeywordHit(row: unknown): KeywordSearchHit {
  const input = row as { readonly score: number };
  return {
    chunk: parseChunk(row),
    score: Number(input.score),
  };
}

function quoteFts(query: string): string {
  return `"${query.replaceAll('"', '""')}"`;
}

function chunkIdFor(versionId: DocumentVersionId, ordinal: number): ChunkId {
  return `chunk_${createHash("sha256").update(`${versionId}:${ordinal}`).digest("hex").slice(0, 24)}`;
}
