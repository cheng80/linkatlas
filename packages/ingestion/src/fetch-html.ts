import type { RequestOptions } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { FetchError, FetchErrorCode } from "./errors.js";
import type { FetchUrlPolicy } from "./url-policy.js";
import { validateFetchUrl } from "./url-policy.js";

export type FetchHtmlInput = {
  readonly url: string;
  readonly policy: FetchUrlPolicy;
};

export type FetchHtmlResult = {
  readonly finalUrl: string;
  readonly html: string;
  readonly statusCode: number;
};

const desktopBrowserHeaders = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
} as const;

export async function fetchHtml(input: FetchHtmlInput): Promise<FetchHtmlResult> {
  return fetchHtmlWithRedirects(input.url, input.policy, 0);
}

async function fetchHtmlWithRedirects(
  rawUrl: string,
  policy: FetchUrlPolicy,
  redirectCount: number,
): Promise<FetchHtmlResult> {
  if (redirectCount > policy.maxRedirects) {
    throw new FetchError({
      errorCode: FetchErrorCode.RedirectLimitExceeded,
      message: "Too many redirects.",
    });
  }

  const url = await validateFetchUrl(rawUrl, policy);
  const response = await requestUrl(url, policy);

  if (isRedirect(response.statusCode)) {
    const location = response.headers.location;
    if (location === undefined) {
      throw new FetchError({
        errorCode: FetchErrorCode.HttpStatusError,
        message: `Redirect response ${response.statusCode} did not include a location.`,
      });
    }
    return fetchHtmlWithRedirects(new URL(location, url).toString(), policy, redirectCount + 1);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new FetchError({
      errorCode: FetchErrorCode.HttpStatusError,
      message: `HTTP request failed with status ${response.statusCode}.`,
    });
  }

  const html = response.body.toString("utf8");
  if (isUnsupportedBrowserPage(url, html)) {
    throw new FetchError({
      errorCode: FetchErrorCode.UnsupportedBrowserPage,
      message: "HTTP response was an unsupported-browser interstitial page.",
    });
  }

  return {
    finalUrl: url.toString(),
    html,
    statusCode: response.statusCode,
  };
}

type RawResponse = {
  readonly statusCode: number;
  readonly headers: ResponseHeaders;
  readonly body: Buffer;
};

type ResponseHeaders = {
  readonly location?: string;
};

function requestUrl(url: URL, policy: FetchUrlPolicy): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    const requestOptions: RequestOptions = {
      headers: desktopBrowserHeaders,
      hostname: url.hostname,
      method: "GET",
      path: `${url.pathname}${url.search}`,
      port: url.port,
      protocol: url.protocol,
      timeout: policy.timeoutMs,
    };
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      requestOptions,
      (response) => {
        const statusCode = response.statusCode ?? 0;
        response.on("data", (chunk: Buffer) => {
          receivedBytes += chunk.byteLength;
          if (receivedBytes > policy.maxBytes) {
            rejectOnce(
              reject,
              new FetchError({
                errorCode: FetchErrorCode.ResponseTooLarge,
                message: "HTTP response exceeded the configured size limit.",
              }),
            );
            request.destroy();
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          if (settled) {
            return;
          }
          settled = true;
          resolve({
            statusCode,
            headers: responseHeaders(response.headers.location),
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    request.on("timeout", () => {
      rejectOnce(
        reject,
        new FetchError({
          errorCode: FetchErrorCode.RequestTimeout,
          message: "HTTP request timed out.",
        }),
      );
      request.destroy();
    });
    request.on("error", (error: Error) => {
      rejectOnce(reject, error);
    });
    request.end();

    function rejectOnce(rejectPromise: (reason?: unknown) => void, error: Error): void {
      if (settled) {
        return;
      }
      settled = true;
      rejectPromise(error);
    }
  });
}

function isRedirect(statusCode: number): boolean {
  return statusCode >= 300 && statusCode < 400;
}

function isUnsupportedBrowserPage(url: URL, html: string): boolean {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const normalizedHtml = html.toLowerCase();
  const isKnownUnsupportedBrowserUrl =
    (hostname === "facebook.com" || hostname.endsWith(".facebook.com")) &&
    pathname.includes("unsupportedbrowser");
  const hasUnsupportedBrowserCopy =
    normalizedHtml.includes("unsupported browser") ||
    normalizedHtml.includes("unsupportedbrowser") ||
    normalizedHtml.includes("브라우저를 업데이트") ||
    normalizedHtml.includes("지원되지 않는 브라우저");

  return (
    isKnownUnsupportedBrowserUrl ||
    (pathname.includes("unsupportedbrowser") && hasUnsupportedBrowserCopy)
  );
}

function headerValue(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0];
}

function responseHeaders(locationHeader: string | readonly string[] | undefined): ResponseHeaders {
  const location = headerValue(locationHeader);
  return location === undefined ? {} : { location };
}
