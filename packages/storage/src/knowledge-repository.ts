import { createHash } from "node:crypto";
import type { DocumentId, EntityId, MentionId, TopicId } from "@linkatlas/domain";
import type { LinkAtlasDatabase } from "./connection.js";

export type TopicInput = {
  readonly label: string;
  readonly description: string;
  readonly confidence: number;
};

export type EntityInput = {
  readonly name: string;
  readonly type: string;
  readonly aliases: readonly string[];
  readonly confidence: number;
  readonly blockIds: readonly string[];
};

export type TopicRecord = {
  readonly id: TopicId;
  readonly label: string;
  readonly normalizedLabel: string;
  readonly description: string | null;
  readonly documentCount: number;
};

export type EntityRecord = {
  readonly id: EntityId;
  readonly canonicalName: string;
  readonly normalizedName: string;
  readonly entityType: string;
  readonly aliases: readonly string[];
};

export type RelatedDocumentRecord = {
  readonly documentId: DocumentId;
  readonly title: string;
  readonly score: number;
  readonly semanticScore: number | null;
  readonly topicScore: number | null;
  readonly entityScore: number | null;
  readonly isPinned: boolean;
  readonly reason: string;
  readonly sharedTopics: readonly string[];
  readonly sharedEntities: readonly string[];
};

export interface KnowledgeRepository {
  upsertDocumentTopics(input: {
    readonly documentId: DocumentId;
    readonly topics: readonly TopicInput[];
    readonly now: Date;
  }): readonly TopicRecord[];
  upsertDocumentEntities(input: {
    readonly documentId: DocumentId;
    readonly entities: readonly EntityInput[];
    readonly now: Date;
  }): readonly EntityRecord[];
  listTopics(): readonly TopicRecord[];
  listDocumentTopics(documentId: DocumentId): readonly TopicRecord[];
  refreshDocumentRelations(input: {
    readonly documentId: DocumentId;
    readonly now: Date;
    readonly limit: number;
  }): readonly RelatedDocumentRecord[];
  listRelatedDocuments(input: {
    readonly documentId: DocumentId;
    readonly limit: number;
  }): readonly RelatedDocumentRecord[];
  setDocumentRelationPinned(input: {
    readonly sourceDocumentId: DocumentId;
    readonly targetDocumentId: DocumentId;
    readonly pinned: boolean;
  }): void;
  removeDocumentRelation(input: {
    readonly sourceDocumentId: DocumentId;
    readonly targetDocumentId: DocumentId;
  }): void;
}

