import type { LinkAtlasApi } from "../shared/link-atlas-api.js";

export function installDevLinkAtlasApi(): void {
  if (!import.meta.env.DEV || window.linkAtlas !== undefined) {
    return;
  }

  Object.defineProperty(window, "linkAtlas", {
    configurable: true,
    value: createDevLinkAtlasApi(),
  });
}

function createDevLinkAtlasApi(): LinkAtlasApi {
  return {
    app: {
      getVersion: async () => ({ name: "LinkAtlas", version: "0.0.0-dev" }),
    },
    ask: {
      onEvent: () => () => undefined,
      start: async () => ({
        message: "브라우저 dev mock에서는 질문 스트리밍을 실행하지 않습니다.",
        ok: false,
      }),
    },
    ingest: {
      addUrl: async (input) => ({
        blockCount: 4,
        byteLength: 4096,
        documentId: "doc_dev_threads",
        excerpt: "브라우저 dev mock으로 저장된 샘플 문서입니다.",
        finalUrl: input.url,
        jobId: "job_dev_ingest",
        jobStatus: "COMPLETED",
        language: "ko",
        ok: true,
        summary: null,
        title: "브라우저 dev 샘플",
      }),
    },
    jobs: {
      cancel: async () => ({ errorCode: "JOB_NOT_FOUND", message: "dev mock", ok: false }),
      list: async () => ({
        jobs: [
          {
            documentId: "doc_dev_threads",
            errorCode: null,
            id: "job_dev_ingest",
            progress: 100,
            sourceUrl: "https://www.threads.com/@robin",
            stage: "stage_storing",
            status: "COMPLETED",
            updatedAt: "2026-06-19T09:00:00.000Z",
          },
        ],
      }),
      retry: async () => ({ errorCode: "JOB_NOT_FOUND", message: "dev mock", ok: false }),
    },
    knowledge: {
      listRelated: async () => ({ related: [] }),
      listTopics: async () => ({
        topics: [
          {
            description: "브라우저 dev mock 토픽입니다.",
            documentCount: 1,
            id: "topic_dev",
            label: "Dev",
          },
        ],
      }),
      pinRelation: async () => ({ ok: false }),
      removeRelation: async () => ({ ok: false }),
    },
    library: {
      list: async () => ({
        documents: [
          {
            id: "doc_dev_threads",
            originalUrl: "https://www.threads.com/@robin",
            status: "ready",
            title: "브라우저 dev 샘플",
            updatedAt: "2026-06-19T09:00:00.000Z",
          },
        ],
      }),
    },
    models: {
      health: async () => ({ message: "dev mock", ok: true }),
      list: async () => ({
        models: [
          {
            digest: "dev",
            name: "gemma4:e4b-it-qat",
          },
        ],
        ok: true,
      }),
    },
    search: {
      query: async () => [],
    },
  };
}
