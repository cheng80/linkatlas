import type { AppErrorCode, DocumentId, Job, JobId, JobStage } from "@linkatlas/domain";
import { JobStatus } from "@linkatlas/domain";
import { z } from "zod";
import type { LinkAtlasDatabase } from "./connection.js";

export const JobIdSchema = z.custom<JobId>(
  (value) => typeof value === "string" && value.startsWith("job_"),
);

export const DocumentIdSchema = z.custom<DocumentId>(
  (value) => typeof value === "string" && value.startsWith("doc_"),
);

export const JobStageSchema = z.custom<JobStage>(
  (value) => typeof value === "string" && value.startsWith("stage_"),
);

const JobRowSchema = z.object({
  id: JobIdSchema,
  document_id: DocumentIdSchema.nullable(),
  status: z.enum([
    JobStatus.Queued,
    JobStatus.Running,
    JobStatus.Blocked,
    JobStatus.Failed,
    JobStatus.Completed,
    JobStatus.Cancelled,
  ]),
  stage: JobStageSchema.nullable(),
  progress: z.number().int().min(0).max(100),
  error_code: z.string().nullable(),
  updated_at: z.string().datetime(),
});

export function getJobById(database: LinkAtlasDatabase, id: JobId): Job | null {
  const row = database
    .prepare<[JobId]>(
      "select id, document_id, status, stage, progress, error_code, updated_at from jobs where id = ?",
    )
    .get(id);
  return row === undefined ? null : parseJob(row);
}

export function getJobByIdempotencyKey(
  database: LinkAtlasDatabase,
  idempotencyKey: string,
): Job | null {
  const row = database
    .prepare<[string]>(
      `
select id, document_id, status, stage, progress, error_code, updated_at
from jobs
where idempotency_key = ?
`,
    )
    .get(idempotencyKey);
  return row === undefined ? null : parseJob(row);
}

export function parseJob(input: unknown): Job {
  const row = JobRowSchema.parse(input);
  return {
    id: row.id,
    documentId: row.document_id,
    status: row.status,
    stage: row.stage,
    progress: row.progress,
    errorCode: row.error_code as AppErrorCode | null,
    updatedAt: new Date(row.updated_at),
  };
}
