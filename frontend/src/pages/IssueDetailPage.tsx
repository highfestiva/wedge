/** IssueDetailPage — data-fetching wrapper for the IssueDetailView component. */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "urql";
import { ISSUE_QUERY } from "../graphql/queries";
import { UPDATE_ISSUE_MUTATION, ADD_COMMENT_MUTATION } from "../graphql/mutations";
import { EditIssueForm } from "../components/EditIssueForm";
import { createLogger } from "../utils/logger";

const log = createLogger("issue");

export const IssueDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  const [queryResult] = useQuery({
    query: ISSUE_QUERY,
    variables: { identifier: identifier ?? "" },
  });

  const [, executeUpdateMutation] = useMutation(UPDATE_ISSUE_MUTATION);
  const [, executeCommentMutation] = useMutation(ADD_COMMENT_MUTATION);

  const { fetching, data, error } = queryResult;

  if (data?.issue) {
    log.info(`loaded issue ${data.issue.identifier}`);
  }

  const handleUpdateField = (field: string, value: string | string[]) => {
    log.info(`updateField ${identifier} ${field}`);
    executeUpdateMutation({ identifier, [field]: value });
  };

  const handleAddComment = (body: string) => {
    log.info(`addComment on ${identifier}`);
    executeCommentMutation({ issueIdentifier: identifier, body });
  };

  return (
    <EditIssueForm
      issue={data?.issue ?? null}
      loading={fetching}
      error={error?.message ?? null}
      onUpdateField={handleUpdateField}
      onAddComment={handleAddComment}
      onCancel={() => navigate(-1)}
    />
  );
};
