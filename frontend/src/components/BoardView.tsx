import React, { useState, useCallback } from "react";
import type { Issue, IssueState } from "../types";
import { ISSUE_STATES } from "../types";
import { IssueCard } from "./IssueCard";

export interface BoardViewProps {
  /** Issues to display. Injected for testing; in prod, fetched via GraphQL. */
  issues?: Issue[];
  /** Whether issues are loading. */
  loading?: boolean;
  /** Error message, if any. */
  error?: string | null;
  /** Called when a card is dropped into a new column (with optional target position). */
  onMoveIssue?: (identifier: string, newState: IssueState, targetIndex?: number) => void;
  /** Called when the "Create Issue" button is clicked. */
  onCreateIssue?: () => void;
  /** Called when an issue card is clicked. */
  onIssueClick?: (identifier: string) => void;
}

/** Drop zone rendered between issue cards for positional drag-and-drop. */
const DropZone: React.FC<{
  state: IssueState;
  index: number;
  onDrop: (identifier: string, state: IssueState, index: number) => void;
}> = ({ state, index, onDrop }) => {
  const [active, setActive] = useState(false);

  return (
    <div
      data-testid={`drop-zone-${state}-${index}`}
      data-drop-active={active ? "true" : undefined}
      className={`h-1 transition-all ${active ? "h-2 bg-blue-400 rounded" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.stopPropagation();
        const id = e.dataTransfer.getData("text/plain");
        if (id) {
          setActive(false);
          onDrop(id, state, index);
        }
      }}
    />
  );
};

export const BoardView: React.FC<BoardViewProps> = ({
  issues = [],
  loading = false,
  error = null,
  onMoveIssue,
  onCreateIssue,
  onIssueClick,
}) => {
  const handleDropZone = useCallback(
    (identifier: string, state: IssueState, index: number) => {
      onMoveIssue?.(identifier, state, index);
    },
    [onMoveIssue],
  );

  if (loading) {
    return (
      <div data-testid="loading-spinner" className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-t-faint">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-message" className="mx-auto max-w-lg py-12">
        <div className="rounded-xl border border-t-error-border bg-t-error-bg px-5 py-4 text-sm text-t-error-text">
          {error}
        </div>
      </div>
    );
  }

  const issuesByState = (state: IssueState) =>
    issues
      .filter((i) => i.state === state)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div data-testid="board" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-t-muted tracking-wide">Board</h2>
        <button
          data-testid="create-issue-btn"
          onClick={onCreateIssue}
          className="primary-button text-xs px-3.5 py-1.5"
        >
          + Create Issue
        </button>
      </div>
      <div className="board-grid">
        {ISSUE_STATES.map((state) => {
          const columnIssues = issuesByState(state);
          return (
            <div key={state} data-testid={`column-${state}`} className="board-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) onMoveIssue?.(id, state, columnIssues.length);
              }}
            >
              <div className="board-column-header">
                <span data-testid={`column-header-${state}`}>
                  {state}{" "}
                  <span className="ml-1 rounded-full bg-t-badge px-1.5 py-0.5 text-[10px] tabular-nums text-t-faint">
                    ({columnIssues.length})
                  </span>
                </span>
              </div>
              <div className="board-column-body">
                <DropZone state={state} index={0} onDrop={handleDropZone} />
                {columnIssues.map((issue, i) => (
                  <React.Fragment key={issue.identifier}>
                    <div
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", issue.identifier)
                      }
                    >
                      <IssueCard
                        issue={issue}
                        onClick={() => onIssueClick?.(issue.identifier)}
                      />
                    </div>
                    <DropZone state={state} index={i + 1} onDrop={handleDropZone} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
