# Frontend GraphQL Client

## Overview

The frontend communicates with the backend via a urql GraphQL client. The client is configured once and provided to the React component tree through urql's `<Provider>`.

## Client Configuration

- **Source:** [frontend/src/graphql/client.ts](../../frontend/src/graphql/client.ts)
- **Library:** urql (`@urql/core`)
- **Endpoint:** `/graphql` (relative — routed through the Vite dev proxy or a production reverse proxy)
- **Exchanges:** `fetchExchange` only (default urql fetch-based transport)
- **Authentication:** `X-User` header set to `"anonymous"` via `fetchOptions`. This is a placeholder; real authentication is not yet implemented.

## Provider Wiring

- **Source:** [frontend/src/App.tsx](../../frontend/src/App.tsx)
- The `<Provider value={client}>` wraps the entire `<BrowserRouter>` tree, making urql hooks (`useQuery`, `useMutation`) available to all components.

## Query & Mutation Documents

All GraphQL operations are defined as plain template-literal strings (not `gql`-tagged):

| Document | File | Purpose |
|----------|------|---------|
| `PROJECTS_QUERY` | [queries.ts](../../frontend/src/graphql/queries.ts) | Fetch all projects |
| `ISSUE_QUERY` | [queries.ts](../../frontend/src/graphql/queries.ts) | Fetch a single issue by identifier (full detail with comments and history) |
| `ISSUES_QUERY` | [queries.ts](../../frontend/src/graphql/queries.ts) | Fetch paginated issues for a project (summary fields only) |
| `CREATE_PROJECT_MUTATION` | [mutations.ts](../../frontend/src/graphql/mutations.ts) | Create a new project |
| `CREATE_ISSUE_MUTATION` | [mutations.ts](../../frontend/src/graphql/mutations.ts) | Create a new issue |
| `UPDATE_ISSUE_MUTATION` | [mutations.ts](../../frontend/src/graphql/mutations.ts) | Update issue fields (title, state, priority, etc.) |
| `ADD_COMMENT_MUTATION` | [mutations.ts](../../frontend/src/graphql/mutations.ts) | Add a comment to an issue |
| `DELETE_ISSUE_MUTATION` | [mutations.ts](../../frontend/src/graphql/mutations.ts) | Delete an issue (defined but not yet used) |

## Log Exchange

- **Source:** [frontend/src/graphql/logExchange.ts](../../frontend/src/graphql/logExchange.ts)
- A urql `Exchange` that logs outgoing operations (query/mutation name) and incoming errors to the console.
- **Status:** Implemented and tested but not yet wired into the client's exchange pipeline.
