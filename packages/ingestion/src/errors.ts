export const FetchErrorCode = {
  InvalidUrl: "INVALID_URL",
  UnsupportedProtocol: "UNSUPPORTED_PROTOCOL",
  LocalNetworkBlocked: "LOCAL_NETWORK_BLOCKED",
  RedirectLimitExceeded: "REDIRECT_LIMIT_EXCEEDED",
  ResponseTooLarge: "RESPONSE_TOO_LARGE",
  RequestTimeout: "REQUEST_TIMEOUT",
  UnsupportedBrowserPage: "UNSUPPORTED_BROWSER_PAGE",
  HttpStatusError: "HTTP_STATUS_ERROR",
} as const;

export type FetchErrorCode = (typeof FetchErrorCode)[keyof typeof FetchErrorCode];

export class FetchError extends Error {
  public readonly errorCode: FetchErrorCode;

  public constructor(input: {
    readonly errorCode: FetchErrorCode;
    readonly message: string;
    readonly cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = "FetchError";
    this.errorCode = input.errorCode;
  }
}
