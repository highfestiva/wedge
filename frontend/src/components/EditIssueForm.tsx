import React, { useState, useEffect } from "react";
import type { Issue } from "../types";
import { CommentsSection } from "./CommentsSection";
import { IssueFormFields } from "./IssueFormFields";
import { ModalOverlay } from "./ModalOverlay";
import { formatTimestamp } from "../utils/formatTimestamp";

export interface EditIssueFormProps {
  issue?: Issue | null;
  loading?: boolean;
  error?: string | null;
  onUpdateField?: (field: string, value: string | string[]) => void;
  onAddComment?: (body: string) => void;
  onCancel?: () => void;
}

export const EditIssueForm: React.FC<EditIssueFormProps> = ({
  issue = null,
  loading = false,
  error = null,
  onUpdateField,
  onAddComment,
  onCancel,
}) => {
  const [localTitle, setLocalTitle] = useState(issue?.title ?? "");
  const [assignee, setAssignee] = useState(issue?.assignee ?? "");
  const [labelsStr, setLabelsStr] = useState(issue?.labels.join(", ") ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [localState, setLocalState] = useState(issue?.state ?? "Backlog");
  const [localPriority, setLocalPriority] = useState(issue?.priority ?? "none");
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    setLocalTitle(issue?.title ?? "");
    setAssignee(issue?.assignee ?? "");
    setLabelsStr(issue?.labels.join(", ") ?? "");
    setDescription(issue?.description ?? "");
    setLocalState(issue?.state ?? "Backlog");
    setLocalPriority(issue?.priority ?? "none");
  }, [issue]);

  const handleSave = () => {
    if (!issue) return;
    if (localTitle !== issue.title) onUpdateField?.("title", localTitle);
    if (description !== (issue.description ?? "")) onUpdateField?.("description", description);
    if (localState !== issue.state) onUpdateField?.("state", localState);
    if (localPriority !== issue.priority) onUpdateField?.("priority", localPriority);
    if (labelsStr !== issue.labels.join(", ")) {
      onUpdateField?.("labels", labelsStr.split(",").map((l) => l.trim()).filter(Boolean));
    }
    if (assignee !== (issue.assignee ?? "")) onUpdateField?.("assignee", assignee);
    onCancel?.();
  };

  const handleCancel = () => {
    if (issue) {
      setLocalTitle(issue.title);
      setDescription(issue.description);
      setLocalState(issue.state);
      setLocalPriority(issue.priority);
      setLabelsStr(issue.labels.join(", "));
      setAssignee(issue.assignee ?? "");
    }
    onCancel?.();
  };

  const isDirty = issue
    ? localTitle !== issue.title ||
      description !== (issue.description ?? "") ||
      localState !== issue.state ||
      localPriority !== issue.priority ||
      labelsStr !== issue.labels.join(", ") ||
      assignee !== (issue.assignee ?? "")
    : false;

  if (loading) {
    return (
      <ModalOverlay onOverlayClick={onCancel}>
      <div data-testid="loading-spinner" className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-t-faint">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay onOverlayClick={onCancel}>
      <div data-testid="error-message" className="mx-auto max-w-lg py-12">
        <div className="rounded-lg border border-t-error-border bg-t-error-bg px-3 py-2 text-xs text-t-error-text">
          {error}
        </div>
      </div>
      </ModalOverlay>
    );
  }

  if (!issue) {
    return (
      <ModalOverlay onOverlayClick={onCancel}>
      <div data-testid="not-found" className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-t-faint">Issue not found</p>
      </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onOverlayClick={isDirty ? undefined : onCancel}>
    <div data-testid="issue-detail" className="section-card mx-auto max-w-lg space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-t-faint">
        <span data-testid="issue-identifier" className="font-semibold text-t-muted">{issue.identifier}</span>
        <span className="text-t-separator">&middot;</span>
        <span data-testid="issue-creator">{issue.creator}</span>
        <span className="text-t-separator">&middot;</span>
        <span data-testid="issue-created-at">{formatTimestamp(issue.createdAt)}</span>
        <span className="ml-auto text-t-dim">
          Updated&nbsp;<span data-testid="issue-updated-at">{formatTimestamp(issue.updatedAt)}</span>
        </span>
      </div>

      <IssueFormFields
        testIdPrefix="issue"
        title={localTitle}
        description={description}
        state={localState}
        priority={localPriority}
        labels={labelsStr}
        assignee={assignee}
        onTitleChange={setLocalTitle}
        onDescriptionChange={setDescription}
        onStateChange={setLocalState}
        onPriorityChange={setLocalPriority}
        onLabelsChange={setLabelsStr}
        onAssigneeChange={setAssignee}
        descriptionPlaceholder="Add a description…"
        labelsPlaceholder="Add labels…"
        assigneePlaceholder="Unassigned"
        submitLabel="Save"
        onCancel={handleCancel}
        onSubmit={handleSave}
      />

      {/* Collapsible comments + history */}
      <button
        type="button"
        data-testid="toggle-activity"
        className="flex w-full items-center gap-2 rounded-lg border border-t-border-subtle bg-t-inset px-3 py-2 text-xs font-medium text-t-muted hover:text-t-text hover:bg-t-hover transition-colors"
        onClick={() => setShowActivity((v) => !v)}
      >
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${showActivity ? "rotate-90" : ""}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M4.5 2l5 4-5 4V2z" />
        </svg>
        <span>Comments &amp; Activity</span>
        {(issue.comments.length > 0 || issue.history.length > 0) && (
          <span className="ml-auto rounded-full bg-t-badge px-1.5 py-0.5 text-[10px] leading-none text-t-dim">{issue.comments.length + issue.history.length}</span>
        )}
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          showActivity ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 pt-1">
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
                  <span className="ml-auto text-t-dim">{formatTimestamp(h.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </ModalOverlay>
  );
};

/** @deprecated Use EditIssueForm instead */
export const IssueDetailView = EditIssueForm;
export type IssueDetailViewProps = EditIssueFormProps;
