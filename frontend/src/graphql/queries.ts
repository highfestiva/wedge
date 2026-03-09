/** GraphQL query/subscription documents. */

export const PROJECTS_QUERY = `
  query Projects {
    projects {
      id
      name
      prefix
      description
      createdAt
    }
  }
`;

export const ISSUE_QUERY = `
  query Issue($identifier: String!) {
    issue(identifier: $identifier) {
      id
      identifier
      title
      description
      state
      priority
      labels
      creator
      assignee
      project
      url
      createdAt
      updatedAt
      comments {
        id
        author
        body
        createdAt
      }
      history {
        id
        actor
        field
        fromValue
        toValue
        timestamp
      }
    }
  }
`;

export const ISSUES_QUERY = `
  query Issues(
    $projectId: String!
    $state: String
    $assignee: String
    $label: String
    $first: Int
    $after: String
  ) {
    issues(
      projectId: $projectId
      state: $state
      assignee: $assignee
      label: $label
      first: $first
      after: $after
    ) {
      items {
        id
        identifier
        title
        state
        priority
        assignee
        labels
        sortOrder
      }
      cursor
    }
  }
`;
