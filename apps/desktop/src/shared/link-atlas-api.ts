import type { AppInfoDto } from "@linkatlas/contracts";

export type LinkAtlasApi = {
  readonly app: {
    readonly getVersion: () => Promise<AppInfoDto>;
  };
};
