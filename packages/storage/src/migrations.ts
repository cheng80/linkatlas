export type SqliteMigration = {
  readonly id: string;
  readonly sql: string;
};

export const sqliteMigrations: readonly SqliteMigration[] = [
  {
    id: "0001_initial",
    sql: `
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  canonical_url TEXT,
  final_url TEXT,
  title TEXT NOT NULL,
  domain TEXT,
  author TEXT,
  published_at TEXT,
  captured_at TEXT NOT NULL,
  language TEXT,
  content_type TEXT,
  status TEXT NOT NULL,
  current_version_id TEXT,
  user_note TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  raw_blob_path TEXT,
  normalized_markdown_path TEXT,
  extraction_method TEXT NOT NULL,
  word_count INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE content_blocks (
  id TEXT PRIMARY KEY,
  document_version_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  heading_path TEXT NOT NULL,
  text TEXT NOT NULL,
  source_selector TEXT,
  FOREIGN KEY(document_version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_content_blocks_document_version_id ON content_blocks(document_version_id);
CREATE UNIQUE INDEX idx_content_blocks_version_ordinal ON content_blocks(document_version_id, ordinal);
`,
  },
  {
    id: "0002_jobs",
    sql: `
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  initial_stage TEXT NOT NULL,
  stage TEXT,
  progress INTEGER NOT NULL,
  lease_owner TEXT,
  lease_expires_at TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_jobs_idempotency_key ON jobs(idempotency_key);
CREATE INDEX idx_jobs_ready ON jobs(status, lease_expires_at, created_at);
`,
  },
  {
    id: "0003_summaries",
    sql: `
CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_version_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  content_json TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_name TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  is_user_edited INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(document_version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

CREATE INDEX idx_summaries_document_id ON summaries(document_id, created_at);
CREATE UNIQUE INDEX idx_summaries_generated_version_kind
  ON summaries(document_version_id, kind)
  WHERE is_user_edited = 0;
`,
  },
  {
    id: "0004_chunks_search",
    sql: `
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_version_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  heading_path TEXT NOT NULL,
  text TEXT NOT NULL,
  block_ids_json TEXT NOT NULL,
  embedding_index_version TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(document_version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chunks_document_id ON chunks(document_id, ordinal);
CREATE UNIQUE INDEX idx_chunks_version_ordinal ON chunks(document_version_id, ordinal);

CREATE VIRTUAL TABLE chunk_fts USING fts5(
  chunk_id UNINDEXED,
  document_id UNINDEXED,
  title,
  heading_path,
  body,
  tokenize = 'unicode61'
);
`,
  },
  {
    id: "0005_knowledge_graph",
    sql: `
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT,
  is_user_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(parent_id) REFERENCES topics(id) ON DELETE SET NULL
);

CREATE TABLE document_topics (
  document_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  confidence REAL NOT NULL,
  source TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(document_id, topic_id),
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  aliases_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(normalized_name, entity_type)
);

CREATE TABLE mentions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_id TEXT,
  entity_id TEXT NOT NULL,
  surface_text TEXT NOT NULL,
  block_ids_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE SET NULL,
  FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

CREATE TABLE document_relations (
  source_document_id TEXT NOT NULL,
  target_document_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  semantic_score REAL,
  topic_score REAL,
  entity_score REAL,
  final_score REAL NOT NULL,
  explanation_json TEXT NOT NULL,
  evidence_json TEXT,
  source TEXT NOT NULL,
  is_user_pinned INTEGER NOT NULL DEFAULT 0,
  is_user_removed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY(source_document_id, target_document_id, relation_type),
  FOREIGN KEY(source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(target_document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_topics_topic_id ON document_topics(topic_id, document_id);
CREATE INDEX idx_mentions_entity_id ON mentions(entity_id, document_id);
CREATE INDEX idx_document_relations_source_score ON document_relations(source_document_id, final_score);
`,
  },
];
