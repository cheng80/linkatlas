import { describe, expect, it } from "vitest";

import {
  BrowserCaptureResponseSchema,
  parseBrowserCaptureRequest,
  parseBrowserCaptureResponse,
} from "./browser-capture.js";

describe("browser capture contracts", () => {
  it("parses page and selection capture messages", () => {
    expect(
      parseBrowserCaptureRequest({
        html: "<article>hello</article>",
        kind: "page",
        title: "Example",
        url: "https://example.com/post",
      }),
    ).toEqual({
      html: "<article>hello</article>",
      kind: "page",
      title: "Example",
      url: "https://example.com/post",
    });
    expect(
      parseBrowserCaptureRequest({
        kind: "selection",
        selectionText: "selected text",
        title: "Example",
        url: "https://example.com/post",
      }),
    ).toMatchObject({ kind: "selection", selectionText: "selected text" });
  });

  it("rejects malformed native messaging responses", () => {
    expect(() => parseBrowserCaptureResponse({ ok: true, status: "saved" })).toThrow();
    expect(
      BrowserCaptureResponseSchema.parse({
        errorCode: "APP_UNAVAILABLE",
        message: "LinkAtlas is not running.",
        ok: false,
      }),
    ).toEqual({
      errorCode: "APP_UNAVAILABLE",
      message: "LinkAtlas is not running.",
      ok: false,
    });
  });
});
