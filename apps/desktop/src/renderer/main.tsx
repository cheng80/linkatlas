import type { DocumentSummaryDto, JobDto } from "@linkatlas/contracts";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { JobList } from "./job-list.js";
import { LibraryCard } from "./library-card.js";
import { OllamaStatusBadge, type OllamaStatusState } from "./ollama-status-badge.js";
import { SummaryCard } from "./summary-card.js";
import "./styles.css";

type IngestState =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | {
      readonly kind: "accepted";
      readonly title: string;
      readonly finalUrl: string;
      readonly jobStatus: string;
      readonly blockCount: number;
      readonly excerpt: string | null;
      readonly language: string | null;
      readonly summary: DocumentSummaryDto | null;
    }
  | { readonly kind: "rejected"; readonly message: string };

type AppVersionState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly version: string }
  | { readonly kind: "failed"; readonly message: string };

const requiredGenerationModel = "gemma4:12b";

function App(): React.JSX.Element {
  const [versionState, setVersionState] = useState<AppVersionState>({ kind: "loading" });
  const [ollamaState, setOllamaState] = useState<OllamaStatusState>({ kind: "checking" });
  const [url, setUrl] = useState("");
  const [ingestState, setIngestState] = useState<IngestState>({ kind: "idle" });
  const [jobs, setJobs] = useState<readonly JobDto[]>([]);

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

  const refreshJobs = useCallback(async (): Promise<void> => {
    const result = await window.linkAtlas.jobs.list();
    setJobs(result.jobs);
  }, []);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    let active = true;

    async function loadOllamaStatus(): Promise<void> {
      const health = await window.linkAtlas.models.health();
      if (!active) {
        return;
      }
      if (!health.ok) {
        setOllamaState({ kind: "unavailable", message: health.message });
        return;
      }

      const models = await window.linkAtlas.models.list();
      if (!active) {
        return;
      }
      if (!models.ok) {
        setOllamaState({ kind: "failed", message: models.message });
        return;
      }
      const hasRequiredModel = models.models.some(
        (model) => model.name === requiredGenerationModel,
      );
      setOllamaState(
        hasRequiredModel
          ? { kind: "ready", modelCount: models.models.length }
          : { kind: "missing", model: requiredGenerationModel },
      );
    }

    void loadOllamaStatus();

    return () => {
      active = false;
    };
  }, []);

  async function submitUrl(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIngestState({ kind: "submitting" });

    const result = await window.linkAtlas.ingest.addUrl({ url });
    if (result.ok) {
      setIngestState({
        kind: "accepted",
        title: result.title,
        finalUrl: result.finalUrl,
        jobStatus: result.jobStatus,
        blockCount: result.blockCount,
        excerpt: result.excerpt,
        language: result.language,
        summary: result.summary,
      });
      await refreshJobs();
      return;
    }

    setIngestState({ kind: "rejected", message: result.message });
    await refreshJobs();
  }

  async function cancelJob(jobId: `job_${string}`): Promise<void> {
    await window.linkAtlas.jobs.cancel({ jobId });
    await refreshJobs();
  }

  async function retryJob(jobId: `job_${string}`): Promise<void> {
    await window.linkAtlas.jobs.retry({ jobId });
    await refreshJobs();
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
          <OllamaStatusBadge state={ollamaState} />
        </header>
        <section className="inbox-panel">
          <p className="eyebrow">Local-first knowledge base</p>
          <h2 id="workspace-title">Inbox</h2>
          <p>URL을 저장하면 정제된 본문 블록이 로컬 Vault에 추가됩니다.</p>
          <p
            className={ingestState.kind === "rejected" ? "ingest-message error" : "ingest-message"}
          >
            {renderIngestState(ingestState)}
          </p>
          {ingestState.kind === "accepted" ? <LibraryCard state={ingestState} /> : null}
          {ingestState.kind === "accepted" && ingestState.summary !== null ? (
            <SummaryCard summary={ingestState.summary} />
          ) : null}
          <JobList jobs={jobs} onCancel={cancelJob} onRetry={retryJob} />
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
      return `${state.title} 본문 추출 및 저장 완료`;
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
