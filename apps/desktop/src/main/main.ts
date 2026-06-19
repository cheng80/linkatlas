import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OllamaGenerationProvider } from "@linkatlas/llm";
import {
  createSqliteConnection,
  createSqliteDocumentRepository,
  createSqliteJobRepository,
  type LinkAtlasDatabase,
  migrateDatabase,
} from "@linkatlas/storage";
import { app, BrowserWindow } from "electron";

import { registerIngestIpc } from "./ingest-ipc.js";
import { registerJobIpc } from "./job-ipc.js";
import { registerModelIpc } from "./model-ipc.js";
import { createSecureWebPreferences, isAllowedNavigation } from "./security.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const e2eEnvironmentKey = "LINKATLAS_E2E";
const e2eUserDataDirectoryKey = "LINKATLAS_E2E_USER_DATA_DIR";
const allowedFetchHostsKey = "LINKATLAS_ALLOWED_FETCH_HOSTS";
const ollamaBaseUrlKey = "LINKATLAS_OLLAMA_BASE_URL";

const e2eUserDataDirectory = process.env[e2eUserDataDirectoryKey];
if (e2eUserDataDirectory !== undefined && e2eUserDataDirectory.trim().length > 0) {
  app.setPath("userData", e2eUserDataDirectory);
}

export function createMainWindow(): BrowserWindow {
  const preloadPath = join(currentDirectory, "../preload/preload.cjs");
  const rendererPath = join(currentDirectory, "../renderer/index.html");
  const window = new BrowserWindow({
    height: 760,
    minHeight: 560,
    minWidth: 900,
    show: true,
    title: "LinkAtlas",
    webPreferences: createSecureWebPreferences(preloadPath),
    width: 1180,
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isAllowedNavigation(targetUrl)) {
      event.preventDefault();
    }
  });

  void window.loadFile(rendererPath);

  return window;
}

app.whenReady().then(() => {
  const database = createAppDatabase();
  const jobRepository = createSqliteJobRepository(database);
  registerIngestIpc({
    allowedHosts: allowedFetchHosts(),
    documentRepository: createSqliteDocumentRepository(database),
    jobRepository,
  });
  registerJobIpc({ jobRepository });
  registerModelIpc({
    generationProvider: new OllamaGenerationProvider({
      baseUrl: process.env[ollamaBaseUrlKey] ?? "http://127.0.0.1:11434",
      timeoutMs: 1_000,
    }),
  });
  app.once("before-quit", () => {
    database.close();
  });
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || process.env[e2eEnvironmentKey] === "1") {
    app.quit();
  }
});

function allowedFetchHosts(): readonly string[] {
  const raw = process.env[allowedFetchHostsKey];
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }
  return raw
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0);
}

function createAppDatabase(): LinkAtlasDatabase {
  const database = createSqliteConnection({
    databasePath: join(app.getPath("userData"), "vault.sqlite3"),
  });
  migrateDatabase(database);
  return database;
}
