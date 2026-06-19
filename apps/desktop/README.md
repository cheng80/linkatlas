# @linkatlas/desktop

Electron desktop shell for LinkAtlas.

## Responsibility

- Own Electron main, preload, and React renderer entrypoints.
- Keep renderer isolated from Node, Electron, filesystem, SQLite, shell, network adapters, and Ollama adapters.
- Expose only typed preload APIs backed by contracts.

## Allowed Dependencies

- Electron in main/preload code.
- React in renderer code.
- `@linkatlas/contracts` for typed DTOs.

## Forbidden Dependencies

- Generic preload APIs such as `execute`, `readFile`, `writeFile`, or `querySql`.
- SQLite, Ollama, or filesystem access from renderer code.
- Public internet calls in tests.

## Test

```bash
pnpm --filter @linkatlas/desktop test
pnpm test:e2e
```
