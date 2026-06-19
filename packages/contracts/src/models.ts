import { z } from "zod";

export const ProviderHealthDtoSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export type ProviderHealthDto = z.infer<typeof ProviderHealthDtoSchema>;

export const ModelInfoDtoSchema = z.object({
  name: z.string(),
  digest: z.string().nullable(),
});

export type ModelInfoDto = z.infer<typeof ModelInfoDtoSchema>;

export const ListModelsResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    models: z.array(ModelInfoDtoSchema),
  }),
  z.object({
    ok: z.literal(false),
    errorCode: z.string(),
    message: z.string(),
  }),
]);

export type ListModelsResultDto = z.infer<typeof ListModelsResultSchema>;
