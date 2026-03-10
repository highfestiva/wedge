import React, { useState, useCallback, useRef } from "react";
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
  active: boolean;
  onDrop: (identifier: string, state: IssueState, index: number) => void;
  onActivate: (key: string) => void;
  onDeactivate: (key: string) => void;
}> = ({ state, index, active, onDrop, onActivate, onDeactivate }) => {
  const key = `${state}-${index}`;

  return (
    <div
      data-testid={`drop-zone-${key}`}
      data-drop-active={active ? "true" : undefined}
      className={active ? "h-20 transition-all duration-150" : "h-2"}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onActivate(key);
      }}
      onDragLeave={() => onDeactivate(key)}
      onDrop={(e) => {
        e.stopPropagation();
        const id = e.dataTransfer.getData("text/plain");
        if (id) {
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const deactivateTimer = useRef<number | null>(null);
  // Tracks whether a sibling element received dragenter before the current
  // dragleave fires. Browser fires dragenter on the new target before
  // dragleave on the old target, so this flag lets us skip deactivation.
  const dragTransferRef = useRef(false);

  const activateDropZone = useCallback((key: string) => {
    // Cancel any pending deactivation — the cursor moved to a sibling element.
    if (deactivateTimer.current !== null) {
      cancelAnimationFrame(deactivateTimer.current);
      deactivateTimer.current = null;
    }
    dragTransferRef.current = false;
    setActiveDropZone(key);
  }, []);

  const deactivateDropZone = useCallback((key: string) => {
    // If a sibling already received dragenter, skip deactivation entirely.
    if (dragTransferRef.current) {
      dragTransferRef.current = false;
      return;
    }
    // Defer deactivation to the next frame so that a dragOver on an adjacent
    // element (which fires synchronously before the next paint) can cancel it.
    if (deactivateTimer.current !== null) {
      cancelAnimationFrame(deactivateTimer.current);
    }
    deactivateTimer.current = requestAnimationFrame(() => {
      deactivateTimer.current = null;
      setActiveDropZone((prev) => (prev === key ? null : prev));
    });
  }, []);

  const handleDropZone = useCallback(
    (identifier: string, state: IssueState, index: number) => {
      setDraggingId(null);
      setActiveDropZone(null);
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
                if (id) {
                  setDraggingId(null);
                  setActiveDropZone(null);
                  onMoveIssue?.(id, state, columnIssues.length);
                }
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
                <DropZone state={state} index={0} active={activeDropZone === `${state}-0`} onDrop={handleDropZone} onActivate={activateDropZone} onDeactivate={deactivateDropZone} />
                {columnIssues.map((issue, i) => (
                  <React.Fragment key={issue.identifier}>
                    <div
                      draggable
                      className={draggingId === issue.identifier ? "hidden" : ""}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", issue.identifier);
                        requestAnimationFrame(() => setDraggingId(issue.identifier));
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setActiveDropZone(null);
                      }}
                      onDragEnter={() => {
                        // Signal that a sibling received the drag before
                        // the old element's dragleave fires.
                        dragTransferRef.current = true;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        // Cancel any pending deactivation from a DropZone we
                        // just left — prevents the deferred null from clobbering
                        // the zone we're about to (re)activate.
                        if (deactivateTimer.current !== null) {
                          cancelAnimationFrame(deactivateTimer.current);
                          deactivateTimer.current = null;
                        }
                        // Capture DOM measurements synchronously before the
                        // synthetic event is nullified by React.
                        const rect = e.currentTarget.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        const clientY = e.clientY;
                        // Only recompute zone if the active zone isn't already
                        // one of this card's two adjacent zones. This prevents
                        // oscillation when zone expansion shifts the card layout.
                        setActiveDropZone((prev) => {
                          const above = `${state}-${i}`;
                          const below = `${state}-${i + 1}`;
                          if (prev === above || prev === below) return prev;
                          return clientY < midY ? above : below;
                        });
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        const id = e.dataTransfer.getData("text/plain");
                        if (id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midY = rect.top + rect.height / 2;
                          const dropIndex = e.clientY < midY ? i : i + 1;
                          setDraggingId(null);
                          setActiveDropZone(null);
                          onMoveIssue?.(id, state, dropIndex);
                        }
                      }}
                    >
                      <IssueCard
                        issue={issue}
                        onClick={() => onIssueClick?.(issue.identifier)}
                      />
                    </div>
                    <DropZone state={state} index={i + 1} active={activeDropZone === `${state}-${i + 1}`} onDrop={handleDropZone} onActivate={activateDropZone} onDeactivate={deactivateDropZone} />
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
