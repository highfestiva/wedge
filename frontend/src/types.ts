/** Shared TypeScript types for the Wedge issue tracker frontend. */

// ---------------------------------------------------------------------------
// Enums / Constants
// ---------------------------------------------------------------------------

export const ISSUE_STATES = [
  "Backlog",
  "Todo",
  "In Progress",
  "In Review",
  "Done",
  "Cancelled",
] as const;

export type IssueState = (typeof ISSUE_STATES)[number];

export const PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const;

export type Priority = (typeof PRIORITIES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  actor: string;
  field: string;
  fromValue: string | null;
  toValue: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: IssueState;
  priority: Priority;
  labels: string[];
  creator: string;
  assignee: string | null;
  project: string;
  url: string;
  comments: Comment[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  prefix: string;
  description: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// GraphQL result wrappers
// ---------------------------------------------------------------------------

export interface PaginatedIssues {
  items: Issue[];
  cursor: string | null;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface CreateIssueInput {
  projectId: string;
  title: string;
  description?: string;
  state?: IssueState;
  priority?: Priority;
  labels?: string[];
  assignee?: string;
}

export interface UpdateIssueInput {
  identifier: string;
  title?: string;
  description?: string;
  state?: IssueState;
  priority?: Priority;
  labels?: string[];
  assignee?: string;
}
