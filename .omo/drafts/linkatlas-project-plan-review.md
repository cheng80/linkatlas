# LinkAtlas Project Plan Review Draft

status: awaiting-approval
pending_action: write .omo/plans/linkatlas-bootstrap-workplan.md after explicit approval
intent: UNCLEAR / Architecture
tier: HEAVY - repository has no implementation yet; plan affects monorepo structure, Electron security boundary, storage, IPC, LLM adapters, migrations, and test strategy.
created_at: 2026-06-19

## Skill Survey

- omo:ulw-plan: used. User invoked it directly and requested project-wide detailed planning.
- caveman: active in lite mode. Responses remain concise Korean.
- codegraph: attempted first for architecture survey; returned no relevant code because repository currently has no implementation source.

Subagents were not spawned. The current tool policy says not to spawn subagents unless the user explicitly asks for subagents or parallel agent work. This draft records the same planning work directly.

## Evidence Read

- `/Users/cheng80/Desktop/linkatlas/AGENTS.md`: product rules, architecture boundaries, security rules, test commands, completion report format.
- `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md`: Draft v0.1 full product, architecture, data model, IPC, security, test strategy, roadmap, ADRs.
- `/Users/cheng80/Desktop/linkatlas/README.md`: design-pack usage points to `docs/CODEX_EXECUTION_PLAN.md` and schema.
- `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md`: existing Task 00-11 vertical-slice sequence.
- `/Users/cheng80/Desktop/linkatlas/schemas/document-analysis.schema.json`: structured document analysis output schema.
- `git status --porcelain=v1 --untracked-files=all`: clean before this `.omo` draft.
- `git ls-files`: only `.gitignore`, AGENTS, execution plan, design, README, and schema are tracked.

## Current Repository State

- This is a design pack, not an application implementation.
- No `package.json`, `pnpm-workspace.yaml`, `apps/`, `packages/`, migrations, tests, or CI files exist yet.
- No ADR directory exists; ADRs are embedded in `DESIGN.md` section 26.
- No current tests exist; Task 00 must establish test infrastructure before feature work.
- `.codegraph` symlink exists, but source survey cannot return relevant code until implementation files exist.

## Topology Lock

1. Foundation: pnpm monorepo, TypeScript strict, lint/format/typecheck/test, CI-ready scripts.
2. Desktop security shell: Electron main/preload/renderer separation, `nodeIntegration=false`, `contextIsolation=true`, sandbox on, typed allowlist API.
3. Contracts and domain core: Zod DTOs, pure domain types, provider/index interfaces, stable error model.
4. Storage backbone: SQLite, migrations, WAL, repositories, FTS/vector extension boundary.
5. Ingestion and analysis pipeline: URL validation, fixture fetch, Readability, block IDs, queue, Ollama adapters, prompts, schema validation.
6. User-visible vertical slices: URL add -> library card -> summary -> search -> related -> Ask -> extension -> export/package.

## Findings

- Existing `CODEX_EXECUTION_PLAN.md` has a good macro order, but Task 00 is too compressed. It mixes app scaffolding, contracts/domain, Electron shell, lint/format/typecheck/test, and security validation in one step. Worker plan should split Task 00 into verifiable sub-todos.
- Storage should come before URL fetch only if contracts/domain already define `Document`, `DocumentVersion`, `ContentBlock`, `Job`, and stable `errorCode`. Otherwise later tasks will backfill core types.
- IPC and security tests must be introduced in Task 00, not deferred. Renderer Node leakage and preload allowlist are architectural invariants.
- Prompt files should be created before the LLM adapter integration reaches document analysis, because AGENTS forbids scattered prompt strings.
- Migration tests need an explicit "never edit old migration" rule in todo acceptance criteria.
- Browser extension should remain late. Native Messaging contracts should still be modeled early in `packages/contracts` to prevent IPC shape drift.
- `schemas/document-analysis.schema.json` is useful, but implementation should generate matching Zod schemas or validate JSON Schema plus app-level evidence block IDs. Do not rely on model JSON alone.
- There is no current package README. Each new package todo should require a short README describing responsibility and forbidden dependencies.

