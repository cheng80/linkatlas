import { AppErrorCode, type Job, JobStatus } from "@linkatlas/domain";
import type { DocumentRepository, JobRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { createIngestUrlHandler } from "./ingest-ipc.js";

const repository: DocumentRepository = {
  getDocumentSnapshot: () => null,
  saveDocumentSnapshot: () => undefined,
};
const queuedJob: Job = {
  id: "job_test",
  documentId: null,
  status: JobStatus.Queued,
  stage: "stage_fetching",
  progress: 0,
  errorCode: null,
  updatedAt: new Date("2026-06-19T00:00:00.000Z"),
};

describe("createIngestUrlHandler", () => {
  it("returns a stable user-facing error for invalid URLs", async () => {
    let capturedErrorCode: string | null = null;
    const jobRepository: JobRepository = {
      acquireNext: () => ({ ...queuedJob, status: JobStatus.Running }),
      cancel: () => null,
      complete: () => null,
      enqueue: () => queuedJob,
      fail: (input) => {
        capturedErrorCode = input.errorCode;
        return { ...queuedJob, errorCode: input.errorCode, status: JobStatus.Failed };
      },
      listRecent: () => [],
      retryFailed: () => null,
      updateProgress: () => ({ ...queuedJob, status: JobStatus.Running }),
    };
    const handler = createIngestUrlHandler({
      allowedHosts: [],
      documentRepository: repository,
      jobRepository,
    });

    await expect(handler({ url: "file:///tmp/nope" })).resolves.toEqual({
      errorCode: "UNSUPPORTED_PROTOCOL",
      message: "http 또는 https URL만 저장할 수 있습니다.",
      ok: false,
    });
    expect(capturedErrorCode).toBe(AppErrorCode.InvalidInput);
  });
});
