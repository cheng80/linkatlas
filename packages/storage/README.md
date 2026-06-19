# @linkatlas/storage

SQLite adapter package for LinkAtlas.

## Dependency Review

- `better-sqlite3`: actively maintained SQLite binding used by many Electron/Node apps; MIT license; native binary dependency that must be rebuilt for Electron packaging; isolated behind this package so storage can be swapped later.
- `zod`: already used in contracts; MIT license; pure TypeScript runtime validation for parsing SQLite rows at the package boundary.
