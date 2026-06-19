import type {
  VectorHit,
  VectorIndex,
  VectorIndexMeta,
  VectorRecord,
  VectorSearchOptions,
} from "@linkatlas/domain";

export class InMemoryVectorIndex implements VectorIndex {
  private readonly records = new Map<string, VectorRecord>();

  public async upsert(records: readonly VectorRecord[]): Promise<void> {
    for (const record of records) {
      this.records.set(record.id, record);
    }
  }

  public async remove(ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      this.records.delete(id);
    }
  }

  public async search(
    query: readonly number[],
    options: VectorSearchOptions,
  ): Promise<readonly VectorHit[]> {
    return [...this.records.values()]
      .filter((record) => matchesFilter(record, options.filter))
      .map((record) => ({
        id: record.id,
        metadata: record.metadata,
        score: cosineSimilarity(query, record.vector),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, options.limit);
  }

  public async createVersion(meta: VectorIndexMeta): Promise<string> {
    return `vector_${meta.model}_${meta.dimensions}`;
  }

  public async activateVersion(_versionId: string): Promise<void> {
    return;
  }
}

function matchesFilter(
  record: VectorRecord,
  filter: Readonly<Record<string, string>> | undefined,
): boolean {
  if (filter === undefined) {
    return true;
  }
  return Object.entries(filter).every(([key, value]) => record.metadata[key] === value);
}

function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }
  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
