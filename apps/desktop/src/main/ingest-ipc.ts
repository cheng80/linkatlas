import { createHash } from "node:crypto";
import type { IngestUrlRequestDto, IngestUrlResultDto } from "@linkatlas/contracts";
import { parseIngestUrlRequest } from "@linkatlas/contracts";
import type {
  ContentBlock,
  Document,
  DocumentVersion,
  GenerationProvider,
} from "@linkatlas/domain";
import { AppErrorCode, DocumentStatus, JobStatus } from "@linkatlas/domain";
import type { ExtractedArticleBlock } from "@linkatlas/ingestion";
import { extractArticle, FetchError, FetchErrorCode, fetchHtml } from "@linkatlas/ingestion";
import type { DocumentRepository, JobRepository, SummaryRepository } from "@linkatlas/storage";
import { ipcMain } from "electron";
import { maybeAnalyzeDocument } from "./analysis-summary.js";

export type IngestUrlHandlerOptions = {
  readonly allowedHosts: readonly string[];
  readonly documentRepository: DocumentRepository;
  readonly jobRepository: JobRepository;
  readonly summaryRepository?: SummaryRepository;
  readonly generationProvider?: GenerationProvider;
  readonly analysisModel?: string;
  readonly now?: () => Date;
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

    const requestedAt = options.now?.() ?? new Date();
    const job = options.jobRepository.enqueue({
      id: jobIdForUrl(request.url),
      documentId: null,
      idempotencyKey: `ingest-url:${request.url}`,
      now: requestedAt,
      stage: "stage_fetching",
    });
    const leasedJob = options.jobRepository.acquireNext({
      leaseExpiresAt: new Date(requestedAt.getTime() + 60_000),
      now: requestedAt,
      workerId: "main-ingest",
    });

    if (leasedJob?.id !== job.id) {
      return {
        ok: false,
        errorCode: "UNKNOWN_FETCH_ERROR",
        message: "URL 작업이 이미 처리 중입니다.",
      };
    }

    try {
      options.jobRepository.updateProgress({
        id: job.id,
        now: options.now?.() ?? new Date(),
        progress: 10,
        stage: "stage_fetching",
      });
      const fetched = await fetchHtml({
        url: request.url,
        policy: {
          allowedHosts: options.allowedHosts,
          maxBytes: 1_000_000,
          maxRedirects: 5,
          timeoutMs: 10_000,
        },
      });
      options.jobRepository.updateProgress({
        id: job.id,
        now: options.now?.() ?? new Date(),
        progress: 45,
        stage: "stage_extracting",
      });
      const article = extractArticle({ html: fetched.html, url: fetched.finalUrl });
      const now = options.now?.() ?? new Date();
      const documentId = documentIdForUrl(fetched.finalUrl);
      const versionId = documentVersionIdForHash(article.contentHash);

      const document: Document = {
        id: documentId,
        originalUrl: request.url,
        title: article.title,
        status: DocumentStatus.Ready,
        createdAt: now,
        updatedAt: now,
      };
      const version: DocumentVersion = {
        id: versionId,
        documentId,
        contentHash: article.contentHash,
        createdAt: now,
      };
      const blocks = article.blocks.map((block): ContentBlock => toContentBlock(versionId, block));

      options.jobRepository.updateProgress({
        id: job.id,
        now,
        progress: 80,
        stage: "stage_storing",
      });
      options.documentRepository.saveDocumentSnapshot({ document, version, blocks });
      const summary = await maybeAnalyzeDocument({
        blocks,
        documentId,
        generationProvider: options.generationProvider,
        model: options.analysisModel,
        now,
        summaryRepository: options.summaryRepository,
        versionId,
      });
      const completedJob = options.jobRepository.complete({ id: job.id, now });

      return {
        ok: true,
        documentId,
        jobId: job.id,
        jobStatus: completedJob?.status ?? JobStatus.Completed,
        finalUrl: fetched.finalUrl,
        title: article.title,
        byteLength: Buffer.byteLength(fetched.html),
        blockCount: blocks.length,
        excerpt: article.excerpt,
        language: article.language,
        summary,
      };
    } catch (error) {
      if (error instanceof FetchError) {
        options.jobRepository.fail({
          errorCode: fetchErrorToAppErrorCode(error.errorCode),
          id: job.id,
          now: options.now?.() ?? new Date(),
        });
        return {
          ok: false,
          errorCode: error.errorCode,
          message: userMessageForFetchError(error.errorCode),
        };
      }

      options.jobRepository.fail({
        errorCode: AppErrorCode.InvalidInput,
        id: job.id,
        now: options.now?.() ?? new Date(),
      });
      return {
        ok: false,
        errorCode: "UNKNOWN_FETCH_ERROR",
        message: "URL을 가져오는 중 알 수 없는 오류가 발생했습니다.",
      };
    }
  };
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

function documentIdForUrl(url: string): `doc_${string}` {
  return `doc_${sha256(url).slice(0, 24)}`;
}

function jobIdForUrl(url: string): `job_${string}` {
  return `job_${sha256(url).slice(0, 24)}`;
}

function documentVersionIdForHash(contentHash: string): `docver_${string}` {
  return `docver_${sha256(contentHash).slice(0, 24)}`;
}

function toContentBlock(
  documentVersionId: `docver_${string}`,
  block: ExtractedArticleBlock,
): ContentBlock {
  return {
    id: `block_${sha256(`${documentVersionId}\0${block.id}`).slice(0, 24)}`,
    documentVersionId,
    ordinal: block.ordinal,
    blockType: block.blockType,
    text: block.text,
    headingPath: block.headingPath,
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fetchErrorToAppErrorCode(errorCode: FetchErrorCode): AppErrorCode {
  switch (errorCode) {
    case FetchErrorCode.InvalidUrl:
    case FetchErrorCode.UnsupportedProtocol:
    case FetchErrorCode.LocalNetworkBlocked:
      return AppErrorCode.InvalidInput;
    case FetchErrorCode.RedirectLimitExceeded:
    case FetchErrorCode.ResponseTooLarge:
    case FetchErrorCode.RequestTimeout:
    case FetchErrorCode.HttpStatusError:
      return AppErrorCode.ProviderUnavailable;
    default:
      return assertNever(errorCode);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled fetch error: ${String(value)}`);
}
