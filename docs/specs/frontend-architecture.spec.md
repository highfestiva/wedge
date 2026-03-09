# Frontend Architecture: Pages & Components

## Overview

The frontend uses a container/presentational component pattern. Route-level "page" components handle data fetching and navigation logic, then delegate rendering to stateless presentational components.

## Directory Structure

```
src/
  pages/          # Data-fetching containers (route-level)
    BoardPage.tsx
    IssueDetailPage.tsx
  components/     # Presentational UI components
    BoardView.tsx
    IssueDetailView.tsx
    IssueCard.tsx
    Header.tsx
    ProjectSelector.tsx
    CreateIssueForm.tsx
    CommentsSection.tsx
    ThemeToggle.tsx
    NotFound.tsx
  graphql/        # GraphQL client, queries, mutations, exchanges
    client.ts
    queries.ts
    mutations.ts
    logExchange.ts
  utils/          # Shared utilities
    logger.ts
  types.ts        # Centralized TypeScript type definitions
```

## Page Components

### BoardPage

- **Source:** [frontend/src/pages/BoardPage.tsx](../../frontend/src/pages/BoardPage.tsx)
- Reads `projectId` from route params.
- Fetches issues via `useQuery(ISSUES_QUERY, { projectId })`.
- Passes `issues`, `loading`, `error` to `<BoardView>`.
- Wires callbacks:
  - `onMoveIssue` — executes `UPDATE_ISSUE_MUTATION` with new state.
  - `onIssueClick` — navigates to `/projects/:projectId/issues/:identifier`.
  - `onCreateIssue` — toggles inline `<CreateIssueForm>` which calls `CREATE_ISSUE_MUTATION`.

### IssueDetailPage

- **Source:** [frontend/src/pages/IssueDetailPage.tsx](../../frontend/src/pages/IssueDetailPage.tsx)
- Reads `identifier` from route params.
- Fetches a single issue via `useQuery(ISSUE_QUERY, { identifier })`.
- Passes `issue`, `loading`, `error` to `<IssueDetailView>`.
- Wires callbacks:
  - `onUpdateField(field, value)` — executes `UPDATE_ISSUE_MUTATION` with dynamic field.
  - `onAddComment(body)` — executes `ADD_COMMENT_MUTATION`.

## Presentational Components

Presentational components receive all data via props and communicate upward through callback props. They contain no data-fetching or routing logic.

- **BoardView** — Kanban board with columns per `IssueState`. Supports HTML5 native drag-and-drop (`draggable`, `onDragStart`, `onDrop`) for moving issues between columns.
- **IssueDetailView** — Full issue detail view with inline-editable title, state/priority/assignee/label selectors, description textarea, comments section, and history timeline.
- **Header** — App header with logo and project selector. **Note:** Currently performs data fetching (`useQuery` for projects) and navigation directly, which deviates from the pure presentational pattern.
- **ProjectSelector** — `<select>` dropdown receiving `projects`, `currentProjectId`, and `onSelect` callback.

## Routing

- **Source:** [frontend/src/App.tsx](../../frontend/src/App.tsx)
- All routes defined in a single flat `<Routes>` block.

| Path | Component | Description |
|------|-----------|-------------|
| `/projects/:projectId/board` | `BoardPage` | Kanban board for a project |
| `/projects/:projectId/issues/:identifier` | `IssueDetailPage` | Single issue detail view |
| `/` | `Navigate` → `/projects/default/board` | Root redirect |
| `*` | `NotFound` | 404 catch-all |

## Type System

- **Source:** [frontend/src/types.ts](../../frontend/src/types.ts)
- Centralized definitions for `Issue`, `Project`, `Comment`, `HistoryEntry`, `IssueState`, `Priority`, `CreateIssueInput`, `UpdateIssueInput`, etc.
- Both `pages/` and `components/` import exclusively from `types.ts`.
