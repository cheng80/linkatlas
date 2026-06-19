import type {
  AskCitationDto,
  DocumentSummaryDto,
  JobDto,
  LibraryDocumentDto,
  RelatedDocumentDto,
  SearchResultDto,
  TopicDto,
} from "@linkatlas/contracts";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { installDevLinkAtlasApi } from "./dev-link-atlas-api.js";
import { JobList } from "./job-list.js";
import { LibraryCard } from "./library-card.js";
import { LibraryPanel } from "./library-panel.js";
import { OllamaStatusBadge, type OllamaStatusState } from "./ollama-status-badge.js";
import { SummaryCard } from "./summary-card.js";
import "./styles.css";

installDevLinkAtlasApi();

type IngestState =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | {
      readonly kind: "accepted";
      readonly documentId: string;
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

const requiredGenerationModel = "gemma4:e4b-it-qat";

function App(): React.JSX.Element {
  const [versionState, setVersionState] = useState<AppVersionState>({ kind: "loading" });
  const [ollamaState, setOllamaState] = useState<OllamaStatusState>({ kind: "checking" });
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly SearchResultDto[]>([]);
  const [ingestState, setIngestState] = useState<IngestState>({ kind: "idle" });
  const [jobs, setJobs] = useState<readonly JobDto[]>([]);
  const [libraryDocuments, setLibraryDocuments] = useState<readonly LibraryDocumentDto[]>([]);
  const [topics, setTopics] = useState<readonly TopicDto[]>([]);
  const [relatedSourceId, setRelatedSourceId] = useState<string | null>(null);
  const [relatedDocuments, setRelatedDocuments] = useState<readonly RelatedDocumentDto[]>([]);
  const [view, setView] = useState(currentView());
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askCitations, setAskCitations] = useState<readonly AskCitationDto[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<AskCitationDto | null>(null);
  const [askStatus, setAskStatus] = useState("idle");
  const [activeAskRequestId, setActiveAskRequestId] = useState<string | null>(null);
  const [firstRunComplete, setFirstRunComplete] = useState(
    () => window.localStorage.getItem("linkatlas:first-run-complete") === "1",
  );
  const [diagnosticStatus, setDiagnosticStatus] = useState("idle");

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

  const refreshLibrary = useCallback(async (): Promise<void> => {
    const result = await window.linkAtlas.library.list();
    setLibraryDocuments(result.documents);
  }, []);

  useEffect(() => {
    void refreshJobs();
    void refreshLibrary();
  }, [refreshJobs, refreshLibrary]);

  const refreshTopics = useCallback(async (): Promise<void> => {
    const result = await window.linkAtlas.knowledge.listTopics();
    setTopics(result.topics);
  }, []);

  const refreshRelated = useCallback(async (documentId: string): Promise<void> => {
    const result = await window.linkAtlas.knowledge.listRelated({ documentId, limit: 5 });
    setRelatedSourceId(documentId);
    setRelatedDocuments(result.related);
  }, []);

  useEffect(() => {
    const updateView = (): void => {
      setView(currentView());
    };
    window.addEventListener("hashchange", updateView);
    return () => {
      window.removeEventListener("hashchange", updateView);
    };
  }, []);

  useEffect(() => {
    return window.linkAtlas.ask.onEvent((event) => {
      if (activeAskRequestId !== null && event.requestId !== activeAskRequestId) {
        return;
      }
      switch (event.type) {
        case "status":
          setAskStatus(event.message);
          break;
        case "token":
          setAskAnswer((current) => `${current}${event.text}`);
          break;
        case "done":
          setAskStatus("done");
          setAskAnswer(event.answer.answerMarkdown);
          setAskCitations(event.answer.citations);
          break;
        case "error":
          setAskStatus(event.message);
          break;
        default:
          assertNever(event);
      }
    });
  }, [activeAskRequestId]);

  useEffect(() => {
    if (view === "topics") {
      void refreshTopics();
    }
    if (view === "library") {
      void refreshLibrary();
    }
  }, [refreshLibrary, refreshTopics, view]);

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
        documentId: result.documentId,
        title: result.title,
        finalUrl: result.finalUrl,
        jobStatus: result.jobStatus,
        blockCount: result.blockCount,
        excerpt: result.excerpt,
        language: result.language,
        summary: result.summary,
      });
      await refreshJobs();
      await refreshLibrary();
      await refreshTopics();
      await refreshRelated(result.documentId);
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

  async function submitSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setSearchResults(await window.linkAtlas.search.query({ query: searchQuery, limit: 8 }));
  }

  async function pinRelatedDocument(targetDocumentId: string): Promise<void> {
    if (relatedSourceId === null) {
      return;
    }
    await window.linkAtlas.knowledge.pinRelation({
      sourceDocumentId: relatedSourceId,
      targetDocumentId,
    });
    await refreshRelated(relatedSourceId);
  }

  async function removeRelatedDocument(targetDocumentId: string): Promise<void> {
    if (relatedSourceId === null) {
      return;
    }
    await window.linkAtlas.knowledge.removeRelation({
      sourceDocumentId: relatedSourceId,
      targetDocumentId,
    });
    await refreshRelated(relatedSourceId);
  }

  async function submitAsk(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (askQuestion.trim().length === 0) {
      return;
    }
    setAskAnswer("");
    setAskCitations([]);
    setSelectedCitation(null);
    setAskStatus("starting");
    const result = await window.linkAtlas.ask.start({ limit: 8, question: askQuestion });
    if (result.ok && result.requestId !== undefined) {
      setActiveAskRequestId(result.requestId);
      return;
    }
    setAskStatus(result.message ?? "질문을 시작할 수 없습니다.");
  }

  async function runSampleDiagnostic(): Promise<void> {
    setDiagnosticStatus("checking");
    const health = await window.linkAtlas.models.health();
    setDiagnosticStatus(health.ok ? "ollama reachable" : health.message);
  }

  function completeFirstRun(): void {
    window.localStorage.setItem("linkatlas:first-run-complete", "1");
    setFirstRunComplete(true);
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
          <form className="search-entry" onSubmit={submitSearch}>
            <label>
              <span>Search</span>
              <input
                type="search"
                placeholder="저장된 자료 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
            </label>
          </form>
          <div className="model-status" data-testid="app-version">
            {renderVersion(versionState)}
          </div>
          <OllamaStatusBadge state={ollamaState} />
        </header>
        {view === "library" ? (
          <LibraryPanel documents={libraryDocuments} />
        ) : view === "topics" ? (
          <TopicPanel topics={topics} />
        ) : view === "ask" ? (
          <AskPanel
            answer={askAnswer}
            citations={askCitations}
            question={askQuestion}
            selectedCitation={selectedCitation}
            status={askStatus}
            onCitationSelect={setSelectedCitation}
            onQuestionChange={setAskQuestion}
            onSubmit={submitAsk}
          />
        ) : view === "settings" ? (
          <SettingsPanel
            diagnosticStatus={diagnosticStatus}
            firstRunComplete={firstRunComplete}
            ollamaState={ollamaState}
            onCompleteFirstRun={completeFirstRun}
            onRunDiagnostic={runSampleDiagnostic}
          />
        ) : (
          <section className="inbox-panel">
            <p className="eyebrow">Local-first knowledge base</p>
            <h2 id="workspace-title">Inbox</h2>
            <p>URL을 저장하면 정제된 본문 블록이 로컬 Vault에 추가됩니다.</p>
            <p
              className={
                ingestState.kind === "rejected" ? "ingest-message error" : "ingest-message"
              }
            >
              {renderIngestState(ingestState)}
            </p>
            {ingestState.kind === "accepted" ? <LibraryCard state={ingestState} /> : null}
            {ingestState.kind === "accepted" && ingestState.summary !== null ? (
              <SummaryCard summary={ingestState.summary} />
            ) : null}
            <RelatedPanel
              relatedDocuments={relatedDocuments}
              onPin={pinRelatedDocument}
              onRemove={removeRelatedDocument}
            />
            {searchResults.length > 0 ? (
              <section className="search-results" aria-label="Search results">
                <p className="eyebrow">Search results</p>
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.chunkId}>
                      <strong>{result.headingPath.join(" > ") || result.documentId}</strong>
                      <span>{result.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <JobList jobs={jobs} onCancel={cancelJob} onRetry={retryJob} />
          </section>
        )}
      </section>
    </main>
  );
}

function SettingsPanel(input: {
  readonly diagnosticStatus: string;
  readonly firstRunComplete: boolean;
  readonly ollamaState: OllamaStatusState;
  readonly onCompleteFirstRun: () => void;
  readonly onRunDiagnostic: () => Promise<void>;
}): React.JSX.Element {
  const memory = (navigator as Navigator & { readonly deviceMemory?: number }).deviceMemory;
  return (
    <section className="inbox-panel">
      <p className="eyebrow">First run</p>
      <h2 id="workspace-title">Settings</h2>
      <div className="setup-panel">
        <dl>
          <div className="setup-row">
            <dt>Ollama</dt>
            <dd>{ollamaStatusText(input.ollamaState)}</dd>
          </div>
          <div className="setup-row">
            <dt>Memory</dt>
            <dd>{memory === undefined ? "unknown" : `${memory}GB`}</dd>
          </div>
          <div className="setup-row">
            <dt>Generation</dt>
            <dd>gemma4:e4b-it-qat</dd>
          </div>
          <div className="setup-row">
            <dt>Embedding</dt>
            <dd>embeddinggemma:300m-qat-q8_0</dd>
          </div>
        </dl>
        <div className="pull-progress">
          <span>Model pull</span>
          <progress value={input.firstRunComplete ? 1 : 0} max={1} />
        </div>
        <div className="settings-actions">
          <button type="button" onClick={() => void input.onRunDiagnostic()}>
            Sample URL 진단
          </button>
          <button type="button" onClick={input.onCompleteFirstRun}>
            완료
          </button>
        </div>
        <p>{input.diagnosticStatus}</p>
      </div>
    </section>
  );
}

function ollamaStatusText(state: OllamaStatusState): string {
  switch (state.kind) {
    case "checking":
      return "checking";
    case "ready":
      return `${state.modelCount} models`;
    case "missing":
      return `missing ${state.model}`;
    case "unavailable":
    case "failed":
      return state.message;
    default:
      return assertNever(state);
  }
}

function TopicPanel(input: { readonly topics: readonly TopicDto[] }): React.JSX.Element {
  return (
    <section className="inbox-panel">
      <p className="eyebrow">Topic map</p>
      <h2 id="workspace-title">Topics</h2>
      <p>분석된 문서에서 안정화된 주제만 병합해 보여줍니다.</p>
      <div className="topic-grid">
        {input.topics.map((topic) => (
          <article className="topic-card" key={topic.id}>
            <div>
              <h3>{topic.label}</h3>
              <span>{topic.documentCount} docs</span>
            </div>
            {topic.description !== null && topic.description.length > 0 ? (
              <p>{topic.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RelatedPanel(input: {
  readonly relatedDocuments: readonly RelatedDocumentDto[];
  readonly onPin: (targetDocumentId: string) => Promise<void>;
  readonly onRemove: (targetDocumentId: string) => Promise<void>;
}): React.JSX.Element | null {
  if (input.relatedDocuments.length === 0) {
    return null;
  }
  return (
    <section className="related-panel" aria-label="Related documents">
      <p className="eyebrow">Related</p>
      <ul>
        {input.relatedDocuments.map((document) => (
          <li key={document.documentId}>
            <div>
              <strong>{document.title}</strong>
              <span>{document.reason}</span>
              <small>
                score {document.score.toFixed(2)}
                {document.sharedTopics.length > 0 ? ` · ${document.sharedTopics.join(", ")}` : ""}
              </small>
            </div>
            <div className="relation-actions">
              <button type="button" onClick={() => void input.onPin(document.documentId)}>
                {document.isPinned ? "Pinned" : "Pin"}
              </button>
              <button type="button" onClick={() => void input.onRemove(document.documentId)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AskPanel(input: {
  readonly answer: string;
  readonly citations: readonly AskCitationDto[];
  readonly question: string;
  readonly selectedCitation: AskCitationDto | null;
  readonly status: string;
  readonly onCitationSelect: (citation: AskCitationDto) => void;
  readonly onQuestionChange: (value: string) => void;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}): React.JSX.Element {
  return (
    <section className="inbox-panel">
      <p className="eyebrow">Evidence QA</p>
      <h2 id="workspace-title">Ask</h2>
      <form className="ask-entry" onSubmit={input.onSubmit}>
        <label>
          <span>Question</span>
          <textarea
            placeholder="저장된 자료에 근거해 질문"
            value={input.question}
            onChange={(event) => input.onQuestionChange(event.currentTarget.value)}
          />
        </label>
        <button type="submit" disabled={input.question.trim().length === 0}>
          Ask
        </button>
      </form>
      <section className="ask-answer" aria-label="Ask answer">
        <p className="eyebrow">{input.status}</p>
        <p>
          {input.answer.length > 0
            ? input.answer
            : "질문을 입력하면 근거가 있는 답변을 생성합니다."}
        </p>
        {input.citations.length > 0 ? (
          <ul className="citation-list">
            {input.citations.map((citation) => (
              <li key={citation.citationId}>
                <button type="button" onClick={() => input.onCitationSelect(citation)}>
                  {citation.citationId}
                </button>
                <span>{citation.claim}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {input.selectedCitation !== null ? (
          <article className="source-preview" aria-label="Source block preview">
            <strong>{input.selectedCitation.blockIds.join(", ")}</strong>
            <span>{input.selectedCitation.previewText ?? input.selectedCitation.claim}</span>
          </article>
        ) : null}
      </section>
    </section>
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

function currentView(): "ask" | "inbox" | "library" | "settings" | "topics" {
  if (window.location.hash === "#library") {
    return "library";
  }
  if (window.location.hash === "#topics") {
    return "topics";
  }
  if (window.location.hash === "#ask") {
    return "ask";
  }
  if (window.location.hash === "#settings") {
    return "settings";
  }
  return "inbox";
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
