/** BoardPage — data-fetching wrapper for the BoardView component. */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "urql";
import { PROJECTS_QUERY, ISSUES_QUERY } from "../graphql/queries";
import { UPDATE_ISSUE_MUTATION, CREATE_ISSUE_MUTATION } from "../graphql/mutations";
import { BoardView } from "../components/BoardView";
import { CreateIssueForm } from "../components/CreateIssueForm";
import { createLogger } from "../utils/logger";
import type { Issue, IssueState, CreateIssueInput, Project } from "../types";

const log = createLogger("board");

export const BoardPage: React.FC = () => {
  const { projectPrefix } = useParams<{ projectPrefix: string }>();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localIssues, setLocalIssues] = useState<Issue[]>([]);
  const [moveError, setMoveError] = useState<string | null>(null);

  const [projectsResult] = useQuery({ query: PROJECTS_QUERY });
  const projects: Project[] = projectsResult.data?.projects ?? [];
  const project = projects.find((p) => p.prefix === projectPrefix);
  const projectId = project?.id ?? "";

  const [queryResult] = useQuery({
    query: ISSUES_QUERY,
    variables: { projectId },
    pause: !projectId,
  });

  const [, executeUpdateMutation] = useMutation(UPDATE_ISSUE_MUTATION);
  const [, executeCreateMutation] = useMutation(CREATE_ISSUE_MUTATION);

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

  const handleMoveIssue = (identifier: string, newState: IssueState) => {
    const issue = localIssues.find((i) => i.identifier === identifier);
    if (!issue) {
      log.info(`moveIssue: unknown identifier ${identifier}, ignoring`);
      return;
    }
    if (issue.state === newState) {
      return;
    }

    log.info(`moveIssue ${identifier} -> ${newState}`);
    const previousState = issue.state;

    setLocalIssues((prev) =>
      prev.map((i) => (i.identifier === identifier ? { ...i, state: newState } : i))
    );
    setMoveError(null);

    const result = executeUpdateMutation({ identifier, state: newState });
    Promise.resolve(result).then(
      (res) => {
        if (res?.error) {
          setLocalIssues((prev) =>
            prev.map((i) =>
              i.identifier === identifier ? { ...i, state: previousState } : i
            )
          );
          setMoveError(res.error.message);
        }
      },
      () => {
        setLocalIssues((prev) =>
          prev.map((i) =>
            i.identifier === identifier ? { ...i, state: previousState } : i
          )
        );
        setMoveError("Failed to move issue");
      }
    );
  };

  const handleIssueClick = (identifier: string) => {
    navigate(`/projects/${projectPrefix}/issues/${identifier}`);
  };

  const handleCreateIssue = () => {
    setShowCreateForm(true);
  };

  const handleCreateSubmit = (input: CreateIssueInput) => {
    executeCreateMutation(input);
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <CreateIssueForm
        projectId={projectId ?? ""}
        onSubmit={handleCreateSubmit}
        onClose={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <>
      {moveError && (
        <div data-testid="move-error" className="mx-auto max-w-lg mb-4">
          <div className="rounded-xl border border-t-error-border bg-t-error-bg px-5 py-4 text-sm text-t-error-text">
            {moveError}
          </div>
        </div>
      )}
      <BoardView
        issues={localIssues}
        loading={fetching}
        error={error?.message ?? null}
        onMoveIssue={handleMoveIssue}
        onCreateIssue={handleCreateIssue}
        onIssueClick={handleIssueClick}
      />
    </>
  );
};
