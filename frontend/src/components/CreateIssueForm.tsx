import React, { useState } from "react";
import type { CreateIssueInput } from "../types";
import { ISSUE_STATES, PRIORITIES } from "../types";
import { IssueFormFields } from "./IssueFormFields";
import { ModalOverlay } from "./ModalOverlay";

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

  const isDirty =
    title !== "" ||
    description !== "" ||
    state !== ISSUE_STATES[0] ||
    priority !== PRIORITIES[4] ||
    labels !== "" ||
    assignee !== "";

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
    <ModalOverlay onOverlayClick={isDirty ? undefined : onClose}>
    <form data-testid="create-issue-form" onSubmit={handleSubmit} className="section-card mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-t-text tracking-tight">Create Issue</h2>

      <IssueFormFields
        testIdPrefix="input"
        title={title}
        description={description}
        state={state}
        priority={priority}
        labels={labels}
        assignee={assignee}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onStateChange={setState}
        onPriorityChange={setPriority}
        onLabelsChange={setLabels}
        onAssigneeChange={setAssignee}
        titlePlaceholder="Issue title"
        descriptionPlaceholder="Describe the issue…"
        labelsPlaceholder="bug, frontend, urgent"
        assigneePlaceholder="email@example.com"
        submitLabel="Create"
        onCancel={onClose}
        validationError={validationError}
      />
    </form>
    </ModalOverlay>
  );
};
