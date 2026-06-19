# @linkatlas/llm

Ollama adapters for LinkAtlas provider interfaces.

## Owns

- Ollama HTTP transport wrapping.
- Generation, structured output, chat streaming, and embeddings adapters.
- Mockable transport for tests.

## Must not own

- Renderer APIs.
- SQLite persistence.
- Prompt text storage.
- Domain model decisions beyond provider interfaces.
