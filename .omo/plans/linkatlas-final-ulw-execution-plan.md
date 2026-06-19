# LinkAtlas Final ULW Execution Plan

## TL;DR
> Summary:      Complete LinkAtlas from current `main` through `docs/CODEX_EXECUTION_PLAN.md` Task 03-11 under one ULW aggregate, preserving completed commits through `efb162e` and reconciling the current uncommitted Task 03 extraction draft without treating it as already shipped.
> Deliverables:
> - Full fixture-backed article extraction, durable queue, Ollama-compatible providers, structured analysis, embeddings/search, topics/entities/relations, grounded Ask, browser extension share flow, richer UI states, export/backup/restore, macOS packaging/update checks, and final hardening.
> - Evidence under `.omo/evidence/task-<N>-<slug>.*` plus aggregate ULW evidence under `.omo/ulw-loop/evidence/final-C001-happy-path.txt`, `.omo/ulw-loop/evidence/final-C002-security-boundaries.txt`, and `.omo/ulw-loop/evidence/final-C003-regression-release.txt`.
> - One aggregate remains active until Task 11 and final quality gate F1-F4 pass.
> Effort:       XL
> Risk:         High - the remaining work crosses storage migrations, Electron IPC/security, LLM/runtime adapters, vector indexing, extension native messaging, and release packaging.

## Scope
### Must have
- Preserve completed commits/tasks already on `main`: Task 00 docs moved (`623cbd1`), Task 01 bootstrap workspace/Electron shell/contracts/domain (`8e335f3`), Task 02 SQLite storage/migrations/repository (`0ae7af3`), and initial Task 03 safe URL fetch/IPC/renderer URL form (`efb162e`). Do not rewrite, squash, revert, or redefine these commits as incomplete.
- Treat current dirty Task 03 extraction files as draft work to preserve and reconcile, not as committed completion: `packages/ingestion/package.json`, `packages/ingestion/src/index.ts`, `packages/ingestion/src/extract-article.ts`, `packages/ingestion/src/extract-article.test.ts`, `packages/test-fixtures/html/*`, `apps/desktop/package.json`, and `pnpm-lock.yaml`.
- Complete `docs/CODEX_EXECUTION_PLAN.md` Task 03-11 as one ULW aggregate:
  - Task 03: Readability/JSDOM extraction, sanitization, stable schema-compatible block IDs, fixture coverage, DB persistence, Library card.
  - Task 04: durable DB job queue with leases, progress, recovery, cancel, retry, idempotency, fetch/extract/store pipeline.
  - Task 05: `packages/llm` Ollama generation/embedding providers, health/model list, structured generation, streaming, batch embeddings, mock transport, redacted logs.
  - Task 06: schema-driven structured analysis with prompts, chunk summary to document reduce, Zod validation, evidence validation, one correction retry, summary UI, version metadata, user-edit protection.
  - Task 07: heading-aware chunking, FTS5, vector adapter/versioning/rebuild, hybrid BM25/vector RRF search, Korean/English fixture queries, filters.
  - Task 08: topic normalization, entity merge, relation scoring, top related documents, explainable reasons, pin/remove overrides.
  - Task 09: Ask pipeline with intent classification, query expansion, context diversity, streaming structured answer, citation validation, unsupported-question handling, citation-to-block navigation.
  - Task 10: Manifest V3 Chrome/Edge extension, current page and selection save, Native Messaging, app-not-running/duplicate states, shared contracts.
  - Task 11: Markdown/JSONL export, ZIP backup/restore, first-run wizard, Ollama/model diagnostics, restore index validation/rebuild, macOS `.app`/`.dmg`, update-check readiness.
- Keep AGENTS boundaries: renderer has no direct filesystem, SQLite, network, shell, or Ollama access; renderer only uses typed preload allowlist APIs; domain imports no Electron/SQLite/Ollama implementations; prompts live in versioned files; external HTML is untrusted; tests use fixtures/mocks, not public internet.
- Extend storage only through new forward migrations. Do not edit existing migration `0001_initial` in `packages/storage/src/migrations.ts:8`.
- Use TypeScript strict mode, Zod at IPC/extension boundaries, stable `errorCode` plus separate user messages, injected time/UUID/network/model dependencies in tests, and no `any`.
- Commit each task as an atomic Conventional Commit. Because the ULW brief requested Korean commit messages, use Korean imperative subjects while preserving Conventional Commit format, for example `feat(ingestion): Readability 본문 추출을 완료하다`.
- Final gate must execute exactly: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and `pnpm test:e2e` because UI/Electron/browser-extension behavior changes.
- Final answer from the executor must not mark ULW/Codex complete until Task 11 plus F1-F4 pass and the user explicitly accepts the surfaced final verification results.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not implement cloud sync, login/collaboration, mobile apps, internet crawler behavior, autonomous agent runtime loops, model fine-tuning, paid-wall/DRM bypass, or Codex/runtime agent dependencies inside the shipped app.
- Do not expose generic preload APIs such as `execute`, `readFile`, `writeFile`, `querySql`, raw `ipcRenderer`, raw SQL, shell, or arbitrary file path operations to renderer.
- Do not load external pages in a privileged BrowserWindow. External links must be validated before `shell.openExternal`.
- Do not let extension-supplied extraction bypass main-process validation/sanitization/persistence rules.
- Do not run tests against public internet. "Sample URL diagnostic" must use a local fixture HTTP server in automated tests; any optional public/manual diagnostic must be non-CI and separately labeled.
- Do not compare all document pairs for relations. Candidate sets only: vector top 30, topic-overlap top 20, entity-overlap top 20, union, then top 5-10 displayed.
- Do not rely on sqlite-vec until extension loading and packaged-app compatibility are proven; provide a deterministic exact-vector fallback for tests if native loading fails.
- Do not automatically overwrite user-edited summaries/tags/entities/relations with model output.
- Do not scatter prompt strings in TypeScript implementation modules; update prompts by versioned files under `packages/prompts/.../vN/`.
- Do not mark any task complete from self-report only. Every task must capture executable evidence at the stated path.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Vitest unit/integration tests, Playwright Electron E2E, fixture HTTP servers, mock Ollama/native messaging transports, packaging smoke commands.
- QA policy: every task has agent-executed scenarios. UI/Electron/extension-facing behavior uses Playwright against the built Electron app or a real Chrome/Chromium extension context; CLI/data behavior uses bash commands with captured output.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`
- Final aggregate evidence:
  - Happy path: `.omo/ulw-loop/evidence/final-C001-happy-path.txt`
  - Security/malformed path: `.omo/ulw-loop/evidence/final-C002-security-boundaries.txt`
  - Regression/release path: `.omo/ulw-loop/evidence/final-C003-regression-release.txt`
- Required final commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration`
  - `pnpm test:e2e`
- Verification must also include:
  - `git status --short --branch`
  - `git log --oneline -12`
  - Migration audit proving existing migrations were not edited and new migrations apply from empty DB.
  - Dependency review evidence for every added dependency: maintenance, license, Electron packaging compatibility, native binary status, adapter boundary.

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (no dependencies):
- Task 1: Baseline, dirty-worktree intake, and dependency/risk ledger
- Task 2: Contracts/domain foundations for remaining app surfaces
- Task 3: Fixture and mock harness foundations
- Task 4: Storage migration and repository foundations
- Task 5: Desktop service/IPC foundation and renderer navigation/state shell

Wave 2 (after Wave 1):
- Task 6: Complete article extraction and Library persistence, depends [1, 2, 3, 4, 5]
- Task 7: Durable queue and queued ingest pipeline, depends [2, 4, 5, 6]
- Task 8: Ollama provider package and redacted model runtime, depends [2, 3]
- Task 9: Model/settings UI and blocked-runtime states, depends [5, 8]
- Task 10: Structured document analysis pipeline and Summary UI, depends [2, 3, 4, 6, 7, 8, 9]

Wave 3 (after Wave 2):
- Task 11: Chunking and FTS5 indexing, depends [4, 6, 7, 10]
- Task 12: Vector index adapter, embedding pipeline, and rebuild, depends [8, 11]
- Task 13: Hybrid search service and UI filters, depends [5, 11, 12]
- Task 14: Topic/entity normalization and edit/merge UI, depends [10, 11, 12, 13]
- Task 15: Related document scoring and override UI, depends [12, 14]

Wave 4 (after Wave 3):
- Task 16: Ask retrieval, context composer, and chat persistence, depends [10, 13, 15]
- Task 17: Streaming RAG answer validation and citation UI, depends [8, 16]
- Task 18: Browser extension contracts and MV3 extraction, depends [2, 3, 6]
- Task 19: Native Messaging host and desktop share enqueue flow, depends [7, 18]
- Task 20: Rich UI states, network log, and recovery polish, depends [7, 9, 13, 15, 17, 19]

Wave 5 (after Wave 4):
- Task 21: Export, JSONL, ZIP backup/restore, and restore rebuild, depends [4, 11, 12, 14, 15, 17]
- Task 22: First-run wizard, hardware/model diagnostics, and fixture sample diagnostic, depends [8, 9, 21]
- Task 23: macOS packaging, Native Messaging registration assets, and update-check readiness, depends [19, 21, 22]
- Task 24: Final release hardening and aggregate evidence, depends [1-23]

