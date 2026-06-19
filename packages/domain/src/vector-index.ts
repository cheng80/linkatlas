export type VectorRecord = {
  readonly id: string;
  readonly vector: readonly number[];
  readonly metadata: Readonly<Record<string, string>>;
};

export type VectorSearchOptions = {
  readonly limit: number;
  readonly filter?: Readonly<Record<string, string>>;
};

export type VectorHit = {
  readonly id: string;
  readonly score: number;
  readonly metadata: Readonly<Record<string, string>>;
};

export type VectorIndexMeta = {
  readonly model: string;
  readonly dimensions: number;
};

export interface VectorIndex {
  upsert(records: readonly VectorRecord[]): Promise<void>;
  remove(ids: readonly string[]): Promise<void>;
  search(query: readonly number[], options: VectorSearchOptions): Promise<readonly VectorHit[]>;
  createVersion(meta: VectorIndexMeta): Promise<string>;
  activateVersion(versionId: string): Promise<void>;
}
