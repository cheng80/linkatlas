export const AppErrorCode = {
  InvalidInput: "INVALID_INPUT",
  ProviderUnavailable: "PROVIDER_UNAVAILABLE",
  ProviderModelMissing: "PROVIDER_MODEL_MISSING",
  OperationCancelled: "OPERATION_CANCELLED",
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

export class AppError extends Error {
  public readonly errorCode: AppErrorCode;
  public readonly userMessage: string;

  public constructor(input: { readonly errorCode: AppErrorCode; readonly userMessage: string }) {
    super(input.userMessage);
    this.name = "AppError";
    this.errorCode = input.errorCode;
    this.userMessage = input.userMessage;
  }
}
