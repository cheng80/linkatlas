import { createHash } from "node:crypto";
import type { BrowserCaptureRequestDto, BrowserCaptureResponseDto } from "@linkatlas/contracts";
import { parseBrowserCaptureRequest } from "@linkatlas/contracts";
import type {
  ContentBlock,
  Document,
  DocumentVersion,
  EmbeddingProvider,
  GenerationProvider,
  VectorIndex,
} from "@linkatlas/domain";
import { DocumentStatus } from "@linkatlas/domain";
import { extractArticle } from "@linkatlas/ingestion";
import type {
  ChunkRepository,
  DocumentRepository,
  KnowledgeRepository,
  SummaryRepository,
} from "@linkatlas/storage";
import { maybeAnalyzeDocument } from "./analysis-summary.js";
import { indexChunks } from "./embedding-index.js";

export type BrowserCaptureHandlerOptions = {
  readonly documentRepository: DocumentRepository;
  readonly chunkRepository?: ChunkRepository;
  readonly knowledgeRepository?: KnowledgeRepository;
  readonly summaryRepository?: SummaryRepository;
  readonly generationProvider?: GenerationProvider;
  readonly embeddingProvider?: EmbeddingProvider;
  readonly vectorIndex?: VectorIndex;
  readonly analysisModel?: string;
  readonly embeddingModel?: string;
  readonly now?: () => Date;
};

export async function handleBrowserCapture(
  options: BrowserCaptureHandlerOptions,
  input: unknown,
): Promise<BrowserCaptureResponseDto> {
  let request: BrowserCaptureRequestDto;
  try {
    request = parseBrowserCaptureRequest(input);
  } catch {
    return {
      errorCode: "INVALID_MESSAGE",
      message: "브라우저 캡처 메시지 형식이 올바르지 않습니다.",
      ok: false,
    };
  }
  if (!isSupportedPageUrl(request.url)) {
    return {
      errorCode: "UNSUPPORTED_URL",
      message: "http 또는 https 페이지 URL만 저장할 수 있습니다.",
      ok: false,
    };
  }

  const documentId = documentIdForUrl(request.url);
  const duplicate = options.documentRepository.getDocumentSnapshot(documentId);
  if (duplicate !== null) {
    return { documentId, ok: true, status: "duplicate", title: duplicate.document.title };
  }

  try {
    const now = options.now?.() ?? new Date();
    const snapshot =
      request.kind === "page"
        ? snapshotFromPageCapture(request, documentId, now)
        : snapshotFromSelectionCapture(request, documentId, now);
    options.documentRepository.saveDocumentSnapshot(snapshot);
    options.chunkRepository?.rebuildDocumentChunks({ now, snapshot });
    if (options.chunkRepository !== undefined) {
      await indexChunks({
        chunks: options.chunkRepository.listDocumentChunks(documentId),
        embeddingProvider: options.embeddingProvider,
        model: options.embeddingModel,
        vectorIndex: options.vectorIndex,
      });
    }
    await maybeAnalyzeDocument({
      blocks: snapshot.blocks,
      documentId,
      generationProvider: options.generationProvider,
      knowledgeRepository: options.knowledgeRepository,
      model: options.analysisModel,
      now,
      summaryRepository: options.summaryRepository,
      versionId: snapshot.version.id,
    });
    return { documentId, ok: true, status: "saved", title: snapshot.document.title };
  } catch {
    return {
      errorCode: "CAPTURE_FAILED",
      message: "브라우저 캡처를 저장할 수 없습니다.",
      ok: false,
    };
  }
}

function snapshotFromPageCapture(
  request: Extract<BrowserCaptureRequestDto, { readonly kind: "page" }>,
  documentId: `doc_${string}`,
  now: Date,
): {
  readonly document: Document;
  readonly version: DocumentVersion;
  readonly blocks: readonly ContentBlock[];
} {
  const article = extractArticle({ html: request.html, url: request.url });
  const versionId = documentVersionIdForHash(article.contentHash);
  return {
    blocks: article.blocks.map((block) => ({
      blockType: block.blockType,
      documentVersionId: versionId,
      headingPath: block.headingPath,
      id: `block_${sha256(`${versionId}\0${block.id}`).slice(0, 24)}`,
      ordinal: block.ordinal,
      text: block.text,
    })),
    document: {
      createdAt: now,
      id: documentId,
      originalUrl: request.url,
      status: DocumentStatus.Ready,
      title:
        article.title === "Untitled" || article.title.length === 0 ? request.title : article.title,
      updatedAt: now,
    },
    version: {
      contentHash: article.contentHash,
      createdAt: now,
      documentId,
      id: versionId,
    },
  };
}

function snapshotFromSelectionCapture(
  request: Extract<BrowserCaptureRequestDto, { readonly kind: "selection" }>,
  documentId: `doc_${string}`,
  now: Date,
): {
  readonly document: Document;
  readonly version: DocumentVersion;
  readonly blocks: readonly ContentBlock[];
} {
  const contentHash = sha256(request.selectionText);
  const versionId = documentVersionIdForHash(contentHash);
  return {
    blocks: [
      {
        blockType: "paragraph",
        documentVersionId: versionId,
        headingPath: ["Selection"],
        id: `block_${sha256(`${versionId}:selection`).slice(0, 24)}`,
        ordinal: 0,
        text: request.selectionText,
      },
    ],
    document: {
      createdAt: now,
      id: documentId,
      originalUrl: request.url,
      status: DocumentStatus.Ready,
      title: `${request.title} selection`,
      updatedAt: now,
    },
    version: {
      contentHash,
      createdAt: now,
      documentId,
      id: versionId,
    },
  };
}

function isSupportedPageUrl(rawUrl: string): boolean {
  const url = new URL(rawUrl);
  return url.protocol === "http:" || url.protocol === "https:";
}

function documentIdForUrl(url: string): `doc_${string}` {
  return `doc_${sha256(url).slice(0, 24)}`;
}

function documentVersionIdForHash(contentHash: string): `docver_${string}` {
  return `docver_${sha256(contentHash).slice(0, 24)}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
