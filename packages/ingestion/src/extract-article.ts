import { createHash } from "node:crypto";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import sanitizeHtml from "sanitize-html";
import TurndownService from "turndown";

export type ExtractArticleInput = {
  readonly html: string;
  readonly url: string;
};

export type ExtractedArticleBlockType = "heading" | "paragraph" | "code" | "table" | "quote";

export type ExtractedArticleBlock = {
  readonly id: `block_${string}`;
  readonly ordinal: number;
  readonly blockType: ExtractedArticleBlockType;
  readonly text: string;
  readonly headingPath: readonly string[];
};

export type ExtractedArticle = {
  readonly title: string;
  readonly author: string | null;
  readonly publishedAt: string | null;
  readonly siteName: string | null;
  readonly language: string | null;
  readonly excerpt: string | null;
  readonly normalizedHtml: string;
  readonly markdown: string;
  readonly contentHash: string;
  readonly blocks: readonly ExtractedArticleBlock[];
};

const allowedTags = [
  "a",
  "blockquote",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const turndown = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

export function extractArticle(input: ExtractArticleInput): ExtractedArticle {
  const sourceDom = new JSDOM(input.html, { url: input.url });
  const document = sourceDom.window.document;
  const metadata = extractMetadata(document);
  const reader = new Readability(document);
  const article = reader.parse();
  const candidateHtml = article?.content ?? fallbackArticleHtml(document);
  const normalizedHtml = sanitizeArticleHtml(candidateHtml);
  const markdown = turndown.turndown(normalizedHtml).trim();
  const blocks = extractBlocks(normalizedHtml);

  return {
    title: nonEmpty(article?.title) ?? metadata.title ?? "Untitled",
    author: nonEmpty(article?.byline) ?? metadata.author,
    publishedAt: metadata.publishedAt,
    siteName: metadata.siteName,
    language: metadata.language,
    excerpt: nonEmpty(article?.excerpt) ?? metadata.excerpt,
    normalizedHtml,
    markdown,
    contentHash: `sha256:${sha256(normalizedHtml)}`,
    blocks,
  };
}

type ArticleMetadata = {
  readonly title: string | null;
  readonly author: string | null;
  readonly publishedAt: string | null;
  readonly siteName: string | null;
  readonly language: string | null;
  readonly excerpt: string | null;
};

function extractMetadata(document: Document): ArticleMetadata {
  return {
    title: nonEmpty(document.querySelector("title")?.textContent),
    author:
      metaContent(document, "name", "author") ??
      metaContent(document, "property", "article:author"),
    publishedAt:
      metaContent(document, "property", "article:published_time") ??
      metaContent(document, "name", "date"),
    siteName: metaContent(document, "property", "og:site_name"),
    language: nonEmpty(document.documentElement.getAttribute("lang")),
    excerpt:
      metaContent(document, "name", "description") ??
      metaContent(document, "property", "og:description"),
  };
}

function metaContent(
  document: Document,
  attributeName: "name" | "property",
  attributeValue: string,
): string | null {
  return nonEmpty(
    document.querySelector(`meta[${attributeName}="${attributeValue}"]`)?.getAttribute("content"),
  );
}

function fallbackArticleHtml(document: Document): string {
  const root = document.querySelector("article") ?? document.body;
  return root?.innerHTML ?? "";
}

function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https"],
    allowedTags,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  }).trim();
}

function extractBlocks(html: string): readonly ExtractedArticleBlock[] {
  const dom = new JSDOM(`<article>${html}</article>`);
  const root = dom.window.document.querySelector("article");
  if (root === null) {
    return [];
  }

  const headingPath: string[] = [];
  const blocks: ExtractedArticleBlock[] = [];
  const elements = root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,pre,blockquote,table");

  for (const element of elements) {
    const blockType = blockTypeForElement(element);
    const text = normalizeBlockText(element);
    if (text.length === 0) {
      continue;
    }

    if (blockType === "heading") {
      updateHeadingPath(headingPath, headingLevel(element), text);
    }

    const ordinal = blocks.length;
    blocks.push({
      id: blockId(ordinal, blockType, text),
      ordinal,
      blockType,
      text,
      headingPath: [...headingPath],
    });
  }

  return blocks;
}

function blockTypeForElement(element: Element): ExtractedArticleBlockType {
  const tagName = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tagName)) {
    return "heading";
  }
  if (tagName === "pre") {
    return "code";
  }
  if (tagName === "table") {
    return "table";
  }
  if (tagName === "blockquote") {
    return "quote";
  }
  return "paragraph";
}

function normalizeBlockText(element: Element): string {
  if (element.tagName.toLowerCase() === "table") {
    return [...element.querySelectorAll("tr")]
      .map((row) =>
        [...row.querySelectorAll("th,td")]
          .map((cell) => normalizeWhitespace(cell.textContent ?? ""))
          .filter((cell) => cell.length > 0)
          .join("\t"),
      )
      .filter((row) => row.length > 0)
      .join("\n");
  }
  return normalizeWhitespace(element.textContent ?? "");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function updateHeadingPath(path: string[], level: number, text: string): void {
  path.splice(level - 1);
  path[level - 1] = text;
}

function headingLevel(element: Element): number {
  return Number.parseInt(element.tagName.slice(1), 10);
}

function blockId(
  ordinal: number,
  blockType: ExtractedArticleBlockType,
  text: string,
): `block_${string}` {
  return `block_${sha256(`${ordinal}\0${blockType}\0${text}`).slice(0, 20)}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
}
