import type { ListModelsResultDto, ProviderHealthDto } from "@linkatlas/contracts";
import { AppError, type GenerationProvider, type ModelInfo } from "@linkatlas/domain";
import { ipcMain } from "electron";

export type ModelIpcOptions = {
  readonly generationProvider: GenerationProvider;
};

export const modelIpcChannels = {
  health: "linkAtlas:models:health",
  list: "linkAtlas:models:list",
} as const;

export function registerModelIpc(options: ModelIpcOptions): void {
  ipcMain.handle(modelIpcChannels.health, () => modelHealth(options));
  ipcMain.handle(modelIpcChannels.list, () => listModels(options));
}

export async function modelHealth(options: ModelIpcOptions): Promise<ProviderHealthDto> {
  return await options.generationProvider.health();
}

export async function listModels(options: ModelIpcOptions): Promise<ListModelsResultDto> {
  try {
    const models = await options.generationProvider.listModels();
    return { ok: true, models: models.map(toModelDto) };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return { ok: false, errorCode: error.errorCode, message: error.userMessage };
    }
    return {
      ok: false,
      errorCode: "PROVIDER_UNAVAILABLE",
      message: "Ollama 모델 목록을 불러올 수 없습니다.",
    };
  }
}

function toModelDto(model: ModelInfo): { readonly name: string; readonly digest: string | null } {
  return {
    digest: model.digest,
    name: model.name,
  };
}
