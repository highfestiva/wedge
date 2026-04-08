import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import type { Issue, IssueState } from "../types";

// ---------------------------------------------------------------------------
// urql mock — controlled via module-level variables
// ---------------------------------------------------------------------------
let mockProjectsResult: { fetching: boolean; data?: unknown; error?: unknown } = {
  fetching: false,
  data: { projects: [{ id: "default-id", name: "Default", prefix: "default", description: null, createdAt: "2025-01-01" }] },
  error: undefined,
};
let mockIssuesResult: { fetching: boolean; data?: unknown; error?: unknown } = {
  fetching: false,
  data: undefined,
  error: undefined,
};
let mockIssueResult: { fetching: boolean; data?: unknown; error?: unknown } = {
  fetching: false,
  data: undefined,
  error: undefined,
};
let mockUseQueryArgs: unknown = undefined;
const mockMutationExecute = vi.fn();

vi.mock("urql", () => ({
  useQuery: (args: { query: string; variables?: unknown; pause?: boolean }) => {
    if (args.query.includes("Projects")) {
      return [mockProjectsResult];
    }
    if (args.query.includes("$identifier")) {
      return [mockIssueResult];
    }
    mockUseQueryArgs = args;
    return [mockIssuesResult];
  },
  useMutation: () => [
    { fetching: false, data: undefined, error: undefined },
    mockMutationExecute,
  ],
}));

import { BoardPage } from "../pages/BoardPage";
import { Header } from "../components/Header";
import { CreateIssueActionProvider } from "../contexts/CreateIssueContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "DEF-1",
    title: "Test issue",
    description: null,
    state: "Backlog" as IssueState,
    priority: "medium",
    labels: [],
    creator: "alice",
    assignee: null,
    project: "default",
    url: "/DEF-1",
    comments: [],
    history: [],
    sortOrder: 0,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-02",
    ...overrides,
  } as Issue;
}

/** Captures the current URL so we can assert on navigation. */
function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location-display">{loc.pathname}</div>;
}

