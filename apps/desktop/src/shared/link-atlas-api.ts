import type {
  AppInfoDto,
  IngestUrlRequestDto,
  IngestUrlResultDto,
  JobCommandRequestDto,
  JobCommandResultDto,
  ListJobsResultDto,
} from "@linkatlas/contracts";

export const linkAtlasIpcChannels = {
  cancelJob: "linkAtlas:jobs:cancel",
  ingestUrl: "linkAtlas:ingestUrl",
  listJobs: "linkAtlas:jobs:list",
  retryJob: "linkAtlas:jobs:retry",
} as const;

export type LinkAtlasApi = {
  readonly app: {
    readonly getVersion: () => Promise<AppInfoDto>;
  };
  readonly ingest: {
    readonly addUrl: (input: IngestUrlRequestDto) => Promise<IngestUrlResultDto>;
  };
  readonly jobs: {
    readonly cancel: (input: JobCommandRequestDto) => Promise<JobCommandResultDto>;
    readonly list: () => Promise<ListJobsResultDto>;
    readonly retry: (input: JobCommandRequestDto) => Promise<JobCommandResultDto>;
  };
};
