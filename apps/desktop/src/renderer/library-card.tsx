export type SavedLibraryItem = {
  readonly title: string;
  readonly finalUrl: string;
  readonly jobStatus: string;
  readonly blockCount: number;
  readonly excerpt: string | null;
  readonly language: string | null;
};

export function LibraryCard(props: { readonly state: SavedLibraryItem }): React.JSX.Element {
  const { state } = props;
  return (
    <article className="library-card" aria-label="Saved library item">
      <div>
        <p className="eyebrow">Library</p>
        <h3>{state.title}</h3>
      </div>
      <p>{state.excerpt ?? "요약 가능한 본문이 저장되었습니다."}</p>
      <dl>
        <div>
          <dt>Job</dt>
          <dd>{state.jobStatus}</dd>
        </div>
        <div>
          <dt>Blocks</dt>
          <dd>{state.blockCount}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{state.language ?? "unknown"}</dd>
        </div>
      </dl>
      <a href={state.finalUrl}>{state.finalUrl}</a>
    </article>
  );
}