export function createSqliteKnowledgeRepository(database: LinkAtlasDatabase): KnowledgeRepository {
  return {
    upsertDocumentTopics(input): readonly TopicRecord[] {
      const records: TopicRecord[] = [];
      const transaction = database.transaction(() => {
        for (const topic of input.topics) {
          const normalizedLabel = normalizeLabel(topic.label);
          const topicId = topicIdFor(normalizedLabel);
          database
            .prepare<{
              readonly id: TopicId;
              readonly label: string;
              readonly normalizedLabel: string;
              readonly description: string;
              readonly createdAt: string;
            }>(
              `
insert into topics (id, label, normalized_label, description, created_at)
values (@id, @label, @normalizedLabel, @description, @createdAt)
on conflict(normalized_label) do update set
  description = coalesce(nullif(excluded.description, ''), topics.description)
`,
            )
            .run({
              id: topicId,
              label: topic.label.trim(),
              normalizedLabel,
              description: topic.description.trim(),
              createdAt: input.now.toISOString(),
            });
          database
            .prepare<{
              readonly documentId: DocumentId;
              readonly topicId: TopicId;
              readonly confidence: number;
            }>(
              `
insert into document_topics (document_id, topic_id, confidence, source)
values (@documentId, @topicId, @confidence, 'analysis')
on conflict(document_id, topic_id) do update set
  confidence = max(document_topics.confidence, excluded.confidence)
`,
            )
            .run({ documentId: input.documentId, topicId, confidence: topic.confidence });
          records.push({
            id: topicId,
            label: topic.label.trim(),
            normalizedLabel,
            description: topic.description.trim() || null,
            documentCount: 1,
          });
        }
      });
      transaction.immediate();
      return records;
    },

    upsertDocumentEntities(input): readonly EntityRecord[] {
      const records: EntityRecord[] = [];
      const transaction = database.transaction(() => {
        for (const entity of input.entities) {
          const normalizedName = normalizeLabel(entity.name);
          const entityType = entity.type.toUpperCase();
          const entityId = entityIdFor(normalizedName, entityType);
          database
            .prepare<{
              readonly id: EntityId;
              readonly canonicalName: string;
              readonly normalizedName: string;
              readonly entityType: string;
              readonly aliasesJson: string;
              readonly createdAt: string;
            }>(
              `
insert into entities (id, canonical_name, normalized_name, entity_type, aliases_json, created_at)
values (@id, @canonicalName, @normalizedName, @entityType, @aliasesJson, @createdAt)
on conflict(normalized_name, entity_type) do update set
  aliases_json = excluded.aliases_json
`,
            )
            .run({
              id: entityId,
              canonicalName: entity.name.trim(),
              normalizedName,
              entityType,
              aliasesJson: JSON.stringify([
                ...new Set(entity.aliases.map((alias) => alias.trim())),
              ]),
              createdAt: input.now.toISOString(),
            });
          const mentionId = mentionIdFor(input.documentId, entityId);
          database
            .prepare<{
              readonly id: MentionId;
              readonly documentId: DocumentId;
              readonly entityId: EntityId;
              readonly surfaceText: string;
              readonly blockIdsJson: string;
              readonly confidence: number;
            }>(
              `
insert into mentions (id, document_id, entity_id, surface_text, block_ids_json, confidence)
values (@id, @documentId, @entityId, @surfaceText, @blockIdsJson, @confidence)
on conflict(id) do update set
  block_ids_json = excluded.block_ids_json,
  confidence = max(mentions.confidence, excluded.confidence)
`,
            )
            .run({
              id: mentionId,
              documentId: input.documentId,
              entityId,
              surfaceText: entity.name.trim(),
              blockIdsJson: JSON.stringify(entity.blockIds),
              confidence: entity.confidence,
            });
          records.push({
            id: entityId,
            canonicalName: entity.name.trim(),
            normalizedName,
            entityType,
            aliases: entity.aliases,
          });
        }
      });
      transaction.immediate();
      return records;
    },

    listTopics(): readonly TopicRecord[] {
      return database
        .prepare(
          `
select topics.id, topics.label, topics.normalized_label, topics.description, count(document_topics.document_id) as document_count
from topics
left join document_topics on document_topics.topic_id = topics.id
group by topics.id
order by topics.label asc
`,
        )
        .all()
        .map(parseTopic);
    },

    listDocumentTopics(documentId): readonly TopicRecord[] {
      return database
        .prepare<[DocumentId]>(
          `
select topics.id, topics.label, topics.normalized_label, topics.description, 1 as document_count
from document_topics
join topics on topics.id = document_topics.topic_id
where document_topics.document_id = ?
order by document_topics.confidence desc, topics.label asc
`,
        )
        .all(documentId)
        .map(parseTopic);
    },

    refreshDocumentRelations(input): readonly RelatedDocumentRecord[] {
      const candidates = relationCandidates(database, input.documentId);
      const limited = candidates
        .map((candidate) => scoreCandidate(candidate))
        .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
        .slice(0, input.limit);
      const transaction = database.transaction(() => {
        for (const relation of limited) {
          database
            .prepare<{
              readonly sourceDocumentId: DocumentId;
              readonly targetDocumentId: DocumentId;
              readonly semanticScore: number | null;
              readonly topicScore: number;
              readonly entityScore: number;
              readonly finalScore: number;
              readonly explanationJson: string;
              readonly createdAt: string;
            }>(
              `
insert into document_relations (
  source_document_id, target_document_id, relation_type, semantic_score, topic_score,
  entity_score, final_score, explanation_json, evidence_json, source, created_at
)
values (
  @sourceDocumentId, @targetDocumentId, 'related', @semanticScore, @topicScore,
  @entityScore, @finalScore, @explanationJson, '[]', 'analysis', @createdAt
)
on conflict(source_document_id, target_document_id, relation_type) do update set
  semantic_score = excluded.semantic_score,
  topic_score = excluded.topic_score,
  entity_score = excluded.entity_score,
  final_score = case
    when document_relations.is_user_pinned = 1 then max(excluded.final_score, 0.05)
    else excluded.final_score
  end,
  explanation_json = excluded.explanation_json
where document_relations.is_user_removed = 0
`,
            )
            .run({
              sourceDocumentId: input.documentId,
              targetDocumentId: relation.documentId,
              semanticScore: relation.semanticScore,
              topicScore: relation.topicScore ?? 0,
              entityScore: relation.entityScore ?? 0,
              finalScore: relation.score,
              explanationJson: JSON.stringify({
                reason: relation.reason,
                sharedEntities: relation.sharedEntities,
                sharedTopics: relation.sharedTopics,
              }),
              createdAt: input.now.toISOString(),
            });
        }
      });
      transaction.immediate();
      return this.listRelatedDocuments(input);
    },

    listRelatedDocuments(input): readonly RelatedDocumentRecord[] {
      return database
        .prepare<[DocumentId, number]>(
          `
select
  document_relations.target_document_id,
  documents.title,
  document_relations.semantic_score,
  document_relations.topic_score,
  document_relations.entity_score,
  document_relations.final_score,
  document_relations.explanation_json,
  document_relations.is_user_pinned
from document_relations
join documents on documents.id = document_relations.target_document_id
where document_relations.source_document_id = ?
  and document_relations.relation_type = 'related'
  and document_relations.is_user_removed = 0
order by document_relations.is_user_pinned desc, document_relations.final_score desc, documents.title asc
limit ?
`,
        )
        .all(input.documentId, input.limit)
        .map(parseRelatedDocument);
    },

    setDocumentRelationPinned(input): void {
      database
        .prepare<{
          readonly sourceDocumentId: DocumentId;
          readonly targetDocumentId: DocumentId;
          readonly isPinned: number;
        }>(
          `
update document_relations
set is_user_pinned = @isPinned,
    is_user_removed = 0
where source_document_id = @sourceDocumentId
  and target_document_id = @targetDocumentId
  and relation_type = 'related'
`,
        )
        .run({
          isPinned: input.pinned ? 1 : 0,
          sourceDocumentId: input.sourceDocumentId,
          targetDocumentId: input.targetDocumentId,
        });
    },

    removeDocumentRelation(input): void {
      database
        .prepare<{
          readonly sourceDocumentId: DocumentId;
          readonly targetDocumentId: DocumentId;
        }>(
          `
update document_relations
set is_user_removed = 1,
    is_user_pinned = 0
where source_document_id = @sourceDocumentId
  and target_document_id = @targetDocumentId
  and relation_type = 'related'
`,
        )
        .run(input);
    },
  };
}

