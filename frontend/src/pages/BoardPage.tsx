/** BoardPage — data-fetching wrapper for the BoardView component. */

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "urql";
import { PROJECTS_QUERY, ISSUES_QUERY } from "../graphql/queries";
import { UPDATE_ISSUE_MUTATION, CREATE_ISSUE_MUTATION } from "../graphql/mutations";
import { BoardView } from "../components/BoardView";
import { CreateIssueForm } from "../components/CreateIssueForm";
import { createLogger } from "../utils/logger";
import type { IssueState, CreateIssueInput, Project } from "../types";

const log = createLogger("board");

export const BoardPage: React.FC = () => {
  const { projectPrefix } = useParams<{ projectPrefix: string }>();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  if (data?.issues) {
    log.info(`loaded ${data.issues.items.length} issues`);
  }

  const handleMoveIssue = (identifier: string, newState: IssueState) => {
    log.info(`moveIssue ${identifier} -> ${newState}`);
    executeUpdateMutation({ identifier, state: newState });
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
    <BoardView
      issues={data?.issues?.items ?? []}
      loading={fetching}
      error={error?.message ?? null}
      onMoveIssue={handleMoveIssue}
      onCreateIssue={handleCreateIssue}
      onIssueClick={handleIssueClick}
    />
  );
};