## Adopted Defaults

- Treat first executable plan as "M0 bootstrap through first local vertical slice", not the entire app through M7, because the repo has no runtime code and large end-to-end implementation would blur task boundaries.
- Keep `docs/CODEX_EXECUTION_PLAN.md` as roadmap source, but write a more decision-complete worker plan for Task 00 plus readiness gates for Task 01-03.
- Use tests-after for pure scaffolding files that cannot fail before code exists, but use failing-first tests for security contracts, URL validation, migrations, extraction, and schema validation once those modules exist.
- Use Vitest for unit/integration, Playwright Electron for shell smoke, and fixed local fixtures only. No public internet in tests.
- Default bundle id placeholder: `app.linkatlas.desktop` until user chooses final identity. This is reversible before packaging.
- Default minimum macOS: current Electron supported baseline at implementation time, documented in package metadata. Verify with official Electron docs during Task 00 implementation.

## Recommended Work Plan Shape

### Wave 0 - Bootstrap Planning Hygiene

- Move design docs toward target layout without breaking links: create `docs/` copies or plan a docs move only if the worker can update references atomically.
- Add package/workspace scaffolding.
- Add package README stubs.
- Add ADR directory and extract embedded ADRs only if the user wants docs normalization; otherwise leave embedded ADRs and create new ADRs only for new decisions.

### Wave 1 - Toolchain and Type Boundary

- Root `package.json`, `pnpm-workspace.yaml`, TS configs, ESLint, Prettier, Vitest.
- `packages/contracts`: Zod schemas and typed DTO skeletons for app info and a minimal preload smoke API.
- `packages/domain`: pure domain types and interfaces, with no Electron/SQLite/Ollama imports.
- Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test`.

### Wave 2 - Electron Security Shell

- `apps/desktop`: Electron main, preload, React renderer via Vite.
- BrowserWindow security settings enforce AGENTS invariants.
- Preload exposes one typed allowlist API, e.g. `app.getVersion()`.
- Renderer uses only preload API.
- Verification: Playwright Electron smoke or nearest supported Electron launch smoke; inspect webPreferences and renderer behavior.

### Wave 3 - First Slice Readiness

- Add test fixture layout and local HTTP fixture server utility for future URL tests.
- Add preliminary IPC validation pattern using Zod.
- Add explicit error model with stable `errorCode` and user-safe message separation.
- Add prompts directory placeholder with README, not production prompts yet.

### Wave 4 - Final Verification and Handoff

- Run full available checks.
- Confirm no product runtime dependency on Codex or agent frameworks.
- Confirm dirty worktree only contains intended scaffold files.
- Produce next-step plan for Task 01 SQLite and migration.

## Must Not Have

- No renderer direct access to filesystem, SQLite, shell, network, or Ollama.
- No `nodeIntegration=true`.
- No disabled `contextIsolation` or renderer sandbox.
- No `any`, `@ts-ignore`, or type suppression.
- No public internet tests.
- No Codex/agent runtime dependency in app code.
- No prompt strings scattered inside implementation modules.
- No generic preload APIs such as `execute`, `readFile`, `writeFile`, or `querySql`.

## Success Criteria for Formal Plan

1. Worker can execute Task 00 without asking architectural questions.
2. Every todo names exact paths to create/edit and exact forbidden imports/settings.
3. Every todo includes agent-executable acceptance criteria.
4. Every behavior-affecting todo includes a test or explicit scaffold exemption.
5. Final verification wave includes lint, typecheck, unit tests, Electron smoke, security boundary check, and dirty-worktree review.

## Approval Gate

Recommended pending action: write `.omo/plans/linkatlas-bootstrap-workplan.md` as a decision-complete Task 00 bootstrap plan, with readiness notes for Task 01-03.

Approval needed: user says to proceed/write the plan. Approval only authorizes the plan file, not implementation.
