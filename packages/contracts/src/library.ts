import { z } from "zod";

export const LibraryDocumentDtoSchema = z.object({
  id: z.string().startsWith("doc_"),
  originalUrl: z.string().url(),
  title: z.string(),
  status: z.enum(["inbox", "ready", "failed", "archived"]),
  updatedAt: z.string().datetime(),
});

export type LibraryDocumentDto = z.infer<typeof LibraryDocumentDtoSchema>;

export const ListLibraryDocumentsResultSchema = z.object({
  documents: z.array(LibraryDocumentDtoSchema),
});

export type ListLibraryDocumentsResultDto = z.infer<typeof ListLibraryDocumentsResultSchema>;
