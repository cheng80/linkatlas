import type { DocumentId, DocumentVersionId, SummaryId } from "@linkatlas/domain";
import { z } from "zod";
import type { LinkAtlasDatabase } from "./connection.js";

const SummaryIdSchema = z.custom<SummaryId>(
  (value) => typeof value === "string" && value.startsWith("summary_"),
);
const DocumentIdSchema = z.custom<DocumentId>(
  (value) => typeof value === "string" && value.startsWith("doc_"),
);
const DocumentVersionIdSchema = z.custom<DocumentVersionId>(
  (value) => typeof value === "string" && value.startsWith("docver_"),
);

const SummaryRowSchema = z.object({
  id: SummaryIdSchema,
  document_id: DocumentIdSchema,
  document_version_id: DocumentVersionIdSchema,
  kind: z.enum(["document-analysis"]),
  content_json: z.string(),
  model_name: z.string().min(1),
  prompt_name: z.string().min(1),
  prompt_version: z.string().min(1),
  input_hash: z.string().min(1),
  is_user_edited: z.union([z.literal(0), z.literal(1)]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SummaryRecord = {
  readonly id: SummaryId;
  readonly documentId: DocumentId;
  readonly documentVersionId: DocumentVersionId;
  readonly kind: "document-analysis";
  readonly content: unknown;
  readonly modelName: string;
  readonly promptName: string;
  readonly promptVersion: string;
  readonly inputHash: string;
  readonly isUserEdited: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type SaveSummaryInput = SummaryRecord;

export interface SummaryRepository {
  save(input: SaveSummaryInput): void;
  getLatestForDocument(documentId: DocumentId): SummaryRecord | null;
  hasUserEditedSummary(documentId: DocumentId): boolean;
}

export function createSqliteSummaryRepository(database: LinkAtlasDatabase): SummaryRepository {
  return {
    save(input): void {
      database
        .prepare<{
          readonly id: SummaryId;
          readonly documentId: DocumentId;
          readonly documentVersionId: DocumentVersionId;
          readonly kind: string;
          readonly contentJson: string;
          readonly modelName: string;
          readonly promptName: string;
          readonly promptVersion: string;
          readonly inputHash: string;
          readonly isUserEdited: number;
          readonly createdAt: string;
          readonly updatedAt: string;
        }>(
          `
insert into summaries (
  id, document_id, document_version_id, kind, content_json, model_name,
  prompt_name, prompt_version, input_hash, is_user_edited, created_at, updated_at
)
values (
  @id, @documentId, @documentVersionId, @kind, @contentJson, @modelName,
  @promptName, @promptVersion, @inputHash, @isUserEdited, @createdAt, @updatedAt
)
on conflict(id) do update set
  content_json = excluded.content_json,
  model_name = excluded.model_name,
  prompt_name = excluded.prompt_name,
  prompt_version = excluded.prompt_version,
  input_hash = excluded.input_hash,
  is_user_edited = excluded.is_user_edited,
  updated_at = excluded.updated_at
`,
        )
        .run({
          id: input.id,
          documentId: input.documentId,
          documentVersionId: input.documentVersionId,
          kind: input.kind,
          contentJson: JSON.stringify(input.content),
          modelName: input.modelName,
          promptName: input.promptName,
          promptVersion: input.promptVersion,
          inputHash: input.inputHash,
          isUserEdited: input.isUserEdited ? 1 : 0,
          createdAt: input.createdAt.toISOString(),
          updatedAt: input.updatedAt.toISOString(),
        });
    },

    getLatestForDocument(documentId): SummaryRecord | null {
      const row = database
        .prepare<[DocumentId]>(
          `
select *
from summaries
where document_id = ?
order by updated_at desc
limit 1
`,
        )
        .get(documentId);
      return row === undefined ? null : parseSummary(row);
    },

    hasUserEditedSummary(documentId): boolean {
      const row = database
        .prepare<[DocumentId]>(
          "select 1 as found from summaries where document_id = ? and is_user_edited = 1 limit 1",
        )
        .get(documentId);
      return row !== undefined;
    },
  };
}

function parseSummary(input: unknown): SummaryRecord {
  const row = SummaryRowSchema.parse(input);
  return {
    id: row.id,
    documentId: row.document_id,
    documentVersionId: row.document_version_id,
    kind: row.kind,
    content: JSON.parse(row.content_json) as unknown,
    modelName: row.model_name,
    promptName: row.prompt_name,
    promptVersion: row.prompt_version,
    inputHash: row.input_hash,
    isUserEdited: row.is_user_edited === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
