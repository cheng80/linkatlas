export type ProviderHealth = {
  readonly ok: boolean;
  readonly message: string;
};

export type ModelInfo = {
  readonly name: string;
  readonly digest: string | null;
};

export type GenerateTextRequest = {
  readonly model: string;
  readonly prompt: string;
  readonly abortSignal?: AbortSignal | undefined;
};

export type GenerateTextResult = {
  readonly text: string;
  readonly model: string;
};

export type JsonSchemaObject = {
  readonly [key: string]: unknown;
};

export type StructuredRequest<T> = {
  readonly model: string;
  readonly prompt: string;
  readonly schema: JsonSchemaObject;
  readonly parse: (value: unknown) => T;
  readonly abortSignal?: AbortSignal | undefined;
};

export type ChatMessage = {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
};

export type ChatRequest = {
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly abortSignal?: AbortSignal | undefined;
};

export interface StreamSink {
  onToken(token: string): void | Promise<void>;
}

export type EmbedRequest = {
  readonly model: string;
  readonly input: readonly string[];
  readonly abortSignal?: AbortSignal | undefined;
};

export interface GenerationProvider {
  health(): Promise<ProviderHealth>;
  listModels(): Promise<readonly ModelInfo[]>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
  streamChat(request: ChatRequest, sink: StreamSink): Promise<void>;
}

export interface EmbeddingProvider {
  dimensions(model: string): Promise<number>;
  embed(request: EmbedRequest): Promise<readonly (readonly number[])[]>;
}
