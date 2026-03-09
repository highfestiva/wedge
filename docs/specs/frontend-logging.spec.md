# Frontend Logging

## Overview

The frontend uses a tagged console-logging utility to provide visibility into application behavior in the browser console and container logs.

## Logger Utility

- **Source:** [frontend/src/utils/logger.ts](../../frontend/src/utils/logger.ts)
- Factory function: `createLogger(tag: string)` → `Logger`
- Returns an object with `info`, `warn`, and `error` methods.
- All output is prefixed with `[wedge:<tag>]` for easy filtering.

| Method | Console API | Example Output |
|--------|-------------|----------------|
| `info` | `console.log` | `[wedge:board] loaded 5 issues` |
| `warn` | `console.warn` | `[wedge:issue] unexpected state` |
| `error` | `console.error` | `[wedge:graphql] error { message: "..." }` |

## Logger Instances

| Tag | Used In | Purpose |
|-----|---------|---------|
| `"board"` | [BoardPage.tsx](../../frontend/src/pages/BoardPage.tsx) | Logs issue loading count and mutation triggers |
| `"issue"` | [IssueDetailPage.tsx](../../frontend/src/pages/IssueDetailPage.tsx) | Logs issue detail loading and field updates |
| `"graphql"` | [logExchange.ts](../../frontend/src/graphql/logExchange.ts) | Logs GraphQL operations and errors (via direct `console.log` calls, not yet using `createLogger`) |

## Additional Logging

- **RouteLogger** in [App.tsx](../../frontend/src/App.tsx): Logs route changes via raw `console.log("[router] navigated to", path)`. Does not use `createLogger`.

## Log Exchange

- **Source:** [frontend/src/graphql/logExchange.ts](../../frontend/src/graphql/logExchange.ts)
- A urql `Exchange` that intercepts the operation pipeline:
  - Logs outgoing operations: kind (query/mutation) and operation name.
  - Logs errors from responses.
- Implemented and tested but not yet added to the client's exchange array.
