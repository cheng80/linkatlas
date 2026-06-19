import type { WebPreferences } from "electron";

export function createSecureWebPreferences(preloadPath: string): WebPreferences {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    preload: preloadPath,
    sandbox: true,
  };
}

export function isAllowedNavigation(targetUrl: string): boolean {
  const parsedUrl = new URL(targetUrl);

  return parsedUrl.protocol === "file:";
}
