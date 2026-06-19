# @linkatlas/prompts

Versioned prompt files for LinkAtlas model calls.

## Responsibility

- Store prompt text in versioned directories.
- Keep prompt names, versions, and intended schemas explicit.
- Prevent prompt strings from being scattered through implementation code.

## Initial Layout

```text
document-analysis/v1/system.md
document-analysis/v1/user.md
chunk-summary/v1/system.md
relation-label/v1/system.md
rag-answer/v1/system.md
```

## Forbidden Dependencies

- Runtime TypeScript imports from app code.
- Unversioned prompt edits.
- Prompts that grant shell, file, or network tool access to extracted webpage content.
