import type { EmbeddingProvider, VectorIndex } from "@linkatlas/domain";
import type { ChunkRecord } from "@linkatlas/storage";

export async function indexChunks(input: {
  readonly chunks: readonly ChunkRecord[];
  readonly embeddingProvider: EmbeddingProvider | undefined;
  readonly vectorIndex: VectorIndex | undefined;
  readonly model: string | undefined;
}): Promise<void> {
  if (
    input.embeddingProvider === undefined ||
    input.vectorIndex === undefined ||
    input.model === undefined ||
    input.chunks.length === 0
  ) {
    return;
  }
  try {
    const embeddings = await input.embeddingProvider.embed({
      input: input.chunks.map((chunk) => chunk.text),
      model: input.model,
    });
    await input.vectorIndex.upsert(
      input.chunks.map((chunk, index) => ({
        id: chunk.id,
        metadata: {
          blockIds: JSON.stringify(chunk.blockIds),
          documentId: chunk.documentId,
          headingPath: JSON.stringify(chunk.headingPath),
          text: chunk.text,
        },
        vector: embeddings[index] ?? [],
      })),
    );
  } catch {
    return;
  }
}
