import { type Job, JobStatus } from "@linkatlas/domain";
import type { JobRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { cancelJob, listJobs, retryJob } from "./job-ipc.js";

const failedJob: Job = {
  id: "job_failed",
  documentId: null,
  status: JobStatus.Failed,
  stage: "stage_fetching",
  progress: 30,
  errorCode: "PROVIDER_UNAVAILABLE",
  updatedAt: new Date("2026-06-19T00:00:00.000Z"),
};

describe("job IPC handlers", () => {
  it("lists recent jobs as DTOs", () => {
    const repository = createRepository({ listRecent: () => [failedJob] });

    expect(listJobs({ jobRepository: repository })).toEqual({
      jobs: [
        {
          id: "job_failed",
          status: JobStatus.Failed,
          stage: "stage_fetching",
          progress: 30,
          errorCode: "PROVIDER_UNAVAILABLE",
          updatedAt: "2026-06-19T00:00:00.000Z",
        },
      ],
    });
  });

  it("cancels and retries jobs through parsed command inputs", () => {
    const repository = createRepository({
      cancel: () => ({ ...failedJob, status: JobStatus.Cancelled }),
      retryFailed: () => ({ ...failedJob, errorCode: null, progress: 0, status: JobStatus.Queued }),
    });

    expect(cancelJob({ jobRepository: repository }, { jobId: "job_failed" })).toMatchObject({
      job: { id: "job_failed", status: JobStatus.Cancelled },
      ok: true,
    });
    expect(retryJob({ jobRepository: repository }, { jobId: "job_failed" })).toMatchObject({
      job: { id: "job_failed", status: JobStatus.Queued },
      ok: true,
    });
  });

  it("rejects malformed command inputs", () => {
    const repository = createRepository({});

    expect(cancelJob({ jobRepository: repository }, { jobId: "bad" })).toEqual({
      errorCode: "JOB_NOT_FOUND",
      message: "작업을 찾을 수 없습니다.",
      ok: false,
    });
  });
});

function createRepository(overrides: Partial<JobRepository>): JobRepository {
  return {
    acquireNext: () => null,
    cancel: () => null,
    complete: () => null,
    enqueue: () => failedJob,
    fail: () => null,
    listRecent: () => [],
    retryFailed: () => null,
    updateProgress: () => null,
    ...overrides,
  };
}
