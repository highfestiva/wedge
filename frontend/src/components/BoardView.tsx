import React from "react";
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
  /** Called when a card is dropped into a new column. */
  onMoveIssue?: (identifier: string, newState: IssueState) => void;
  /** Called when the "Create Issue" button is clicked. */
  onCreateIssue?: () => void;
  /** Called when an issue card is clicked. */
  onIssueClick?: (identifier: string) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  issues = [],
  loading = false,
  error = null,
  onMoveIssue,
  onCreateIssue,
  onIssueClick,
}) => {
  if (loading) {
    return (
      <div data-testid="loading-spinner" className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
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
        <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  const issuesByState = (state: IssueState) =>
    issues.filter((i) => i.state === state);

  return (
    <div data-testid="board" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-400 tracking-wide">Board</h2>
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
            <div key={state} data-testid={`column-${state}`} className="board-column">
              <div className="board-column-header">
                <span data-testid={`column-header-${state}`}>
                  {state}{" "}
                  <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500">
                    ({columnIssues.length})
                  </span>
                </span>
              </div>
              <div className="board-column-body">
                {columnIssues.map((issue) => (
                  <IssueCard
                    key={issue.identifier}
                    issue={issue}
                    onClick={() => onIssueClick?.(issue.identifier)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
