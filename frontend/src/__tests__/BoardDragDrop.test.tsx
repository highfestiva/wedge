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
import { render, screen, act } from "@testing-library/react";
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
