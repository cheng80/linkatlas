import type { LinkAtlasApi } from "../shared/link-atlas-api.js";

declare global {
  interface Window {
    readonly linkAtlas: LinkAtlasApi;
  }
}
