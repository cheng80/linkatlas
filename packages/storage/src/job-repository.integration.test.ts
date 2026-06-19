import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppErrorCode, type Job, JobStatus } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import { createSqliteConnection, createSqliteJobRepository, migrateDatabase } from "./index.js";

async function withTempDatabase<T>(test: (databasePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "linkatlas-jobs-"));
  try {
    return await test(join(directory, "vault.sqlite3"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

describe("SQLite job repository", () => {
  it("deduplicates queued jobs by idempotency key", async () => {
    await withTempDatabase(async (databasePath) => {
      const now = new Date("2026-06-19T01:00:00.000Z");
      const database = createSqliteConnection({ databasePath });

      try {
        migrateDatabase(database);
        const repository = createSqliteJobRepository(database);

        const first = repository.enqueue({
          id: "job_fetch_first",
          documentId: null,
          idempotencyKey: "url:https://example.com/a",
          now,
          stage: "stage_fetching",
        });
        const second = repository.enqueue({
          id: "job_fetch_second",
          documentId: null,
          idempotencyKey: "url:https://example.com/a",
          now,
          stage: "stage_fetching",
        });

        expect(second).toEqual(first);
        expect(repository.listRecent({ limit: 10 })).toHaveLength(1);
      } finally {
        database.close();
      }
    });
  });

  it("leases the next queued job and recovers an expired lease", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });

      try {
        migrateDatabase(database);
        const repository = createSqliteJobRepository(database);
        repository.enqueue({
          id: "job_fetch",
          documentId: null,
          idempotencyKey: "url:https://example.com/b",
          now: new Date("2026-06-19T01:00:00.000Z"),
          stage: "stage_fetching",
        });

        const leased = repository.acquireNext({
          leaseExpiresAt: new Date("2026-06-19T01:05:00.000Z"),
          now: new Date("2026-06-19T01:01:00.000Z"),
          workerId: "worker_a",
        });
        expect(jobSummary(leased)).toEqual({
          id: "job_fetch",
          progress: 0,
          stage: "stage_fetching",
          status: JobStatus.Running,
        });
        expect(
          repository.acquireNext({
            leaseExpiresAt: new Date("2026-06-19T01:06:00.000Z"),
            now: new Date("2026-06-19T01:02:00.000Z"),
            workerId: "worker_b",
          }),
        ).toBeNull();

        const recovered = repository.acquireNext({
          leaseExpiresAt: new Date("2026-06-19T01:11:00.000Z"),
          now: new Date("2026-06-19T01:06:00.000Z"),
          workerId: "worker_b",
        });

        expect(jobSummary(recovered)).toEqual({
          id: "job_fetch",
          progress: 0,
          stage: "stage_fetching",
          status: JobStatus.Running,
        });
      } finally {
        database.close();
      }
    });
  });

  it("tracks progress, cancellation, failure, and retry", async () => {
    await withTempDatabase(async (databasePath) => {
      const database = createSqliteConnection({ databasePath });

      try {
        migrateDatabase(database);
        const repository = createSqliteJobRepository(database);
        repository.enqueue({
          id: "job_analyze",
          documentId: null,
          idempotencyKey: "analysis:doc_a",
          now: new Date("2026-06-19T02:00:00.000Z"),
          stage: "stage_extracting",
        });
        repository.acquireNext({
          leaseExpiresAt: new Date("2026-06-19T02:05:00.000Z"),
          now: new Date("2026-06-19T02:01:00.000Z"),
          workerId: "worker_a",
        });

        const progressed = repository.updateProgress({
          id: "job_analyze",
          now: new Date("2026-06-19T02:02:00.000Z"),
          progress: 40,
          stage: "stage_summarizing",
        });
        expect(jobSummary(progressed)).toEqual({
          id: "job_analyze",
          progress: 40,
          stage: "stage_summarizing",
          status: JobStatus.Running,
        });

        const failed = repository.fail({
          errorCode: AppErrorCode.ProviderUnavailable,
          id: "job_analyze",
          now: new Date("2026-06-19T02:03:00.000Z"),
        });
        expect(failed?.status).toBe(JobStatus.Failed);
        expect(failed?.errorCode).toBe(AppErrorCode.ProviderUnavailable);

        const retried = repository.retryFailed({
          id: "job_analyze",
          now: new Date("2026-06-19T02:04:00.000Z"),
        });
        expect(jobSummary(retried)).toEqual({
          id: "job_analyze",
          progress: 0,
          stage: "stage_extracting",
          status: JobStatus.Queued,
        });

        const cancelled = repository.cancel({
          id: "job_analyze",
          now: new Date("2026-06-19T02:05:00.000Z"),
        });
        expect(cancelled?.status).toBe(JobStatus.Cancelled);
      } finally {
        database.close();
      }
    });
  });
});

function jobSummary(job: Job | null): {
  readonly id: string;
  readonly progress: number;
  readonly stage: string | null;
  readonly status: string;
} | null {
  if (job === null) {
    return null;
  }
  return {
    id: job.id,
    progress: job.progress,
    stage: job.stage,
    status: job.status,
  };
}
