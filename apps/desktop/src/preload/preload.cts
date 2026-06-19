type LinkAtlasApi = import("../shared/link-atlas-api.js").LinkAtlasApi;

const electron: typeof import("electron") = require("electron");

const api: LinkAtlasApi = {
  app: {
    getVersion: async () => ({ name: "LinkAtlas", version: appVersion() }),
  },
};

function appVersion(): string {
  return "0.0.0";
}

electron.contextBridge.exposeInMainWorld("linkAtlas", api);
