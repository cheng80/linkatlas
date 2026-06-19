import { z } from "zod";

export const ContractErrorCodeSchema = z.enum(["INVALID_CONTRACT_PAYLOAD"]);

export type ContractErrorCode = z.infer<typeof ContractErrorCodeSchema>;

export const ContractErrorSchema = z.object({
  errorCode: ContractErrorCodeSchema,
  message: z.string().min(1),
});

export type ContractErrorDto = z.infer<typeof ContractErrorSchema>;

export class ContractParseError extends Error {
  public readonly errorCode: ContractErrorCode;

  public constructor(message: string) {
    super(message);
    this.name = "ContractParseError";
    this.errorCode = "INVALID_CONTRACT_PAYLOAD";
  }
}

export function parseContract<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  throw new ContractParseError("Contract payload did not match the expected schema.");
}
