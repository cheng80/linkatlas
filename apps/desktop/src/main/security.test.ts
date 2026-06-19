import { describe, expect, it } from "vitest";

import { createSecureWebPreferences, isAllowedNavigation } from "./security.js";

describe("Electron security settings", () => {
  it("enforces isolated sandboxed renderer preferences", () => {
    const preferences = createSecureWebPreferences("/tmp/preload.js");

    expect(preferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      preload: "/tmp/preload.js",
      sandbox: true,
    });
  });

  it("blocks non-file navigations from the privileged app window", () => {
    expect(isAllowedNavigation("file:///app/index.html")).toBe(true);
    expect(isAllowedNavigation("https://example.com")).toBe(false);
    expect(isAllowedNavigation("http://127.0.0.1:3000")).toBe(false);
  });
});
