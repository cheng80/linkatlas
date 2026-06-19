import type { DocumentSummaryDto } from "@linkatlas/contracts";

export function SummaryCard(props: { readonly summary: DocumentSummaryDto }): React.JSX.Element {
  const { summary } = props;
  return (
    <article className="summary-card" aria-label="Document summary">
      <div>
        <p className="eyebrow">Summary</p>
        <h3>{summary.headline}</h3>
      </div>
      <p>{summary.abstract}</p>
      <ul>
        {summary.keyPoints.map((point) => (
          <li key={`${point.text}:${point.evidenceBlockIds.join(",")}`}>
            <span>{point.text}</span>
            <small>{point.evidenceBlockIds.join(", ")}</small>
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Model</dt>
          <dd>{summary.modelName}</dd>
        </div>
        <div>
          <dt>Prompt</dt>
          <dd>{summary.promptVersion}</dd>
        </div>
      </dl>
    </article>
  );
}
