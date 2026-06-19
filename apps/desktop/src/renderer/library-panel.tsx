import type { LibraryDocumentDto } from "@linkatlas/contracts";

export function LibraryPanel(input: {
  readonly documents: readonly LibraryDocumentDto[];
}): React.JSX.Element {
  return (
    <section className="inbox-panel">
      <p className="eyebrow">Saved documents</p>
      <h2 id="workspace-title">Library</h2>
      <p>저장된 자료를 최근 업데이트 순으로 확인합니다.</p>
      {input.documents.length === 0 ? (
        <p className="empty-state">아직 저장된 자료가 없습니다.</p>
      ) : (
        <div className="library-grid">
          {input.documents.map((document) => (
            <article className="library-list-card" key={document.id}>
              <div>
                <h3>{document.title}</h3>
                <span>{documentStatusLabel(document.status)}</span>
              </div>
              <a href={document.originalUrl}>{document.originalUrl}</a>
              <small>{formatDateTime(document.updatedAt)}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function documentStatusLabel(status: LibraryDocumentDto["status"]): string {
  switch (status) {
    case "inbox":
      return "검토 전";
    case "ready":
      return "저장됨";
    case "failed":
      return "실패";
    case "archived":
      return "보관됨";
    default:
      return assertNever(status);
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled document status: ${String(value)}`);
}
