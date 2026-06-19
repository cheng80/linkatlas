import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { FetchError, FetchErrorCode } from "./errors.js";

export type FetchUrlPolicy = {
  readonly allowedHosts: readonly string[];
  readonly maxBytes: number;
  readonly maxRedirects: number;
  readonly timeoutMs: number;
};

export async function validateFetchUrl(rawUrl: string, policy: FetchUrlPolicy): Promise<URL> {
  const url = parseUrl(rawUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchError({
      errorCode: FetchErrorCode.UnsupportedProtocol,
      message: "Only http and https URLs are supported.",
    });
  }

  if (policy.allowedHosts.includes(url.hostname)) {
    return url;
  }

  if (isLocalHostname(url.hostname)) {
    throw localNetworkBlocked();
  }

  const literalIpKind = isIP(url.hostname);
  if (literalIpKind !== 0) {
    if (isPrivateAddress(url.hostname)) {
      throw localNetworkBlocked();
    }
    return url;
  }

  const resolved = await lookup(url.hostname, { all: true, verbatim: true });
  if (resolved.some((entry) => isPrivateAddress(entry.address))) {
    throw localNetworkBlocked();
  }

  return url;
}

function parseUrl(rawUrl: string): URL {
  try {
    return new URL(rawUrl);
  } catch (error) {
    throw new FetchError({
      errorCode: FetchErrorCode.InvalidUrl,
      message: "URL could not be parsed.",
      cause: error,
    });
  }
}

function localNetworkBlocked(): FetchError {
  return new FetchError({
    errorCode: FetchErrorCode.LocalNetworkBlocked,
    message: "Local and private network URLs are blocked.",
  });
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized.endsWith(".localhost");
}

function isPrivateAddress(address: string): boolean {
  if (address === "::1" || address.startsWith("fe80:")) {
    return true;
  }

  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [first, second] = parts;
  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