export function normalizeLabel(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/gu, " ");
}

function parseTopic(row: unknown): TopicRecord {
  const input = row as {
    readonly id: TopicId;
    readonly label: string;
    readonly normalized_label: string;
    readonly description: string | null;
    readonly document_count: number;
  };
  return {
    id: input.id,
    label: input.label,
    normalizedLabel: input.normalized_label,
    description: input.description,
    documentCount: input.document_count,
  };
}

type RelationCandidate = {
  readonly documentId: DocumentId;
  readonly title: string;
  readonly sharedTopics: readonly string[];
  readonly sharedEntities: readonly string[];
  readonly sourceTopicCount: number;
  readonly targetTopicCount: number;
  readonly sourceEntityCount: number;
  readonly targetEntityCount: number;
};

function relationCandidates(
  database: LinkAtlasDatabase,
  sourceDocumentId: DocumentId,
): readonly RelationCandidate[] {
  const topicRows = database
    .prepare<[DocumentId]>(
      `
select distinct candidate.id as document_id, candidate.title, topics.label
from document_topics source_topics
join document_topics target_topics on target_topics.topic_id = source_topics.topic_id
join topics on topics.id = source_topics.topic_id
join documents candidate on candidate.id = target_topics.document_id
where source_topics.document_id = ? and candidate.id != source_topics.document_id
`,
    )
    .all(sourceDocumentId) as readonly {
    readonly document_id: DocumentId;
    readonly title: string;
    readonly label: string;
  }[];
  const entityRows = database
    .prepare<[DocumentId]>(
      `
select distinct candidate.id as document_id, candidate.title, entities.canonical_name
from mentions source_mentions
join mentions target_mentions on target_mentions.entity_id = source_mentions.entity_id
join entities on entities.id = source_mentions.entity_id
join documents candidate on candidate.id = target_mentions.document_id
where source_mentions.document_id = ? and candidate.id != source_mentions.document_id
`,
    )
    .all(sourceDocumentId) as readonly {
    readonly document_id: DocumentId;
    readonly title: string;
    readonly canonical_name: string;
  }[];
  const byDocument = new Map<DocumentId, MutableCandidate>();
  for (const row of topicRows) {
    const candidate = mutableCandidate(byDocument, row.document_id, row.title);
    candidate.sharedTopics.add(row.label);
  }
  for (const row of entityRows) {
    const candidate = mutableCandidate(byDocument, row.document_id, row.title);
    candidate.sharedEntities.add(row.canonical_name);
  }
  const sourceTopicCount = countDocumentTopics(database, sourceDocumentId);
  const sourceEntityCount = countDocumentEntities(database, sourceDocumentId);
  return [...byDocument.values()].map((candidate) => ({
    documentId: candidate.documentId,
    title: candidate.title,
    sharedEntities: [...candidate.sharedEntities].sort(),
    sharedTopics: [...candidate.sharedTopics].sort(),
    sourceEntityCount,
    sourceTopicCount,
    targetEntityCount: countDocumentEntities(database, candidate.documentId),
    targetTopicCount: countDocumentTopics(database, candidate.documentId),
  }));
}

