import { z } from "zod";

export const AppInfoSchema = z.object({
  name: z.literal("LinkAtlas"),
  version: z.string().min(1),
});

export type AppInfoDto = z.infer<typeof AppInfoSchema>;

export function parseAppInfo(input: unknown): AppInfoDto {
  return AppInfoSchema.parse(input);
}
