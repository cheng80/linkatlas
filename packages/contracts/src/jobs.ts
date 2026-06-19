import { z } from "zod";
import { parseContract } from "./errors.js";

export type JobIdDto = `job_${string}`;

export const JobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "BLOCKED",
  "FAILED",
  "COMPLETED",
  "CANCELLED",
]);

export type JobStatusDto = z.infer<typeof JobStatusSchema>;

export const JobDtoSchema = z.object({
  id: z.custom<JobIdDto>((value) => typeof value === "string" && value.startsWith("job_")),
  status: JobStatusSchema,
  stage: z.string().nullable(),
  progress: z.number().int().min(0).max(100),
  errorCode: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export type JobDto = z.infer<typeof JobDtoSchema>;

export const ListJobsResultSchema = z.object({
  jobs: z.array(JobDtoSchema),
});

export type ListJobsResultDto = z.infer<typeof ListJobsResultSchema>;

export const JobCommandRequestSchema = z.object({
  jobId: z.custom<JobIdDto>((value) => typeof value === "string" && value.startsWith("job_")),
});

export type JobCommandRequestDto = z.infer<typeof JobCommandRequestSchema>;

export const JobCommandResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    job: JobDtoSchema,
  }),
  z.object({
    ok: z.literal(false),
    errorCode: z.enum(["JOB_NOT_FOUND"]),
    message: z.string().min(1),
  }),
]);

export type JobCommandResultDto = z.infer<typeof JobCommandResultSchema>;

export function parseJobCommandRequest(input: unknown): JobCommandRequestDto {
  return parseContract(JobCommandRequestSchema, input);
}