type MutableCandidate = {
  readonly documentId: DocumentId;
  readonly title: string;
  readonly sharedTopics: Set<string>;
  readonly sharedEntities: Set<string>;
};

function mutableCandidate(
  byDocument: Map<DocumentId, MutableCandidate>,
  documentId: DocumentId,
  title: string,
): MutableCandidate {
  const existing = byDocument.get(documentId);
  if (existing !== undefined) {
    return existing;
  }
  const candidate = {
    documentId,
    title,
    sharedEntities: new Set<string>(),
    sharedTopics: new Set<string>(),
  };
  byDocument.set(documentId, candidate);
  return candidate;
}

function scoreCandidate(candidate: RelationCandidate): RelatedDocumentRecord {
  const topicScore = overlapScore(
    candidate.sharedTopics.length,
    candidate.sourceTopicCount,
    candidate.targetTopicCount,
  );
  const entityScore = overlapScore(
    candidate.sharedEntities.length,
    candidate.sourceEntityCount,
    candidate.targetEntityCount,
  );
  const score = Number((topicScore * 0.25 + entityScore * 0.15).toFixed(6));
  return {
    documentId: candidate.documentId,
    entityScore,
    isPinned: false,
    reason: relationReason(candidate.sharedTopics, candidate.sharedEntities),
    score,
    semanticScore: null,
    sharedEntities: candidate.sharedEntities,
    sharedTopics: candidate.sharedTopics,
    title: candidate.title,
    topicScore,
  };
}

