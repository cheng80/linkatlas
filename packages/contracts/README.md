# @linkatlas/contracts

Typed IPC and extension DTO contracts for LinkAtlas.

## Responsibility

- Own Zod schemas for data crossing process or extension boundaries.
- Export inferred TypeScript DTO types from those schemas.
- Keep schema parsing at the boundary; internal packages receive typed values.

## Allowed Dependencies

- Zod.
- Pure TypeScript utility code.

## Forbidden Dependencies

- Electron main/preload runtime APIs.
- SQLite or vector database packages.
- Ollama or HTTP transport implementations.
- Filesystem, shell, or generic IPC executors.

## Test

```bash
pnpm --filter @linkatlas/contracts test
```
