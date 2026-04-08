/**
 * Tests for Board Drag-and-Drop — bug-fix edge cases
 *
 * Tests for cross-column gap clearing and dragend-outside-board recovery.
 * Core drag behaviour (optimistic updates, reverts, counts, sort-order) is
 * covered by BoardView.test.tsx and BoardPage.test.tsx.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { BoardView } from "../components/BoardView";
import type { Issue } from "../types";

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

// ===========================================================================
// Bug fix: card returns to original position when dropped outside board
// ===========================================================================
describe("Card reappears when dropped outside the board", () => {
  it("given a card is being dragged, when dragend fires (drop outside board), then the card reappears", () => {
    vi.useFakeTimers();
    try {
      const issues = [
        makeIssue({ identifier: "WDG-1", id: "1", sortOrder: 1.0, state: "Todo" }),
      ];
      const onMoveIssue = vi.fn();
      render(<BoardView issues={issues} onMoveIssue={onMoveIssue} />);

      // Card is visible initially
      expect(screen.getByTestId("issue-card-WDG-1")).toBeInTheDocument();

      // Start dragging — capture the draggable wrapper before rAF unmounts it
      const card = screen.getByTestId("issue-card-WDG-1").closest("[draggable]")!;
      const dataTransferData: Record<string, string> = {};
      const dataTransfer = {
        setData: (k: string, v: string) => { dataTransferData[k] = v; },
        getData: (k: string) => dataTransferData[k] ?? "",
      };
      fireEvent.dragStart(card, { dataTransfer });

      // Flush the requestAnimationFrame that sets draggingId and unmounts the card
      act(() => { vi.runAllTimers(); });

      // The card's element is now detached from the DOM by React.
      // Simulate the browser firing dragend on the (detached) source element.
      act(() => {
        card.dispatchEvent(new Event("dragend", { bubbles: true }));
      });

      // Card should be visible again
      expect(screen.getByTestId("issue-card-WDG-1")).toBeInTheDocument();
      // onMoveIssue should NOT have been called
      expect(onMoveIssue).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
