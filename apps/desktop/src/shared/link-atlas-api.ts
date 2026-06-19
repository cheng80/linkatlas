import type { AppInfoDto, IngestUrlRequestDto, IngestUrlResultDto } from "@linkatlas/contracts";

export const linkAtlasIpcChannels = {
  ingestUrl: "linkAtlas:ingestUrl",
} as const;

export type LinkAtlasApi = {
  readonly app: {
    readonly getVersion: () => Promise<AppInfoDto>;
  };
  readonly ingest: {
    readonly addUrl: (input: IngestUrlRequestDto) => Promise<IngestUrlResultDto>;
  };
};
