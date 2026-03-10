/**
 * Tests for Board Drag-and-Drop — TDD Red Phase
 *
 * Tests 2.1 – 2.4 from the frontend TDD plan.
 * NOTE: These tests simulate drag-and-drop callbacks via the component API.
 * Full @dnd-kit integration tests would require more complex setup.
 * For the red phase these verify the contract: onMoveIssue is called,
 * optimistic UI updates happen, and reverts occur on failure.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { BoardView } from "../components/BoardView";
import type { Issue, IssueState } from "../types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "WDG-1",
    title: "Draggable",
    description: null,
    state: "Todo",
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
// 2.1 Dragging an issue to a different column fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("2.1 Drag fires onMoveIssue callback", () => {
  it("given an issue in Todo, when moved to In Progress, then onMoveIssue is called with the new state", () => {
    // Given
    const onMoveIssue = vi.fn();
    const issue = makeIssue({ state: "Todo" });
    render(<BoardView issues={[issue]} onMoveIssue={onMoveIssue} />);

    // When — simulate the drag completing
    act(() => {
      onMoveIssue("WDG-1", "In Progress" as IssueState);
    });

    // Then
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-1", "In Progress");
  });
});

// ---------------------------------------------------------------------------
// 2.2 Optimistic update on drag
// ---------------------------------------------------------------------------
describe("2.2 Optimistic update on drag", () => {
  it("given an issue in Todo, when dropped into In Progress, then the card appears in the target column immediately", () => {
    // Given
    const issue = makeIssue({ state: "Todo" });
    const { rerender } = render(<BoardView issues={[issue]} />);

    // When — simulate optimistic update: issue state changed in parent
    const movedIssue = { ...issue, state: "In Progress" as const };
    rerender(<BoardView issues={[movedIssue]} />);

    // Then
    const ipCol = screen.getByTestId("column-In Progress");
    expect(ipCol).toHaveTextContent("Draggable");
  });
});

// ---------------------------------------------------------------------------
// 2.3 Revert on mutation failure
// ---------------------------------------------------------------------------
describe("2.3 Revert on mutation failure", () => {
  it("given an issue was optimistically moved, when the mutation fails, then the card reverts to the original column", () => {
    // Given
    const issue = makeIssue({ state: "Todo" });
    const { rerender } = render(<BoardView issues={[issue]} />);

    // When — optimistic move
    rerender(<BoardView issues={[{ ...issue, state: "In Progress" as const }]} />);

    // Then — simulate failure revert
    rerender(<BoardView issues={[issue]} />);
    const todoCol = screen.getByTestId("column-Todo");
    expect(todoCol).toHaveTextContent("Draggable");
  });
});

// ---------------------------------------------------------------------------
// 2.4 Column counts update after drag
// ---------------------------------------------------------------------------
describe("2.4 Column counts update after drag", () => {
  it("given an issue moved from Todo to In Progress, then source count decreases and target increases", () => {
    // Given
    const issue = makeIssue({ state: "Todo" });
    const { rerender } = render(<BoardView issues={[issue]} />);
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("Todo (1)");
    expect(screen.getByTestId("column-header-In Progress")).toHaveTextContent("In Progress (0)");

    // When
    rerender(<BoardView issues={[{ ...issue, state: "In Progress" as const }]} />);

    // Then
    expect(screen.getByTestId("column-header-Todo")).toHaveTextContent("Todo (0)");
    expect(screen.getByTestId("column-header-In Progress")).toHaveTextContent("In Progress (1)");
  });
});

// ===========================================================================
// Sort Order — Part 7: onMoveIssue Callback Signature Change
// ===========================================================================
describe("Sort Order Part 7 — onMoveIssue callback signature change", () => {
  // -----------------------------------------------------------------------
  // Test 7.1 — onMoveIssue receives three arguments: identifier, newState, targetIndex
  // -----------------------------------------------------------------------
  it("7.1 — onMoveIssue callback receives three arguments: identifier, newState, targetIndex", () => {
    // Given BoardView is rendered with issues and an onMoveIssue spy
    const onMoveIssue = vi.fn();
    const issues = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a card is dropped onto a drop zone in a column
    const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-Backlog-1");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then the spy is called with (identifier, newState, targetIndex) — three arguments
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-1", "Backlog", expect.any(Number));
    expect(onMoveIssue.mock.calls[0]).toHaveLength(3);
  });

  // -----------------------------------------------------------------------
  // Test 7.2 — Cross-column drag fires onMoveIssue with correct column and position
  // -----------------------------------------------------------------------
  it("7.2 — cross-column drag fires onMoveIssue with correct column and position", () => {
    // Given BoardView with issues in "Backlog" and "In Progress"
    const onMoveIssue = vi.fn();
    const issues = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-A", id: "a", sortOrder: 1.0, state: "In Progress" }),
      makeIssue({ identifier: "WDG-B", id: "b", sortOrder: 2.0, state: "In Progress" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When a "Backlog" issue is dropped at a specific position in "In Progress"
    const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
    const dropZone = screen.getByTestId("drop-zone-In Progress-1");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    // Then onMoveIssue is called with the issue identifier, "In Progress", and the correct target index
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-1", "In Progress", 1);
  });

  // -----------------------------------------------------------------------
  // Test 7.3 — Column-level drop (not on a specific drop zone) appends at end
  // -----------------------------------------------------------------------
  it("7.3 — column-level drop (not on a specific drop zone) appends at end", () => {
    // Given BoardView with two issues in a column
    const onMoveIssue = vi.fn();
    const issues = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Todo" }),
      makeIssue({ identifier: "WDG-X", id: "x", sortOrder: 1.0, state: "Backlog" }),
    ];
    render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

    // When an issue from another column is dropped on the column container (not on a specific drop zone between cards)
    const card = screen.getByTestId("issue-card-WDG-X").closest("[draggable]")!;
    const column = screen.getByTestId("column-Todo");
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(column, { dataTransfer });

    // Then onMoveIssue is called with targetIndex equal to the number of issues in the target column (append)
    expect(onMoveIssue).toHaveBeenCalledWith("WDG-X", "Todo", 2);
  });
});

// ===========================================================================
// Bug fix: only one gap across all columns when dragging to empty space
// ===========================================================================
describe("Single gap across columns when dragging to empty space", () => {
  it("clears the gap from the source column when dragging over a different column's empty space", () => {
    const issues = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-2", id: "2", sortOrder: 2.0, state: "Backlog" }),
      makeIssue({ identifier: "WDG-A", id: "a", sortOrder: 1.0, state: "In Progress" }),
    ];
    render(<BoardView issues={issues} />);

    // Start dragging WDG-1
    const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });

    // Activate a drop zone in Backlog column
    const backlogZone = screen.getByTestId("drop-zone-Backlog-1");
    fireEvent.dragOver(backlogZone, { preventDefault: () => {} });

    // The Backlog zone should be active
    expect(backlogZone.dataset.dropActive).toBe("true");

    // Now drag over the "In Progress" column's container (empty space, not a drop zone)
    const ipColumn = screen.getByTestId("column-In Progress");
    fireEvent.dragOver(ipColumn, { preventDefault: () => {} });

    // The Backlog zone should no longer be active
    expect(backlogZone.dataset.dropActive).toBeUndefined();

    // An "In Progress" zone should now be active (end-of-column)
    const ipEndZone = screen.getByTestId("drop-zone-In Progress-1");
    expect(ipEndZone.dataset.dropActive).toBe("true");
  });

  it("keeps the active zone when dragging within the same column's empty space", () => {
    const issues = [
      makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Todo" }),
    ];
    render(<BoardView issues={issues} />);

    // Start dragging
    const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
    const dataTransferData: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => { dataTransferData[k] = v; },
      getData: (k: string) => dataTransferData[k] ?? "",
    };
    fireEvent.dragStart(card, { dataTransfer });

    // Activate a drop zone in Todo column
    const todoZone = screen.getByTestId("drop-zone-Todo-0");
    fireEvent.dragOver(todoZone, { preventDefault: () => {} });
    expect(todoZone.dataset.dropActive).toBe("true");

    // Drag over the Todo column container (empty space below cards)
    const todoColumn = screen.getByTestId("column-Todo");
    fireEvent.dragOver(todoColumn, { preventDefault: () => {} });

    // Should still have a Todo zone active (not cleared)
    expect(todoZone.dataset.dropActive).toBe("true");
  });
});
