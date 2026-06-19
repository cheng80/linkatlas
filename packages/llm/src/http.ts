import { AppError, AppErrorCode } from "@linkatlas/domain";
import type { z } from "zod";
import { OllamaErrorResponseSchema } from "./ollama-schemas.js";
import {
  defaultHttpTransport,
  type HttpTransport,
  type OllamaProviderOptions,
} from "./transport.js";

export type OllamaHttpClient = {
  requestJson<T>(input: JsonRequestInput<T>): Promise<T>;
  requestStream(input: StreamRequestInput): Promise<ReadableStream<Uint8Array>>;
};

type JsonRequestInput<T> = {
  readonly path: string;
  readonly method: "GET" | "POST";
  readonly body?: unknown;
  readonly abortSignal?: AbortSignal | undefined;
  readonly schema: z.ZodType<T>;
};

type StreamRequestInput = {
  readonly path: string;
  readonly method: "POST";
  readonly body: unknown;
  readonly abortSignal?: AbortSignal | undefined;
};

export function createOllamaHttpClient(options: OllamaProviderOptions): OllamaHttpClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const transport = options.transport ?? defaultHttpTransport;
  const timeoutMs = options.timeoutMs ?? 30_000;

  async function requestJson<T>(input: JsonRequestInput<T>): Promise<T> {
    const response = await request({
      abortSignal: input.abortSignal,
      baseUrl,
      body: input.body,
      method: input.method,
      path: input.path,
      timeoutMs,
      transport,
    });
    const value: unknown = await response.json();
    const parsed = input.schema.safeParse(value);
    if (!parsed.success) {
      throw new AppError({
        errorCode: AppErrorCode.ProviderUnavailable,
        userMessage: "Ollama 응답 형식이 올바르지 않습니다.",
      });
    }
    return parsed.data;
  }

  async function requestStream(input: StreamRequestInput): Promise<ReadableStream<Uint8Array>> {
    const response = await request({
      abortSignal: input.abortSignal,
      baseUrl,
      body: input.body,
      method: input.method,
      path: input.path,
      timeoutMs,
      transport,
    });
    if (response.body === null) {
      throw new AppError({
        errorCode: AppErrorCode.ProviderUnavailable,
        userMessage: "Ollama 스트림을 열 수 없습니다.",
      });
    }
    return response.body;
  }

  return {
    requestJson,
    requestStream,
  };
}

async function request(input: {
  readonly baseUrl: URL;
  readonly path: string;
  readonly method: "GET" | "POST";
  readonly body?: unknown;
  readonly abortSignal?: AbortSignal | undefined;
  readonly timeoutMs: number;
  readonly transport: HttpTransport;
}): Promise<Response> {
  const timeout = createTimeoutSignal(input.abortSignal, input.timeoutMs);
  try {
    const init: RequestInit & { readonly signal: AbortSignal } = {
      method: input.method,
      signal: timeout.signal,
    };
    if (input.body !== undefined) {
      init.body = JSON.stringify(input.body);
      init.headers = { "content-type": "application/json" };
    }
    const response = await input.transport(new URL(input.path, input.baseUrl), init);
    if (!response.ok) {
      await throwHttpError(response);
    }
    return response;
  } catch (error: unknown) {
    if (timeout.signal.aborted) {
      throw new AppError({
        errorCode: AppErrorCode.OperationCancelled,
        userMessage: "Ollama 요청이 취소되었습니다.",
      });
    }
    throw error;
  } finally {
    timeout.cleanup();
  }
}

async function throwHttpError(response: Response): Promise<never> {
  const raw: unknown = await response.json().catch(() => null);
  const parsed = OllamaErrorResponseSchema.safeParse(raw);
  const message = parsed.success ? parsed.data.error : `HTTP ${response.status}`;
  const errorCode = isModelMissing(message)
    ? AppErrorCode.ProviderModelMissing
    : AppErrorCode.ProviderUnavailable;
  throw new AppError({
    errorCode,
    userMessage:
      errorCode === AppErrorCode.ProviderModelMissing
        ? "Ollama 모델이 설치되어 있지 않습니다."
        : "Ollama 요청에 실패했습니다.",
  });
}

function createTimeoutSignal(
  abortSignal: AbortSignal | undefined,
  timeoutMs: number,
): { readonly signal: AbortSignal; readonly cleanup: () => void } {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  const timeout = setTimeout(abort, timeoutMs);
  if (abortSignal?.aborted === true) {
    controller.abort();
  } else {
    abortSignal?.addEventListener("abort", abort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      abortSignal?.removeEventListener("abort", abort);
    },
  };
}

function isModelMissing(message: string): boolean {
  return /model.+(not found|not installed)|not found.+model/iu.test(message);
}

function normalizeBaseUrl(raw: string): URL {
  return new URL(raw.endsWith("/") ? raw : `${raw}/`);
}
