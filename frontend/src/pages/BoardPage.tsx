/** BoardPage — data-fetching wrapper for the BoardView component. */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "urql";
import { PROJECTS_QUERY, ISSUES_QUERY, ISSUE_QUERY } from "../graphql/queries";
import { UPDATE_ISSUE_MUTATION, CREATE_ISSUE_MUTATION, ADD_COMMENT_MUTATION } from "../graphql/mutations";
import { BoardView } from "../components/BoardView";
import { CreateIssueForm } from "../components/CreateIssueForm";
import { EditIssueForm } from "../components/EditIssueForm";
import { useCreateIssueAction } from "../contexts/CreateIssueContext";
import { createLogger } from "../utils/logger";
import type { Issue, IssueState, CreateIssueInput, Project } from "../types";

const log = createLogger("board");

export const BoardPage: React.FC = () => {
  const { projectPrefix } = useParams<{ projectPrefix: string }>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingIdentifier, setEditingIdentifier] = useState<string | null>(null);
  const [localIssues, setLocalIssues] = useState<Issue[]>([]);
  const [moveError, setMoveError] = useState<string | null>(null);
  const { setOnCreateIssue } = useCreateIssueAction();

  useEffect(() => {
    setOnCreateIssue(() => () => setShowCreateForm(true));
    return () => setOnCreateIssue(null);
  }, [setOnCreateIssue]);

  const [projectsResult] = useQuery({ query: PROJECTS_QUERY });
  const projects: Project[] = projectsResult.data?.projects ?? [];
  const project = projects.find((p) => p.prefix === projectPrefix);
  const projectId = project?.id ?? "";

  const [queryResult, reexecuteIssuesQuery] = useQuery({
    query: ISSUES_QUERY,
    variables: { projectId },
    pause: !projectId,
  });

  const [issueResult, reexecuteIssueQuery] = useQuery({
    query: ISSUE_QUERY,
    variables: { identifier: editingIdentifier ?? "" },
    pause: !editingIdentifier,
  });

  const [, executeUpdateMutation] = useMutation(UPDATE_ISSUE_MUTATION);
  const [, executeCreateMutation] = useMutation(CREATE_ISSUE_MUTATION);
  const [, executeCommentMutation] = useMutation(ADD_COMMENT_MUTATION);

  const { fetching, data, error } = queryResult;

  const queryItems = data?.issues?.items;
  useEffect(() => {
    if (queryItems) {
      setLocalIssues(queryItems);
    }
  }, [queryItems]);

  if (data?.issues) {
    log.info(`loaded ${data.issues.items.length} issues`);
  }

  const handleMoveIssue = (identifier: string, newState: IssueState, targetIndex?: number) => {
    const issue = localIssues.find((i) => i.identifier === identifier);
    if (!issue) {
      log.info(`moveIssue: unknown identifier ${identifier}, ignoring`);
      return;
    }

    const sameColumn = issue.state === newState;
    const rawIdx = targetIndex;

    // Detect same-position no-op for within-column reorder
    if (sameColumn && rawIdx !== undefined) {
      const fullColumnSorted = localIssues
        .filter((i) => i.state === newState)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = fullColumnSorted.findIndex((i) => i.identifier === identifier);
      if (rawIdx === currentIndex || rawIdx === currentIndex + 1) {
        return;
      }
    }

    // Build sorted list of issues in target column, excluding dragged issue
    const columnIssues = localIssues
      .filter((i) => i.state === newState && i.identifier !== identifier)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Adjust index: for same-column reorder, account for removal of dragged item
    let idx: number;
    if (rawIdx === undefined) {
      idx = columnIssues.length;
    } else if (sameColumn) {
      const fullColumnSorted = localIssues
        .filter((i) => i.state === newState)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const currentIndex = fullColumnSorted.findIndex((i) => i.identifier === identifier);
      idx = currentIndex < rawIdx ? rawIdx - 1 : rawIdx;
    } else {
      idx = rawIdx;
    }

    // Compute new sortOrder
    let newSortOrder: number;
    if (columnIssues.length === 0) {
      newSortOrder = 0.0;
    } else if (idx === 0) {
      newSortOrder = columnIssues[0].sortOrder - 1.0;
    } else if (idx >= columnIssues.length) {
      newSortOrder = columnIssues[columnIssues.length - 1].sortOrder + 1.0;
    } else {
      newSortOrder = (columnIssues[idx - 1].sortOrder + columnIssues[idx].sortOrder) / 2;
    }

    log.info(`moveIssue ${identifier} -> ${newState} at index ${idx}, sortOrder ${newSortOrder}`);
    const previousState = issue.state;
    const previousSortOrder = issue.sortOrder;

    setLocalIssues((prev) =>
      prev.map((i) =>
        i.identifier === identifier
          ? { ...i, state: newState, sortOrder: newSortOrder }
          : i
      )
    );
    setMoveError(null);

    const mutationVars: Record<string, unknown> = { identifier, sortOrder: newSortOrder };
    if (!sameColumn) {
      mutationVars.state = newState;
    }

    const result = executeUpdateMutation(mutationVars);
    Promise.resolve(result).then(
      (res) => {
        if (res?.error) {
          setLocalIssues((prev) =>
            prev.map((i) =>
              i.identifier === identifier
                ? { ...i, state: previousState, sortOrder: previousSortOrder }
                : i
            )
          );
          setMoveError(res.error.message);
        }
      },
      () => {
        setLocalIssues((prev) =>
          prev.map((i) =>
            i.identifier === identifier
              ? { ...i, state: previousState, sortOrder: previousSortOrder }
              : i
          )
        );
        setMoveError("Failed to move issue");
      }
    );
  };

  const handleIssueClick = (identifier: string) => {
    setEditingIdentifier(identifier);
  };

  const handleUpdateField = (field: string, value: string | string[]) => {
    if (!editingIdentifier) return;
    log.info(`updateField ${editingIdentifier} ${field}`);
    executeUpdateMutation({ identifier: editingIdentifier, [field]: value }).then((res) => {
      if (!res?.error) {
        reexecuteIssuesQuery({ requestPolicy: "network-only" });
      }
    });
  };

  const handleAddComment = (body: string) => {
    if (!editingIdentifier) return;
    log.info(`addComment on ${editingIdentifier}`);
    executeCommentMutation({ issueIdentifier: editingIdentifier, body }).then((res) => {
      if (!res?.error) {
        reexecuteIssueQuery({ requestPolicy: "network-only" });
      }
    });
  };

  const handleCreateSubmit = (input: CreateIssueInput) => {
    executeCreateMutation(input).then((res) => {
      if (!res?.error) {
        reexecuteIssuesQuery({ requestPolicy: "network-only" });
      }
    });
    setShowCreateForm(false);
  };

  return (
    <>
      {showCreateForm && (
        <CreateIssueForm
          projectId={projectId ?? ""}
          onSubmit={handleCreateSubmit}
          onClose={() => setShowCreateForm(false)}
        />
      )}
      {editingIdentifier && (
        <EditIssueForm
          issue={issueResult.data?.issue ?? null}
          loading={issueResult.fetching}
          error={issueResult.error?.message ?? null}
          onUpdateField={handleUpdateField}
          onAddComment={handleAddComment}
          onCancel={() => setEditingIdentifier(null)}
        />
      )}
      {moveError && (
        <div data-testid="move-error" className="mx-auto max-w-lg mb-4">
          <div className="rounded-xl border border-t-error-border bg-t-error-bg px-5 py-4 text-sm text-t-error-text">
            {moveError}
          </div>
        </div>
      )}
      <BoardView
        issues={localIssues}
        loading={fetching && localIssues.length === 0}
        error={error?.message ?? null}
        onMoveIssue={handleMoveIssue}
        onIssueClick={handleIssueClick}
      />
    </>
  );
};
