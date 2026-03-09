import React, { useState, useEffect } from "react";
import type { Issue, Comment as CommentType, HistoryEntry } from "../types";
import { ISSUE_STATES, PRIORITIES } from "../types";
import { CommentsSection } from "./CommentsSection";

export interface IssueDetailViewProps {
  issue?: Issue | null;
  loading?: boolean;
  error?: string | null;
  onUpdateField?: (field: string, value: string | string[]) => void;
  onAddComment?: (body: string) => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({
  issue = null,
  loading = false,
  error = null,
  onUpdateField,
  onAddComment,
}) => {
  const [assignee, setAssignee] = useState(issue?.assignee ?? "");
  const [labelsStr, setLabelsStr] = useState(issue?.labels.join(", ") ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");

  useEffect(() => {
    setAssignee(issue?.assignee ?? "");
    setLabelsStr(issue?.labels.join(", ") ?? "");
    setDescription(issue?.description ?? "");
  }, [issue]);
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

  if (!issue) {
    return (
      <div data-testid="not-found" className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-t-faint">Issue not found</p>
      </div>
    );
  }

  return (
    <div data-testid="issue-detail" className="mx-auto max-w-4xl space-y-5">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-t-faint">
        <span data-testid="issue-identifier" className="font-semibold text-t-muted">{issue.identifier}</span>
        <span className="text-t-separator">&middot;</span>
        <span data-testid="issue-creator">{issue.creator}</span>
        <span className="text-t-separator">&middot;</span>
        <span data-testid="issue-created-at">{issue.createdAt}</span>
        <span className="ml-auto text-t-dim">
          Updated&nbsp;<span data-testid="issue-updated-at">{issue.updatedAt}</span>
        </span>
      </div>

      {/* Title */}
      <h1
        data-testid="issue-title"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) =>
          onUpdateField?.("title", e.currentTarget.textContent ?? "")
        }
        className="text-2xl font-semibold text-t-heading tracking-tight outline-none rounded-lg px-2 -mx-2 py-1 focus:bg-t-focus-bg transition"
      >
        {issue.title}
      </h1>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div>
            <label className="label-text">State</label>
            <select
              data-testid="issue-state"
              value={issue.state}
              onChange={(e) => onUpdateField?.("state", e.target.value)}
              className="form-select"
            >
              {ISSUE_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Priority</label>
            <select
              data-testid="issue-priority"
              value={issue.priority}
              onChange={(e) => onUpdateField?.("priority", e.target.value)}
              className="form-select"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Assignee</label>
            <input
              data-testid="issue-assignee"
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                onUpdateField?.("assignee", e.target.value);
              }}
              className="form-input"
              placeholder="Unassigned"
            />
          </div>

          <div>
            <label className="label-text">Labels</label>
            <input
              data-testid="issue-labels"
              value={labelsStr}
              onChange={(e) => {
                setLabelsStr(e.target.value);
                onUpdateField?.(
                  "labels",
                  e.target.value.split(",").map((l) => l.trim()).filter(Boolean)
                );
              }}
              className="form-input"
              placeholder="Add labels…"
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          <div>
            <label className="label-text">Description</label>
            <textarea
              data-testid="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={(e) => onUpdateField?.("description", e.target.value)}
              className="form-textarea min-h-[120px]"
              placeholder="Add a description…"
            />
          </div>

          {/* Comments */}
          <CommentsSection
            comments={issue.comments}
            onAddComment={onAddComment}
          />

          {/* History */}
          <div data-testid="history-section" className="space-y-2">
            <h3 className="label-text">Activity</h3>
            {issue.history.length === 0 && (
              <p className="text-xs text-t-dim">No activity yet.</p>
            )}
            {issue.history.map((h) => (
              <div
                key={h.id}
                data-testid={`history-entry-${h.id}`}
                className="flex flex-wrap items-baseline gap-x-1 rounded-lg bg-t-inset border border-t-border-subtle px-3 py-2 text-xs text-t-muted"
              >
                <em className="not-italic font-medium text-t-tertiary">{h.actor}</em>
                <span>changed</span>
                <em className="not-italic font-medium text-t-tertiary">{h.field}</em>
                <span>from</span>
                <em className="not-italic text-t-tertiary">{h.fromValue ?? "—"}</em>
                <span>to</span>
                <em className="not-italic text-t-tertiary">{h.toValue}</em>
                <span className="ml-auto text-t-dim">{h.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
