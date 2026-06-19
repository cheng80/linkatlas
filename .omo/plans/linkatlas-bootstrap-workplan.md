# linkatlas-bootstrap-workplan - Work Plan

## TL;DR (For humans)

**What you'll get:** A runnable LinkAtlas development foundation: strict TypeScript workspace, a secure Electron desktop shell, typed app contracts, pure domain boundaries, package docs, and automated checks. It stops before real URL ingestion or database persistence, but leaves those next slices ready.

**Why this approach:** The current repository is a design pack, not an app. The first safe step is to lock the runtime boundary and test harness before storage, web fetching, Ollama, or search code can drift across layers.

**What it will NOT do:** It will not implement real document ingestion, SQLite persistence, Ollama calls, browser extension behavior, or packaging. It will not add Codex or agent-framework runtime dependencies.

**Effort:** Medium
**Risk:** Medium - Electron security and monorepo boundaries must be correct before later feature slices build on them.
**Decisions I made for you:** Use `docs/DESIGN.md` and `docs/CODEX_EXECUTION_PLAN.md` as the canonical planning docs; create `packages/contracts` and `packages/domain` during bootstrap; use `app.linkatlas.desktop` as a reversible local bundle id placeholder; require package READMEs; use tests-after only for pure scaffolding and failing-first tests for behavior once seams exist.

Your next move: start execution with `$start-work` or ask for plan review changes. Full execution detail follows below.

---

> TL;DR (machine): Medium effort, medium risk; bootstrap pnpm/Electron/React/contracts/domain/test foundation and readiness gates for storage, fetch, extraction.

