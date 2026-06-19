export type RankedHit = {
  readonly id: string;
  readonly score: number;
  readonly source: "keyword" | "semantic" | "hybrid";
};

export function reciprocalRankFusion(input: {
  readonly keywordIds: readonly string[];
  readonly semanticIds: readonly string[];
  readonly limit: number;
  readonly k?: number;
}): readonly RankedHit[] {
  const k = input.k ?? 60;
  const scores = new Map<string, number>();
  addRanks(scores, input.keywordIds, k);
  addRanks(scores, input.semanticIds, k);
  return [...scores.entries()]
    .map(([id, score]) => ({
      id,
      score,
      source: sourceFor(id, input.keywordIds, input.semanticIds),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit);
}

function addRanks(scores: Map<string, number>, ids: readonly string[], k: number): void {
  ids.forEach((id, index) => {
    scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
  });
}

function sourceFor(
  id: string,
  keywordIds: readonly string[],
  semanticIds: readonly string[],
): "keyword" | "semantic" | "hybrid" {
  const keyword = keywordIds.includes(id);
  const semantic = semanticIds.includes(id);
  if (keyword && semantic) {
    return "hybrid";
  }
  return keyword ? "keyword" : "semantic";
}
