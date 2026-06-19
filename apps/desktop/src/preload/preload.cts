type LinkAtlasApi = import("../shared/link-atlas-api.js").LinkAtlasApi;

const electron: typeof import("electron") = require("electron");

const api: LinkAtlasApi = {
  app: {
    getVersion: async () => ({ name: "LinkAtlas", version: appVersion() }),
  },
  ask: {
    onEvent: (callback) => {
      const listener = (_event: unknown, payload: unknown): void => {
        callback(payload as Parameters<typeof callback>[0]);
      };
      electron.ipcRenderer.on("linkAtlas:ask:event", listener);
      return () => {
        electron.ipcRenderer.off("linkAtlas:ask:event", listener);
      };
    },
    start: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:ask:start", input);
    },
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
  knowledge: {
    listRelated: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:knowledge:related:list", input);
    },
    listTopics: async () => {
      return await electron.ipcRenderer.invoke("linkAtlas:knowledge:topics:list");
    },
    pinRelation: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:knowledge:relation:pin", input);
    },
    removeRelation: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:knowledge:relation:remove", input);
    },
  },
  library: {
    list: async () => {
      return await electron.ipcRenderer.invoke("linkAtlas:library:list");
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
  search: {
    query: async (input) => {
      return await electron.ipcRenderer.invoke("linkAtlas:search:query", input);
    },
  },
};

function appVersion(): string {
  return "0.0.0";
}

electron.contextBridge.exposeInMainWorld("linkAtlas", api);
