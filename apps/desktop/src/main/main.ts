import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSqliteConnection,
  createSqliteDocumentRepository,
  type LinkAtlasDatabase,
  migrateDatabase,
} from "@linkatlas/storage";
import { app, BrowserWindow } from "electron";

import { registerIngestIpc } from "./ingest-ipc.js";
import { createSecureWebPreferences, isAllowedNavigation } from "./security.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const e2eEnvironmentKey = "LINKATLAS_E2E";
const allowedFetchHostsKey = "LINKATLAS_ALLOWED_FETCH_HOSTS";

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
  registerIngestIpc({
    allowedHosts: allowedFetchHosts(),
    documentRepository: createSqliteDocumentRepository(database),
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
