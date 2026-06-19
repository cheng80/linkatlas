import { describe, expect, it } from "vitest";

import type { LinkAtlasApi } from "../shared/link-atlas-api.js";

describe("preload API contract", () => {
  it("exposes only typed allowlist namespaces", () => {
    const exposedKeys = [
      "app",
      "ask",
      "ingest",
      "jobs",
      "knowledge",
      "library",
      "models",
      "search",
    ] satisfies readonly (keyof LinkAtlasApi)[];
    const forbiddenKeys = ["execute", "readFile", "writeFile", "querySql", "ipcRenderer"];

    expect(exposedKeys).toEqual([
      "app",
      "ask",
      "ingest",
      "jobs",
      "knowledge",
      "library",
      "models",
      "search",
    ]);
    expect(forbiddenKeys).not.toContain("app");
  });
});
