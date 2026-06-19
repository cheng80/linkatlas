---
slug: linkatlas-bootstrap-workplan
status: plan-written
intent: unclear
pending-action: execute only after explicit `$start-work` or equivalent instruction
approach: Produce a decision-complete bootstrap plan for Task 00, with readiness gates for Task 01-03. No product code implementation in this planning turn.
---

# Draft: linkatlas-bootstrap-workplan

## Components (topology ledger)

| id | outcome | status | evidence path |
| --- | --- | --- | --- |
| C1 | Foundation workspace and toolchain exists with strict TypeScript, pnpm, lint, format, Vitest, and root scripts. | active | `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md`, `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md` |
| C2 | Contracts/domain packages establish typed IPC DTOs, Zod validation, pure domain types, provider interfaces, and error model. | active | `/Users/cheng80/Desktop/linkatlas/AGENTS.md`, `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` |
| C3 | Electron desktop shell enforces renderer isolation and exposes only typed preload allowlist API. | active | `/Users/cheng80/Desktop/linkatlas/AGENTS.md`, `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` |
| C4 | Test/evidence infrastructure exists for future fixture-only integration and E2E work. | active | `/Users/cheng80/Desktop/linkatlas/AGENTS.md`, `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md` |
| C5 | Task 01-03 readiness boundaries are recorded so the next worker does not blur storage, fetch, and extraction responsibilities. | active | `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md` |

## Open assumptions (announced defaults)

| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| First implementation target | Task 00 bootstrap only, with readiness gates for Task 01-03 | Repository has no runtime code; full-app implementation would mix too many vertical slices. | Yes |
| Package manager | pnpm workspaces | Required by AGENTS and DESIGN. | No, unless project rules change |
| UI shell stack | Electron + React + Vite + TypeScript | Required by DESIGN and Task 00. | No for MVP |
| Runtime identity | bundle id placeholder `app.linkatlas.desktop` | Final app name/bundle id is still a design open item; placeholder unblocks local dev. | Yes |
| Test approach | tests-after for pure scaffolding, failing-first for behavior once a seam exists | Empty repo cannot fail a module test before module exists; security/validation behavior must be proved by tests. | Yes |
| Package docs | Each new package gets a small README | AGENTS says read relevant package README; new packages need their own local contract. | Yes |
| External docs | Verify Electron baseline and current package APIs during implementation | DESIGN references modern Electron security constraints; versions may change. | Yes |

## Findings (cited - path:lines)

- `/Users/cheng80/Desktop/linkatlas/AGENTS.md`: renderer must not access filesystem, SQLite, network, shell, or Ollama directly; preload must expose typed allowlist API only; `nodeIntegration=false`, `contextIsolation=true`, renderer sandbox on.
- `/Users/cheng80/Desktop/linkatlas/AGENTS.md`: TypeScript strict, no `any`, public input/output types, Zod validation for IPC, no generic execute/read/write/query SQL APIs.
- `/Users/cheng80/Desktop/linkatlas/AGENTS.md`: tests must avoid public internet and use fixtures/mocks for HTML and Ollama responses.
- `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md`: recommended repo shape includes `apps/desktop`, `packages/contracts`, `packages/domain`, `packages/storage`, `packages/ingestion`, `packages/llm`, `packages/search`, `packages/knowledge-graph`, `packages/prompts`, and tests.
- `/Users/cheng80/Desktop/linkatlas/docs/DESIGN.md`: M0 requires pnpm monorepo, Electron/React shell, contracts/domain packages, lint/format/typecheck/tests, SQLite migration runner, CI.
- `/Users/cheng80/Desktop/linkatlas/docs/CODEX_EXECUTION_PLAN.md`: Task 00 asks for pnpm workspace monorepo, Electron main/preload/renderer split, `packages/contracts`, `packages/domain`, security defaults, and passing `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `/Users/cheng80/Desktop/linkatlas/schemas/document-analysis.schema.json`: document analysis schema already exists and should be wired later through app validation plus evidence block ID checks.
- `git ls-files`: no implementation packages, package manifest, tests, or migrations are present yet.

## Decisions (with rationale)

- Plan scopes execution to Task 00 plus readiness gates, not Tasks 01-11. Rationale: the repo currently has only design files; bootstrapping must establish boundaries before feature slices.
- Contracts/domain are part of Task 00. Rationale: later storage, ingestion, LLM, and IPC tasks need stable DTOs, pure domain types, and provider interfaces.
- Security invariants get tests/smoke checks in Task 00. Rationale: Electron security settings are foundational and expensive to retrofit.
- `DESIGN.md` and `CODEX_EXECUTION_PLAN.md` now live under `docs/`. Rationale: user explicitly requested the move after plan creation; future execution must use the new paths.
- Package READMEs are required as part of new package creation. Rationale: AGENTS expects related package README to be read before future work.
- `.omo` plan artifacts are not product runtime inputs. Rationale: AGENTS forbids Codex/agent runtime dependency, not local planning files.

## Scope IN

- Create a decision-complete worker plan for bootstrapping LinkAtlas from the current design pack.
- Include exact intended paths, guardrails, acceptance criteria, QA scenarios, and commit slices.
- Include readiness notes for SQLite/migrations, URL fetch, and Readability extraction.
- Keep implementation out of this planning turn.

## Scope OUT (Must NOT have)

- No product code edits during this planning turn.
- No dependency install during this planning turn.
- No commits during this planning turn.
- No broad roadmap rewrite beyond Task 00 and Task 01-03 readiness.
- No runtime dependency on Codex, OMO, `.omo`, or autonomous agent frameworks.

## Open questions

- None blocking the formal plan. Final bundle identifier, minimum macOS version, and release packaging details remain later product decisions and are not required for Task 00.

## Approval gate

status: approved-and-written
approval_source: user said "정식 계획 작성" after the plan review draft asked for explicit approval.
next_action: user may start execution with `$start-work` or equivalent explicit instruction.
