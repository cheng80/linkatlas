export type OllamaStatusState =
  | { readonly kind: "checking" }
  | { readonly kind: "unavailable"; readonly message: string }
  | { readonly kind: "missing"; readonly model: string }
  | { readonly kind: "ready"; readonly modelCount: number }
  | { readonly kind: "failed"; readonly message: string };

export function OllamaStatusBadge(props: { readonly state: OllamaStatusState }): React.JSX.Element {
  const { state } = props;
  return (
    <div
      className={`runtime-status ${statusClassName(state)}`}
      aria-label="Ollama status"
      role="status"
    >
      {statusLabel(state)}
    </div>
  );
}

function statusLabel(state: OllamaStatusState): string {
  switch (state.kind) {
    case "checking":
      return "Ollama 확인 중";
    case "unavailable":
      return "Ollama 미연결";
    case "missing":
      return `${state.model} 없음`;
    case "ready":
      return `Ollama 모델 ${state.modelCount}개`;
    case "failed":
      return state.message;
    default:
      return assertNever(state);
  }
}

function statusClassName(state: OllamaStatusState): string {
  switch (state.kind) {
    case "checking":
      return "pending";
    case "ready":
      return "ready";
    case "missing":
    case "unavailable":
    case "failed":
      return "blocked";
    default:
      return assertNever(state);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${String(value)}`);
}