## Scope
### Must have
- Root pnpm workspace with strict TypeScript project references or equivalent strict per-package configs.
- Root scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and `pnpm test:e2e` if Electron E2E is configured in this slice.
- `apps/desktop` with Electron main, preload, and React renderer split.
- BrowserWindow security defaults: `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
- Typed preload allowlist API with one smoke method, for example `linkAtlas.app.getVersion()`.
- Renderer calls only the typed preload API and does not import Node/Electron modules.
- `packages/contracts` with Zod-backed DTO/schema pattern for the smoke API and future IPC shape.
- `packages/domain` with pure domain models/interfaces needed by Task 00 and next slices, without Electron/SQLite/Ollama imports.
- Stable app error shape separating `errorCode` and user-safe message.
- Package READMEs for every new package, stating responsibility and forbidden dependencies.
- Test fixture directory shape for future HTML/Ollama fixtures, without public internet tests.
- A documented readiness handoff for Task 01 SQLite/migrations, Task 02 URL validation/fetch, and Task 03 Readability extraction.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No renderer direct filesystem, SQLite, shell, network, or Ollama access.
- No generic preload or IPC APIs named like `execute`, `readFile`, `writeFile`, `querySql`, or raw channel passthrough.
- No `any`, `@ts-ignore`, `@ts-expect-error`, skipped tests, or disabled lint/type rules.
- No public internet dependency in tests.
- No real SQLite schema or migration implementation in Task 00, except placeholder directories/docs if needed.
- No Ollama HTTP implementation in Task 00.
- No browser extension implementation in Task 00.
- Preserve `docs/DESIGN.md` and `docs/CODEX_EXECUTION_PLAN.md` as canonical document paths; do not recreate duplicate root copies.
- No app runtime import from `.omo`, Codex, OMO, or agent frameworks.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after for pure scaffold files; failing-first for behavior-bearing seams once created. Frameworks: Vitest for unit/integration, Playwright Electron or equivalent Electron smoke for desktop shell.
- Required command evidence:
  - `pnpm lint` -> `.omo/evidence/task-final-linkatlas-bootstrap-workplan-lint.txt`
  - `pnpm typecheck` -> `.omo/evidence/task-final-linkatlas-bootstrap-workplan-typecheck.txt`
  - `pnpm test` -> `.omo/evidence/task-final-linkatlas-bootstrap-workplan-test.txt`
  - `pnpm test:integration` -> `.omo/evidence/task-final-linkatlas-bootstrap-workplan-integration.txt`
  - `pnpm test:e2e` or documented "not configured yet" proof -> `.omo/evidence/task-final-linkatlas-bootstrap-workplan-e2e.txt`
- Required manual QA surface:
  - Desktop shell smoke via exact command supplied by implementation scripts, expected observable: renderer displays the app shell and smoke API value while DevTools/global checks show no Node globals exposed.
- Required security evidence:
  - Test or script proves BrowserWindow options include `nodeIntegration=false`, `contextIsolation=true`, and `sandbox=true`.
  - Test or bundle scan proves renderer source does not import `fs`, `path`, `child_process`, `electron`, SQLite packages, or Ollama/network adapters.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 0: establish workspace and package layout. Todos 1-4.
- Wave 1: build contracts/domain/security shell seams. Todos 5-9.
- Wave 2: add tests, fixture scaffolding, readiness docs, and validation. Todos 10-13.
- Wave 3: final verification and handoff. Todo 14 plus final verification wave.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 4, 10, 14 | none |
| 2 | 1 | 5, 6, 10, 14 | 3, 4 |
| 3 | 1 | 5, 7, 14 | 2, 4 |
| 4 | 1 | 8, 11, 14 | 2, 3 |
| 5 | 2, 3 | 8, 9, 10, 14 | 6, 7 |
| 6 | 2 | 8, 10, 14 | 5, 7 |
| 7 | 3 | 9, 14 | 5, 6 |
| 8 | 4, 5, 6 | 9, 10, 12, 14 | 11 |
| 9 | 5, 7, 8 | 12, 14 | 10, 11 |
| 10 | 2, 5, 6, 8 | 14 | 9, 11 |
| 11 | 4, 8 | 13, 14 | 9, 10 |
| 12 | 8, 9 | 14 | 13 |
| 13 | 11 | 14 | 12 |
| 14 | all prior todos | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Create root workspace and baseline metadata
  What to do / Must NOT do: Create root `package.json`, `pnpm-workspace.yaml`, baseline `.npmrc` if needed, and scripts for lint/typecheck/test/integration/e2e. Preserve existing `AGENTS.md`, `README.md`, `docs/DESIGN.md`, `docs/CODEX_EXECUTION_PLAN.md`, and schema. Do not install feature dependencies beyond bootstrap tooling and app shell dependencies.
  Parallelization: Wave 0 | Blocked by: none | Blocks: 2, 3, 4, 10, 14
  References (executor has NO interview context - be exhaustive): `/Users/cheng80/Desktop/linkatlas/AGENTS.md`; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 7, 23, 25; `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md` Task 00.
  Acceptance criteria (agent-executable): `pnpm --version` works; `pnpm install` completes; `pnpm -r list --depth 0` lists planned workspaces after packages are created; root scripts exist and fail only because target files are not created yet before later todos complete.
  QA scenarios (name the exact tool + invocation): happy: `pnpm install`, evidence `.omo/evidence/task-1-install.txt`; failure: `pnpm run does-not-exist` exits non-zero, evidence `.omo/evidence/task-1-script-failure.txt`.
  Commit: Y | `build(workspace): bootstrap pnpm workspace`

- [ ] 2. Add strict TypeScript, lint, format, and Vitest baseline
  What to do / Must NOT do: Add shared TypeScript configs, ESLint flat config or current recommended config, Prettier config, Vitest config, and a minimal root or package test proving the runner works. Do not disable strict mode or allow implicit `any`.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: 5, 6, 10, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` coding/test rules; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 7, 22, 24, 25.
  Acceptance criteria: `pnpm lint`, `pnpm typecheck`, and `pnpm test` run and pass after this todo's minimal files exist.
  QA scenarios: happy: `pnpm test -- --run`, evidence `.omo/evidence/task-2-vitest-pass.txt`; failure: temporarily run a targeted negative fixture or typecheck sample outside committed files proving strict config rejects implicit `any`, evidence `.omo/evidence/task-2-strict-negative.txt`.
  Commit: Y | `build(tooling): add strict TypeScript and test baseline`