Critical path: Task 1 -> Task 2 -> Task 4 -> Task 6 -> Task 7 -> Task 10 -> Task 11 -> Task 12 -> Task 13 -> Task 16 -> Task 17 -> Task 21 -> Task 22 -> Task 23 -> Task 24

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1 | none | 6, 24 | 2, 3, 4, 5 |
| 2 | none | 4, 5, 6, 7, 8, 10, 18 | 1, 3 |
| 3 | none | 6, 8, 10, 18 | 1, 2, 4, 5 |
| 4 | 2 | 6, 7, 10, 11, 21 | 5 |
| 5 | 2 | 6, 7, 9, 13, 20 | 4 |
| 6 | 1, 2, 3, 4, 5 | 7, 10, 11, 18 | 8, 9 |
| 7 | 2, 4, 5, 6 | 10, 11, 19, 20 | 8, 9 |
| 8 | 2, 3 | 9, 10, 12, 17, 22 | 6, 7 |
| 9 | 5, 8 | 10, 20, 22 | 6, 7 |
| 10 | 2, 3, 4, 6, 7, 8, 9 | 11, 14, 16 | none |
| 11 | 4, 6, 7, 10 | 12, 13, 21 | 14 after 12 |
| 12 | 8, 11 | 13, 14, 15, 21 | none |
| 13 | 5, 11, 12 | 14, 16, 20 | 15 after 14 |
| 14 | 10, 11, 12, 13 | 15, 21 | none |
| 15 | 12, 14 | 16, 20, 21 | none |
| 16 | 10, 13, 15 | 17, 21 | 18 |
| 17 | 8, 16 | 20, 21 | 18, 19 |
| 18 | 2, 3, 6 | 19 | 16, 17 |
| 19 | 7, 18 | 20, 23 | 17 |
| 20 | 7, 9, 13, 15, 17, 19 | 24 | none |
| 21 | 4, 11, 12, 14, 15, 17 | 22, 23, 24 | none |
| 22 | 8, 9, 21 | 23, 24 | none |
| 23 | 19, 21, 22 | 24 | none |
| 24 | 1-23 | Final verification | none |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Baseline, dirty-worktree intake, and dependency/risk ledger

  What to do: Record the starting baseline, explicitly preserving committed Tasks 00-02 and initial Task 03 safe URL fetch at `efb162e`. Inspect and preserve the current dirty Task 03 draft files without reverting them. Create an execution ledger entry under `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/ledger.jsonl` noting that the aggregate remains `in_progress`. Create `.omo/evidence/dependency-review-template.md` for future tasks. Confirm every new dependency must document maintenance, license, Electron packaging compatibility, native binary status, and adapter boundary. If execution starts in a clean worktree where the dirty extraction draft is absent, recreate the Task 03 extraction work from the references in this plan instead of asking the user.
  Must NOT do: Do not commit, discard, or overwrite dirty user changes without incorporating them. Do not mark ULW complete. Do not edit production code in this bookkeeping task except generated `.omo/evidence` records if needed.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 24] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:7` - Task 00 completed baseline.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:39` - Task 01 completed baseline.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:69` - Task 02 completed baseline.
  - Pattern:  `apps/desktop/src/main/ingest-ipc.ts:12` - current URL ingest IPC slice from `efb162e`.
  - Pattern:  `packages/ingestion/src/fetch-html.ts:19` - current safe fetch implementation.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/brief.md:1` - aggregate must not complete before Task 11/final gate.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:17` - happy-path aggregate criterion.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:26` - security/malformed aggregate criterion.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:35` - regression/release criterion.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - existing E2E baseline that must remain green.

  Acceptance criteria (agent-executable only):
  - [ ] `git log --oneline -4 | tee .omo/evidence/task-1-baseline-log.txt` includes `efb162e URL 입력과 안전 fetch 흐름 추가`, `0ae7af3 SQLite 저장소와 마이그레이션 추가`, `8e335f3 LinkAtlas 부트스트랩 워크스페이스 추가`, and `623cbd1 문서를 docs로 이동하고 실행 계획 정리`.
  - [ ] `git status --short --branch | tee .omo/evidence/task-1-dirty-status.txt` captures all current dirty paths before implementation and no dirty path is removed by this task.
  - [ ] `test -f .omo/plans/linkatlas-final-ulw-execution-plan.md && test -f .omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: committed baseline is preserved
    Tool:     bash
    Steps:    git log --oneline -4 | tee .omo/evidence/task-1-baseline-log.txt
    Expected: output contains efb162e, 0ae7af3, 8e335f3, and 623cbd1 in that order from newest to oldest.
    Evidence: .omo/evidence/task-1-baseline-log.txt

  Scenario: dirty Task 03 draft is visible and preserved
    Tool:     bash
    Steps:    git status --short --branch | tee .omo/evidence/task-1-dirty-status.txt
    Expected: output includes current branch main and any existing modified/untracked Task 03 draft files; no file is deleted by this task.
    Evidence: .omo/evidence/task-1-dirty-status.txt
  ```

  Commit: NO | Message: `chore(ulw): 실행 기준선을 기록하다` | Files: [`.omo/evidence/task-1-baseline-log.txt`, `.omo/evidence/task-1-dirty-status.txt`]

- [ ] 2. Contracts/domain foundations for remaining app surfaces

  What to do: Expand `packages/contracts` and `packages/domain` with typed DTOs/domain interfaces for documents, jobs, models, analysis, chunks, search, topics, entities, relations, Ask/chat streams, browser extension messages, export/backup/restore, settings, and stable errors. Update the existing provider interfaces so Task 05 can expose structured generation, streaming chat, batch embeddings, cancellation, and model-missing errors without leaking Ollama HTTP shapes. Update `ContentBlock`/schema alignment so evidence block IDs are schema-compatible `b0001` style, or update `schemas/document-analysis.schema.json` and prompts consistently if choosing a different stable format. Keep domain pure.
  Must NOT do: Do not import Electron, SQLite, Ollama, Node filesystem, shell, or HTTP implementation modules into `packages/domain`. Do not expose raw IPC channel strings to renderer code beyond typed preload APIs.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [4, 5, 6, 7, 8, 10, 18] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/contracts/src/ingest-url.ts:5` - current Zod DTO pattern and parse helpers.
  - Pattern:  `packages/contracts/src/errors.ts:1` - current contract parse error pattern.
  - Pattern:  `packages/domain/src/documents.ts:12` - current document/version/block domain shapes.
  - Pattern:  `packages/domain/src/jobs.ts:4` - existing but too-thin job status model.
  - Pattern:  `packages/domain/src/providers.ts:22` - existing provider interfaces to extend.
  - Pattern:  `packages/domain/src/vector-index.ts:23` - existing `VectorIndex` boundary.
  - Pattern:  `apps/desktop/src/shared/link-atlas-api.ts:7` - current typed preload API surface.
  - API/Type: `schemas/document-analysis.schema.json:76` - schema currently expects evidence IDs matching `^b[0-9]{4,}$`.
  - Test:     `tests/boundaries/architecture-boundaries.test.ts:46` - domain boundary test.
  - External: `https://docs.ollama.com/api/generate` - generation API includes streaming and response fields.
  - External: `https://docs.ollama.com/api/embed` - embeddings API accepts string or string array.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/contracts test | tee .omo/evidence/task-2-contracts-test.txt` passes.
  - [ ] `pnpm --filter @linkatlas/domain test | tee .omo/evidence/task-2-domain-test.txt` passes.
  - [ ] `pnpm test -- tests/boundaries/architecture-boundaries.test.ts | tee .omo/evidence/task-2-boundaries.txt` passes and proves domain remains implementation-independent.
  - [ ] `pnpm typecheck | tee .omo/evidence/task-2-typecheck.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: contracts reject malformed IPC/extension inputs
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/contracts test | tee .omo/evidence/task-2-contracts-test.txt
    Expected: contract tests include malformed document/job/model/search/chat/extension/export payloads and pass with stable parse errors.
    Evidence: .omo/evidence/task-2-contracts-test.txt

  Scenario: domain boundary stays pure
    Tool:     bash
    Steps:    pnpm test -- tests/boundaries/architecture-boundaries.test.ts | tee .omo/evidence/task-2-boundaries.txt
    Expected: no domain source imports Electron, SQLite, Ollama, Node filesystem, or shell modules.
    Evidence: .omo/evidence/task-2-boundaries.txt
  ```

  Commit: YES | Message: `feat(contracts): 남은 앱 계약과 도메인 경계를 정의하다` | Files: [`packages/contracts/src/**`, `packages/domain/src/**`, `schemas/document-analysis.schema.json`, `tests/boundaries/architecture-boundaries.test.ts`]

- [ ] 3. Fixture and mock harness foundations

  What to do: Populate `packages/test-fixtures` with deterministic HTML, Markdown, prompt-injection, mock Ollama generation/embedding/chat responses, native messaging payloads, search/query fixtures, backup/export fixtures, and local fixture HTTP server helpers. Promote any existing untracked `packages/test-fixtures/html/*` draft files into the committed fixture package after review. Add package exports only for test code if needed. Keep fixtures local and free of private user data.
  Must NOT do: Do not fetch public internet in tests. Do not make production code depend on fixture packages. Do not store real user document contents.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 8, 10, 18] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/test-fixtures/README.md:7` - fixture package responsibility.
  - Pattern:  `packages/test-fixtures/README.md:11` - required fixture categories.
  - Pattern:  `packages/ingestion/src/safe-fetch.test.ts:16` - current inline local HTTP fixture server pattern.
  - Pattern:  `docs/DESIGN.md:1375` - required fixed webpage fixture categories.
  - Pattern:  `docs/DESIGN.md:1421` - quality targets for retrieval/citation/schema.
  - Test:     `tests/integration/bootstrap.test.ts:3` - integration harness placeholder to expand.

  Acceptance criteria (agent-executable only):
  - [ ] `find packages/test-fixtures -type f | sort | tee .omo/evidence/task-3-fixture-list.txt` lists HTML, prompt-injection, Ollama, search, native messaging, and export fixtures.
  - [ ] `pnpm test -- tests/integration packages/ingestion/src | tee .omo/evidence/task-3-fixture-tests.txt` passes without public network access.
  - [ ] `rg -n "https?://(?!127\\.0\\.0\\.1|localhost|example\\.com|linkatlas\\.local)" packages tests | tee .omo/evidence/task-3-network-scan.txt` returns no public-test URL usages requiring live internet.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: fixture inventory covers remaining tasks
    Tool:     bash
    Steps:    find packages/test-fixtures -type f | sort | tee .omo/evidence/task-3-fixture-list.txt
    Expected: output includes HTML fixtures, prompt-injection fixtures, mock Ollama responses, native messaging payloads, search fixtures, and export/backup fixtures.
    Evidence: .omo/evidence/task-3-fixture-list.txt

  Scenario: test suite stays local-only
    Tool:     bash
    Steps:    rg -n "https?://(?!127\\.0\\.0\\.1|localhost|example\\.com|linkatlas\\.local)" packages tests | tee .omo/evidence/task-3-network-scan.txt
    Expected: output has no test code requiring public internet; docs-only or literal fixture URLs are either absent or explicitly marked safe.
    Evidence: .omo/evidence/task-3-network-scan.txt
  ```

  Commit: YES | Message: `test(fixtures): 로컬 전용 검증 자산을 확장하다` | Files: [`packages/test-fixtures/**`, `tests/integration/**`, `packages/ingestion/src/**/*.test.ts`]

- [ ] 4. Storage migration and repository foundations

  What to do: Add forward-only migrations and repositories for jobs, chunks, summaries, topics, document_topics, entities, mentions, claims, document_relations, vector index versions, embeddings metadata, FTS5 tables, chat sessions/messages/citations, network logs, model settings, export manifests, and backup restore metadata. Preserve existing `0001_initial` untouched. Add repository tests for idempotent migrations, empty DB setup, rollback, and core CRUD.
  Must NOT do: Do not edit an existing migration after it has shipped. Do not add raw SQL access to renderer or contracts. Do not expose storage implementation details from domain.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 7, 10, 11, 21] | Blocked by: [2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/storage/src/migrations.ts:6` - migration list shape.
  - Pattern:  `packages/storage/src/migrate.ts:13` - migration runner transaction pattern.
  - Pattern:  `packages/storage/src/connection.ts:14` - WAL and foreign key setup.
  - Pattern:  `packages/storage/src/document-repository.ts:67` - current repository construction pattern.
  - Pattern:  `docs/DESIGN.md:817` - table model draft starts here.
  - Pattern:  `docs/DESIGN.md:991` - jobs table draft.
  - Pattern:  `docs/DESIGN.md:1012` - FTS5 design.
  - Test:     `packages/storage/src/storage.integration.test.ts:24` - migration/repository integration style.
  - External: `https://sqlite.org/fts5.html` - FTS5 virtual table syntax and constraints.

  Acceptance criteria (agent-executable only):
  - [ ] `git diff --exit-code HEAD -- packages/storage/src/migrations.ts || true` shows new migration entries but no modification to the SQL text of `0001_initial`; capture with `git diff HEAD -- packages/storage/src/migrations.ts | tee .omo/evidence/task-4-migration-diff.txt`.
  - [ ] `pnpm --filter @linkatlas/storage test | tee .omo/evidence/task-4-storage-test.txt` passes.
  - [ ] `pnpm test:integration | tee .omo/evidence/task-4-integration.txt` passes migration integration from empty DB.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: empty vault migrates with all required tables
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/storage test | tee .omo/evidence/task-4-storage-test.txt
    Expected: tests create an empty temporary DB, apply all migrations twice, verify WAL/foreign keys, and assert required tables/FTS objects exist.
    Evidence: .omo/evidence/task-4-storage-test.txt

  Scenario: existing migration remains unchanged
    Tool:     bash
    Steps:    git diff HEAD -- packages/storage/src/migrations.ts | tee .omo/evidence/task-4-migration-diff.txt
    Expected: diff adds new forward migrations only; `0001_initial` SQL is not edited.
    Evidence: .omo/evidence/task-4-migration-diff.txt
  ```

  Commit: YES | Message: `feat(storage): 확장 스키마와 저장소 기반을 추가하다` | Files: [`packages/storage/src/**`, `packages/storage/package.json`, `pnpm-lock.yaml`, `tests/integration/**`]

- [ ] 5. Desktop service/IPC foundation and renderer navigation/state shell

  What to do: Expand the main/preload/shared API shell to typed allowlist methods for jobs, documents, search, chat, models, settings, extension ingest, export/backup, and network logs. Add IPC sender validation for all privileged calls. Build a renderer navigation/state skeleton for Inbox, Library, Document Detail, Topics, Related, Ask, Settings, First Run, Export/Restore with loading/empty/error/success states but no fake data. Keep renderer data access through `window.linkAtlas` only. Add boundary tests and E2E skeleton checks.
  Must NOT do: Do not expose raw `ipcRenderer`, generic methods, SQL, files, shell, or arbitrary external URL opening to renderer. Do not implement full feature behavior here; downstream feature tasks fill handlers.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [6, 7, 9, 13, 20] | Blocked by: [2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `apps/desktop/src/shared/link-atlas-api.ts:3` - current channel registry pattern.
  - Pattern:  `apps/desktop/src/preload/preload.cts:5` - current contextBridge API exposure.
  - Pattern:  `apps/desktop/src/main/ingest-ipc.ts:12` - current IPC registration pattern.
  - Pattern:  `apps/desktop/src/main/security.ts:3` - secure BrowserWindow settings.
  - Pattern:  `apps/desktop/src/renderer/main.tsx:59` - current shell layout.
  - Pattern:  `docs/DESIGN.md:1045` - intended IPC contract shape.
  - Pattern:  `docs/DESIGN.md:1131` - screen design.
  - Test:     `apps/desktop/src/preload/preload.test.ts:5` - preload surface test to update.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - Electron Playwright smoke style.
  - External: `https://www.electronjs.org/docs/latest/tutorial/security` - IPC sender validation and renderer isolation recommendations.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/desktop test | tee .omo/evidence/task-5-desktop-test.txt` passes and includes IPC sender validation/preload allowlist tests.
  - [ ] `pnpm test -- tests/boundaries/architecture-boundaries.test.ts | tee .omo/evidence/task-5-boundaries.txt` passes.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "desktop shell" | tee .omo/evidence/task-5-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: typed renderer shell exposes expected states
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "desktop shell" | tee .omo/evidence/task-5-e2e.txt
    Expected: Electron app renders navigation for Inbox, Library, Topics, Ask, Settings, no Node globals exist, and no generic preload APIs are visible.
    Evidence: .omo/evidence/task-5-e2e.txt

  Scenario: malicious IPC sender is rejected
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/desktop test | tee .omo/evidence/task-5-desktop-test.txt
    Expected: desktop tests include a forged sender/origin case and assert stable rejection without privileged action.
    Evidence: .omo/evidence/task-5-desktop-test.txt
  ```

  Commit: YES | Message: `feat(desktop): 타입 안전 IPC와 화면 상태 기반을 넓히다` | Files: [`apps/desktop/src/main/**`, `apps/desktop/src/preload/**`, `apps/desktop/src/shared/**`, `apps/desktop/src/renderer/**`, `tests/e2e/**`, `tests/boundaries/**`]

- [ ] 6. Complete article extraction and Library persistence

  What to do: Finish Task 03 end-to-end. Reconcile the current uncommitted `extract-article` draft with committed source. Use JSDOM and Mozilla Readability with scripts/resources disabled, sanitize untrusted HTML, preserve metadata, Markdown, normalized HTML, stable schema-compatible block IDs, content hash, code/table blocks, and hostile prompt text as inert content. Store extracted document/version/block data through storage repositories. Add document list/detail contracts and render Library/Inbox cards from actual persisted data. Ensure app restart preserves the card.
  Must NOT do: Do not keep `block_${hash}` IDs if `schemas/document-analysis.schema.json` still requires `b0001` IDs. Do not render unsanitized HTML. Do not use public internet tests.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [7, 10, 11, 18] | Blocked by: [1, 2, 3, 4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/ingestion/src/extract-article.ts:65` - current dirty draft extraction entry point, if present.
  - Pattern:  `packages/ingestion/src/extract-article.test.ts:12` - current dirty draft fixture tests, if present.
  - Pattern:  `packages/ingestion/src/fetch-html.ts:19` - safe HTML fetch to feed extraction.
  - Pattern:  `packages/storage/src/document-repository.ts:67` - current snapshot persistence pattern.
  - Pattern:  `apps/desktop/src/renderer/main.tsx:46` - current URL submit flow to replace with persisted job/document state.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:99` - Task 03 requirements.
  - Pattern:  `docs/DESIGN.md:473` - extraction priorities and stored fields.
  - Pattern:  `docs/DESIGN.md:500` - normalization and stable block ID requirements.
  - Test:     `packages/ingestion/src/safe-fetch.test.ts:81` - fixture-friendly testing style.
  - External: `https://github.com/mozilla/readability` - Readability requires DOM, page URL, and sanitizer for untrusted output.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/ingestion test | tee .omo/evidence/task-6-ingestion-test.txt` passes with 5+ fixtures including Korean, English, code, table, prompt injection.
  - [ ] `pnpm --filter @linkatlas/storage test | tee .omo/evidence/task-6-storage-test.txt` passes and includes extracted article persistence.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "Library card persists" | tee .omo/evidence/task-6-e2e.txt` passes.
  - [ ] `rg -n "block_[a-f0-9]" packages schemas apps | tee .omo/evidence/task-6-block-id-scan.txt` returns no production/schema mismatch if schema remains `b0001`.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: fixture article is extracted, stored, and shown after restart
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "Library card persists" | tee .omo/evidence/task-6-e2e.txt
    Expected: local fixture URL is added, sanitized article card appears in Library with title/domain/status, Electron app restarts, and the card remains visible.
    Evidence: .omo/evidence/task-6-e2e.txt

  Scenario: hostile HTML is inert but retained as evidence text
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/ingestion test -- --run packages/ingestion/src/extract-article.test.ts | tee .omo/evidence/task-6-ingestion-test.txt
    Expected: tests assert scripts/event handlers/javascript URLs are removed while prompt-injection text remains as untrusted content blocks.
    Evidence: .omo/evidence/task-6-ingestion-test.txt
  ```

  Commit: YES | Message: `feat(ingestion): Readability 본문 추출을 완료하다` | Files: [`packages/ingestion/**`, `packages/test-fixtures/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/e2e/**`, `pnpm-lock.yaml`]

- [ ] 7. Durable queue and queued ingest pipeline

  What to do: Implement Task 04 durable DB job queue with statuses `QUEUED`, `RUNNING`, `BLOCKED`, `FAILED`, `COMPLETED`, `CANCELLED`, stage/progress, lease, attempts, idempotency key, error code/message, cancellation via `AbortSignal`, and restart recovery. Move fetch/extract/store from direct IPC handler into queue-backed services. Add UI for job progress, cancel, retry, duplicate enqueue prevention, blocked model/runtime later integration points.
  Must NOT do: Do not keep direct fetch/extract/store side effects in renderer-triggered IPC outside queue orchestration. Do not make background handlers non-idempotent.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [10, 11, 19, 20] | Blocked by: [2, 4, 5, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/jobs.ts:4` - existing status constants to extend.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:131` - Task 04 requirements.
  - Pattern:  `docs/DESIGN.md:425` - ingest/analysis pipeline stages.
  - Pattern:  `docs/DESIGN.md:1280` - queue executor and retry policy.
  - Pattern:  `apps/desktop/src/main/ingest-ipc.ts:33` - direct fetch code to move behind queue.
  - Test:     `packages/storage/src/storage.integration.test.ts:102` - transaction rollback pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/storage test | tee .omo/evidence/task-7-queue-storage-test.txt` passes queue repository tests for lease/restart/idempotency/cancel/retry.
  - [ ] `pnpm test:integration | tee .omo/evidence/task-7-integration.txt` passes queued fetch/extract/store tests using local fixture server.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "job queue" | tee .omo/evidence/task-7-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: queued ingest resumes after restart
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/job-queue.test.ts | tee .omo/evidence/task-7-integration.txt
    Expected: test creates a RUNNING job with expired lease, restarts queue service, resumes only the failed stage, and completes once.
    Evidence: .omo/evidence/task-7-integration.txt

  Scenario: duplicate URL enqueue is idempotent and cancellable
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "job queue" | tee .omo/evidence/task-7-e2e.txt
    Expected: submitting the same fixture URL twice shows one active job, cancel changes it to CANCELLED, retry creates/resumes one job with stable UI status.
    Evidence: .omo/evidence/task-7-e2e.txt
  ```

  Commit: YES | Message: `feat(queue): 수집 작업을 영속 큐로 이동하다` | Files: [`packages/domain/src/jobs.ts`, `packages/storage/src/**`, `apps/desktop/src/main/**`, `apps/desktop/src/preload/**`, `apps/desktop/src/shared/**`, `apps/desktop/src/renderer/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 8. Ollama provider package and redacted model runtime

  What to do: Add `packages/llm` with `OllamaGenerationProvider`, `OllamaEmbeddingProvider`, mock transport, health, model list, structured generation using JSON Schema, streaming chat, batch embeddings, timeout/cancel, model missing errors, model/options metadata, and redacted logging. Keep Ollama HTTP responses behind domain/provider interfaces. Tests must pass without real Ollama.
  Must NOT do: Do not log document body, full question, or full model output by default. Do not expose Ollama HTTP response objects to domain/UI. Do not require a local Ollama process for default tests.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [9, 10, 12, 17, 22] | Blocked by: [2, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/providers.ts:22` - provider interfaces to implement/extend.
  - Pattern:  `packages/prompts/README.md:3` - prompt version responsibility.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:160` - Task 05 requirements.
  - Pattern:  `docs/DESIGN.md:324` - Ollama gateway responsibilities.
  - Pattern:  `docs/DESIGN.md:402` - model replacement interface design.
  - Pattern:  `docs/DESIGN.md:747` - structured output rules.
  - External: `https://docs.ollama.com/api/generate` - `/api/generate` generation endpoint and streaming default.
  - External: `https://docs.ollama.com/api/chat` - chat endpoint.
  - External: `https://docs.ollama.com/api/embed` - `/api/embed` embeddings endpoint.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/llm test | tee .omo/evidence/task-8-llm-test.txt` passes with mock transport for health/models/structured/stream/embed/cancel/model-missing.
  - [ ] `pnpm typecheck | tee .omo/evidence/task-8-typecheck.txt` passes.
  - [ ] `rg -n "(document body|full prompt|model output|answerMarkdown)" packages/llm apps packages/storage | tee .omo/evidence/task-8-log-scan.txt` shows no default full-content logging implementation.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: mock Ollama structured and streaming calls work
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/llm test | tee .omo/evidence/task-8-llm-test.txt
    Expected: mock provider tests pass for health, model list, structured JSON Schema generation, streaming chat events, batch embeddings, cancellation, and model-missing errors.
    Evidence: .omo/evidence/task-8-llm-test.txt

  Scenario: provider logs are redacted
    Tool:     bash
    Steps:    rg -n "(console\\.log|logger\\.|document body|model output)" packages/llm apps/desktop/src/main | tee .omo/evidence/task-8-log-scan.txt
    Expected: any logging sites redact body/question/model output or are tests asserting redaction; no default full content logging exists.
    Evidence: .omo/evidence/task-8-log-scan.txt
  ```

  Commit: YES | Message: `feat(llm): Ollama 호환 모델 어댑터를 추가하다` | Files: [`packages/llm/**`, `packages/domain/src/providers.ts`, `packages/contracts/src/**`, `packages/test-fixtures/**`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`, `pnpm-lock.yaml`]

- [ ] 9. Model/settings UI and blocked-runtime states

  What to do: Wire model health/list/settings IPC and renderer Settings/Topbar model state to `packages/llm`. Show Ollama unavailable, model missing, selected generation/embedding model, provider timeout/cancel, and blocked job states without leaking prompt/body content. Store settings locally through storage. Keep model pull progress contract ready for Task 22; if actual pull is deferred, expose disabled/diagnostic state with stable reason.
  Must NOT do: Do not hard-require real Ollama in tests. Do not auto-download models in this task. Do not mix generation and embedding models.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [10, 20, 22] | Blocked by: [5, 8]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `apps/desktop/src/renderer/main.tsx:93` - current model/status chip location.
  - Pattern:  `docs/DESIGN.md:1206` - Settings screen requirements.
  - Pattern:  `docs/DESIGN.md:217` - model independence requirement.
  - Pattern:  `docs/DESIGN.md:1294` - blocked runtime/model retry policy.
  - API/Type: `packages/domain/src/errors.ts:1` - app error code pattern to extend.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:15` - UI assertion pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/desktop test | tee .omo/evidence/task-9-desktop-test.txt` passes model IPC/settings tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "model settings" | tee .omo/evidence/task-9-e2e.txt` passes.
  - [ ] `pnpm test:integration | tee .omo/evidence/task-9-integration.txt` passes mock Ollama unavailable/model-missing integration.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: Settings shows mock model health and selected models
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "model settings" | tee .omo/evidence/task-9-e2e.txt
    Expected: Settings renders Ollama status, generation model, embedding model, and no raw prompt/body text.
    Evidence: .omo/evidence/task-9-e2e.txt

  Scenario: Ollama unavailable fails closed
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/model-status.test.ts | tee .omo/evidence/task-9-integration.txt
    Expected: mock transport connection failure surfaces `PROVIDER_UNAVAILABLE`/blocked state with a user message and no retry loop storm.
    Evidence: .omo/evidence/task-9-integration.txt
  ```

  Commit: YES | Message: `feat(models): 모델 상태와 설정 화면을 연결하다` | Files: [`apps/desktop/src/**`, `packages/contracts/src/**`, `packages/storage/src/**`, `packages/llm/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 10. Structured document analysis pipeline and Summary UI

  What to do: Implement Task 06. Use versioned prompts and `schemas/document-analysis.schema.json` for chunk summary to document reduce, structured JSON Schema request, Zod validation, evidenceBlockIds existence validation, exactly one correction retry, model/prompt/input/output hash persistence, and user-edited summary protection. Add prompt-injection fixture tests with mock model outputs. Render Summary UI with headline, abstract, key points, actions, caveats, topics, entities, claims, evidence block links, model/prompt version.
  Must NOT do: Do not place prompt text in TypeScript modules. Do not trust model-provided evidence IDs without checking against input blocks. Do not overwrite user edits during reanalysis.

  Parallelization: Can parallel: NO | Wave 2 | Blocks: [11, 14, 16] | Blocked by: [2, 3, 4, 6, 7, 8, 9]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `schemas/document-analysis.schema.json:1` - analysis schema.
  - Pattern:  `packages/prompts/document-analysis/v1/system.md:1` - current system prompt.
  - Pattern:  `packages/prompts/document-analysis/v1/user.md:1` - current user prompt.
  - Pattern:  `packages/prompts/chunk-summary/v1/system.md:1` - chunk summary prompt.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:190` - Task 06 requirements.
  - Pattern:  `docs/DESIGN.md:555` - hierarchical summary design.
  - Pattern:  `docs/DESIGN.md:763` - prompt injection-resistant prompt principles.
  - Pattern:  `docs/DESIGN.md:787` - prompt/model metadata persistence.
  - Test:     `packages/test-fixtures/README.md:17` - prompt injection fixture requirement.
  - External: `https://docs.ollama.com/api/generate` - structured generation request surface.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test -- packages/llm packages/storage tests/integration | tee .omo/evidence/task-10-analysis-tests.txt` passes schema, evidence, correction retry, prompt injection, persistence tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "summary evidence" | tee .omo/evidence/task-10-e2e.txt` passes.
  - [ ] `rg -n "You are|Ignore previous|JSON Schema|evidenceBlockIds" packages apps --glob '*.ts' --glob '*.tsx' | tee .omo/evidence/task-10-prompt-scan.txt` proves prompt prose is not scattered in implementation modules except schema/type references.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: mock analysis produces summary with valid evidence links
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "summary evidence" | tee .omo/evidence/task-10-e2e.txt
    Expected: a fixture document reaches Summary, shows model/prompt version, and each evidence badge opens an existing original block.
    Evidence: .omo/evidence/task-10-e2e.txt

  Scenario: malformed model JSON gets one correction retry then fails closed
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/document-analysis.test.ts | tee .omo/evidence/task-10-analysis-tests.txt
    Expected: mock malformed JSON triggers exactly one correction request; a second invalid response stores FAILED with stable schema error and no user-edit overwrite.
    Evidence: .omo/evidence/task-10-analysis-tests.txt
  ```

  Commit: YES | Message: `feat(analysis): 근거 검증 문서 분석을 추가하다` | Files: [`packages/llm/**`, `packages/prompts/**`, `schemas/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`, `packages/test-fixtures/**`]

- [ ] 11. Chunking and FTS5 indexing

  What to do: Implement heading-aware chunker in `packages/ingestion` or a search-prep module, persist chunks with block IDs and heading paths, create FTS5 index for title/summary/body/chunks, update queue pipeline to index extracted/analyzed documents, and add deterministic Korean/English keyword tests. Keep code/table blocks intact where possible and follow token target constraints from design.
  Must NOT do: Do not put FTS SQL in renderer. Do not use FTS5 `PRIMARY KEY` declarations. Do not split code/table blocks when avoidable.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [12, 13, 21] | Blocked by: [4, 6, 7, 10]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/DESIGN.md:536` - chunking constraints.
  - Pattern:  `docs/DESIGN.md:1012` - FTS5 virtual table design.
  - Pattern:  `packages/domain/src/documents.ts:28` - content block shape.
  - Pattern:  `packages/storage/src/migrations.ts:6` - migration shape.
  - Test:     `packages/ingestion/src/extract-article.test.ts:67` - code/table preservation tests if present.
  - External: `https://sqlite.org/fts5.html` - FTS5 creation, tokenizer, and constraint rules.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/ingestion test | tee .omo/evidence/task-11-chunker-test.txt` passes chunking unit tests.
  - [ ] `pnpm --filter @linkatlas/storage test | tee .omo/evidence/task-11-fts-storage-test.txt` passes FTS migration/index tests.
  - [ ] `pnpm test:integration -- --run tests/integration/search-index.test.ts | tee .omo/evidence/task-11-integration.txt` passes keyword search for Korean and English fixtures.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: heading-aware chunks preserve block provenance
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/ingestion test | tee .omo/evidence/task-11-chunker-test.txt
    Expected: chunks respect heading paths, token bounds, overlap, and block ID lists; code/table-heavy fixtures are not split unnecessarily.
    Evidence: .omo/evidence/task-11-chunker-test.txt

  Scenario: FTS5 keyword search finds Korean and English fixture chunks
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/search-index.test.ts | tee .omo/evidence/task-11-integration.txt
    Expected: local DB indexes fixture chunks and returns expected Korean/English hits with document ID, chunk ID, block IDs, title, and snippet.
    Evidence: .omo/evidence/task-11-integration.txt
  ```

  Commit: YES | Message: `feat(search): 청킹과 FTS 인덱스를 추가하다` | Files: [`packages/ingestion/**`, `packages/storage/src/**`, `packages/search/**`, `packages/contracts/src/**`, `tests/integration/**`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`]

- [ ] 12. Vector index adapter, embedding pipeline, and rebuild

  What to do: Implement `VectorIndex` adapter and embedding pipeline. Prefer sqlite-vec behind `packages/search` if packaging compatibility is proven; otherwise add an exact cosine SQLite/JSON fallback for tests and keep sqlite-vec as a feature-gated adapter. Store index versions with model/dimensions/options, support rebuild, remove/upsert, active version switching, and deterministic fixture embeddings. Add native dependency review and packaged build compatibility smoke.
  Must NOT do: Do not let business logic import sqlite-vec directly. Do not mix generation and embedding models. Do not fail default tests when native vector extension is unavailable.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [13, 14, 15, 21] | Blocked by: [8, 11]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/vector-index.ts:23` - vector boundary.
  - Pattern:  `docs/DESIGN.md:546` - embedding design.
  - Pattern:  `docs/DESIGN.md:1029` - vector abstraction and sqlite-vec caution.
  - Pattern:  `packages/storage/README.md:5` - dependency review style.
  - External: `https://github.com/asg017/sqlite-vec` - sqlite-vec primary repo and pre-v1 risk.
  - External: `https://docs.ollama.com/api/embed` - embeddings endpoint contract.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/search test | tee .omo/evidence/task-12-vector-test.txt` passes vector upsert/remove/search/version/rebuild tests.
  - [ ] `pnpm test:integration -- --run tests/integration/vector-index.test.ts | tee .omo/evidence/task-12-integration.txt` passes with deterministic embeddings.
  - [ ] `pnpm --filter @linkatlas/desktop build | tee .omo/evidence/task-12-desktop-build.txt` passes after adding vector dependencies or fallback.
  - [ ] `cat .omo/evidence/task-12-dependency-review.md` documents sqlite-vec/native packaging compatibility decision.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: vector search and rebuild are deterministic
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/vector-index.test.ts | tee .omo/evidence/task-12-integration.txt
    Expected: deterministic fixture embeddings return expected top hits, reindex creates a new active version, and repeated rebuild returns same rankings.
    Evidence: .omo/evidence/task-12-integration.txt

  Scenario: native vector dependency does not break desktop build
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/desktop build | tee .omo/evidence/task-12-desktop-build.txt
    Expected: desktop build exits 0; if sqlite-vec is feature-gated, fallback path is active in tests and dependency review records the packaging decision.
    Evidence: .omo/evidence/task-12-desktop-build.txt
  ```

  Commit: YES | Message: `feat(search): 벡터 인덱스와 재생성을 구현하다` | Files: [`packages/search/**`, `packages/storage/src/**`, `packages/domain/src/vector-index.ts`, `packages/llm/**`, `tests/integration/**`, `package.json`, `pnpm-lock.yaml`, `.omo/evidence/task-12-dependency-review.md`]

- [ ] 13. Hybrid search service and UI filters

  What to do: Implement hybrid search with FTS BM25, vector search, Reciprocal Rank Fusion (`k=60` default), filters for date, domain, topic, content type, language, and collection-ready scope, plus snippets/highlights and search UI. Include semantic-only queries where keyword terms do not match but vector meaning does. Ensure empty-result UX is graceful.
  Must NOT do: Do not let generated query expansions dominate original query results. Do not expose raw SQL or vector internals to renderer.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [14, 16, 20] | Blocked by: [5, 11, 12]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/DESIGN.md:679` - hybrid search design.
  - Pattern:  `docs/DESIGN.md:690` - RRF scoring example.
  - Pattern:  `docs/DESIGN.md:1390` - E2E search coverage.
  - Pattern:  `apps/desktop/src/renderer/main.tsx:89` - currently disabled search field.
  - API/Type: `packages/domain/src/vector-index.ts:7` - vector search options.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - E2E style.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/search test | tee .omo/evidence/task-13-search-test.txt` passes BM25/vector/RRF/filter unit tests.
  - [ ] `pnpm test:integration -- --run tests/integration/hybrid-search.test.ts | tee .omo/evidence/task-13-integration.txt` passes Korean/English fixture search.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "hybrid search" | tee .omo/evidence/task-13-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: hybrid search returns keyword and semantic fixture hits
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "hybrid search" | tee .omo/evidence/task-13-e2e.txt
    Expected: user searches Korean and English fixture queries, sees ranked results with snippets, source document, and filters applied.
    Evidence: .omo/evidence/task-13-e2e.txt

  Scenario: empty search is graceful
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/hybrid-search.test.ts | tee .omo/evidence/task-13-integration.txt
    Expected: query with no keyword/vector hit returns empty result DTO and stable empty-state message, not an error.
    Evidence: .omo/evidence/task-13-integration.txt
  ```

  Commit: YES | Message: `feat(search): 하이브리드 검색과 필터를 연결하다` | Files: [`packages/search/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 14. Topic/entity normalization and edit/merge UI

  What to do: Implement Task 08 topic candidate normalization and entity merge based on structured analysis outputs. Use string normalization plus existing topic/entity search and embeddings; LLM suggests candidates only, final mapping is rule/search based. Add user-approved topics, aliases, merge suggestions, tag edits, and Topic screen. Persist source/confidence/evidence. Protect user edits from reanalysis overwrite.
  Must NOT do: Do not create unbounded new topics from raw model strings. Do not treat model candidates as final truth without evidence and normalization.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [15, 21] | Blocked by: [10, 11, 12, 13]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:241` - Task 08 requirements.
  - Pattern:  `docs/DESIGN.md:573` - topic normalization design.
  - Pattern:  `docs/DESIGN.md:589` - entity/claim design.
  - Pattern:  `docs/DESIGN.md:910` - topic table draft.
  - Pattern:  `docs/DESIGN.md:933` - entity/mention table draft.
  - Pattern:  `docs/DESIGN.md:1179` - Topic screen requirements.
  - Test:     `packages/domain/src/domain.test.ts:1` - domain test location to extend for pure normalization.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test -- packages/domain packages/storage packages/search tests/integration | tee .omo/evidence/task-14-topic-tests.txt` passes normalization/merge/persistence tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "topics entities" | tee .omo/evidence/task-14-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: similar topic candidates merge to existing approved topic
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/topics-entities.test.ts | tee .omo/evidence/task-14-topic-tests.txt
    Expected: fixture candidates such as "Unity Addressables" and normalized variants map to one topic with evidence and confidence; ambiguous candidates are marked review-needed.
    Evidence: .omo/evidence/task-14-topic-tests.txt

  Scenario: user topic/entity edits survive reanalysis
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "topics entities" | tee .omo/evidence/task-14-e2e.txt
    Expected: user edits/merges a topic or entity, triggers reanalysis, and edited value remains pinned/user-approved.
    Evidence: .omo/evidence/task-14-e2e.txt
  ```

  Commit: YES | Message: `feat(knowledge): 주제와 엔티티 정규화를 구현하다` | Files: [`packages/domain/src/**`, `packages/search/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 15. Related document scoring and override UI

  What to do: Implement relation candidate generation and scoring. Candidate set is vector top 30, topic-overlap top 20, entity-overlap top 20, union, then calculate `0.55 semantic + 0.25 topic + 0.15 entity + 0.05 user/recency`. Display top 5 related documents with semantic/topic/entity scores and explanation. Support user pin/remove and possible duplicate relation. Add optional relation-label LLM only for top candidates with evidence.
  Must NOT do: Do not perform full pairwise document comparison. Do not let LLM invent relation explanations without score/evidence. Do not ignore user pinned/removed state.

  Parallelization: Can parallel: NO | Wave 3 | Blocks: [16, 20, 21] | Blocked by: [12, 14]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:241` - relation part of Task 08.
  - Pattern:  `docs/DESIGN.md:619` - relation scoring formula.
  - Pattern:  `docs/DESIGN.md:640` - candidate limits and pairwise ban.
  - Pattern:  `docs/DESIGN.md:650` - relation labels.
  - Pattern:  `docs/DESIGN.md:669` - explainable relation UI.
  - Pattern:  `packages/prompts/relation-label/v1/system.md:1` - relation-label prompt.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - UI QA pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test:integration -- --run tests/integration/document-relations.test.ts | tee .omo/evidence/task-15-relations-integration.txt` passes candidate cap, score formula, pin/remove tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "related documents" | tee .omo/evidence/task-15-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: related top five show score reasons
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "related documents" | tee .omo/evidence/task-15-e2e.txt
    Expected: document detail Related tab shows up to five related documents with semantic/topic/entity score components and relation reason.
    Evidence: .omo/evidence/task-15-e2e.txt

  Scenario: full pairwise comparison is not used
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/document-relations.test.ts | tee .omo/evidence/task-15-relations-integration.txt
    Expected: fixture with many documents asserts only bounded candidate union is scored; all-pairs path is absent or test fails if invoked.
    Evidence: .omo/evidence/task-15-relations-integration.txt
  ```

  Commit: YES | Message: `feat(knowledge): 관련 문서 점수와 설명을 추가하다` | Files: [`packages/search/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`, `packages/prompts/**`]

- [ ] 16. Ask retrieval, context composer, and chat persistence

  What to do: Implement first half of Task 09: Ask contracts, chat session/message/citation persistence, intent classification, query expansion, hybrid retrieval, document diversity/MMR context composer, scope filters for all/topic/collection-ready/selected docs, unsupported empty context path. Use original question plus expansions without allowing expansions to dominate.
  Must NOT do: Do not generate final answers in this task unless behind mock stubs for context composer tests. Do not retrieve outside saved documents. Do not persist full raw question to logs.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [17, 21] | Blocked by: [10, 13, 15]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:263` - Task 09 steps.
  - Pattern:  `docs/DESIGN.md:698` - query classification and expansion.
  - Pattern:  `docs/DESIGN.md:711` - context construction.
  - Pattern:  `docs/DESIGN.md:1197` - Ask screen UI requirements.
  - Pattern:  `docs/DESIGN.md:720` - answer/citation output shape.
  - Test:     `tests/integration/bootstrap.test.ts:3` - integration harness to expand.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test:integration -- --run tests/integration/ask-retrieval.test.ts | tee .omo/evidence/task-16-ask-retrieval.txt` passes intent/query/context tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "ask retrieval" | tee .omo/evidence/task-16-e2e.txt` passes Ask empty/context states.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: Ask context includes diverse cited chunks
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/ask-retrieval.test.ts | tee .omo/evidence/task-16-ask-retrieval.txt
    Expected: compare/synthesis fixture query is classified, expanded, retrieved by hybrid search, diversified across documents, and composed with document/chunk/block IDs.
    Evidence: .omo/evidence/task-16-ask-retrieval.txt

  Scenario: unsupported question has empty-context state
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "ask retrieval" | tee .omo/evidence/task-16-e2e.txt
    Expected: Ask UI accepts unsupported fixture question and shows stored material does not confirm it, without hallucinated citations.
    Evidence: .omo/evidence/task-16-e2e.txt
  ```

  Commit: YES | Message: `feat(ask): 질문 검색과 컨텍스트 구성을 추가하다` | Files: [`packages/search/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 17. Streaming RAG answer validation and citation UI

  What to do: Complete Task 09 with streaming structured answers from mock/Ollama-compatible provider, citation validation, unsupported statement reduction, citation badges, source block preview/navigation, answer saving as note if in scope, compare/synthesis tests, and failure handling for missing/out-of-context citations. Validate each citation references retrieved context and existing block IDs.
  Must NOT do: Do not display model citations that are not in retrieved context. Do not generate strong facts outside saved context. Do not stream unvalidated final citations into persisted answer state.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [20, 21] | Blocked by: [8, 16]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/prompts/rag-answer/v1/system.md:1` - RAG prompt boundary.
  - Pattern:  `docs/DESIGN.md:719` - answer format.
  - Pattern:  `docs/DESIGN.md:738` - answer validation rules.
  - Pattern:  `docs/DESIGN.md:1644` - Ask completion criteria.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:282` - Task 09 completion criteria.
  - External: `https://docs.ollama.com/api/chat` - chat/streaming endpoint.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test:integration -- --run tests/integration/rag-answer.test.ts | tee .omo/evidence/task-17-rag-integration.txt` passes valid citation, missing citation, unsupported question, compare/synthesis tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "rag citations" | tee .omo/evidence/task-17-e2e.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: streaming answer shows valid citations and opens source blocks
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "rag citations" | tee .omo/evidence/task-17-e2e.txt
    Expected: Ask streams a mock answer, citation badges appear, clicking a badge opens the exact source block in document detail.
    Evidence: .omo/evidence/task-17-e2e.txt

  Scenario: out-of-context citation is rejected
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/rag-answer.test.ts | tee .omo/evidence/task-17-rag-integration.txt
    Expected: mock answer with unknown citation or block outside context is rejected or reduced to 확인 불가 with stable validation error.
    Evidence: .omo/evidence/task-17-rag-integration.txt
  ```

  Commit: YES | Message: `feat(ask): 근거 검증 답변과 인용 UI를 완성하다` | Files: [`packages/llm/**`, `packages/search/**`, `packages/storage/src/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `packages/prompts/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 18. Browser extension contracts and MV3 extraction

  What to do: Add `apps/browser-extension` Manifest V3 package with minimal permissions, service worker, content script/current page capture, selection save, Readability-based extraction in extension context, shared contract DTOs in `packages/contracts`, popup/status UI for ready/app missing/duplicate/error. Re-sanitize and revalidate payloads in desktop main later; extension extraction is a convenience, not trusted input.
  Must NOT do: Do not request broad host permissions beyond active tab/scripting/nativeMessaging as required. Do not treat extension-extracted HTML as trusted. Do not use localhost HTTP in release path.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [19] | Blocked by: [2, 3, 6]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:292` - Task 10 requirements.
  - Pattern:  `docs/DESIGN.md:1097` - extension design.
  - Pattern:  `docs/DESIGN.md:1706` - ADR for Native Messaging.
  - Pattern:  `packages/contracts/README.md:3` - extension DTO contract responsibility.
  - External: `https://developer.chrome.com/docs/extensions/develop/migrate` - Manifest V3 migration/reference.
  - External: `https://developer.chrome.com/docs/extensions/reference/api/runtime` - runtime messaging API.
  - External: `https://github.com/mozilla/readability` - browser Readability usage and sanitization warning.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/browser-extension test | tee .omo/evidence/task-18-extension-test.txt` passes contract/content/service-worker unit tests.
  - [ ] `pnpm --filter @linkatlas/browser-extension build | tee .omo/evidence/task-18-extension-build.txt` passes.
  - [ ] `node apps/browser-extension/scripts/inspect-manifest.mjs | tee .omo/evidence/task-18-manifest-inspect.txt` reports only approved MV3 permissions.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: extension extracts current page and selected text fixture
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/browser-extension test | tee .omo/evidence/task-18-extension-test.txt
    Expected: tests load fixture DOM, produce shared contract payload for full page and selected text, and reject malformed payloads.
    Evidence: .omo/evidence/task-18-extension-test.txt

  Scenario: extension manifest uses minimal permissions
    Tool:     bash
    Steps:    node apps/browser-extension/scripts/inspect-manifest.mjs | tee .omo/evidence/task-18-manifest-inspect.txt
    Expected: manifest is MV3 and includes only required permissions such as activeTab/scripting/nativeMessaging/storage where justified; no broad host wildcards.
    Evidence: .omo/evidence/task-18-manifest-inspect.txt
  ```

  Commit: YES | Message: `feat(extension): MV3 공유 확장 기반을 추가하다` | Files: [`apps/browser-extension/**`, `packages/contracts/src/**`, `packages/test-fixtures/**`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`, `pnpm-lock.yaml`]

- [ ] 19. Native Messaging host and desktop share enqueue flow

  What to do: Implement Native Messaging stdio host with 32-bit length-prefixed JSON protocol, macOS manifest generation, allowed extension origins with no wildcards, origin validation, shared schema validation, app-not-running response, duplicate URL response, and desktop enqueue into Task 07 queue. Re-sanitize extension payloads before storage. Add installer/packaging hooks to be finalized in Task 23.
  Must NOT do: Do not expose localhost HTTP release path. Do not write debug logs to stdout from native host. Do not accept wildcard extension origins. Do not bypass queue idempotency.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [20, 23] | Blocked by: [7, 18]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/DESIGN.md:1108` - Native Messaging flow.
  - Pattern:  `docs/DESIGN.md:1121` - Native Messaging benefits and no loopback release path.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:296` - Task 10 Native Messaging requirement.
  - Pattern:  `packages/contracts/src/ingest-url.ts:40` - parse-at-boundary style.
  - External: `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging` - manifest, path, allowed origins, protocol, size limits.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test:integration -- --run tests/integration/native-messaging.test.ts | tee .omo/evidence/task-19-native-messaging.txt` passes protocol, origin, duplicate, app-not-running, enqueue tests.
  - [ ] `node apps/browser-extension/scripts/validate-native-host-manifest.mjs | tee .omo/evidence/task-19-host-manifest.txt` verifies macOS manifest JSON, absolute path, stdio type, no wildcard `allowed_origins`.
  - [ ] `pnpm --filter @linkatlas/desktop build | tee .omo/evidence/task-19-desktop-build.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: native message enqueues browser capture
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/native-messaging.test.ts | tee .omo/evidence/task-19-native-messaging.txt
    Expected: length-prefixed fixture message from allowed origin is parsed, schema validated, re-sanitized, idempotently enqueued, and returns success JSON under 1 MB.
    Evidence: .omo/evidence/task-19-native-messaging.txt

  Scenario: forbidden origin and app-not-running fail clearly
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/native-messaging.test.ts | tee .omo/evidence/task-19-native-messaging.txt
    Expected: disallowed origin is rejected; simulated app-not-running returns stable user-facing error; no stdout debug noise corrupts protocol.
    Evidence: .omo/evidence/task-19-native-messaging.txt
  ```

  Commit: YES | Message: `feat(extension): Native Messaging 수집 흐름을 연결하다` | Files: [`apps/browser-extension/**`, `apps/desktop/src/main/**`, `packages/contracts/src/**`, `packages/storage/src/**`, `tests/integration/**`, `scripts/**`, `package.json`, `pnpm-lock.yaml`]

- [ ] 20. Rich UI states, network log, and recovery polish

  What to do: Complete richer UI states across Inbox, Library, Document Detail, Original, Summary, Related, Topics, Ask, Settings, jobs, extension share states, network log, and recovery/failure states. Add accessible loading/empty/error/success UI, retry/cancel controls, source previews, model health, and no visible instructional filler text. Record network requests without document body/question/model output. Ensure UI text fits in desktop/mobile-ish constrained Electron viewport.
  Must NOT do: Do not use marketing/landing-page layouts. Do not add decorative slop. Do not log sensitive content. Do not introduce renderer direct access to Node/network/storage.

  Parallelization: Can parallel: NO | Wave 4 | Blocks: [24] | Blocked by: [7, 9, 13, 15, 17, 19]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/DESIGN.md:1131` - app shell.
  - Pattern:  `docs/DESIGN.md:1149` - Inbox.
  - Pattern:  `docs/DESIGN.md:1158` - document detail tabs.
  - Pattern:  `docs/DESIGN.md:1197` - Ask screen.
  - Pattern:  `docs/DESIGN.md:1206` - Settings/network log.
  - Pattern:  `apps/desktop/src/renderer/styles.css:23` - current shell styling baseline.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - Playwright Electron test pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/desktop test | tee .omo/evidence/task-20-desktop-test.txt` passes renderer/state unit tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "full UI states" | tee .omo/evidence/task-20-e2e.txt` passes.
  - [ ] `pnpm test -- tests/boundaries/architecture-boundaries.test.ts | tee .omo/evidence/task-20-boundaries.txt` passes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: major UI surfaces show real states
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "full UI states" | tee .omo/evidence/task-20-e2e.txt
    Expected: Inbox, Library, Document Detail, Topics, Related, Ask, Settings, jobs, and extension share states show accessible loading/empty/error/success states against fixture data.
    Evidence: .omo/evidence/task-20-e2e.txt

  Scenario: network log redacts sensitive content
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/network-log.test.ts | tee .omo/evidence/task-20-network-log.txt
    Expected: network log records URL/domain/status/timing/errorCode but excludes document body, full question, and full model output.
    Evidence: .omo/evidence/task-20-network-log.txt
  ```

  Commit: YES | Message: `feat(ui): 주요 화면 상태와 복구 흐름을 다듬다` | Files: [`apps/desktop/src/renderer/**`, `apps/desktop/src/main/**`, `apps/desktop/src/shared/**`, `packages/contracts/src/**`, `packages/storage/src/**`, `tests/e2e/**`, `tests/integration/**`]

- [ ] 21. Export, JSONL, ZIP backup/restore, and restore rebuild

  What to do: Implement Task 11 export/backup/restore. Add Markdown document export, full JSONL export, ZIP backup containing metadata, summaries, tags/topics/entities/relations, original/normalized content references, prompts/model metadata, and manifest. Restore creates a new vault by default, validates manifest/schema/checksums, applies migrations, imports transactionally, then validates/rebuilds FTS/vector indexes. Add restore failure rollback. Provide UI in Settings.
  Must NOT do: Do not merge into an existing vault by default. Do not restore partially without rollback and error record. Do not include secrets/tokens/private logs in export.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [22, 23, 24] | Blocked by: [4, 11, 12, 14, 15, 17]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:313` - Task 11 export/backup requirements.
  - Pattern:  `docs/DESIGN.md:182` - export/backup requirements.
  - Pattern:  `docs/DESIGN.md:1206` - Settings export/restore.
  - Pattern:  `docs/DESIGN.md:1663` - M7 export/install roadmap.
  - Pattern:  `packages/storage/src/connection.ts:21` - transaction helper.
  - Test:     `packages/storage/src/storage.integration.test.ts:102` - rollback test pattern.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm test:integration -- --run tests/integration/export-backup.test.ts | tee .omo/evidence/task-21-export-integration.txt` passes Markdown/JSONL/ZIP round trip and rollback tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "export restore" | tee .omo/evidence/task-21-e2e.txt` passes.
  - [ ] `unzip -l .omo/evidence/task-21-fixture-backup.zip | tee .omo/evidence/task-21-zip-list.txt` shows manifest, JSONL, Markdown, and content blobs without secrets.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: backup restores into a new vault with rebuilt indexes
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/export-backup.test.ts | tee .omo/evidence/task-21-export-integration.txt
    Expected: fixture vault exports Markdown/JSONL/ZIP, restore imports into new temp vault, migrations apply, FTS/vector indexes validate or rebuild, search/Ask fixtures still pass.
    Evidence: .omo/evidence/task-21-export-integration.txt

  Scenario: corrupt backup rolls back
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/export-backup.test.ts | tee .omo/evidence/task-21-export-integration.txt
    Expected: corrupt checksum/manifest restore fails with stable error, no partial documents remain in target vault.
    Evidence: .omo/evidence/task-21-export-integration.txt
  ```

  Commit: YES | Message: `feat(export): 백업과 복원 라운드트립을 구현하다` | Files: [`packages/storage/src/**`, `packages/export/**`, `packages/contracts/src/**`, `apps/desktop/src/**`, `tests/integration/**`, `tests/e2e/**`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `pnpm-lock.yaml`]

- [ ] 22. First-run wizard, hardware/model diagnostics, and fixture sample diagnostic

  What to do: Add first-run wizard with vault path selection/display, Ollama health, hardware memory detection, recommended generation/embedding model profile, model availability/pull progress UI where supported, and fixture-based sample URL diagnostic. Use `~/Library/Application Support/LinkAtlas/` as default vault path on macOS unless user selects otherwise. Persist first-run completion and settings.
  Must NOT do: Do not require public internet for automated sample diagnostic. Do not bundle Ollama or models. Do not store pairing tokens outside secure storage if tokens are introduced.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [23, 24] | Blocked by: [8, 9, 21]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/DESIGN.md:1312` - install/distribution first-run structure.
  - Pattern:  `docs/DESIGN.md:1322` - wizard steps.
  - Pattern:  `docs/DESIGN.md:358` - hardware profile defaults.
  - Pattern:  `docs/DESIGN.md:1257` - local storage default.
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:317` - Task 11 first-run and model pull display.
  - External: `https://docs.ollama.com/api/generate` - model runtime compatibility.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/desktop test | tee .omo/evidence/task-22-wizard-test.txt` passes first-run/model-profile tests.
  - [ ] `pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "first run wizard" | tee .omo/evidence/task-22-e2e.txt` passes.
  - [ ] `pnpm test:integration -- --run tests/integration/sample-diagnostic.test.ts | tee .omo/evidence/task-22-sample-diagnostic.txt` passes using local fixture server.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: first-run wizard completes with mock Ollama and fixture diagnostic
    Tool:     playwright(real Chrome via Electron)
    Steps:    pnpm --filter @linkatlas/desktop build && LINKATLAS_E2E=1 pnpm exec playwright test tests/e2e/desktop-smoke.spec.ts --grep "first run wizard" | tee .omo/evidence/task-22-e2e.txt
    Expected: wizard shows vault path, mock Ollama status, hardware/model recommendation, fixture sample diagnostic, and persists completion.
    Evidence: .omo/evidence/task-22-e2e.txt

  Scenario: public internet is not used for sample diagnostic
    Tool:     bash
    Steps:    pnpm test:integration -- --run tests/integration/sample-diagnostic.test.ts | tee .omo/evidence/task-22-sample-diagnostic.txt
    Expected: diagnostic uses local fixture HTTP server only and records no public network request.
    Evidence: .omo/evidence/task-22-sample-diagnostic.txt
  ```

  Commit: YES | Message: `feat(onboarding): 첫 실행 진단 마법사를 추가하다` | Files: [`apps/desktop/src/**`, `packages/contracts/src/**`, `packages/storage/src/**`, `packages/llm/**`, `tests/integration/**`, `tests/e2e/**`]

- [ ] 23. macOS packaging, Native Messaging registration assets, and update-check readiness

  What to do: Configure macOS `.app` and `.dmg` packaging using Electron-compatible tooling already selected by dependency review. Include app identity/bundle identifier default `app.linkatlas.desktop` unless project docs specify otherwise, extension/native host registration assets, packaging of native modules, license notices, update-check readiness, signed-build limitations documented if signing credentials are unavailable, and local packaging smoke. Update scripts and README/docs. Auto-update checks must be disabled or simulated in development/tests unless signed/release metadata exists.
  Must NOT do: Do not claim notarization/code signing completed without credentials and evidence. Do not weaken Electron security settings. Do not ship update checks that hit arbitrary public URLs in tests.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [24] | Blocked by: [19, 21, 22]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `docs/CODEX_EXECUTION_PLAN.md:313` - Task 11 packaging requirements.
  - Pattern:  `docs/DESIGN.md:1312` - distribution design.
  - Pattern:  `docs/DESIGN.md:1663` - M7 packaging roadmap.
  - Pattern:  `docs/DESIGN.md:1725` - remaining decisions; use defaults when not blocking.
  - Pattern:  `apps/desktop/package.json:8` - current build script.
  - External: `https://www.electronjs.org/docs/latest/tutorial/application-distribution` - Electron packaging guidance.
  - External: `https://www.electronjs.org/docs/latest/tutorial/updates` - update requirements and signed macOS caveats.
  - External: `https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging` - macOS native host manifest locations and absolute paths.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm --filter @linkatlas/desktop package:mac | tee .omo/evidence/task-23-package-mac.txt` creates `.app` and `.dmg` or records a credential-independent packaging artifact plus explicit blocker if signing/notarization is unavailable.
  - [ ] `find apps/desktop/release -maxdepth 3 -type f | sort | tee .omo/evidence/task-23-release-files.txt` lists expected artifacts.
  - [ ] `node scripts/validate-release-config.mjs | tee .omo/evidence/task-23-release-config.txt` validates Electron security, update-check config, native host manifest assets, and license notices.
  - [ ] `pnpm test:e2e | tee .omo/evidence/task-23-e2e.txt` passes after packaging config changes.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: macOS package command produces release artifacts
    Tool:     bash
    Steps:    pnpm --filter @linkatlas/desktop package:mac | tee .omo/evidence/task-23-package-mac.txt && find apps/desktop/release -maxdepth 3 -type f | sort | tee .omo/evidence/task-23-release-files.txt
    Expected: command exits 0 and release listing includes `.app` plus `.dmg`; if code signing/notarization is unavailable, evidence clearly states unsigned local artifact and missing credential blocker.
    Evidence: .omo/evidence/task-23-package-mac.txt

  Scenario: release config preserves security and update constraints
    Tool:     bash
    Steps:    node scripts/validate-release-config.mjs | tee .omo/evidence/task-23-release-config.txt
    Expected: validation confirms nodeIntegration=false, contextIsolation=true, sandbox=true, no remote privileged pages, update checks disabled/simulated unless signed metadata exists, and native host manifests use absolute paths/no wildcard origins.
    Evidence: .omo/evidence/task-23-release-config.txt
  ```

  Commit: YES | Message: `build(desktop): macOS 패키징과 업데이트 점검을 준비하다` | Files: [`apps/desktop/**`, `apps/browser-extension/**`, `scripts/**`, `docs/**`, `package.json`, `pnpm-lock.yaml`]

- [ ] 24. Final release hardening and aggregate evidence

  What to do: Run final release hardening across security, data migration, prompt injection, no public-internet tests, renderer/domain boundaries, dependency review, logs redaction, UI E2E, extension/native messaging, export/restore, packaging, docs sync, and clean git state. Produce final ULW evidence files for C001-C003. Surface F1-F4 final verification results to the caller and wait for explicit "okay" before declaring complete or updating ULW goal complete.
  Must NOT do: Do not mark the aggregate complete before Task 11 and F1-F4 pass. Do not hide test failures. Do not claim signed/notarized release if credentials were unavailable.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [Final verification] | Blocked by: [1-23]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `AGENTS.md:8` - required final command set.
  - Pattern:  `AGENTS.md:10` - completion response fields.
  - Pattern:  `docs/DESIGN.md:1222` - security design.
  - Pattern:  `docs/DESIGN.md:1744` - beta definition of done.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:17` - final happy criterion.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:26` - final security criterion.
  - Pattern:  `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722/goals.json:35` - final regression/release criterion.
  - Test:     `package.json:11` - root verification scripts.
  - Test:     `tests/boundaries/architecture-boundaries.test.ts:33` - boundary checks.
  - Test:     `tests/e2e/desktop-smoke.spec.ts:4` - user-facing E2E.

  Acceptance criteria (agent-executable only):
  - [ ] `pnpm lint | tee .omo/evidence/task-24-lint.txt` passes.
  - [ ] `pnpm typecheck | tee .omo/evidence/task-24-typecheck.txt` passes.
  - [ ] `pnpm test | tee .omo/evidence/task-24-test.txt` passes.
  - [ ] `pnpm test:integration | tee .omo/evidence/task-24-integration.txt` passes.
  - [ ] `pnpm test:e2e | tee .omo/evidence/task-24-e2e.txt` passes.
  - [ ] `git status --short --branch | tee .omo/evidence/task-24-git-status.txt` shows only intended final tracked changes before commit, and clean after final commit/push if the executor is authorized to push.
  - [ ] `.omo/ulw-loop/evidence/final-C001-happy-path.txt`, `.omo/ulw-loop/evidence/final-C002-security-boundaries.txt`, and `.omo/ulw-loop/evidence/final-C003-regression-release.txt` exist and reference task evidence.

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: full quality gate passes
    Tool:     bash
    Steps:    pnpm lint | tee .omo/evidence/task-24-lint.txt; pnpm typecheck | tee .omo/evidence/task-24-typecheck.txt; pnpm test | tee .omo/evidence/task-24-test.txt; pnpm test:integration | tee .omo/evidence/task-24-integration.txt; pnpm test:e2e | tee .omo/evidence/task-24-e2e.txt
    Expected: all five commands exit 0; failures are fixed and evidence refreshed before final review.
    Evidence: .omo/evidence/task-24-e2e.txt

  Scenario: aggregate evidence proves C001-C003 and remains active until user approval
    Tool:     bash
    Steps:    test -s .omo/ulw-loop/evidence/final-C001-happy-path.txt && test -s .omo/ulw-loop/evidence/final-C002-security-boundaries.txt && test -s .omo/ulw-loop/evidence/final-C003-regression-release.txt && git status --short --branch | tee .omo/evidence/task-24-git-status.txt
    Expected: all aggregate evidence files exist; final message surfaces F1-F4 results and waits for explicit user okay before ULW completion.
    Evidence: .omo/evidence/task-24-git-status.txt
  ```

  Commit: YES | Message: `chore(release): 최종 품질 게이트 증거를 정리하다` | Files: [`.omo/evidence/**`, `.omo/ulw-loop/evidence/**`, `docs/**`, `README.md`, changed source/test/config files from Tasks 1-23]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/linkatlas-final-ulw-execution-plan.md`.
- Preserve already completed main commits:
  - `623cbd1 문서를 docs로 이동하고 실행 계획 정리`
  - `8e335f3 LinkAtlas 부트스트랩 워크스페이스 추가`
  - `0ae7af3 SQLite 저장소와 마이그레이션 추가`
  - `efb162e URL 입력과 안전 fetch 흐름 추가`
- Suggested commit boundaries:
  - Task 1: no source commit unless evidence/docs changes are intentionally tracked.
  - Task 2: `feat(contracts): 남은 앱 계약과 도메인 경계를 정의하다`
  - Task 3: `test(fixtures): 로컬 전용 검증 자산을 확장하다`
  - Task 4: `feat(storage): 확장 스키마와 저장소 기반을 추가하다`
  - Task 5: `feat(desktop): 타입 안전 IPC와 화면 상태 기반을 넓히다`
  - Task 6: `feat(ingestion): Readability 본문 추출을 완료하다`
  - Task 7: `feat(queue): 수집 작업을 영속 큐로 이동하다`
  - Task 8: `feat(llm): Ollama 호환 모델 어댑터를 추가하다`
  - Task 9: `feat(models): 모델 상태와 설정 화면을 연결하다`
  - Task 10: `feat(analysis): 근거 검증 문서 분석을 추가하다`
  - Task 11: `feat(search): 청킹과 FTS 인덱스를 추가하다`
  - Task 12: `feat(search): 벡터 인덱스와 재생성을 구현하다`
  - Task 13: `feat(search): 하이브리드 검색과 필터를 연결하다`
  - Task 14: `feat(knowledge): 주제와 엔티티 정규화를 구현하다`
  - Task 15: `feat(knowledge): 관련 문서 점수와 설명을 추가하다`
  - Task 16: `feat(ask): 질문 검색과 컨텍스트 구성을 추가하다`
  - Task 17: `feat(ask): 근거 검증 답변과 인용 UI를 완성하다`
  - Task 18: `feat(extension): MV3 공유 확장 기반을 추가하다`
  - Task 19: `feat(extension): Native Messaging 수집 흐름을 연결하다`
  - Task 20: `feat(ui): 주요 화면 상태와 복구 흐름을 다듬다`
  - Task 21: `feat(export): 백업과 복원 라운드트립을 구현하다`
  - Task 22: `feat(onboarding): 첫 실행 진단 마법사를 추가하다`
  - Task 23: `build(desktop): macOS 패키징과 업데이트 점검을 준비하다`
  - Task 24: `chore(release): 최종 품질 게이트 증거를 정리하다`

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.
- Current `main` baseline through `efb162e` is preserved, and current Task 03 draft work is either incorporated or explicitly superseded by equivalent committed implementation without data loss.
- The ULW session `.omo/ulw-loop/E10191E7-97CE-4FD6-8C5F-3DC63CA62722` remains one aggregate and is not marked complete until Task 11, Task 24, final commands, F1-F4, and explicit user okay all pass.
- Final app can ingest a fixture URL, extract/sanitize/persist content, summarize/classify/link with mocked/Ollama-compatible providers, build embeddings/search indexes, answer with validated citations, accept a browser-extension share through Native Messaging, export/restore a vault, and produce macOS packaging artifacts or a credential-specific blocker for signing/notarization only.
- Security checks prove: SSRF controls still pass, prompt injection fixture causes no tool/external action, renderer remains isolated, IPC/extension inputs are Zod-validated, logs redact bodies/questions/model output, and no public-internet tests are required.
