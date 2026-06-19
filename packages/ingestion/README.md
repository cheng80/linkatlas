# @linkatlas/ingestion

Safe URL validation and fixture-friendly HTML fetching.

## Dependency Review

No runtime dependency is introduced for HTTP in this slice. The implementation uses Node `http`/`https` directly so redirect validation, timeout, and response-size limits remain explicit and testable.
