import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

type AppVersionState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly version: string }
  | { readonly kind: "failed"; readonly message: string };

function App(): React.JSX.Element {
  const [versionState, setVersionState] = useState<AppVersionState>({ kind: "loading" });

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
          <label className="url-entry">
            <span>URL</span>
            <input type="url" placeholder="https://example.com/article" disabled />
          </label>
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
        </section>
      </section>
    </main>
  );
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
