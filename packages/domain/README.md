# @linkatlas/domain

Pure LinkAtlas domain types and interfaces.

## Responsibility

- Own implementation-independent document, job, provider, and vector-index contracts.
- Make app-level error codes explicit and stable.
- Stay reusable from Electron main, tests, and future adapters.

## Allowed Dependencies

- TypeScript standard library types.
- Pure type-only utility modules in this package.

## Forbidden Dependencies

- Electron.
- SQLite or sqlite-vec packages.
- Ollama HTTP clients or model runtime adapters.
- Node filesystem, shell, or network implementation modules.

## Test

```bash
pnpm --filter @linkatlas/domain test
```