- [ ] 3. Create workspace directory layout and package READMEs
  What to do / Must NOT do: Create `apps/desktop`, `packages/contracts`, `packages/domain`, `packages/test-fixtures`, and `packages/prompts` with package manifests where appropriate and short READMEs. READMEs must state responsibility, allowed dependencies, forbidden dependencies, and test command. Do not create storage/ingestion/llm/search implementation packages yet unless only empty README placeholders are needed for roadmap clarity.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: 5, 7, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` "related package README"; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` section 23 package responsibilities.
  Acceptance criteria: `find apps packages -maxdepth 3 -name README.md -print` lists each created package README; `pnpm -r list --depth 0` includes created package manifests.
  QA scenarios: happy: `pnpm -r list --depth 0`, evidence `.omo/evidence/task-3-workspaces.txt`; failure: `rg "Electron|SQLite|Ollama" packages/domain/src packages/domain/README.md` returns no forbidden implementation imports except explanatory forbidden-dependency text in README, evidence `.omo/evidence/task-3-domain-boundary.txt`.
  Commit: Y | `chore(repo): add workspace package layout`

- [ ] 4. Add test fixture and evidence directory conventions
  What to do / Must NOT do: Create fixture layout under `packages/test-fixtures` for future HTML, prompt-injection HTML, Ollama mock JSON, and local HTTP server utilities. Add README explaining tests must not use public internet. Create `.omo/evidence/` only if needed for local evidence outputs, and keep it out of product runtime code. Do not add real network calls.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: 8, 11, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` test rules; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 22.3 and 24.2.
  Acceptance criteria: Fixture README names required fixture categories; no test code references public URLs except fixed strings inside fixtures/docs.
  QA scenarios: happy: `rg "public internet|fixture|mock" packages/test-fixtures/README.md`, evidence `.omo/evidence/task-4-fixture-readme.txt`; failure: `rg "https?://" packages tests apps --glob '*.{ts,tsx,js,json,md}'` reviewed to ensure no public internet test dependency, evidence `.omo/evidence/task-4-no-public-internet.txt`.
  Commit: Y | `test(fixtures): define offline fixture conventions`

- [ ] 5. Implement `packages/contracts` smoke DTO and validation pattern
  What to do / Must NOT do: Add Zod schema(s) and exported TypeScript types for a minimal app info/smoke API, plus a reusable validation helper pattern for future IPC inputs/outputs. Do not add raw Electron IPC channel wrappers here. Avoid `any`; external data accepted as `unknown`.
  Parallelization: Wave 1 | Blocked by: 2, 3 | Blocks: 8, 9, 10, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` Zod/IPC rules; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` section 16 IPC contract.
  Acceptance criteria: Unit tests prove valid app-info payload passes and malformed payload fails with stable error information.
  QA scenarios: happy: `pnpm --filter @linkatlas/contracts test -- --run`, evidence `.omo/evidence/task-5-contracts-test.txt`; failure: test case with malformed `unknown` payload rejects without throwing raw stack to caller, evidence included in same test output.
  Commit: Y | `feat(contracts): add typed smoke contract`

- [ ] 6. Implement `packages/domain` pure models and interfaces
  What to do / Must NOT do: Add minimal domain exports needed by bootstrap and near-term tasks: branded IDs or string-id types if used, `AppError`/`ErrorCode` shape, `GenerationProvider`, `EmbeddingProvider`, `VectorIndex` interface stubs, `Document`/`DocumentVersion`/`ContentBlock`/`Job` type skeletons. Do not import Electron, SQLite, Ollama HTTP types, Node filesystem, or renderer code.
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 8, 10, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` architecture/coding rules; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 9.4, 15, 15.4.
  Acceptance criteria: Typecheck passes; boundary test or static scan proves forbidden imports are absent from `packages/domain/src`.
  QA scenarios: happy: `pnpm --filter @linkatlas/domain test -- --run`, evidence `.omo/evidence/task-6-domain-test.txt`; failure: static scan `rg "from ['\\\"](electron|better-sqlite3|sqlite3|ollama|node:fs|fs|child_process)" packages/domain/src` finds nothing, evidence `.omo/evidence/task-6-domain-boundary-scan.txt`.
  Commit: Y | `feat(domain): add pure core interfaces`

