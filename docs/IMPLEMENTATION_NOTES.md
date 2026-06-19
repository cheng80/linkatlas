# LinkAtlas Implementation Notes

These notes map the next implementation slices after bootstrap. They do not replace
`docs/DESIGN.md` or `docs/CODEX_EXECUTION_PLAN.md`.

## Task 01 - SQLite And Migrations

Package owner: `packages/storage`.

Must have:

- SQLite connection factory with WAL mode and foreign keys enabled.
- Forward-only migration runner.
- Temporary database support for tests.
- Transaction helper.
- Repository integration tests for `Document`, `DocumentVersion`, and `ContentBlock`.

Must not have:

- Edits to an existing migration after it has shipped.
- SQLite imports in `packages/domain`.
- Renderer access to SQL or generic `querySql` IPC.

Evidence:

- Migration re-run test.
- Document round-trip integration test.
- App restart persistence test when the desktop slice reaches storage.

## Task 02 - URL Validation And Fixture Fetch

Package owner: `packages/ingestion` for validation/fetching, `packages/contracts` for IPC DTOs,
and Electron main process for IPC registration.

Must have:

- `http` and `https` only.
- Production default blocks localhost, loopback, link-local, and private networks.
- Test allowlist for a local fixture HTTP server.
- Redirect target validation on every hop.
- Timeout and response-size limits.
- Zod validation at IPC boundaries.

Must not have:

- Public internet in tests.
- Renderer direct network calls.
- Shell/file/network tool access inside extraction prompts.

Evidence:

- Fixture HTTP server tests for allowed local test URLs.
- SSRF blocking tests for localhost, private ranges, and redirects.
- Timeout and oversized-response tests.

## Task 03 - Readability Extraction

Package owner: `packages/ingestion`.

Must have:

- JSDOM and Mozilla Readability extraction.
- HTML sanitization before storage/display.
- Stable block IDs for identical normalized input.
- Fixtures for Korean, English, code blocks, tables, short pages, noisy pages, and prompt injection.
- Output shape that can later feed `schemas/document-analysis.schema.json`.

Must not have:

- Script or event-handler preservation from external HTML.
- Prompt strings embedded inside implementation modules.
- Public internet fixture fetching.

Evidence:

- Fixed fixture extraction tests.
- Script/event handler removal test.
- Stable block ID repeatability test.
- Prompt injection fixture retained as a security regression test.

## Dependency Review Rule

Every new dependency must record:

- Maintenance status.
- License.
- Electron packaging compatibility.
- Native binary status.
- Replaceable interface or adapter boundary.
