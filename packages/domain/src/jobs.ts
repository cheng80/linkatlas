import type { DocumentId, JobId } from "./brand.js";
import type { AppErrorCode } from "./errors.js";

export const JobStatus = {
  Queued: "QUEUED",
  Running: "RUNNING",
  Blocked: "BLOCKED",
  Failed: "FAILED",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export type JobStage = `stage_${string}`;

export type Job = {
  readonly id: JobId;
  readonly documentId: DocumentId | null;
  readonly idempotencyKey: string;
  readonly status: JobStatus;
  readonly stage: JobStage | null;
  readonly progress: number;
  readonly errorCode: AppErrorCode | null;
  readonly updatedAt: Date;
};
