import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OllamaEmbeddingProvider, OllamaGenerationProvider } from "@linkatlas/llm";
import { InMemoryVectorIndex } from "@linkatlas/search";
import {
  createSqliteChunkRepository,
  createSqliteConnection,
  createSqliteDocumentRepository,
  createSqliteJobRepository,
  createSqliteKnowledgeRepository,
  createSqliteSummaryRepository,
  type LinkAtlasDatabase,
  migrateDatabase,
} from "@linkatlas/storage";
import { app, BrowserWindow } from "electron";

import { registerAskIpc } from "./ask-ipc.js";
import { registerIngestIpc } from "./ingest-ipc.js";
import { registerJobIpc } from "./job-ipc.js";
import { registerKnowledgeIpc } from "./knowledge-ipc.js";
import { registerLibraryIpc } from "./library-ipc.js";
import { registerModelIpc } from "./model-ipc.js";
import { registerSearchIpc } from "./search-ipc.js";
import { createSecureWebPreferences, isAllowedNavigation } from "./security.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const e2eEnvironmentKey = "LINKATLAS_E2E";
const e2eUserDataDirectoryKey = "LINKATLAS_E2E_USER_DATA_DIR";
const allowedFetchHostsKey = "LINKATLAS_ALLOWED_FETCH_HOSTS";
const ollamaBaseUrlKey = "LINKATLAS_OLLAMA_BASE_URL";
const defaultAnalysisModel = "gemma4:e4b-it-qat";
const defaultEmbeddingModel = "embeddinggemma:300m-qat-q8_0";

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
  const documentRepository = createSqliteDocumentRepository(database);
  const knowledgeRepository = createSqliteKnowledgeRepository(database);
  const chunkRepository = createSqliteChunkRepository(database);
  const vectorIndex = new InMemoryVectorIndex();
  const generationProvider = new OllamaGenerationProvider({
    baseUrl: process.env[ollamaBaseUrlKey] ?? "http://127.0.0.1:11434",
    timeoutMs: 1_000,
  });
  const embeddingProvider = new OllamaEmbeddingProvider({
    baseUrl: process.env[ollamaBaseUrlKey] ?? "http://127.0.0.1:11434",
    timeoutMs: 1_000,
  });
  registerIngestIpc({
    allowedHosts: allowedFetchHosts(),
    analysisModel: defaultAnalysisModel,
    chunkRepository,
    documentRepository,
    embeddingModel: defaultEmbeddingModel,
    embeddingProvider,
    generationProvider,
    jobRepository,
    knowledgeRepository,
    summaryRepository: createSqliteSummaryRepository(database),
    vectorIndex,
  });
  registerJobIpc({ jobRepository });
  registerLibraryIpc({ documentRepository });
  registerKnowledgeIpc({ knowledgeRepository });
  registerAskIpc({
    chunkRepository,
    embeddingModel: defaultEmbeddingModel,
    embeddingProvider,
    generationModel: defaultAnalysisModel,
    generationProvider,
    vectorIndex,
  });
  registerModelIpc({
    generationProvider,
  });
  registerSearchIpc({
    chunkRepository,
    embeddingModel: defaultEmbeddingModel,
    embeddingProvider,
    vectorIndex,
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
