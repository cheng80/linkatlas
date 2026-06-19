export const StorageErrorCode = {
  MigrationFailed: "STORAGE_MIGRATION_FAILED",
  RowParseFailed: "STORAGE_ROW_PARSE_FAILED",
} as const;

export type StorageErrorCode = (typeof StorageErrorCode)[keyof typeof StorageErrorCode];

export class StorageError extends Error {
  public readonly errorCode: StorageErrorCode;

  public constructor(input: {
    readonly errorCode: StorageErrorCode;
    readonly message: string;
    readonly cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = "StorageError";
    this.errorCode = input.errorCode;
  }
}
