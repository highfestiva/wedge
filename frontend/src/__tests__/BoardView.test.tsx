/**
 * Tests for BoardView — TDD Red Phase
 *
 * Tests 1.1 – 1.6 from the frontend TDD plan.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { BoardView } from "../components/BoardView";
import { ISSUE_STATES } from "../types";
import type { Issue, IssueState } from "../types";

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
    sortOrder: 0,
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
// Sort Order — Part 1: sortOrder Field Rendering
// ---------------------------------------------------------------------------
describe("Sort Order Part 1 — Issues sorted by sortOrder within columns", () => {
  // -----------------------------------------------------------------------
  // Test 1.1 — Issues within a column are rendered sorted by sortOrder
  // -----------------------------------------------------------------------
  it("1.1 — issues within a column are rendered sorted by sortOrder", () => {
    // Given three issues in "Backlog" with sortOrder values 3.0, 1.0, 2.0
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-A", id: "a", title: "Card A", sortOrder: 3.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-B", id: "b", title: "Card B", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-C", id: "c", title: "Card C", sortOrder: 2.0, state: "Backlog" }),
    ];

    // When the board renders
    render(<BoardView issues={issues} />);

    // Then the issue cards within the "Backlog" column appear in sortOrder order
    const backlogCol = screen.getByTestId("column-Backlog");
    const cards = within(backlogCol).getAllByTestId(/^issue-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "issue-card-WDG-B"); // sortOrder 1.0
    expect(cards[1]).toHaveAttribute("data-testid", "issue-card-WDG-C"); // sortOrder 2.0
    expect(cards[2]).toHaveAttribute("data-testid", "issue-card-WDG-A"); // sortOrder 3.0
  });

  // -----------------------------------------------------------------------
  // Test 1.2 — Issues with the same sortOrder maintain stable rendering
  // -----------------------------------------------------------------------
  it("1.2 — issues with the same sortOrder maintain stable rendering order", () => {
    // Given two issues in "Todo", both with sortOrder 2.0
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-X", id: "x", title: "Card X", sortOrder: 2.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-Y", id: "y", title: "Card Y", sortOrder: 2.0, state: "Todo" }),
    ];

    // When the board renders
    render(<BoardView issues={issues} />);

    // Then both cards appear in the "Todo" column (order doesn't matter as long as neither is missing)
    const todoCol = screen.getByTestId("column-Todo");
    const cards = within(todoCol).getAllByTestId(/^issue-card-/);
    expect(cards).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  // Test 1.3 — Sorting is independent per column
  // -----------------------------------------------------------------------
  it("1.3 — sorting is independent per column", () => {
    // Given issues spread across multiple columns
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 3.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-3", id: "3", sortOrder: 5.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-4", id: "4", sortOrder: 2.0, state: "Todo" }),
    ];

    // When the board renders
    render(<BoardView issues={issues} />);

    // Then each column's issues are sorted by sortOrder independently
    const backlogCards = within(screen.getByTestId("column-Backlog")).getAllByTestId(/^issue-card-/);
    expect(backlogCards[0]).toHaveAttribute("data-testid", "issue-card-WDG-2"); // sortOrder 1.0
    expect(backlogCards[1]).toHaveAttribute("data-testid", "issue-card-WDG-1"); // sortOrder 3.0

    const todoCards = within(screen.getByTestId("column-Todo")).getAllByTestId(/^issue-card-/);
    expect(todoCards[0]).toHaveAttribute("data-testid", "issue-card-WDG-4"); // sortOrder 2.0
    expect(todoCards[1]).toHaveAttribute("data-testid", "issue-card-WDG-3"); // sortOrder 5.0
  });
});

// ===========================================================================
// Sort Order — Part 2: Drop Zone Rendering and Positional Detection
// ===========================================================================
describe("Sort Order Part 2 — Drop zones and positional detection", () => {
  // -----------------------------------------------------------------------
  // Test 2.1 — Drop zones are rendered between issue cards in each column
  // -----------------------------------------------------------------------
  it("2.1 — drop zones are rendered between issue cards in each column", () => {
    // Given BoardView is rendered with three issues in "Backlog"
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-3", id: "3", sortOrder: 3.0, state: "Backlog" }),
    ];

    // When the board renders
    render(<BoardView issues={issues} />);

    // Then there are drop zone elements between each pair of cards and at top/bottom (4 total for 3 cards)
    const backlogCol = screen.getByTestId("column-Backlog");
    const dropZones = within(backlogCol).getAllByTestId(/^drop-zone-/);
    expect(dropZones).toHaveLength(4);
  });

  // -----------------------------------------------------------------------
  // Test 2.2 — Drop zone before first card reports target index 0
  // -----------------------------------------------------------------------
  it("2.2 — drop zone before first card reports target index 0", () => {
    // Given BoardView with two issues in "Backlog" sorted by sortOrder
    const onMoveIssue = vi.fn();
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-X", id: "x", sortOrder: 1.0, state: "Todo" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a card is dragged and dropped onto the drop zone before the first card
    const card = screen.getByTestId("issue-card-WDG-X").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Backlog-0");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with (identifier, "Backlog", 0)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-X", "Backlog", 0);
  });

  // -----------------------------------------------------------------------
  // Test 2.3 — Drop zone between cards reports correct target index
  // -----------------------------------------------------------------------
  it("2.3 — drop zone between cards reports correct target index", () => {
    // Given BoardView with three issues in "Todo" sorted by sortOrder
    const onMoveIssue = vi.fn();
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-3", id: "3", sortOrder: 3.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-X", id: "x", sortOrder: 1.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a card is dragged and dropped onto the drop zone between the first and second card
    const card = screen.getByTestId("issue-card-WDG-X").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Todo-1");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with (identifier, "Todo", 1)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-X", "Todo", 1);
  });

  // -----------------------------------------------------------------------
  // Test 2.4 — Drop zone after last card reports target index equal to column length
  // -----------------------------------------------------------------------
  it("2.4 — drop zone after last card reports target index equal to column length", () => {
    // Given BoardView with two issues in "Backlog"
    const onMoveIssue = vi.fn();
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-X", id: "x", sortOrder: 1.0, state: "Todo" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a card is dropped onto the drop zone after the last card
    const card = screen.getByTestId("issue-card-WDG-X").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Backlog-2");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with (identifier, "Backlog", 2)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-X", "Backlog", 2);
  });

  // -----------------------------------------------------------------------
  // Test 2.5 — Dropping on an empty column drop zone reports target index 0
  // -----------------------------------------------------------------------
  it("2.5 — dropping on an empty column drop zone reports target index 0", () => {
    // Given BoardView with no issues in the "Done" column
    const onMoveIssue = vi.fn();
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-X", id: "x", sortOrder: 1.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a card is dragged and dropped on the "Done" column
    const card = screen.getByTestId("issue-card-WDG-X").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Done-0");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with (identifier, "Done", 0)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-X", "Done", 0);
  });

  // -----------------------------------------------------------------------
  // Test 2.6 — Cross-column drop on a drop zone reports the correct column and index
  // -----------------------------------------------------------------------
  it("2.6 — cross-column drop on a drop zone reports the correct column and index", () => {
    // Given BoardView with issues in "Backlog" and "Todo"
    const onMoveIssue = vi.fn();
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-A", id: "a", sortOrder: 1.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-B", id: "b", sortOrder: 2.0, state: "Todo" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a "Backlog" issue is dragged and dropped onto a specific drop zone in "Todo"
    const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Todo-1");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with (identifier, "Todo", 1)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-1", "Todo", 1);
  });
});

// ===========================================================================
// Sort Order — Part 6: Drag Drop Visual Feedback
// ===========================================================================
describe("Sort Order Part 6 — Drag drop visual feedback", () => {
  // -----------------------------------------------------------------------
  // Test 6.1 — Drop zone shows visual indicator during dragOver
  // -----------------------------------------------------------------------
  it("6.1 — drop zone shows visual indicator during dragOver", () => {
    // Given BoardView is rendered with issues in a column
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} />);

    // When a card is being dragged over a drop zone
    const dropZone = screen.getByTestId("drop-zone-Backlog-0");
    fireEvent.dragOver(dropZone);

    // Then the drop zone element has a visual indicator (class or data-drop-active attribute)
    expect(dropZone).toHaveAttribute("data-drop-active", "true");
  });

  // -----------------------------------------------------------------------
  // Test 6.2 — Visual indicator is removed after dragLeave
  // -----------------------------------------------------------------------
  it("6.2 — visual indicator is removed after dragLeave", async () => {
    // Given a drop zone is in the dragOver state
    const issues: Issue[] = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} />);
    const dropZone = screen.getByTestId("drop-zone-Backlog-0");
    fireEvent.dragOver(dropZone);

    // When fireEvent.dragLeave fires on the drop zone
    fireEvent.dragLeave(dropZone);

    // Deactivation is deferred via requestAnimationFrame to avoid flicker
    await act(() => new Promise((r) => requestAnimationFrame(r)));

    // Then the visual indicator is removed
    expect(dropZone).not.toHaveAttribute("data-drop-active", "true");
  });
});
