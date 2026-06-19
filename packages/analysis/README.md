# @linkatlas/analysis

Structured document analysis pipeline.

## Owns

- Chunk summary to document reduce orchestration.
- JSON Schema requests and Zod validation.
- Evidence block ID validation.
- Prompt/model metadata for persistence.

## Must not own

- Ollama HTTP details.
- SQLite writes.
- Renderer APIs.
