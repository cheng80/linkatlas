import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractArticle } from "./extract-article.js";

const fixtureRoot = resolve(import.meta.dirname, "../../test-fixtures/html");

async function fixture(name: string): Promise<string> {
  return readFile(resolve(fixtureRoot, name), "utf8");
}

describe("article extraction", () => {
  it.each([
    ["korean-article.html", "로컬 지식 관리 흐름"],
    ["english-article.html", "Hybrid Search Notes"],
    ["code-block.html", "Queue Worker Example"],
    ["table.html", "Model Profiles"],
    ["prompt-injection.txt", "Hostile Prompt Fixture"],
  ])("extracts readable blocks from %s", async (fileName, expectedTitle) => {
    const article = extractArticle({
      html: await fixture(fileName),
      url: `https://example.com/${fileName}`,
    });

    expect(article.title).toBe(expectedTitle);
    expect(article.normalizedHtml.length).toBeGreaterThan(0);
    expect(article.markdown.length).toBeGreaterThan(0);
    expect(article.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(article.blocks.length).toBeGreaterThanOrEqual(1);
    expect(article.blocks.map((block) => block.id)).toEqual(
      article.blocks.map(() => expect.stringMatching(/^block_[a-f0-9]{20}$/)),
    );
  });

  it("keeps metadata from Korean and English fixtures", async () => {
    const korean = extractArticle({
      html: await fixture("korean-article.html"),
      url: "https://example.com/korean",
    });
    const english = extractArticle({
      html: await fixture("english-article.html"),
      url: "https://example.com/english",
    });

    expect(korean.author).toBe("LinkAtlas Team");
    expect(korean.publishedAt).toBe("2026-06-18T09:00:00.000Z");
    expect(korean.siteName).toBe("Fixture News");
    expect(korean.language).toBe("ko");
    expect(english.author).toBe("Alex Writer");
    expect(english.siteName).toBe("Engineering Notes");
    expect(english.language).toBe("en");
  });

  it("removes scripts, event handlers, and unsafe links while preserving hostile text as untrusted content", async () => {
    const article = extractArticle({
      html: await fixture("prompt-injection.txt"),
      url: "https://example.com/hostile",
    });

    expect(article.normalizedHtml).not.toContain("<script");
    expect(article.normalizedHtml).not.toContain("onclick");
    expect(article.normalizedHtml).not.toContain("javascript:");
    expect(article.normalizedHtml).toContain("Ignore previous instructions");
    expect(article.normalizedHtml).toContain("https://example.com/safe");
  });

  it("preserves code and table blocks", async () => {
    const codeArticle = extractArticle({
      html: await fixture("code-block.html"),
      url: "https://example.com/code",
    });
    const tableArticle = extractArticle({
      html: await fixture("table.html"),
      url: "https://example.com/table",
    });

    expect(codeArticle.blocks.some((block) => block.blockType === "code")).toBe(true);
    expect(codeArticle.markdown).toContain("```");
    expect(tableArticle.blocks.some((block) => block.blockType === "table")).toBe(true);
    expect(tableArticle.blocks.map((block) => block.text).join("\n")).toContain("Memory");
  });

  it("generates stable block IDs for identical input", async () => {
    const html = await fixture("korean-article.html");

    const first = extractArticle({ html, url: "https://example.com/stable" });
    const second = extractArticle({ html, url: "https://example.com/stable" });

    expect(second.blocks.map((block) => block.id)).toEqual(first.blocks.map((block) => block.id));
    expect(second.contentHash).toBe(first.contentHash);
  });
});
