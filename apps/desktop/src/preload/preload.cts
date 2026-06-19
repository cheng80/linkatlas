type LinkAtlasApi = import("../shared/link-atlas-api.js").LinkAtlasApi;

const electron: typeof import("electron") = require("electron");

const api: LinkAtlasApi = {
  app: {
    getVersion: async () => ({ name: "LinkAtlas", version: appVersion() }),
  },
  ingest: {
    addUrl: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:ingestUrl", input);
    },
  },
};

function appVersion(): string {
  return "0.0.0";
}

electron.contextBridge.exposeInMainWorld("linkAtlas", api);
