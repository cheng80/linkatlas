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
  readonly abortSignal?: AbortSignal;
};

export type GenerateTextResult = {
  readonly text: string;
  readonly model: string;
};

export interface GenerationProvider {
  health(): Promise<ProviderHealth>;
  listModels(): Promise<readonly ModelInfo[]>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
}

export interface EmbeddingProvider {
  dimensions(model: string): Promise<number>;
  embed(input: readonly string[]): Promise<readonly (readonly number[])[]>;
}
