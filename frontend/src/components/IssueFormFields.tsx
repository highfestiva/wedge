import React from "react";
import { ISSUE_STATES, PRIORITIES } from "../types";

export interface IssueFormFieldsProps {
  /** Prefix for data-testid attributes, e.g. "input" → "input-title", "issue" → "issue-title" */
  testIdPrefix: string;
  title: string;
  description: string;
  state: string;
  priority: string;
  labels: string;
  assignee: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onLabelsChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onDescriptionBlur?: () => void;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  labelsPlaceholder?: string;
  assigneePlaceholder?: string;
  /** Label for the submit button, e.g. "Create" or "Save". */
  submitLabel: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  validationError?: string | null;
}

export const IssueFormFields: React.FC<IssueFormFieldsProps> = ({
  testIdPrefix,
  title,
  description,
  state,
  priority,
  labels,
  assignee,
  onTitleChange,
  onDescriptionChange,
  onStateChange,
  onPriorityChange,
  onLabelsChange,
  onAssigneeChange,
  onDescriptionBlur,
  titlePlaceholder = "Issue title",
  descriptionPlaceholder = "Add a description…",
  labelsPlaceholder = "Add labels…",
  assigneePlaceholder = "Unassigned",
  submitLabel,
  onCancel,
  onSubmit,
  validationError,
}) => (
  <>
    <div>
      <label className="label-text">Title</label>
      <input
        data-testid={`${testIdPrefix}-title`}
        placeholder={titlePlaceholder}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="form-input"
      />
    </div>
    <div>
      <label className="label-text">Description</label>
      <textarea
        data-testid={`${testIdPrefix}-description`}
        placeholder={descriptionPlaceholder}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        onBlur={onDescriptionBlur}
        className="form-textarea min-h-[80px]"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label-text">State</label>
        <select
          data-testid={`${testIdPrefix}-state`}
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
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
          data-testid={`${testIdPrefix}-priority`}
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="form-select"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
    <div>
      <label className="label-text">Labels</label>
      <input
        data-testid={`${testIdPrefix}-labels`}
        placeholder={labelsPlaceholder}
        value={labels}
        onChange={(e) => onLabelsChange(e.target.value)}
        className="form-input"
      />
    </div>
    <div>
      <label className="label-text">Assignee</label>
      <input
        data-testid={`${testIdPrefix}-assignee`}
        placeholder={assigneePlaceholder}
        value={assignee}
        onChange={(e) => onAssigneeChange(e.target.value)}
        className="form-input"
      />
    </div>
    {validationError && (
      <div data-testid="validation-error" className="rounded-lg border border-t-error-border bg-t-error-bg px-3 py-2 text-xs text-t-error-text">
        {validationError}
      </div>
    )}
    <div className="flex items-center justify-end gap-2 pt-2">
      <button data-testid="cancel-btn" type="button" onClick={onCancel} className="secondary-button text-xs">
        Cancel
      </button>
      <button data-testid="submit-btn" type={onSubmit ? "button" : "submit"} onClick={onSubmit} className="primary-button text-xs">
        {submitLabel}
      </button>
    </div>
  </>
);
