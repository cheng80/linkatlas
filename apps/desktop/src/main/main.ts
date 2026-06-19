import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";

import { createSecureWebPreferences, isAllowedNavigation } from "./security.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const e2eEnvironmentKey = "LINKATLAS_E2E";

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
