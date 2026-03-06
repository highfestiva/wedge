/** GraphQL mutation documents. */

export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($name: String!, $prefix: String!, $description: String) {
    createProject(name: $name, prefix: $prefix, description: $description) {
      id name prefix description createdAt
    }
  }
`;

export const CREATE_ISSUE_MUTATION = `
  mutation CreateIssue(
    $projectId: String!
    $title: String!
    $description: String
    $state: String
    $priority: String
    $labels: [String!]
    $assignee: String
  ) {
    createIssue(
      projectId: $projectId
      title: $title
      description: $description
      state: $state
      priority: $priority
      labels: $labels
      assignee: $assignee
    ) {
      id identifier title state priority creator assignee labels
    }
  }
`;

export const UPDATE_ISSUE_MUTATION = `
  mutation UpdateIssue(
    $identifier: String!
    $title: String
    $description: String
    $state: String
    $priority: String
    $labels: [String!]
    $assignee: String
  ) {
    updateIssue(
      identifier: $identifier
      title: $title
      description: $description
      state: $state
      priority: $priority
      labels: $labels
      assignee: $assignee
    ) {
      id identifier title description state priority assignee labels
      history { id actor field fromValue toValue timestamp }
    }
  }
`;

export const ADD_COMMENT_MUTATION = `
  mutation AddComment($issueIdentifier: String!, $body: String!) {
    addComment(issueIdentifier: $issueIdentifier, body: $body) {
      id author body createdAt
    }
  }
`;

export const DELETE_ISSUE_MUTATION = `
  mutation DeleteIssue($identifier: String!) {
    deleteIssue(identifier: $identifier)
  }
`;
