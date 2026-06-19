import type {
  GenerateTextRequest,
  GenerateTextResult,
  GenerationProvider,
} from "@linkatlas/domain";
import { AppError, AppErrorCode } from "@linkatlas/domain";
import { describe, expect, it } from "vitest";
import { listModels, modelHealth } from "./model-ipc.js";

describe("model IPC handlers", () => {
  it("returns provider health through a small DTO", async () => {
    const provider = createProvider({
      health: async () => ({ message: "ok", ok: true }),
    });

    await expect(modelHealth({ generationProvider: provider })).resolves.toEqual({
      message: "ok",
      ok: true,
    });
  });

  it("maps model list and provider errors for renderer UI", async () => {
    const provider = createProvider({
      listModels: async () => [{ digest: null, name: "gemma4:12b" }],
    });
    const failingProvider = createProvider({
      listModels: async () => {
        throw new AppError({
          errorCode: AppErrorCode.ProviderUnavailable,
          userMessage: "Ollama 모델 목록을 불러올 수 없습니다.",
        });
      },
    });

    await expect(listModels({ generationProvider: provider })).resolves.toEqual({
      models: [{ digest: null, name: "gemma4:12b" }],
      ok: true,
    });
    await expect(listModels({ generationProvider: failingProvider })).resolves.toEqual({
      errorCode: "PROVIDER_UNAVAILABLE",
      message: "Ollama 모델 목록을 불러올 수 없습니다.",
      ok: false,
    });
  });
});

function createProvider(overrides: Partial<GenerationProvider>): GenerationProvider {
  return {
    generateStructured: async () => {
      throw new Error("unused");
    },
    generateText: async (_request: GenerateTextRequest): Promise<GenerateTextResult> => {
      throw new Error("unused");
    },
    health: async () => ({ message: "unused", ok: false }),
    listModels: async () => [],
    streamChat: async () => {
      throw new Error("unused");
    },
    ...overrides,
  };
}
