import type {
  JobCommandRequestDto,
  JobCommandResultDto,
  JobDto,
  ListJobsResultDto,
} from "@linkatlas/contracts";
import { ContractParseError, parseJobCommandRequest } from "@linkatlas/contracts";
import type { Job } from "@linkatlas/domain";
import type { JobRepository } from "@linkatlas/storage";
import { ipcMain } from "electron";

export type JobIpcOptions = {
  readonly jobRepository: JobRepository;
  readonly now?: () => Date;
};

export const jobIpcChannels = {
  cancel: "linkAtlas:jobs:cancel",
  list: "linkAtlas:jobs:list",
  retry: "linkAtlas:jobs:retry",
} as const;

export function registerJobIpc(options: JobIpcOptions): void {
  ipcMain.handle(jobIpcChannels.list, () => listJobs(options));
  ipcMain.handle(jobIpcChannels.cancel, (_event, input: unknown) => cancelJob(options, input));
  ipcMain.handle(jobIpcChannels.retry, (_event, input: unknown) => retryJob(options, input));
}

export function listJobs(options: JobIpcOptions): ListJobsResultDto {
  return {
    jobs: options.jobRepository.listRecent({ limit: 10 }).map(toJobDto),
  };
}

export function cancelJob(options: JobIpcOptions, input: unknown): JobCommandResultDto {
  return runJobCommand(input, (request) =>
    options.jobRepository.cancel({
      id: request.jobId,
      now: options.now?.() ?? new Date(),
    }),
  );
}

export function retryJob(options: JobIpcOptions, input: unknown): JobCommandResultDto {
  return runJobCommand(input, (request) =>
    options.jobRepository.retryFailed({
      id: request.jobId,
      now: options.now?.() ?? new Date(),
    }),
  );
}

function runJobCommand(
  input: unknown,
  command: (request: JobCommandRequestDto) => Job | null,
): JobCommandResultDto {
  try {
    const request = parseJobCommandRequest(input);
    const job = command(request);
    return job === null ? jobNotFound() : { ok: true, job: toJobDto(job) };
  } catch (error) {
    if (error instanceof ContractParseError) {
      return jobNotFound();
    }
    throw error;
  }
}

function jobNotFound(): JobCommandResultDto {
  return {
    ok: false,
    errorCode: "JOB_NOT_FOUND",
    message: "작업을 찾을 수 없습니다.",
  };
}

function toJobDto(job: Job): JobDto {
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    errorCode: job.errorCode,
    updatedAt: job.updatedAt.toISOString(),
  };
}
