import type {
  AppInfoDto,
  AskQuestionRequestDto,
  AskStartResultDto,
  AskStreamEventDto,
  IngestUrlRequestDto,
  IngestUrlResultDto,
  JobCommandRequestDto,
  JobCommandResultDto,
  ListJobsResultDto,
  ListLibraryDocumentsResultDto,
  ListModelsResultDto,
  ListRelatedDocumentsRequestDto,
  ListRelatedDocumentsResultDto,
  ListTopicsResultDto,
  ProviderHealthDto,
  RelationCommandRequestDto,
  RelationCommandResultDto,
  SearchQueryDto,
  SearchResultDto,
} from "@linkatlas/contracts";

export const linkAtlasIpcChannels = {
  askEvent: "linkAtlas:ask:event",
  askStart: "linkAtlas:ask:start",
  cancelJob: "linkAtlas:jobs:cancel",
  ingestUrl: "linkAtlas:ingestUrl",
  listJobs: "linkAtlas:jobs:list",
  listLibraryDocuments: "linkAtlas:library:list",
  listModels: "linkAtlas:models:list",
  listRelatedDocuments: "linkAtlas:knowledge:related:list",
  listTopics: "linkAtlas:knowledge:topics:list",
  modelHealth: "linkAtlas:models:health",
  pinRelation: "linkAtlas:knowledge:relation:pin",
  removeRelation: "linkAtlas:knowledge:relation:remove",
  retryJob: "linkAtlas:jobs:retry",
  search: "linkAtlas:search:query",
} as const;

export type LinkAtlasApi = {
  readonly app: {
    readonly getVersion: () => Promise<AppInfoDto>;
  };
  readonly ask: {
    readonly onEvent: (callback: (event: AskStreamEventDto) => void) => () => void;
    readonly start: (input: AskQuestionRequestDto) => Promise<AskStartResultDto>;
  };
  readonly ingest: {
    readonly addUrl: (input: IngestUrlRequestDto) => Promise<IngestUrlResultDto>;
  };
  readonly jobs: {
    readonly cancel: (input: JobCommandRequestDto) => Promise<JobCommandResultDto>;
    readonly list: () => Promise<ListJobsResultDto>;
    readonly retry: (input: JobCommandRequestDto) => Promise<JobCommandResultDto>;
  };
  readonly knowledge: {
    readonly listRelated: (
      input: ListRelatedDocumentsRequestDto,
    ) => Promise<ListRelatedDocumentsResultDto>;
    readonly listTopics: () => Promise<ListTopicsResultDto>;
    readonly pinRelation: (input: RelationCommandRequestDto) => Promise<RelationCommandResultDto>;
    readonly removeRelation: (
      input: RelationCommandRequestDto,
    ) => Promise<RelationCommandResultDto>;
  };
  readonly library: {
    readonly list: () => Promise<ListLibraryDocumentsResultDto>;
  };
  readonly models: {
    readonly health: () => Promise<ProviderHealthDto>;
    readonly list: () => Promise<ListModelsResultDto>;
  };
  readonly search: {
    readonly query: (input: SearchQueryDto) => Promise<readonly SearchResultDto[]>;
  };
};
