import { describe, expect, it } from "vitest";

import type { LinkAtlasApi } from "../shared/link-atlas-api.js";

describe("preload API contract", () => {
  it("exposes only the typed smoke namespace", () => {
    const exposedKeys = ["app"] satisfies readonly (keyof LinkAtlasApi)[];
    const forbiddenKeys = ["execute", "readFile", "writeFile", "querySql", "ipcRenderer"];

    expect(exposedKeys).toEqual(["app"]);
    expect(forbiddenKeys).not.toContain("app");
  });
});
