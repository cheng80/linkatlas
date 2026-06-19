import type {
  AppInfoDto,
  IngestUrlRequestDto,
  IngestUrlResultDto,
  JobCommandRequestDto,
  JobCommandResultDto,
  ListJobsResultDto,
  ListModelsResultDto,
  ProviderHealthDto,
  SearchQueryDto,
  SearchResultDto,
} from "@linkatlas/contracts";

export const linkAtlasIpcChannels = {
  cancelJob: "linkAtlas:jobs:cancel",
  ingestUrl: "linkAtlas:ingestUrl",
  listJobs: "linkAtlas:jobs:list",
  listModels: "linkAtlas:models:list",
  modelHealth: "linkAtlas:models:health",
  retryJob: "linkAtlas:jobs:retry",
  search: "linkAtlas:search:query",
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
  readonly models: {
    readonly health: () => Promise<ProviderHealthDto>;
    readonly list: () => Promise<ListModelsResultDto>;
  };
  readonly search: {
    readonly query: (input: SearchQueryDto) => Promise<readonly SearchResultDto[]>;
  };
};
