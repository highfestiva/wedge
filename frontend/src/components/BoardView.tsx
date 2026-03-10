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
  animate: boolean;
  onDrop: (identifier: string, state: IssueState, index: number) => void;
  onActivate: (key: string) => void;
  onDeactivate: (key: string) => void;
}> = ({ state, index, active, animate, onDrop, onActivate, onDeactivate }) => {
  const key = `${state}-${index}`;

  return (
    <div
      data-testid={`drop-zone-${key}`}
      data-drop-active={active ? "true" : undefined}
      className={active ? `h-28${animate ? " transition-all duration-150" : ""}` : `h-2${animate ? " transition-all duration-150" : ""}`}
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
  // When true, the next drop-zone activation should skip its expand
  // transition. Set when a drag begins so the initial gap appears instantly
  // (filling the space left by the removed card). Cleared after the first
  // activation so subsequent zone switches animate normally.
  const skipTransitionRef = useRef(false);
  // Tracks the identifier from the most recent dragStart so the deferred
  // requestAnimationFrame callback becomes a no-op if a drop or dragEnd
  // already occurred (which clears the ref).
  const pendingDragRef = useRef<string | null>(null);
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
    setActiveDropZone((prev) => {
      // First activation after drag start — clear the flag so subsequent
      // switches animate.  The flag is read during render, so clearing it
      // after this setState ensures the current render still sees it.
      if (prev === null && skipTransitionRef.current) {
        requestAnimationFrame(() => { skipTransitionRef.current = false; });
      }
      return key;
    });
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
      pendingDragRef.current = null;
      skipTransitionRef.current = true;
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
          const visibleIssues = columnIssues.filter((issue) => issue.identifier !== draggingId);
          // Index of the dragged item in the full column (-1 if not in this
          // column). Used to convert filtered-list indices back to full-list
          // indices so BoardPage always receives consistent positions.
          const dragOriginIndex = draggingId
            ? columnIssues.findIndex((issue) => issue.identifier === draggingId)
            : -1;
          const toFullIndex = (filteredIdx: number) =>
            dragOriginIndex >= 0 && filteredIdx > dragOriginIndex
              ? filteredIdx + 1
              : filteredIdx;
          return (
            <div key={state} data-testid={`column-${state}`} className="board-column"
              onDragOver={(e) => {
                e.preventDefault();
                // Cancel any pending deactivation — we're actively dragging here.
                if (deactivateTimer.current !== null) {
                  cancelAnimationFrame(deactivateTimer.current);
                  deactivateTimer.current = null;
                }
                // Ensure the active drop zone belongs to this column.
                // Child DropZones stopPropagation so this only fires for
                // cards (which already set their zone) and empty space.
                // When dragging fast across columns, the leave/deactivate
                // on the old column may never fire — this guarantees a
                // single gap by switching to the end-of-column zone.
                setActiveDropZone((prev) => {
                  if (prev !== null && prev.startsWith(`${state}-`)) return prev;
                  return `${state}-${visibleIssues.length}`;
                });
              }}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) {
                  pendingDragRef.current = null;
                  skipTransitionRef.current = true;
                  setDraggingId(null);
                  setActiveDropZone(null);
                  onMoveIssue?.(id, state, toFullIndex(visibleIssues.length));
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
                <DropZone state={state} index={0} active={activeDropZone === `${state}-0`} animate={!skipTransitionRef.current} onDrop={(id, st, idx) => handleDropZone(id, st, toFullIndex(idx))} onActivate={activateDropZone} onDeactivate={deactivateDropZone} />
                {visibleIssues.map((issue, i) => (
                  <React.Fragment key={issue.identifier}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", issue.identifier);
                        const id = issue.identifier;
                        pendingDragRef.current = id;
                        requestAnimationFrame(() => {
                          if (pendingDragRef.current !== id) return;
                          skipTransitionRef.current = true;
                          setDraggingId(id);
                        });
                      }}
                      onDragEnd={() => {
                        pendingDragRef.current = null;
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
                        setActiveDropZone(
                          clientY < midY ? `${state}-${i}` : `${state}-${i + 1}`,
                        );
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        const id = e.dataTransfer.getData("text/plain");
                        if (id) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const midY = rect.top + rect.height / 2;
                          const dropIndex = e.clientY < midY ? i : i + 1;
                          pendingDragRef.current = null;
                          skipTransitionRef.current = true;
                          setDraggingId(null);
                          setActiveDropZone(null);
                          onMoveIssue?.(id, state, toFullIndex(dropIndex));
                        }
                      }}
                    >
                      <IssueCard
                        issue={issue}
                        onClick={() => onIssueClick?.(issue.identifier)}
                      />
                    </div>
                    <DropZone state={state} index={i + 1} active={activeDropZone === `${state}-${i + 1}`} animate={!skipTransitionRef.current} onDrop={(id, st, idx) => handleDropZone(id, st, toFullIndex(idx))} onActivate={activateDropZone} onDeactivate={deactivateDropZone} />
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