- [ ] 7. Scaffold React renderer shell without Node access
  What to do / Must NOT do: Create the renderer entry, app component, styles, and visible shell matching the design at a minimal level: sidebar labels and top URL/search/model-status area can be nonfunctional placeholders. Renderer must use browser APIs and typed preload declarations only. Do not import Node or Electron modules.
  Parallelization: Wave 1 | Blocked by: 3 | Blocks: 9, 14
  References: `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 18 and 23; `/Users/cheng80/Desktop/linkatlas/AGENTS.md` renderer boundary.
  Acceptance criteria: Renderer builds; static scan finds no Node/Electron imports in renderer source; UI text fits a minimal shell and does not claim unavailable features are working.
  QA scenarios: happy: `pnpm --filter @linkatlas/desktop build:renderer` or equivalent script, evidence `.omo/evidence/task-7-renderer-build.txt`; failure: `rg "from ['\\\"](electron|node:|fs|path|child_process|better-sqlite3|sqlite3)" apps/desktop/src/renderer` returns no matches, evidence `.omo/evidence/task-7-renderer-boundary.txt`.
  Commit: Y | `feat(desktop): add renderer shell`

- [ ] 8. Implement Electron main/preload security shell
  What to do / Must NOT do: Create Electron main and preload entrypoints. Main creates BrowserWindow with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, no remote module, and a restrictive default navigation/open-window policy. Preload exposes only the typed smoke API. Do not expose generic filesystem, SQL, shell, network, or raw IPC methods.
  Parallelization: Wave 1 | Blocked by: 4, 5, 6 | Blocks: 9, 10, 12, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` Electron/security rules; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 8.1, 16, 19.3; `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md` Task 00.
  Acceptance criteria: Desktop build succeeds; automated test or AST/static assertion verifies BrowserWindow security flags; preload API surface is limited to smoke namespace.
  QA scenarios: happy: `pnpm --filter @linkatlas/desktop test -- --run` with BrowserWindow config/preload tests, evidence `.omo/evidence/task-8-electron-security-test.txt`; failure: test asserts forbidden API names are absent from exposed preload keys, evidence same file.
  Commit: Y | `feat(desktop): add secure Electron shell`

- [ ] 9. Wire typed smoke API from renderer through preload
  What to do / Must NOT do: Renderer calls `window.linkAtlas.app.getVersion()` or equivalent typed preload method and displays the result. Add global type declarations for `window.linkAtlas`. Validate returned data through contracts. Do not use `ipcRenderer` directly in renderer.
  Parallelization: Wave 1 | Blocked by: 5, 7, 8 | Blocks: 12, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` preload allowlist rule; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` section 16.
  Acceptance criteria: Unit/e2e smoke confirms renderer receives a valid app info value; static scan confirms renderer has no `ipcRenderer` reference.
  QA scenarios: happy: Playwright Electron smoke command such as `pnpm test:e2e -- --grep "smoke"` after configured, evidence `.omo/evidence/task-9-electron-smoke.txt`; failure: `rg "ipcRenderer|contextBridge" apps/desktop/src/renderer` returns no matches, evidence `.omo/evidence/task-9-no-renderer-ipc.txt`.
  Commit: Y | `feat(desktop): wire typed preload smoke api`