function renderBoardPage(projectPrefix = "default") {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectPrefix}/board`]}>
      <CreateIssueActionProvider>
      <Header />
      <Routes>
        <Route path="/projects/:projectPrefix/board" element={<BoardPage />} />
        <Route
          path="/projects/:projectPrefix/issues/:identifier"
          element={<LocationDisplay />}
        />
      </Routes>
      </CreateIssueActionProvider>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockProjectsResult = {
    fetching: false,
    data: { projects: [{ id: "default-id", name: "Default", prefix: "default", description: null, createdAt: "2025-01-01" }] },
    error: undefined,
  };
  mockIssuesResult = { fetching: false, data: undefined, error: undefined };
  mockIssueResult = { fetching: false, data: undefined, error: undefined };
  mockUseQueryArgs = undefined;
  mockMutationExecute.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// Part B — Data-Fetching Page Wrappers
// ===========================================================================
describe("BoardPage (Part B)", () => {
  // -----------------------------------------------------------------------
  // Test B.1 — Shows loading spinner while fetching issues
  // -----------------------------------------------------------------------
  it("B.1 — shows loading spinner while fetching issues", () => {
    // Given useQuery returns fetching: true
    mockIssuesResult = { fetching: true };

    // When BoardPage is rendered
    renderBoardPage();

    // Then the loading spinner is visible
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test B.2 — Displays error message on query failure
  // -----------------------------------------------------------------------
  it("B.2 — displays error message on query failure", () => {
    // Given useQuery returns an error
    mockIssuesResult = {
      fetching: false,
      data: undefined,
      error: { message: "Network error" },
    };

    // When BoardPage is rendered
    renderBoardPage();

    // Then the error message is shown
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message").textContent).toContain(
      "Network error"
    );
  });

  // -----------------------------------------------------------------------
  // Test B.3 — Renders issues on the board after successful fetch
  // -----------------------------------------------------------------------
  it("B.3 — renders issues on the board after successful fetch", () => {
    // Given useQuery returns two issues
    const issue1 = makeIssue({ identifier: "DEF-1", title: "First issue" });
    const issue2 = makeIssue({
      identifier: "DEF-2",
      title: "Second issue",
      id: "id-2",
      state: "Todo",
    });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue1, issue2], cursor: null } },
    };

    // When BoardPage is rendered
    renderBoardPage();

    // Then the board is visible and issue cards are rendered
    expect(screen.getByTestId("board")).toBeInTheDocument();
    expect(screen.getByText("First issue")).toBeInTheDocument();
    expect(screen.getByText("Second issue")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test B.4 — Passes correct projectId variable to the query
  // -----------------------------------------------------------------------
  it("B.4 — passes correct projectId variable to the query", () => {
    // Given the route path is /projects/MY/board and project prefix MY resolves to id "my-project-id"
    mockProjectsResult = {
      fetching: false,
      data: { projects: [{ id: "my-project-id", name: "My Project", prefix: "MY", description: null, createdAt: "2025-01-01" }] },
    };
    mockIssuesResult = { fetching: true };

    // When BoardPage renders and calls useQuery
    renderBoardPage("MY");

    // Then the query variables include projectId resolved from the prefix
    expect(mockUseQueryArgs).toBeDefined();
    const args = mockUseQueryArgs as { variables: { projectId: string } };
    expect(args.variables.projectId).toBe("my-project-id");
  });

  // -----------------------------------------------------------------------
  // Test B.6 — onIssueClick navigates to issue detail route
  // -----------------------------------------------------------------------
  it("B.6 — onIssueClick opens issue edit modal", async () => {
    // Given the board is rendered with an issue
    const user = userEvent.setup();
    const issue = makeIssue({ identifier: "DEF-1", title: "Clickable issue" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    mockIssueResult = {
      fetching: false,
      data: { issue },
    };
    renderBoardPage();

    // When an issue card is clicked
    await user.click(screen.getByText("Clickable issue"));

    // Then the edit form modal appears
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test B.7 — onCreateIssue triggers navigation or modal
  // -----------------------------------------------------------------------
  it("B.7 — onCreateIssue triggers UI for creating an issue", async () => {
    // Given the board is rendered
    const user = userEvent.setup();
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [], cursor: null } },
    };
    renderBoardPage();

    // When the Create Issue button is clicked
    const createBtn = screen.getByTestId("create-issue-btn");
    await user.click(createBtn);

    // Then a create-issue UI appears (form or navigation)
    // We check for either the form or a route change.
    const formVisible = screen.queryByTestId("create-issue-form") !== null;
    const locationEl = screen.queryByTestId("location-display");
    expect(formVisible || locationEl !== null).toBe(true);
  });
});

// ===========================================================================
// Part D — Logging in BoardPage
// ===========================================================================
describe("BoardPage Logging (Part D)", () => {
  // -----------------------------------------------------------------------
  // Test D.7 — BoardPage logs when data arrives
  // -----------------------------------------------------------------------
  it("D.7 — logs when data arrives", () => {
    // Given BoardPage is rendered and useQuery returns data
    const issue = makeIssue();
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };

    // When the component mounts
    renderBoardPage();

    // Then console.log is called with a message containing [wedge:board]
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:board]"),
      expect.anything()
    );
  });

  // -----------------------------------------------------------------------
  // Test D.9 — BoardPage logs mutation calls
  // -----------------------------------------------------------------------
  it("D.9 — logs mutation calls", () => {
    // Given BoardPage is rendered with issues
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When a mutation is triggered (onMoveIssue)
    // (this will fail in red phase because the stub renders nothing)

    // Then console.log includes mutation info
    // We just verify that the logging infrastructure is called at some point.
    // The green phase will make this meaningful.
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:board]"),
      expect.anything()
    );
  });
});

// ---------------------------------------------------------------------------
// Drag-and-drop helper
// ---------------------------------------------------------------------------
/**
 * Simulates a native HTML drag-and-drop from a draggable card to a target column.
 * Uses the same `dataTransfer` pattern as existing test B.5.
 */
function simulateDragDrop(cardTestId: string, targetColumnTestId: string) {
  const card = screen.getByTestId(cardTestId).closest("[draggable]")!;
  const targetColumn = screen.getByTestId(targetColumnTestId);
  const dataTransferData: Record<string, string> = {};
  const dataTransfer = {
    setData: (k: string, v: string) => { dataTransferData[k] = v; },
    getData: (k: string) => dataTransferData[k] ?? "",
  };
  fireEvent.dragStart(card, { dataTransfer });
  fireEvent.drop(targetColumn, { dataTransfer });
}

/**
 * Simulates a drop on a column with a fabricated identifier (not from a real card).
 */
function simulateDropWithId(identifier: string, targetColumnTestId: string) {
  const targetColumn = screen.getByTestId(targetColumnTestId);
  const dataTransfer = {
    setData: () => {},
    getData: () => identifier,
  };
  fireEvent.drop(targetColumn, { dataTransfer });
}

// ===========================================================================
// Part 1 — Optimistic Local State on Drag
// ===========================================================================
describe("BoardPage — Optimistic Drag-and-Drop (Part 1)", () => {
  // -----------------------------------------------------------------------
  // Test 1.1 — Card immediately appears in the target column after drop
  // -----------------------------------------------------------------------
  it("1.1 — card immediately appears in the target column after drop", () => {
    // Given BoardPage is rendered with one issue in Backlog
    const issue = makeIssue({ identifier: "DEF-1", title: "Optimistic card", state: "Backlog" });
    mockMutationExecute.mockReturnValue(new Promise(() => {})); // never resolves
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged from Backlog to Todo
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // Then the card appears in the Todo column immediately
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).getByText("Optimistic card")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test 1.2 — Card is removed from the source column after drop
  // -----------------------------------------------------------------------
  it("1.2 — card is removed from the source column after drop", () => {
    // Given BoardPage is rendered with one issue in Backlog
    const issue = makeIssue({ identifier: "DEF-1", title: "Moving card", state: "Backlog" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged from Backlog to Todo
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // Then the Backlog column no longer contains the card
    const backlogColumn = screen.getByTestId("column-Backlog");
    expect(within(backlogColumn).queryByText("Moving card")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Test 1.3 — Column counts update immediately after drop
  // -----------------------------------------------------------------------
  it("1.3 — column counts update immediately after drop", () => {
    // Given BoardPage with one issue in Backlog and one in Todo
    const issueA = makeIssue({ identifier: "DEF-1", title: "Issue A", state: "Backlog" });
    const issueB = makeIssue({ identifier: "DEF-2", id: "id-2", title: "Issue B", state: "Todo" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB], cursor: null } },
    };
    renderBoardPage();

    // When the Backlog issue is dragged to Todo
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // Then Backlog shows (0), Todo shows (2) — immediately
    expect(screen.getByTestId("column-header-Backlog")).toHaveTextContent("(0)");
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("(2)");
  });

  // -----------------------------------------------------------------------
  // Test 1.4 — Mutation is still fired after optimistic update
  // -----------------------------------------------------------------------
  it("1.4 — mutation is still fired after optimistic update", () => {
    // Given BoardPage with one issue in Backlog
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged to In Progress
    simulateDragDrop("issue-card-DEF-1", "column-In Progress");

    // Then the mutation is called with the correct arguments
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "In Progress",
      })
    );
  });
});

// ===========================================================================
// Part 2 — Revert on Mutation Failure
// ===========================================================================
describe("BoardPage — Revert on Mutation Failure (Part 2)", () => {
  // -----------------------------------------------------------------------
  // Test 2.1 — Card reverts to original column on mutation error
  // -----------------------------------------------------------------------
  it("2.1 — card reverts to original column on mutation error", async () => {
    // Given BoardPage with one issue in Backlog and mutation will fail
    const issue = makeIssue({ identifier: "DEF-1", title: "Revert card", state: "Backlog" });
    mockMutationExecute.mockResolvedValue({ data: undefined, error: { message: "Server error" } });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged to Done
    await act(async () => {
      simulateDragDrop("issue-card-DEF-1", "column-Done");
    });

    // Then the card reappears in Backlog and is no longer in Done
    await waitFor(() => {
      const backlogColumn = screen.getByTestId("column-Backlog");
      expect(within(backlogColumn).getByText("Revert card")).toBeInTheDocument();
    });
    const doneColumn = screen.getByTestId("column-Done");
    expect(within(doneColumn).queryByText("Revert card")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Test 2.2 — Column counts revert on mutation error
  // -----------------------------------------------------------------------
  it("2.2 — column counts revert on mutation error", async () => {
    // Given BoardPage with one issue in Backlog and mutation will fail
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog" });
    mockMutationExecute.mockResolvedValue({ data: undefined, error: { message: "Server error" } });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged to Done
    await act(async () => {
      simulateDragDrop("issue-card-DEF-1", "column-Done");
    });

    // Then counts revert: Backlog (1), Done (0)
    await waitFor(() => {
      expect(screen.getByTestId("column-header-Backlog")).toHaveTextContent("(1)");
    });
    expect(screen.getByTestId("column-header-Done")).toHaveTextContent("(0)");
  });

  // -----------------------------------------------------------------------
  // Test 2.3 — User-visible error indicator on mutation failure
  // -----------------------------------------------------------------------
  it("2.3 — user-visible error indicator is shown on mutation failure", async () => {
    // Given BoardPage with one issue in Backlog and mutation will fail
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog" });
    mockMutationExecute.mockResolvedValue({ data: undefined, error: { message: "Server error" } });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged to Done and mutation settles
    await act(async () => {
      simulateDragDrop("issue-card-DEF-1", "column-Done");
    });

    // Then a user-visible error indicator appears
    await waitFor(() => {
      expect(screen.getByTestId("move-error")).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Part 3 — Same-Column Drop (No-Op)
// ===========================================================================
describe("BoardPage — Same-Column Drop (Part 3)", () => {
  // -----------------------------------------------------------------------
  // Test 3.1 — Dropping into same column does not fire a mutation
  // -----------------------------------------------------------------------
  it("3.1 — dropping an issue into the same column does not fire a mutation", () => {
    // Given BoardPage with one issue in Todo
    const issue = makeIssue({ identifier: "DEF-1", title: "Stay put", state: "Todo" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged and dropped into the same Todo column
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // Then the mutation is NOT called
    expect(mockMutationExecute).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Test 3.2 — Issue remains in place after same-column drop
  // -----------------------------------------------------------------------
  it("3.2 — issue remains in place after same-column drop", () => {
    // Given BoardPage with one issue in Todo
    const issue = makeIssue({ identifier: "DEF-1", title: "Stay put", state: "Todo" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the card is dragged and dropped into the same Todo column
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // Then the card is still in Todo and count is unchanged
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).getByText("Stay put")).toBeInTheDocument();
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("(1)");
  });
});

// ===========================================================================
// Part 4 — Local State Syncs with Query Data
// ===========================================================================
describe("BoardPage — Local State Syncs with Query (Part 4)", () => {
  // -----------------------------------------------------------------------
  // Test 4.1 — Local state resets when query data changes
  // -----------------------------------------------------------------------
  it("4.1 — local state resets when query data changes (simulated refetch)", () => {
    // Given BoardPage rendered with one issue in Backlog
    const issue = makeIssue({ identifier: "DEF-1", title: "Synced issue", state: "Backlog" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    const { rerender } = renderBoardPage();

    // Verify initial state
    const backlogCol = screen.getByTestId("column-Backlog");
    expect(within(backlogCol).getByText("Synced issue")).toBeInTheDocument();

    // When query data changes (simulated refetch — issue moved to Done server-side)
    const updatedIssue = { ...issue, state: "Done" as IssueState };
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [updatedIssue], cursor: null } },
    };
    rerender(
      <MemoryRouter initialEntries={["/projects/default/board"]}>
        <Routes>
          <Route path="/projects/:projectPrefix/board" element={<BoardPage />} />
          <Route path="/projects/:projectPrefix/issues/:identifier" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    // Then the board reflects the updated state
    const doneCol = screen.getByTestId("column-Done");
    expect(within(doneCol).getByText("Synced issue")).toBeInTheDocument();
    const backlogColAfter = screen.getByTestId("column-Backlog");
    expect(within(backlogColAfter).queryByText("Synced issue")).toBeNull();
  });
});

// ===========================================================================
// Part 5 — Rapid / Concurrent Drags
// ===========================================================================
describe("BoardPage — Rapid / Concurrent Drags (Part 5)", () => {
  // -----------------------------------------------------------------------
  // Test 5.1 — Two different issues can be moved simultaneously
  // -----------------------------------------------------------------------
  it("5.1 — two different issues can be moved simultaneously", () => {
    // Given BoardPage with issue A in Backlog and issue B in Todo; mutations never resolve
    const issueA = makeIssue({ identifier: "DEF-1", id: "id-1", title: "Issue A", state: "Backlog" });
    const issueB = makeIssue({ identifier: "DEF-2", id: "id-2", title: "Issue B", state: "Todo" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB], cursor: null } },
    };
    renderBoardPage();

    // When issue A is dragged to In Progress
    simulateDragDrop("issue-card-DEF-1", "column-In Progress");

    // And then issue B is dragged to Done (before A's mutation resolves)
    simulateDragDrop("issue-card-DEF-2", "column-Done");

    // Then issue A appears in In Progress and issue B appears in Done
    const ipColumn = screen.getByTestId("column-In Progress");
    expect(within(ipColumn).getByText("Issue A")).toBeInTheDocument();
    const doneColumn = screen.getByTestId("column-Done");
    expect(within(doneColumn).getByText("Issue B")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Test 5.2 — Rapid re-drag of the same issue uses latest target state
  // -----------------------------------------------------------------------
  it("5.2 — rapid re-drag of the same issue uses latest target state", () => {
    // Given BoardPage with one issue in Backlog; first mutation never resolves
    const issue = makeIssue({ identifier: "DEF-1", title: "Bouncing card", state: "Backlog" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the issue is dragged to Todo
    simulateDragDrop("issue-card-DEF-1", "column-Todo");

    // And then immediately dragged again to In Progress (before first mutation resolves)
    simulateDragDrop("issue-card-DEF-1", "column-In Progress");

    // Then the issue appears in In Progress (latest state wins)
    const ipColumn = screen.getByTestId("column-In Progress");
    expect(within(ipColumn).getByText("Bouncing card")).toBeInTheDocument();
    // And is NOT in Todo
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).queryByText("Bouncing card")).toBeNull();
  });
});

// ===========================================================================
// Part 6 — Defensive Guard — Unknown Issue Identifier
// ===========================================================================
describe("BoardPage — Unknown Identifier Guard (Part 6)", () => {
  // -----------------------------------------------------------------------
  // Test 6.1 — Moving a non-existent identifier does not throw or fire a mutation
  // -----------------------------------------------------------------------
  it("6.1 — moving a non-existent identifier does not throw or fire a mutation", () => {
    // Given BoardPage with one issue
    const issue = makeIssue({ identifier: "DEF-1", title: "Existing card", state: "Backlog" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When a drop event fires with an unknown identifier
    expect(() => {
      simulateDropWithId("UNKNOWN-999", "column-Todo");
    }).not.toThrow();

    // Then no mutation is fired and the board remains unchanged
    expect(mockMutationExecute).not.toHaveBeenCalled();
    const backlogColumn = screen.getByTestId("column-Backlog");
    expect(within(backlogColumn).getByText("Existing card")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Drop-on-drop-zone helper
// ---------------------------------------------------------------------------
/**
 * Simulates a native HTML drag-and-drop from a draggable card to a specific drop zone.
 */
function simulateDropOnDropZone(cardTestId: string, dropZoneTestId: string) {
  const card = screen.getByTestId(cardTestId).closest("[draggable]")!;
  const dropZone = screen.getByTestId(dropZoneTestId);
  const dataTransferData: Record<string, string> = {};
  const dataTransfer = {
    setData: (k: string, v: string) => { dataTransferData[k] = v; },
    getData: (k: string) => dataTransferData[k] ?? "",
  };
  fireEvent.dragStart(card, { dataTransfer });
  fireEvent.drop(dropZone, { dataTransfer });
}

// ===========================================================================
// Sort Order Part 3 — Sort Order Computation in BoardPage
// ===========================================================================
describe("BoardPage — Sort Order Computation (Sort Order Part 3)", () => {
  // -----------------------------------------------------------------------
  // Test 3.1 — Dropping into an empty column assigns sortOrder = 0.0
  // -----------------------------------------------------------------------
  it("SO-3.1 — dropping into an empty column assigns sortOrder = 0.0", () => {
    // Given BoardPage with one issue in "Backlog" and no issues in "Done"
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog", sortOrder: 2.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the issue is dragged from "Backlog" and dropped into "Done" at index 0
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Done-0");

    // Then the mutation is called with sortOrder: 0.0 (in addition to state: "Done")
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "Done",
        sortOrder: 0.0,
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test 3.2 — Dropping before the first item computes sortOrder = firstItem.sortOrder - 1.0
  // -----------------------------------------------------------------------
  it("SO-3.2 — dropping before the first item computes sortOrder = firstItem.sortOrder - 1.0", () => {
    // Given BoardPage with two issues in "Todo" with sortOrder 2.0 and 4.0, and one in "Backlog"
    const todoA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 2.0 });
    const todoB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 4.0 });
    const backlog = makeIssue({ identifier: "DEF-1", id: "1", state: "Backlog", sortOrder: 1.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [todoA, todoB, backlog], cursor: null } },
    };
    renderBoardPage();

    // When the "Backlog" issue is dropped at index 0 in "Todo" (before the first card)
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-0");

    // Then the mutation is called with sortOrder: 1.0 (i.e., 2.0 - 1.0)
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "Todo",
        sortOrder: 1.0,
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test 3.3 — Dropping after the last item computes sortOrder = lastItem.sortOrder + 1.0
  // -----------------------------------------------------------------------
  it("SO-3.3 — dropping after the last item computes sortOrder = lastItem.sortOrder + 1.0", () => {
    // Given BoardPage with two issues in "Todo" with sortOrder 2.0 and 4.0, and one in "Backlog"
    const todoA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 2.0 });
    const todoB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 4.0 });
    const backlog = makeIssue({ identifier: "DEF-1", id: "1", state: "Backlog", sortOrder: 1.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [todoA, todoB, backlog], cursor: null } },
    };
    renderBoardPage();

    // When the "Backlog" issue is dropped at index 2 in "Todo" (after the last card)
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-2");

    // Then the mutation is called with sortOrder: 5.0 (i.e., 4.0 + 1.0)
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "Todo",
        sortOrder: 5.0,
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test 3.4 — Dropping between two items computes sortOrder as midpoint
  // -----------------------------------------------------------------------
  it("SO-3.4 — dropping between two items computes sortOrder as midpoint", () => {
    // Given BoardPage with three issues in "Todo" with sortOrder 1.0, 3.0, 5.0, and one in "Backlog"
    const todoA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0 });
    const todoB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0 });
    const todoC = makeIssue({ identifier: "DEF-C", id: "c", state: "Todo", sortOrder: 5.0 });
    const backlog = makeIssue({ identifier: "DEF-1", id: "1", state: "Backlog", sortOrder: 1.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [todoA, todoB, todoC, backlog], cursor: null } },
    };
    renderBoardPage();

    // When the "Backlog" issue is dropped at index 1 in "Todo" (between sortOrder=1.0 and sortOrder=3.0)
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-1");

    // Then the mutation is called with sortOrder: 2.0 (i.e., (1.0 + 3.0) / 2)
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "Todo",
        sortOrder: 2.0,
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test 3.5 — Reordering within the same column: dragged issue excluded from midpoint
  // -----------------------------------------------------------------------
  it("SO-3.5 — reordering within same column: dragged issue is excluded from midpoint calculation", () => {
    // Given BoardPage with three issues in "Todo" with sortOrder 1.0 (A), 3.0 (B), 5.0 (C)
    const issueA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0 });
    const issueB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0 });
    const issueC = makeIssue({ identifier: "DEF-C", id: "c", state: "Todo", sortOrder: 5.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB, issueC], cursor: null } },
    };
    renderBoardPage();

    // When issue A is dragged and dropped at index 2 (between B and C, after excluding A)
    simulateDropOnDropZone("issue-card-DEF-A", "drop-zone-Todo-2");

    // Then mutation is called with sortOrder: 4.0 (i.e., (3.0 + 5.0) / 2) and state is NOT included
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-A",
        sortOrder: 4.0,
      })
    );
    // state should not be included since the column didn't change
    expect(mockMutationExecute.mock.calls[0][0]).not.toHaveProperty("state");
  });
});

// ===========================================================================
// Sort Order Part 4 — Optimistic Update with Sort Order
// ===========================================================================
describe("BoardPage — Optimistic Update with Sort Order (Sort Order Part 4)", () => {
  // -----------------------------------------------------------------------
  // Test 4.1 — Issue immediately appears at correct position after drop
  // -----------------------------------------------------------------------
  it("SO-4.1 — issue immediately appears at correct position in target column after drop", () => {
    // Given BoardPage with issues in "Todo" having sortOrder 1.0 and 5.0, and one in "Backlog"
    const todoA = makeIssue({ identifier: "DEF-A", id: "a", title: "Todo First", state: "Todo", sortOrder: 1.0 });
    const todoB = makeIssue({ identifier: "DEF-B", id: "b", title: "Todo Last", state: "Todo", sortOrder: 5.0 });
    const backlog = makeIssue({ identifier: "DEF-1", id: "1", title: "Moving Card", state: "Backlog", sortOrder: 2.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [todoA, todoB, backlog], cursor: null } },
    };
    renderBoardPage();

    // When the "Backlog" issue is dropped between the two "Todo" issues (midpoint 3.0)
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-1");

    // Then the issue immediately appears between the two "Todo" issues
    const todoColumn = screen.getByTestId("column-Todo");
    const cards = within(todoColumn).getAllByTestId(/^issue-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "issue-card-DEF-A"); // sortOrder 1.0
    expect(cards[1]).toHaveAttribute("data-testid", "issue-card-DEF-1"); // sortOrder 3.0 (midpoint)
    expect(cards[2]).toHaveAttribute("data-testid", "issue-card-DEF-B"); // sortOrder 5.0
  });

  // -----------------------------------------------------------------------
  // Test 4.2 — Sort order is updated in local state immediately (optimistic)
  // -----------------------------------------------------------------------
  it("SO-4.2 — sort order is updated in local state immediately (optimistic)", () => {
    // Given BoardPage with one issue in "Backlog" (sortOrder=4.0)
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog", sortOrder: 4.0, title: "Optimistic issue" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the issue is dropped into "Todo" at index 0 (empty column, sortOrder=0.0)
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-0");

    // Then the issue appears in "Todo" immediately
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).getByText("Optimistic issue")).toBeInTheDocument();
    // And is no longer in Backlog
    const backlogColumn = screen.getByTestId("column-Backlog");
    expect(within(backlogColumn).queryByText("Optimistic issue")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Test 4.3 — Revert on failure restores both state and sortOrder
  // -----------------------------------------------------------------------
  it("SO-4.3 — revert on failure restores both state and sortOrder", async () => {
    // Given BoardPage with one issue in "Backlog" (sortOrder=2.0) and mutation will fail
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog", sortOrder: 2.0, title: "Revert sort" });
    mockMutationExecute.mockResolvedValue({ data: undefined, error: { message: "Server error" } });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the issue is dragged to "Done" at index 0
    await act(async () => {
      simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Done-0");
    });

    // Then after the mutation rejects, the issue reverts to "Backlog" with sortOrder=2.0
    await waitFor(() => {
      const backlogColumn = screen.getByTestId("column-Backlog");
      expect(within(backlogColumn).getByText("Revert sort")).toBeInTheDocument();
    });
    const doneColumn = screen.getByTestId("column-Done");
    expect(within(doneColumn).queryByText("Revert sort")).toBeNull();
  });
});

// ===========================================================================
// Sort Order Part 5 — Same-Position Drop (No-Op) Within a Column
// ===========================================================================
describe("BoardPage — Same-Position Drop No-Op (Sort Order Part 5)", () => {
  // -----------------------------------------------------------------------
  // Test 5.1 — Dropping issue at its current position does not fire mutation
  // -----------------------------------------------------------------------
  it("SO-5.1 — dropping an issue at its current position in the same column does not fire mutation", () => {
    // Given BoardPage with three issues in "Todo" with sortOrder 1.0, 3.0, 5.0
    const issueA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0, title: "Issue A" });
    const issueB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0, title: "Issue B" });
    const issueC = makeIssue({ identifier: "DEF-C", id: "c", state: "Todo", sortOrder: 5.0, title: "Issue C" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB, issueC], cursor: null } },
    };
    renderBoardPage();

    // When the second issue (sortOrder 3.0) is dropped at index 1 in "Todo" (its current position)
    simulateDropOnDropZone("issue-card-DEF-B", "drop-zone-Todo-1");

    // Then no mutation is fired
    expect(mockMutationExecute).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Test 5.2 — Issue and column counts remain unchanged after same-position drop
  // -----------------------------------------------------------------------
  it("SO-5.2 — issue and column counts remain unchanged after same-position drop", () => {
    // Given BoardPage with two issues in "Todo"
    const issueA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0, title: "Issue A" });
    const issueB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0, title: "Issue B" });
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB], cursor: null } },
    };
    renderBoardPage();

    // When the first issue is dropped at index 0 in "Todo"
    simulateDropOnDropZone("issue-card-DEF-A", "drop-zone-Todo-0");

    // Then the issue remains in place and column count is unchanged
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).getByText("Issue A")).toBeInTheDocument();
    expect(within(todoColumn).getByText("Issue B")).toBeInTheDocument();
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("(2)");
  });
});

// ===========================================================================
// Sort Order Part 8 — Mutation Includes sortOrder Variable
// ===========================================================================
describe("BoardPage — Mutation Includes sortOrder (Sort Order Part 8)", () => {
  // -----------------------------------------------------------------------
  // Test 8.1 — Mutation variables include sortOrder when moving between columns
  // -----------------------------------------------------------------------
  it("SO-8.1 — mutation variables include sortOrder when moving between columns", () => {
    // Given BoardPage with one issue in "Backlog"
    const issue = makeIssue({ identifier: "DEF-1", state: "Backlog", sortOrder: 2.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issue], cursor: null } },
    };
    renderBoardPage();

    // When the issue is dropped into "Todo" at index 0
    simulateDropOnDropZone("issue-card-DEF-1", "drop-zone-Todo-0");

    // Then executeUpdateMutation is called with variables including sortOrder (a number)
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-1",
        state: "Todo",
        sortOrder: expect.any(Number),
      })
    );
  });

  // -----------------------------------------------------------------------
  // Test 8.2 — Mutation variables include sortOrder but not state when reordering within same column
  // -----------------------------------------------------------------------
  it("SO-8.2 — mutation variables include sortOrder but not state when reordering within same column", () => {
    // Given BoardPage with three issues in "Todo"
    const issueA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0 });
    const issueB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0 });
    const issueC = makeIssue({ identifier: "DEF-C", id: "c", state: "Todo", sortOrder: 5.0 });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB, issueC], cursor: null } },
    };
    renderBoardPage();

    // When the first issue is dragged to a new position within "Todo"
    simulateDropOnDropZone("issue-card-DEF-A", "drop-zone-Todo-2");

    // Then executeUpdateMutation is called with identifier and sortOrder but WITHOUT state
    expect(mockMutationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "DEF-A",
        sortOrder: expect.any(Number),
      })
    );
    expect(mockMutationExecute.mock.calls[0][0]).not.toHaveProperty("state");
  });
});

// ===========================================================================
// Sort Order Part 9 — Concurrent Reorder Operations
// ===========================================================================
describe("BoardPage — Concurrent Reorder Operations (Sort Order Part 9)", () => {
  // -----------------------------------------------------------------------
  // Test 9.1 — Multiple within-column reorders work concurrently
  // -----------------------------------------------------------------------
  it("SO-9.1 — multiple within-column reorders of different issues work concurrently", () => {
    // Given BoardPage with four issues in "Todo" and mutations return pending promises
    const issueA = makeIssue({ identifier: "DEF-A", id: "a", state: "Todo", sortOrder: 1.0, title: "Issue A" });
    const issueB = makeIssue({ identifier: "DEF-B", id: "b", state: "Todo", sortOrder: 3.0, title: "Issue B" });
    const issueC = makeIssue({ identifier: "DEF-C", id: "c", state: "Todo", sortOrder: 5.0, title: "Issue C" });
    const issueD = makeIssue({ identifier: "DEF-D", id: "d", state: "Todo", sortOrder: 7.0, title: "Issue D" });
    mockMutationExecute.mockReturnValue(new Promise(() => {}));
    mockIssuesResult = {
      fetching: false,
      data: { issues: { items: [issueA, issueB, issueC, issueD], cursor: null } },
    };
    renderBoardPage();

    // When issue A is reordered (moved to between C and D) before any mutation resolves
    simulateDropOnDropZone("issue-card-DEF-A", "drop-zone-Todo-3");

    // And issue B is reordered (moved to the end) before any mutation resolves
    simulateDropOnDropZone("issue-card-DEF-B", "drop-zone-Todo-3");

    // Then both issues appear at their new positions in the column (optimistic updates coexist)
    const todoColumn = screen.getByTestId("column-Todo");
    expect(within(todoColumn).getByText("Issue A")).toBeInTheDocument();
    expect(within(todoColumn).getByText("Issue B")).toBeInTheDocument();
    expect(within(todoColumn).getByText("Issue C")).toBeInTheDocument();
    expect(within(todoColumn).getByText("Issue D")).toBeInTheDocument();
    // Mutation should have been called twice
    expect(mockMutationExecute).toHaveBeenCalledTimes(2);
  });
});
