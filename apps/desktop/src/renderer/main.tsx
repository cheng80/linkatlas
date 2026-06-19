import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

type IngestState =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | { readonly kind: "accepted"; readonly title: string; readonly finalUrl: string }
  | { readonly kind: "rejected"; readonly message: string };

type AppVersionState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly version: string }
  | { readonly kind: "failed"; readonly message: string };

function App(): React.JSX.Element {
  const [versionState, setVersionState] = useState<AppVersionState>({ kind: "loading" });
  const [url, setUrl] = useState("");
  const [ingestState, setIngestState] = useState<IngestState>({ kind: "idle" });

  useEffect(() => {
    let active = true;

    window.linkAtlas.app
      .getVersion()
      .then((info) => {
        if (active) {
          setVersionState({ kind: "ready", version: info.version });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setVersionState({
            kind: "failed",
            message: error instanceof Error ? error.message : "Unknown preload error",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitUrl(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIngestState({ kind: "submitting" });

    const result = await window.linkAtlas.ingest.addUrl({ url });
    if (result.ok) {
      setIngestState({ kind: "accepted", title: result.title, finalUrl: result.finalUrl });
      return;
    }

    setIngestState({ kind: "rejected", message: result.message });
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="LinkAtlas navigation">
        <h1>LinkAtlas</h1>
        <nav>
          <a href="#inbox">Inbox</a>
          <a href="#library">Library</a>
          <a href="#topics">Topics</a>
          <a href="#collections">Collections</a>
          <a href="#graph">Graph</a>
          <a href="#ask">Ask</a>
          <a href="#settings">Settings</a>
        </nav>
      </aside>
      <section className="workspace" aria-labelledby="workspace-title">
        <header className="topbar">
          <form className="url-entry" onSubmit={submitUrl}>
            <label>
              <span>URL</span>
              <input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(event) => setUrl(event.currentTarget.value)}
              />
            </label>
            <button type="submit" disabled={ingestState.kind === "submitting" || url.length === 0}>
              URL 저장
            </button>
          </form>
          <label className="search-entry">
            <span>Search</span>
            <input type="search" placeholder="저장된 자료 검색" disabled />
          </label>
          <div className="model-status" data-testid="app-version">
            {renderVersion(versionState)}
          </div>
        </header>
        <section className="inbox-panel">
          <p className="eyebrow">Local-first knowledge base</p>
          <h2 id="workspace-title">Inbox 준비 중</h2>
          <p>URL 수집, 본문 추출, 요약, 검색을 위한 안전한 데스크톱 셸이 준비되었습니다.</p>
          <p
            className={ingestState.kind === "rejected" ? "ingest-message error" : "ingest-message"}
          >
            {renderIngestState(ingestState)}
          </p>
        </section>
      </section>
    </main>
  );
}

function renderIngestState(state: IngestState): string {
  switch (state.kind) {
    case "idle":
      return "URL을 입력하면 안전 검증 후 가져오기를 시작합니다.";
    case "submitting":
      return "URL을 검증하고 가져오는 중입니다.";
    case "accepted":
      return `${state.title} 가져오기 완료: ${state.finalUrl}`;
    case "rejected":
      return state.message;
    default:
      return assertNever(state);
  }
}

function renderVersion(state: AppVersionState): string {
  switch (state.kind) {
    case "loading":
      return "Version loading";
    case "ready":
      return `Version ${state.version}`;
    case "failed":
      return state.message;
    default:
      return assertNever(state);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled state: ${String(value)}`);
}

const rootElement = document.querySelector("#root");

if (rootElement === null) {
  throw new Error("Renderer root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
