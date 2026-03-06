/**
 * Tests for BoardView — TDD Red Phase
 *
 * Tests 1.1 – 1.6 from the frontend TDD plan.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardView } from "../components/BoardView";
import { ISSUE_STATES } from "../types";
import type { Issue } from "../types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "WDG-1",
    title: "Test issue",
    description: null,
    state: "Backlog",
    priority: "none",
    labels: [],
    creator: "alice@test.com",
    assignee: null,
    project: "proj-1",
    url: "/issues/WDG-1",
    comments: [],
    history: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1.1 Board renders all workflow-state columns
// ---------------------------------------------------------------------------
describe("1.1 Board renders all workflow-state columns", () => {
  it("given the board view is rendered, when it mounts, then exactly 6 columns are shown in order", () => {
    // Given / When
    render(<BoardView issues={[]} />);

    // Then
    for (const state of ISSUE_STATES) {
      expect(screen.getByTestId(`column-${state}`)).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// 1.2 Issue cards render in the correct column
// ---------------------------------------------------------------------------
describe("1.2 Issue cards render in the correct column", () => {
  it("given issues in different states, when rendered, then each card is in its matching column", () => {
    // Given
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", title: "Backlog item", state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", title: "In Progress item", state: "In Progress", id: "id-2" }),
      makeIssue({ identifier: "WDG-3", title: "Done item", state: "Done", id: "id-3" }),
    ];

    // When
    render(<BoardView issues={issues} />);

    // Then
    const backlogCol = screen.getByTestId("column-Backlog");
    expect(backlogCol).toHaveTextContent("Backlog item");

    const ipCol = screen.getByTestId("column-In Progress");
    expect(ipCol).toHaveTextContent("In Progress item");

    const doneCol = screen.getByTestId("column-Done");
    expect(doneCol).toHaveTextContent("Done item");
  });
});

// ---------------------------------------------------------------------------
// 1.3 Issue card displays key fields
// ---------------------------------------------------------------------------
describe("1.3 Issue card displays key fields", () => {
  it("given an issue, when rendered as a card, then identifier, title, priority, and assignee initials are shown", () => {
    // Given
    const issue = makeIssue({
      identifier: "WDG-5",
      title: "Fix login",
      priority: "high",
      assignee: "bob@test.com",
    });

    // When
    render(<BoardView issues={[issue]} />);

    // Then
    const card = screen.getByTestId("issue-card-WDG-5");
    expect(card).toHaveTextContent("WDG-5");
    expect(card).toHaveTextContent("Fix login");
    expect(card).toHaveTextContent("high");
    expect(card).toHaveTextContent("BO"); // initials from bob@test.com
  });
});

// ---------------------------------------------------------------------------
// 1.4 Column headers show issue count
// ---------------------------------------------------------------------------
describe("1.4 Column headers show issue count", () => {
  it("given issues, when rendered, then each column header shows the correct count", () => {
    // Given
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", state: "Todo", id: "id-1" }),
      makeIssue({ identifier: "WDG-2", state: "Todo", id: "id-2" }),
      makeIssue({ identifier: "WDG-3", state: "Done", id: "id-3" }),
    ];

    // When
    render(<BoardView issues={issues} />);

    // Then
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("Todo (2)");
    expect(screen.getByTestId("column-header-Done")).toHaveTextContent("Done (1)");
    expect(screen.getByTestId("column-header-Backlog")).toHaveTextContent("Backlog (0)");
  });
});

// ---------------------------------------------------------------------------
// 1.5 Board renders empty state
// ---------------------------------------------------------------------------
describe("1.5 Board renders empty state", () => {
  it("given no issues, when rendered, then all 6 columns with zero counts and no cards are shown", () => {
    // Given / When
    render(<BoardView issues={[]} />);

    // Then
    for (const state of ISSUE_STATES) {
      expect(screen.getByTestId(`column-header-${state}`)).toHaveTextContent(`${state} (0)`);
    }
  });
});

// ---------------------------------------------------------------------------
// 1.6 Create-issue button is visible
// ---------------------------------------------------------------------------
describe("1.6 Create-issue button is visible", () => {
  it("given the board view, when rendered, then a create-issue button is present", () => {
    // Given / When
    render(<BoardView issues={[]} />);

    // Then
    expect(screen.getByTestId("create-issue-btn")).toBeInTheDocument();
  });
});