- [ ] 10. Add lint/type/test boundary checks as first-class tests
  What to do / Must NOT do: Add tests or scripts that enforce no forbidden imports in renderer/domain, no generic preload API names, and strict public API typing where practical. Keep checks deterministic and local. Do not rely on grep-only if AST or TypeScript-aware check is reasonable; grep/static scan is acceptable for bootstrap guardrails if documented.
  Parallelization: Wave 2 | Blocked by: 2, 5, 6, 8 | Blocks: 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` architecture/security/coding rules.
  Acceptance criteria: `pnpm lint`, `pnpm typecheck`, and `pnpm test` fail if a forbidden import/API is introduced.
  QA scenarios: happy: `pnpm test -- --run`, evidence `.omo/evidence/task-10-boundary-tests.txt`; failure: local negative fixture or documented temporary mutation proves a boundary check catches a violation, reverted before commit, evidence `.omo/evidence/task-10-negative-boundary.txt`.
  Commit: Y | `test(boundaries): enforce runtime separation`

- [ ] 11. Add future-task readiness docs for storage, fetch, and extraction
  What to do / Must NOT do: Add a short `docs/IMPLEMENTATION_NOTES.md` or equivalent planning doc that maps Task 01-03 to current packages and exact future package creation boundaries. Include SQLite migration guardrails, URL SSRF rules, fixture HTTP server plan, Readability sanitization, block ID stability, and prompt injection fixtures. Do not implement these features yet.
  Parallelization: Wave 2 | Blocked by: 4, 8 | Blocks: 13, 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md`; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 10, 15, 19, 22; `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md` Tasks 01-03.
  Acceptance criteria: Doc lists Task 01, 02, and 03 with package ownership, must-have tests, and must-not-have constraints.
  QA scenarios: happy: `rg "Task 01|Task 02|Task 03|SSRF|migration|block ID|prompt injection" docs/IMPLEMENTATION_NOTES.md`, evidence `.omo/evidence/task-11-readiness-doc.txt`; failure: doc explicitly states public internet tests are forbidden, evidence same file.
  Commit: Y | `docs(implementation): record next-slice readiness`

- [ ] 12. Add desktop app visual/manual smoke path
  What to do / Must NOT do: Configure a deterministic way to run the desktop app locally for manual QA, such as `pnpm --filter @linkatlas/desktop dev` plus Playwright Electron smoke or packaged main-process smoke. If full Playwright Electron is not feasible in this slice, document the blocker and provide the closest automated Electron launch test. Do not substitute a unit test for the final surface check unless Electron launch is technically blocked and recorded.
  Parallelization: Wave 2 | Blocked by: 8, 9 | Blocks: 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` E2E rule; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 18, 22.4, 25.
  Acceptance criteria: One command starts or launches the desktop shell; evidence captures displayed shell text and smoke API value; cleanup stops the process.
  QA scenarios: happy: exact command chosen by implementation, e.g. `pnpm test:e2e -- --grep "desktop smoke"`, evidence `.omo/evidence/task-12-desktop-smoke.txt`; failure: launch with missing/invalid preload path or invalid config fails in test, evidence `.omo/evidence/task-12-desktop-failure.txt`.
  Commit: Y | `test(desktop): add Electron smoke path`

- [ ] 13. Review dependency choices and license/packaging notes
  What to do / Must NOT do: Record in implementation notes or package docs the dependencies added in Task 00, why they are maintained enough, license compatibility, Electron packaging compatibility, native binary status, and replaceability. Do not add sqlite-vec, Readability, Ollama clients, or packaging dependencies before their actual slice unless required by bootstrap.
  Parallelization: Wave 2 | Blocked by: 11 | Blocks: 14
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` dependency checklist; `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` sections 7 and 21.
  Acceptance criteria: Dependency notes cover every newly added production and dev dependency category; native binary status is explicit.
  QA scenarios: happy: `pnpm list --depth 0` plus dependency note review, evidence `.omo/evidence/task-13-dependency-review.txt`; failure: `rg "native binary|license|Electron packaging|replace" docs apps packages README.md` confirms checklist terms are present, evidence `.omo/evidence/task-13-dependency-checklist.txt`.
  Commit: Y | `docs(deps): document bootstrap dependency rationale`

