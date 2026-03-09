import React, { useState } from "react";
import type { CreateIssueInput } from "../types";
import { ISSUE_STATES, PRIORITIES } from "../types";

export interface CreateIssueFormProps {
  projectId: string;
  onSubmit?: (input: CreateIssueInput) => void;
  onClose?: () => void;
}

export const CreateIssueForm: React.FC<CreateIssueFormProps> = ({
  projectId,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState(ISSUE_STATES[0]);
  const [priority, setPriority] = useState(PRIORITIES[4]); // "none"
  const [labels, setLabels] = useState("");
  const [assignee, setAssignee] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Title is required");
      return;
    }
    setValidationError(null);
    onSubmit?.({
      projectId,
      title,
      description: description || undefined,
      state,
      priority,
      labels: labels
        ? labels.split(",").map((l) => l.trim()).filter(Boolean)
        : undefined,
      assignee: assignee || undefined,
    });
  };

  return (
    <form data-testid="create-issue-form" onSubmit={handleSubmit} className="section-card mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-t-text tracking-tight">Create Issue</h2>

      <div>
        <label className="label-text">Title *</label>
        <input
          data-testid="input-title"
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
      </div>
      <div>
        <label className="label-text">Description</label>
        <textarea
          data-testid="input-description"
          placeholder="Describe the issue…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea min-h-[80px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">State</label>
          <select
            data-testid="input-state"
            value={state}
            onChange={(e) => setState(e.target.value as typeof state)}
            className="form-select"
          >
            {ISSUE_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">Priority</label>
          <select
            data-testid="input-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="form-select"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label-text">Labels</label>
        <input
          data-testid="input-labels"
          placeholder="bug, frontend, urgent"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          className="form-input"
        />
      </div>
      <div>
        <label className="label-text">Assignee</label>
        <input
          data-testid="input-assignee"
          placeholder="email@example.com"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="form-input"
        />
      </div>
      {validationError && (
        <div data-testid="validation-error" className="rounded-lg border border-t-error-border bg-t-error-bg px-3 py-2 text-xs text-t-error-text">
          {validationError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button data-testid="cancel-btn" type="button" onClick={onClose} className="secondary-button text-xs">
          Cancel
        </button>
        <button data-testid="submit-btn" type="submit" className="primary-button text-xs">
          Create
        </button>
      </div>
    </form>
  );
};
