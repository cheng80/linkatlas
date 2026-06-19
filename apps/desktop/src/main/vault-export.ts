import type { ContentBlock, Document, DocumentId, DocumentVersion } from "@linkatlas/domain";
import {
  createSqliteChunkRepository,
  createSqliteDocumentRepository,
  type LinkAtlasDatabase,
} from "@linkatlas/storage";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export type VaultExportDocument = {
  readonly document: Document;
  readonly version: DocumentVersion;
  readonly blocks: readonly ContentBlock[];
};

export function exportVaultMarkdown(database: LinkAtlasDatabase): string {
  return listVaultDocuments(database)
    .map((snapshot) =>
      [
        `# ${snapshot.document.title}`,
        "",
        `Source: ${snapshot.document.originalUrl}`,
        `Captured: ${snapshot.document.createdAt.toISOString()}`,
        "",
        ...snapshot.blocks.map((block) => blockToMarkdown(block)),
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}

export function exportVaultJsonl(database: LinkAtlasDatabase): string {
  return `${listVaultDocuments(database)
    .map((snapshot) => JSON.stringify(snapshot))
    .join("\n")}\n`;
}

export function createVaultBackup(database: LinkAtlasDatabase): Uint8Array {
  const manifest = {
    createdAt: new Date().toISOString(),
    format: "linkatlas-backup",
    version: 1,
  };
  return zipSync({
    "documents.jsonl": strToU8(exportVaultJsonl(database)),
    "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
  });
}

export function restoreVaultBackup(input: {
  readonly database: LinkAtlasDatabase;
  readonly backup: Uint8Array;
  readonly now: Date;
}): { readonly documentCount: number; readonly rebuiltChunkCount: number } {
  const files = unzipSync(input.backup);
  const documentsFile = files["documents.jsonl"];
  if (documentsFile === undefined) {
    throw new Error("Backup is missing documents.jsonl.");
  }
  const documentRepository = createSqliteDocumentRepository(input.database);
  const chunkRepository = createSqliteChunkRepository(input.database);
  const snapshots = strFromU8(documentsFile)
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map(parseSnapshot);
  let rebuiltChunkCount = 0;
  for (const snapshot of snapshots) {
    documentRepository.saveDocumentSnapshot(snapshot);
    chunkRepository.rebuildDocumentChunks({ now: input.now, snapshot });
    rebuiltChunkCount += snapshot.blocks.length;
  }
  return { documentCount: snapshots.length, rebuiltChunkCount };
}

export function listVaultDocuments(database: LinkAtlasDatabase): readonly VaultExportDocument[] {
  const documentRepository = createSqliteDocumentRepository(database);
  const rows = database
    .prepare("select id from documents order by created_at asc")
    .all() as readonly {
    readonly id: DocumentId;
  }[];
  return rows.flatMap((row) => {
    const snapshot = documentRepository.getDocumentSnapshot(row.id);
    return snapshot === null ? [] : [snapshot];
  });
}

function blockToMarkdown(block: ContentBlock): string {
  if (block.blockType === "heading") {
    const depth = Math.min(block.headingPath.length + 1, 6);
    return `${"#".repeat(depth)} ${block.text}`;
  }
  return block.text;
}

function parseSnapshot(line: string): VaultExportDocument {
  const parsed = JSON.parse(line) as VaultExportDocument;
  return {
    blocks: parsed.blocks.map((block) => ({
      ...block,
      headingPath: [...block.headingPath],
    })),
    document: {
      ...parsed.document,
      createdAt: new Date(parsed.document.createdAt),
      updatedAt: new Date(parsed.document.updatedAt),
    },
    version: {
      ...parsed.version,
      createdAt: new Date(parsed.version.createdAt),
    },
  };
}
