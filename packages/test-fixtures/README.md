# @linkatlas/test-fixtures

Fixture-only test assets for LinkAtlas.

## Responsibility

- Hold fixed HTML, Markdown, prompt-injection, and mock Ollama response fixtures.
- Provide local-only fixture conventions for future HTTP server tests.
- Keep test data deterministic and committed.

## Required Fixture Categories

- HTML blog article.
- HTML technical documentation.
- Korean and English documents.
- Code block and table-heavy pages.
- Prompt injection page content.
- Ollama structured-output success and failure JSON.

## Network Rule

Tests must not access the public internet. Use local fixture files, local test HTTP servers, or mock transports.

## Forbidden Dependencies

- Production app runtime imports.
- Public network requests.
- User-private document content.
