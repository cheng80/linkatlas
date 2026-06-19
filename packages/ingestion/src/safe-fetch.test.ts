import type { RequestListener } from "node:http";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import {
  FetchError,
  FetchErrorCode,
  type FetchUrlPolicy,
  fetchHtml,
  validateFetchUrl,
} from "./index.js";

const openServers: { readonly close: () => Promise<void> }[] = [];

async function createFixtureServer(
  handler: RequestListener,
): Promise<{ readonly origin: string; readonly close: () => Promise<void> }> {
  const server = createServer(handler);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!isAddressInfo(address)) {
    throw new Error("Fixture server did not bind to a TCP port.");
  }
  const fixture = {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error === undefined) {
            resolve();
            return;
          }
          reject(error);
        });
      }),
  };
  openServers.push(fixture);
  return fixture;
}

function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return typeof address === "object" && address !== null;
}

afterEach(async () => {
  const servers = openServers.splice(0, openServers.length);
  await Promise.all(servers.map((server) => server.close()));
});

function testPolicy(overrides: Partial<FetchUrlPolicy> = {}): FetchUrlPolicy {
  return {
    allowedHosts: ["127.0.0.1"],
    maxBytes: 1024,
    maxRedirects: 3,
    timeoutMs: 500,
    ...overrides,
  };
}

describe("validateFetchUrl", () => {
  it("rejects non-http protocols", async () => {
    await expect(validateFetchUrl("file:///etc/passwd", testPolicy())).rejects.toMatchObject({
      errorCode: FetchErrorCode.UnsupportedProtocol,
    });
  });

  it("blocks localhost when it is not explicitly allowed", async () => {
    await expect(
      validateFetchUrl("http://127.0.0.1:3000/page", testPolicy({ allowedHosts: [] })),
    ).rejects.toMatchObject({
      errorCode: FetchErrorCode.LocalNetworkBlocked,
    });
  });
});

describe("fetchHtml", () => {
  it("fetches HTML from an explicitly allowed fixture host", async () => {
    const fixture = await createFixtureServer((_request, response) => {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end("<html><body>fixture</body></html>");
    });

    await expect(
      fetchHtml({ url: `${fixture.origin}/page`, policy: testPolicy() }),
    ).resolves.toEqual({
      finalUrl: `${fixture.origin}/page`,
      html: "<html><body>fixture</body></html>",
      statusCode: 200,
    });
  });

  it("sends desktop browser headers", async () => {
    const fixture = await createFixtureServer((request, response) => {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(`<html><body>${request.headers["user-agent"] ?? ""}</body></html>`);
    });

    await expect(
      fetchHtml({ url: `${fixture.origin}/page`, policy: testPolicy() }),
    ).resolves.toMatchObject({
      html: expect.stringContaining("Mozilla/5.0"),
    });
  });

  it("revalidates redirect targets", async () => {
    const fixture = await createFixtureServer((_request, response) => {
      response.statusCode = 302;
      response.setHeader("location", "http://127.0.0.1:1/private");
      response.end();
    });

    await expect(
      fetchHtml({ url: `${fixture.origin}/redirect`, policy: testPolicy({ allowedHosts: [] }) }),
    ).rejects.toMatchObject({
      errorCode: FetchErrorCode.LocalNetworkBlocked,
    });
  });

  it("rejects unsupported-browser interstitial pages", async () => {
    const fixture = await createFixtureServer((_request, response) => {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(
        "<html><title>Unsupported Browser</title><body>unsupportedbrowser</body></html>",
      );
    });

    await expect(
      fetchHtml({ url: `${fixture.origin}/unsupportedbrowser`, policy: testPolicy() }),
    ).rejects.toMatchObject({
      errorCode: FetchErrorCode.UnsupportedBrowserPage,
    });
  });

  it("rejects oversized responses", async () => {
    const fixture = await createFixtureServer((_request, response) => {
      response.setHeader("content-type", "text/html");
      response.end("x".repeat(32));
    });

    await expect(
      fetchHtml({ url: `${fixture.origin}/large`, policy: testPolicy({ maxBytes: 8 }) }),
    ).rejects.toBeInstanceOf(FetchError);
  });
});
