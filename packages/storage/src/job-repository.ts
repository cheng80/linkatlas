import type { AppErrorCode, DocumentId, Job, JobId, JobStage } from "@linkatlas/domain";
import { JobStatus } from "@linkatlas/domain";
import { z } from "zod";
import type { LinkAtlasDatabase } from "./connection.js";
import { getJobById, getJobByIdempotencyKey, JobIdSchema, parseJob } from "./job-row.js";

export type EnqueueJobInput = {
  readonly id: JobId;
  readonly documentId: DocumentId | null;
  readonly idempotencyKey: string;
  readonly now: Date;
  readonly stage: JobStage;
};

export type AcquireNextJobInput = {
  readonly workerId: string;
  readonly now: Date;
  readonly leaseExpiresAt: Date;
};

export type UpdateJobProgressInput = {
  readonly id: JobId;
  readonly now: Date;
  readonly progress: number;
  readonly stage: JobStage;
};

export type JobTransitionInput = {
  readonly id: JobId;
  readonly now: Date;
};

export type FailJobInput = JobTransitionInput & {
  readonly errorCode: AppErrorCode;
};

export type ListRecentJobsInput = {
  readonly limit: number;
};

export interface JobRepository {
  enqueue(input: EnqueueJobInput): Job;
  acquireNext(input: AcquireNextJobInput): Job | null;
  updateProgress(input: UpdateJobProgressInput): Job | null;
  complete(input: JobTransitionInput): Job | null;
  fail(input: FailJobInput): Job | null;
  retryFailed(input: JobTransitionInput): Job | null;
  cancel(input: JobTransitionInput): Job | null;
  listRecent(input: ListRecentJobsInput): readonly Job[];
}

export function createSqliteJobRepository(database: LinkAtlasDatabase): JobRepository {
  return {
    enqueue(input: EnqueueJobInput): Job {
      database
        .prepare<{
          readonly id: JobId;
          readonly documentId: DocumentId | null;
          readonly idempotencyKey: string;
          readonly stage: JobStage;
          readonly now: string;
        }>(
          `
insert into jobs (
  id, document_id, idempotency_key, status, initial_stage, stage, progress, created_at, updated_at
)
values (@id, @documentId, @idempotencyKey, 'QUEUED', @stage, @stage, 0, @now, @now)
on conflict(idempotency_key) do nothing
`,
        )
        .run({
          id: input.id,
          documentId: input.documentId,
          idempotencyKey: input.idempotencyKey,
          stage: input.stage,
          now: input.now.toISOString(),
        });

      const job = getJobByIdempotencyKey(database, input.idempotencyKey);
      if (job === null) {
        throw new Error("Failed to read enqueued job.");
      }
      return job;
    },

    acquireNext(input: AcquireNextJobInput): Job | null {
      return database
        .transaction(() => {
          const row = database
            .prepare<{ readonly now: string }>(
              `
select id
from jobs
where status = 'QUEUED'
   or (status = 'RUNNING' and lease_expires_at <= @now)
order by created_at asc
limit 1
`,
            )
            .get({ now: input.now.toISOString() });
          const parsed = z.object({ id: JobIdSchema }).safeParse(row);
          if (!parsed.success) {
            return null;
          }

          database
            .prepare<{
              readonly id: JobId;
              readonly leaseOwner: string;
              readonly leaseExpiresAt: string;
              readonly now: string;
            }>(
              `
update jobs
set status = 'RUNNING',
    lease_owner = @leaseOwner,
    lease_expires_at = @leaseExpiresAt,
    updated_at = @now
where id = @id
`,
            )
            .run({
              id: parsed.data.id,
              leaseOwner: input.workerId,
              leaseExpiresAt: input.leaseExpiresAt.toISOString(),
              now: input.now.toISOString(),
            });

          return getJobById(database, parsed.data.id);
        })
        .immediate();
    },

    updateProgress(input: UpdateJobProgressInput): Job | null {
      database
        .prepare<{
          readonly id: JobId;
          readonly progress: number;
          readonly stage: JobStage;
          readonly now: string;
        }>(
          `
update jobs
set stage = @stage, progress = @progress, updated_at = @now
where id = @id and status = 'RUNNING'
`,
        )
        .run({
          id: input.id,
          progress: input.progress,
          stage: input.stage,
          now: input.now.toISOString(),
        });
      return getJobById(database, input.id);
    },

    complete(input: JobTransitionInput): Job | null {
      return transitionTerminal(database, {
        completedAt: input.now,
        id: input.id,
        now: input.now,
        status: JobStatus.Completed,
      });
    },

    fail(input: FailJobInput): Job | null {
      database
        .prepare<{ readonly id: JobId; readonly errorCode: AppErrorCode; readonly now: string }>(
          `
update jobs
set status = 'FAILED',
    error_code = @errorCode,
    lease_owner = null,
    lease_expires_at = null,
    updated_at = @now
where id = @id and status in ('RUNNING', 'BLOCKED')
`,
        )
        .run({ id: input.id, errorCode: input.errorCode, now: input.now.toISOString() });
      return getJobById(database, input.id);
    },

    retryFailed(input: JobTransitionInput): Job | null {
      database
        .prepare<{ readonly id: JobId; readonly now: string }>(
          `
update jobs
set status = 'QUEUED',
    stage = initial_stage,
    progress = 0,
    lease_owner = null,
    lease_expires_at = null,
    error_code = null,
    updated_at = @now,
    completed_at = null
where id = @id and status = 'FAILED'
`,
        )
        .run({ id: input.id, now: input.now.toISOString() });
      return getJobById(database, input.id);
    },

    cancel(input: JobTransitionInput): Job | null {
      return transitionTerminal(database, {
        completedAt: input.now,
        id: input.id,
        now: input.now,
        status: JobStatus.Cancelled,
      });
    },

    listRecent(input: ListRecentJobsInput): readonly Job[] {
      return database
        .prepare<{ readonly limit: number }>(
          `
select id, document_id, status, stage, progress, error_code, updated_at
from jobs
order by updated_at desc
limit @limit
`,
        )
        .all({ limit: input.limit })
        .map(parseJob);
    },
  };
}

function transitionTerminal(
  database: LinkAtlasDatabase,
  input: {
    readonly id: JobId;
    readonly status: typeof JobStatus.Completed | typeof JobStatus.Cancelled;
    readonly now: Date;
    readonly completedAt: Date;
  },
): Job | null {
  database
    .prepare<{
      readonly id: JobId;
      readonly status: string;
      readonly now: string;
      readonly completedAt: string;
    }>(
      `
update jobs
set status = @status,
    progress = case when @status = 'COMPLETED' then 100 else progress end,
    lease_owner = null,
    lease_expires_at = null,
    updated_at = @now,
    completed_at = @completedAt
where id = @id and status in ('QUEUED', 'RUNNING', 'BLOCKED', 'FAILED')
`,
    )
    .run({
      id: input.id,
      status: input.status,
      now: input.now.toISOString(),
      completedAt: input.completedAt.toISOString(),
    });
  return getJobById(database, input.id);
}
