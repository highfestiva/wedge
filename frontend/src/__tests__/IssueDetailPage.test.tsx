import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Issue, IssueState } from "../types";

// ---------------------------------------------------------------------------
// urql mock — controlled via module-level variables
// ---------------------------------------------------------------------------
let mockQueryResult: { fetching: boolean; data?: unknown; error?: unknown } = {
  fetching: false,
  data: undefined,
  error: undefined,
};
let mockUseQueryArgs: unknown = undefined;
const mockMutationExecute = vi.fn();

vi.mock("urql", () => ({
  useQuery: (args: unknown) => {
    mockUseQueryArgs = args;
    return [mockQueryResult];
  },
  useMutation: () => [
    { fetching: false, data: undefined, error: undefined },
    mockMutationExecute,
  ],
}));

import { IssueDetailPage } from "../pages/IssueDetailPage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "PROJ-1",
    title: "Test issue detail",
    description: "A description",
    state: "Backlog" as IssueState,
    priority: "medium",
    labels: ["bug"],
    creator: "alice",
    assignee: "bob",
    project: "proj",
    url: "/PROJ-1",
    comments: [
      { id: "c1", author: "alice", body: "First comment", createdAt: "2025-01-01" },
    ],
    history: [],
    createdAt: "2025-01-01",
    updatedAt: "2025-01-02",
    ...overrides,
  } as Issue;
}

function renderDetailPage(identifier = "PROJ-1", projectPrefix = "proj") {
  return render(
    <MemoryRouter
      initialEntries={[`/projects/${projectPrefix}/issues/${identifier}`]}
    >
      <Routes>
        <Route
          path="/projects/:projectPrefix/issues/:identifier"
          element={<IssueDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockQueryResult = { fetching: false, data: undefined, error: undefined };
  mockUseQueryArgs = undefined;
  mockMutationExecute.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// Part B — Data-Fetching Page Wrappers: IssueDetailPage
// ===========================================================================
describe("IssueDetailPage (Part B)", () => {
  // -----------------------------------------------------------------------
  // Test B.8 — Shows loading spinner while fetching issue
  // -----------------------------------------------------------------------
  it("B.8 — shows loading spinner while fetching issue", () => {
    // Given useQuery returns fetching: true
    mockQueryResult = { fetching: true };

    // When IssueDetailPage is rendered
    renderDetailPage("PROJ-1");

    // Then the loading spinner is visible
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test B.9 — Displays error message on query failure
  // -----------------------------------------------------------------------
  it("B.9 — displays error message on query failure", () => {
    // Given useQuery returns an error
    mockQueryResult = {
      fetching: false,
      data: undefined,
      error: { message: "Issue not found" },
    };

    // When IssueDetailPage is rendered
    renderDetailPage();

    // Then the error message is shown
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message").textContent).toContain(
      "Issue not found"
    );
  });

  // -----------------------------------------------------------------------
  // Test B.10 — Renders issue detail after successful fetch
  // -----------------------------------------------------------------------
  it("B.10 — renders issue detail after successful fetch", () => {
    // Given useQuery returns a full issue
    const issue = makeIssue();
    mockQueryResult = {
      fetching: false,
      data: { issue },
    };

    // When IssueDetailPage is rendered
    renderDetailPage();

    // Then the issue detail view shows the issue title
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();
    expect(screen.getByTestId("issue-title").textContent).toBe(
      "Test issue detail"
    );
  });

  // -----------------------------------------------------------------------
  // Test B.11 — Passes correct identifier variable to the query
  // -----------------------------------------------------------------------
  it("B.11 — passes correct identifier variable to the query", () => {
    // Given the route path contains identifier PROJ-42
    mockQueryResult = { fetching: true };

    // When IssueDetailPage renders
    renderDetailPage("PROJ-42");

    // Then the query variables include identifier: "PROJ-42"
    expect(mockUseQueryArgs).toBeDefined();
    const args = mockUseQueryArgs as { variables: { identifier: string } };
    expect(args.variables.identifier).toBe("PROJ-42");
  });

  // -----------------------------------------------------------------------
  // Test B.12 — onUpdateField triggers update mutation
  // -----------------------------------------------------------------------
  it("B.12 — onUpdateField triggers update mutation", async () => {
    // Given the issue detail is rendered
    const user = userEvent.setup();
    const issue = makeIssue();
    mockQueryResult = { fetching: false, data: { issue } };
    renderDetailPage();

    // When a field (state) is changed via the UI
    const stateSelect = screen.getByTestId("issue-state");
    await user.selectOptions(stateSelect, "In Progress");

    // Then the mutation execute function is called with correct variables
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "PROJ-1",
        state: "In Progress",
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test B.13 — onAddComment triggers add-comment mutation
  // -----------------------------------------------------------------------
  it("B.13 — onAddComment triggers add-comment mutation", async () => {
    // Given the issue detail is rendered with comments section
    const user = userEvent.setup();
    const issue = makeIssue();
    mockQueryResult = { fetching: false, data: { issue } };
    renderDetailPage();

    // When a comment is typed and submitted
    const commentInput = screen.getByTestId("comment-input");
    await user.type(commentInput, "A new comment");
    const submitBtn = screen.getByTestId("comment-submit");
    await user.click(submitBtn);

    // Then the add-comment mutation is called
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        issueIdentifier: "PROJ-1",
        body: "A new comment",
      })
    );
  });
});

// ===========================================================================
// Part D — Logging in IssueDetailPage
// ===========================================================================
describe("IssueDetailPage Logging (Part D)", () => {
  // -----------------------------------------------------------------------
  // Test D.8 — IssueDetailPage logs when data arrives
  // -----------------------------------------------------------------------
  it("D.8 — logs when data arrives", () => {
    // Given IssueDetailPage is rendered and useQuery returns data
    const issue = makeIssue();
    mockQueryResult = { fetching: false, data: { issue } };

    // When the component mounts
    renderDetailPage();

    // Then console.log is called with [wedge:issue]
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:issue]"),
      expect.anything()
    );
  });
});
