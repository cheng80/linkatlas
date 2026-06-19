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
  jobs: {
    cancel: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:jobs:cancel", input);
    },
    list: async () => {
      return await electron.ipcRenderer.invoke("linkAtlas:jobs:list");
    },
    retry: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:jobs:retry", input);
    },
  },
  models: {
    health: async () => {
      return await electron.ipcRenderer.invoke("linkAtlas:models:health");
    },
    list: async () => {
      return await electron.ipcRenderer.invoke("linkAtlas:models:list");
    },
  },
};

function appVersion(): string {
  return "0.0.0";
}

electron.contextBridge.exposeInMainWorld("linkAtlas", api);
