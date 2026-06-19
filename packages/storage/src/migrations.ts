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
];
