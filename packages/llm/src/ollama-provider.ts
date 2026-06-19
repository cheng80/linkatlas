import {
  AppError,
  AppErrorCode,
  type ChatRequest,
  type EmbeddingProvider,
  type EmbedRequest,
  type GenerateTextRequest,
  type GenerateTextResult,
  type GenerationProvider,
  type ModelInfo,
  type ProviderHealth,
  type StreamSink,
  type StructuredRequest,
} from "@linkatlas/domain";
import { createOllamaHttpClient, type OllamaHttpClient } from "./http.js";
import {
  OllamaChatChunkSchema,
  OllamaEmbedResponseSchema,
  OllamaGenerateResponseSchema,
  OllamaTagsResponseSchema,
} from "./ollama-schemas.js";
import type { OllamaProviderOptions } from "./transport.js";

export class OllamaGenerationProvider implements GenerationProvider {
  private readonly http: OllamaHttpClient;

  public constructor(options: OllamaProviderOptions) {
    this.http = createOllamaHttpClient(options);
  }

  public async health(): Promise<ProviderHealth> {
    try {
      await this.http.requestJson({
        method: "GET",
        path: "api/version",
        schema: OllamaTagsResponseSchema.partial(),
      });
      return { ok: true, message: "Ollama is reachable." };
    } catch {
      return { ok: false, message: "Ollama에 연결할 수 없습니다." };
    }
  }

  public async listModels(): Promise<readonly ModelInfo[]> {
    const response = await this.http.requestJson({
      method: "GET",
      path: "api/tags",
      schema: OllamaTagsResponseSchema,
    });
    return response.models.map((model) => ({
      digest: model.digest ?? null,
      name: model.name,
    }));
  }

  public async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = await this.http.requestJson({
      abortSignal: request.abortSignal,
      body: {
        model: request.model,
        prompt: request.prompt,
        stream: false,
      },
      method: "POST",
      path: "api/generate",
      schema: OllamaGenerateResponseSchema,
    });
    return { model: response.model, text: response.response };
  }

  public async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    const response = await this.http.requestJson({
      abortSignal: request.abortSignal,
      body: {
        format: request.schema,
        model: request.model,
        prompt: request.prompt,
        stream: false,
      },
      method: "POST",
      path: "api/generate",
      schema: OllamaGenerateResponseSchema,
    });
    const parsedJson = parseJson(response.response);
    return request.parse(parsedJson);
  }

  public async streamChat(request: ChatRequest, sink: StreamSink): Promise<void> {
    const stream = await this.http.requestStream({
      abortSignal: request.abortSignal,
      body: {
        messages: request.messages,
        model: request.model,
        stream: true,
      },
      method: "POST",
      path: "api/chat",
    });
    await readJsonLineStream(stream, sink);
  }
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly http: OllamaHttpClient;

  public constructor(options: OllamaProviderOptions) {
    this.http = createOllamaHttpClient(options);
  }

  public async dimensions(model: string): Promise<number> {
    const [embedding] = await this.embed({ input: ["dimension probe"], model });
    return embedding?.length ?? 0;
  }

  public async embed(request: EmbedRequest): Promise<readonly (readonly number[])[]> {
    const response = await this.http.requestJson({
      abortSignal: request.abortSignal,
      body: {
        input: request.input,
        model: request.model,
      },
      method: "POST",
      path: "api/embed",
      schema: OllamaEmbedResponseSchema,
    });
    return response.embeddings;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError({
      errorCode: AppErrorCode.ProviderUnavailable,
      userMessage: "Ollama 구조화 응답을 해석할 수 없습니다.",
    });
  }
}

async function readJsonLineStream(
  stream: ReadableStream<Uint8Array>,
  sink: StreamSink,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      await emitChunk(line, sink);
    }
  }
  if (buffer.trim().length > 0) {
    await emitChunk(buffer, sink);
  }
}

async function emitChunk(line: string, sink: StreamSink): Promise<void> {
  const parsed = OllamaChatChunkSchema.safeParse(JSON.parse(line) as unknown);
  if (!parsed.success) {
    throw new AppError({
      errorCode: AppErrorCode.ProviderUnavailable,
      userMessage: "Ollama 스트림 응답 형식이 올바르지 않습니다.",
    });
  }
  if (parsed.data.error !== undefined) {
    throw new AppError({
      errorCode: AppErrorCode.ProviderUnavailable,
      userMessage: "Ollama 스트림 요청에 실패했습니다.",
    });
  }
  const token = parsed.data.message?.content;
  if (token !== undefined && token.length > 0) {
    await sink.onToken(token);
  }
}
