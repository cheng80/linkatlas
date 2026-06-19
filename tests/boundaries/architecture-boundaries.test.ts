import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceExtensions = [".ts", ".tsx"] as const;

function readSources(
  directory: string,
): readonly { readonly path: string; readonly text: string }[] {
  const entries = readdirSync(directory);
  const files: { readonly path: string; readonly text: string }[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...readSources(fullPath));
      continue;
    }

    if (
      sourceExtensions.some((extension) => fullPath.endsWith(extension)) &&
      !fullPath.endsWith(".test.ts")
    ) {
      files.push({ path: fullPath, text: readFileSync(fullPath, "utf8") });
    }
  }

  return files;
}

describe("architecture boundaries", () => {
  it("keeps renderer source away from Node, Electron, SQLite, and Ollama imports", () => {
    const rendererSources = readSources("apps/desktop/src/renderer");
    const forbidden =
      /from\s+["'](electron|node:|fs|path|child_process|better-sqlite3|sqlite3|ollama)/u;

    const offenders = rendererSources
      .filter((source) => forbidden.test(source.text))
      .map((source) => source.path);

    expect(offenders).toEqual([]);
  });

  it("keeps domain source independent from Electron, SQLite, and Ollama implementations", () => {
    const domainSources = readSources("packages/domain/src");
    const forbidden =
      /from\s+["'](electron|better-sqlite3|sqlite3|ollama|node:fs|fs|child_process)/u;

    const offenders = domainSources
      .filter((source) => forbidden.test(source.text))
      .map((source) => source.path);

    expect(offenders).toEqual([]);
  });

  it("does not expose generic preload APIs", () => {
    const preloadSources = readSources("apps/desktop/src/preload");
    const forbidden = /\b(execute|readFile|writeFile|querySql|ipcRenderer)\b/u;

    const offenders = preloadSources
      .filter((source) => forbidden.test(source.text))
      .map((source) => source.path);

    expect(offenders).toEqual([]);
  });
});
