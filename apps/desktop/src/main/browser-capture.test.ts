import type { DocumentRepository } from "@linkatlas/storage";
import { describe, expect, it } from "vitest";
import { handleBrowserCapture } from "./browser-capture.js";

describe("browser capture handler", () => {
  it("stores a readability page capture and reports duplicates", async () => {
    const repository = inMemoryDocumentRepository();
    const input = {
      html: "<article><h1>Browser Article</h1><p>Readable browser content.</p></article>",
      kind: "page",
      title: "Browser Article",
      url: "https://example.com/browser",
    };

    await expect(
      handleBrowserCapture({ documentRepository: repository }, input),
    ).resolves.toMatchObject({
      ok: true,
      status: "saved",
      title: "Browser Article",
    });
    await expect(
      handleBrowserCapture({ documentRepository: repository }, input),
    ).resolves.toMatchObject({
      ok: true,
      status: "duplicate",
      title: "Browser Article",
    });
  });

  it("stores selection captures without refetching the page", async () => {
    const repository = inMemoryDocumentRepository();

    await expect(
      handleBrowserCapture(
        { documentRepository: repository },
        {
          kind: "selection",
          selectionText: "Selected paragraph from the page.",
          title: "Selection Source",
          url: "https://example.com/selection",
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      status: "saved",
      title: "Selection Source selection",
    });
  });

  it("fails closed for malformed messages and unsupported URLs", async () => {
    const repository = inMemoryDocumentRepository();

    await expect(handleBrowserCapture({ documentRepository: repository }, {})).resolves.toEqual({
      errorCode: "INVALID_MESSAGE",
      message: "브라우저 캡처 메시지 형식이 올바르지 않습니다.",
      ok: false,
    });
    await expect(
      handleBrowserCapture(
        { documentRepository: repository },
        {
          kind: "selection",
          selectionText: "local file",
          title: "Local",
          url: "file:///tmp/local.html",
        },
      ),
    ).resolves.toEqual({
      errorCode: "UNSUPPORTED_URL",
      message: "http 또는 https 페이지 URL만 저장할 수 있습니다.",
      ok: false,
    });
  });
});

function inMemoryDocumentRepository(): DocumentRepository {
  const snapshots = new Map<string, Parameters<DocumentRepository["saveDocumentSnapshot"]>[0]>();
  return {
    getDocumentSnapshot: (documentId) => snapshots.get(documentId) ?? null,
    saveDocumentSnapshot: (input) => {
      snapshots.set(input.document.id, input);
    },
  };
}