function overlapScore(sharedCount: number, leftCount: number, rightCount: number): number {
  const denominator = Math.max(leftCount, rightCount, 1);
  return Number((sharedCount / denominator).toFixed(6));
}

function relationReason(
  sharedTopics: readonly string[],
  sharedEntities: readonly string[],
): string {
  if (sharedTopics.length > 0 && sharedEntities.length > 0) {
    return `공유 주제 ${sharedTopics[0]} 및 공유 엔티티 ${sharedEntities[0]}`;
  }
  if (sharedTopics.length > 0) {
    return `공유 주제 ${sharedTopics[0]}`;
  }
  return `공유 엔티티 ${sharedEntities[0] ?? "확인됨"}`;
}

function countDocumentTopics(database: LinkAtlasDatabase, documentId: DocumentId): number {
  return countByDocument(database, "document_topics", documentId);
}

function countDocumentEntities(database: LinkAtlasDatabase, documentId: DocumentId): number {
  const row = database
    .prepare<[DocumentId]>(
      "select count(distinct entity_id) as count from mentions where document_id = ?",
    )
    .get(documentId) as { readonly count: number } | undefined;
  return row?.count ?? 0;
}

function countByDocument(
  database: LinkAtlasDatabase,
  tableName: "document_topics",
  documentId: DocumentId,
): number {
  const row = database
    .prepare<[DocumentId]>(`select count(*) as count from ${tableName} where document_id = ?`)
    .get(documentId) as { readonly count: number } | undefined;
  return row?.count ?? 0;
}

function parseRelatedDocument(row: unknown): RelatedDocumentRecord {
  const input = row as {
    readonly target_document_id: DocumentId;
    readonly title: string;
    readonly semantic_score: number | null;
    readonly topic_score: number | null;
    readonly entity_score: number | null;
    readonly final_score: number;
    readonly explanation_json: string;
    readonly is_user_pinned: number;
  };
  const explanation = parseExplanation(input.explanation_json);
  return {
    documentId: input.target_document_id,
    entityScore: input.entity_score,
    isPinned: input.is_user_pinned === 1,
    reason: explanation.reason,
    score: input.final_score,
    semanticScore: input.semantic_score,
    sharedEntities: explanation.sharedEntities,
    sharedTopics: explanation.sharedTopics,
    title: input.title,
    topicScore: input.topic_score,
  };
}

function parseExplanation(raw: string): {
  readonly reason: string;
  readonly sharedTopics: readonly string[];
  readonly sharedEntities: readonly string[];
} {
  const parsed = JSON.parse(raw) as {
    readonly reason?: unknown;
    readonly sharedTopics?: unknown;
    readonly sharedEntities?: unknown;
  };
  return {
    reason: typeof parsed.reason === "string" ? parsed.reason : "연관 점수",
    sharedEntities: arrayOfStrings(parsed.sharedEntities),
    sharedTopics: arrayOfStrings(parsed.sharedTopics),
  };
}

function arrayOfStrings(input: unknown): readonly string[] {
  return Array.isArray(input) ? input.filter((item) => typeof item === "string") : [];
}

function topicIdFor(normalizedLabel: string): TopicId {
  return `topic_${sha256(normalizedLabel).slice(0, 24)}`;
}

function entityIdFor(normalizedName: string, entityType: string): EntityId {
  return `entity_${sha256(`${entityType}:${normalizedName}`).slice(0, 24)}`;
}

function mentionIdFor(documentId: DocumentId, entityId: EntityId): MentionId {
  return `mention_${sha256(`${documentId}:${entityId}`).slice(0, 24)}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