- [ ] 14. Run full bootstrap verification and cleanup
  What to do / Must NOT do: Run all required commands, capture evidence under `.omo/evidence/`, inspect changed files, ensure no unrelated files changed, and update final handoff notes. Do not weaken tests or remove failures. If `pnpm test:integration` or `pnpm test:e2e` is intentionally empty/not configured, command must still exist and produce a clear pass or documented no-op output.
  Parallelization: Wave 3 | Blocked by: 1-13 | Blocks: final verification
  References: `/Users/cheng80/Desktop/linkatlas/AGENTS.md` completion commands and reporting format.
  Acceptance criteria: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, and `pnpm test:e2e` have captured outputs; `git status --short` contains only intended files; no running dev server or Electron process remains.
  QA scenarios: happy: run required commands and save outputs to `.omo/evidence/task-final-*`, evidence as listed in Verification strategy; failure: `pgrep -fl "electron|vite"` reviewed after cleanup so no leftover process from QA remains, evidence `.omo/evidence/task-14-cleanup.txt`.
  Commit: Y | `chore(bootstrap): verify LinkAtlas foundation`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Tool/invocation: read this plan and final diff, then verify every todo is satisfied and every Must NOT Have remains true. Evidence `.omo/evidence/f1-plan-compliance.txt`.
- [ ] F2. Code quality review
  Tool/invocation: inspect TypeScript/Electron code plus `pnpm lint`, `pnpm typecheck`, `pnpm test` outputs. Evidence `.omo/evidence/f2-code-quality.txt`.
- [ ] F3. Real manual QA
  Tool/invocation: drive the desktop shell via Playwright Electron or the configured desktop smoke command. Binary observable: app shell launches, shows smoke API value, and renderer lacks Node globals. Evidence `.omo/evidence/f3-real-manual-qa.txt` plus screenshot if browser/GUI runner supports it.
- [ ] F4. Scope fidelity
  Tool/invocation: `git diff --stat`, `git diff --name-only`, and static scans for forbidden runtime imports/dependencies. Binary observable: only bootstrap files changed; no storage/fetch/Ollama/browser-extension implementation snuck in. Evidence `.omo/evidence/f4-scope-fidelity.txt`.

## Commit strategy
- Use small conventional commits matching todo commit lines when feasible.
- Each commit should pass the relevant local checks for its slice; final branch must pass all required commands.
- Do not auto-commit unless the user explicitly asks. If staging succeeds later, report with the required Codex git directive.
- Suggested final commit sequence:
  1. `build(workspace): bootstrap pnpm workspace`
  2. `build(tooling): add strict TypeScript and test baseline`
  3. `chore(repo): add workspace package layout`
  4. `feat(contracts): add typed smoke contract`
  5. `feat(domain): add pure core interfaces`
  6. `feat(desktop): add secure Electron shell`
  7. `test(boundaries): enforce runtime separation`
  8. `docs(implementation): record next-slice readiness`
  9. `chore(bootstrap): verify LinkAtlas foundation`

## Success criteria
- A fresh checkout can run `pnpm install` and then the required check commands.
- A minimal desktop app launches on macOS with Electron security defaults enforced.
- Renderer can call exactly the typed preload smoke API and cannot access Node/Electron APIs directly.
- `packages/contracts` and `packages/domain` exist with tests and READMEs.
- Future Task 01-03 boundaries are documented and testable.
- No public internet tests exist.
- No app runtime dependency on Codex, OMO, `.omo`, or autonomous agent frameworks exists.
- Final evidence files show command outputs, real desktop smoke proof, security boundary proof, and cleanup receipt.
