import type { IngestUrlRequestDto, IngestUrlResultDto } from "@linkatlas/contracts";
import { parseIngestUrlRequest } from "@linkatlas/contracts";
import { FetchError, FetchErrorCode, fetchHtml } from "@linkatlas/ingestion";
import { ipcMain } from "electron";

export type IngestUrlHandlerOptions = {
  readonly allowedHosts: readonly string[];
};

const ingestUrlChannel = "linkAtlas:ingestUrl";

export function registerIngestIpc(options: IngestUrlHandlerOptions): void {
  ipcMain.handle(ingestUrlChannel, async (_event, input: unknown) =>
    createIngestUrlHandler(options)(input),
  );
}

export function createIngestUrlHandler(
  options: IngestUrlHandlerOptions,
): (input: unknown) => Promise<IngestUrlResultDto> {
  return async (input: unknown): Promise<IngestUrlResultDto> => {
    let request: IngestUrlRequestDto;
    try {
      request = parseIngestUrlRequest(input);
    } catch {
      return {
        ok: false,
        errorCode: "INVALID_URL",
        message: "URL 입력 형식이 올바르지 않습니다.",
      };
    }

    try {
      const fetched = await fetchHtml({
        url: request.url,
        policy: {
          allowedHosts: options.allowedHosts,
          maxBytes: 1_000_000,
          maxRedirects: 5,
          timeoutMs: 10_000,
        },
      });

      return {
        ok: true,
        finalUrl: fetched.finalUrl,
        title: extractTitle(fetched.html),
        byteLength: Buffer.byteLength(fetched.html),
      };
    } catch (error) {
      if (error instanceof FetchError) {
        return {
          ok: false,
          errorCode: error.errorCode,
          message: userMessageForFetchError(error.errorCode),
        };
      }

      return {
        ok: false,
        errorCode: "UNKNOWN_FETCH_ERROR",
        message: "URL을 가져오는 중 알 수 없는 오류가 발생했습니다.",
      };
    }
  };
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const title = match?.[1]?.trim();
  return title === undefined || title.length === 0 ? "Untitled" : title;
}

function userMessageForFetchError(errorCode: FetchErrorCode): string {
  switch (errorCode) {
    case FetchErrorCode.InvalidUrl:
      return "URL을 해석할 수 없습니다.";
    case FetchErrorCode.UnsupportedProtocol:
      return "http 또는 https URL만 저장할 수 있습니다.";
    case FetchErrorCode.LocalNetworkBlocked:
      return "로컬 또는 사설 네트워크 URL은 기본 차단됩니다.";
    case FetchErrorCode.RedirectLimitExceeded:
      return "리디렉션 횟수가 너무 많습니다.";
    case FetchErrorCode.ResponseTooLarge:
      return "응답 크기가 허용 한도를 초과했습니다.";
    case FetchErrorCode.RequestTimeout:
      return "URL 요청 시간이 초과되었습니다.";
    case FetchErrorCode.HttpStatusError:
      return "URL 요청이 성공 상태로 끝나지 않았습니다.";
    default:
      return assertNever(errorCode);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled fetch error: ${String(value)}`);
}
