/**
 * Tests for Issue Detail View — Display — TDD Red Phase
 *
 * Tests 3.1 – 3.4 from the frontend TDD plan.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { IssueDetailView } from "../components/IssueDetailView";
import type { Issue } from "../types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "WDG-1",
    title: "Detail issue",
    description: "Some description",
    state: "In Progress",
    priority: "high",
    labels: ["bug", "frontend"],
    creator: "alice@test.com",
    assignee: "bob@test.com",
    project: "proj-1",
    url: "/issues/WDG-1",
    comments: [
      { id: "c1", author: "alice@test.com", body: "First comment", createdAt: "2026-01-01T10:00:00Z" },
      { id: "c2", author: "bob@test.com", body: "Second comment", createdAt: "2026-01-01T11:00:00Z" },
    ],
    history: [
      { id: "h1", actor: "alice@test.com", field: "state", fromValue: "Backlog", toValue: "In Progress", timestamp: "2026-01-01T09:00:00Z" },
      { id: "h2", actor: "bob@test.com", field: "assignee", fromValue: null, toValue: "bob@test.com", timestamp: "2026-01-01T09:30:00Z" },
    ],
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 3.1 Issue detail renders all fields
// ---------------------------------------------------------------------------
describe("3.1 Issue detail renders all fields", () => {
  it("given an issue, when the detail view is rendered, then identifier, title, description, state, priority, assignee, labels, creator, createdAt, updatedAt are displayed", () => {
    // Given
    const issue = makeIssue();

    // When
    render(<IssueDetailView issue={issue} />);

    // Then
    expect(screen.getByTestId("issue-identifier")).toHaveTextContent("WDG-1");
    expect(screen.getByTestId("issue-title")).toHaveTextContent("Detail issue");
    expect(screen.getByTestId("issue-description")).toHaveTextContent("Some description");
    expect(screen.getByTestId("issue-state")).toHaveValue("In Progress");
    expect(screen.getByTestId("issue-priority")).toHaveValue("high");
    expect(screen.getByTestId("issue-assignee")).toHaveValue("bob@test.com");
    expect(screen.getByTestId("issue-labels")).toHaveValue("bug, frontend");
    expect(screen.getByTestId("issue-creator")).toHaveTextContent("alice@test.com");
    expect(screen.getByTestId("issue-created-at")).toHaveTextContent("2026-01-01");
    expect(screen.getByTestId("issue-updated-at")).toHaveTextContent("2026-01-01");
  });
});

// ---------------------------------------------------------------------------
// 3.2 Comments are listed in chronological order
// ---------------------------------------------------------------------------
describe("3.2 Comments are listed in chronological order", () => {
  it("given an issue with comments, when rendered, then comments are shown oldest to newest", () => {
    // Given
    const issue = makeIssue();

    // When
    render(<IssueDetailView issue={issue} />);

    // Then
    const commentsSection = screen.getByTestId("comments-section");
    const commentBodies = within(commentsSection).getAllByTestId("comment-body");
    expect(commentBodies[0]).toHaveTextContent("First comment");
    expect(commentBodies[1]).toHaveTextContent("Second comment");
  });
});

// ---------------------------------------------------------------------------
// 3.3 History entries are listed in chronological order
// ---------------------------------------------------------------------------
describe("3.3 History entries are listed in chronological order", () => {
  it("given an issue with history, when rendered, then entries are in chronological order showing actor, field, values, and timestamp", () => {
    // Given
    const issue = makeIssue();

    // When
    render(<IssueDetailView issue={issue} />);

    // Then
    const historySection = screen.getByTestId("history-section");
    const entries = within(historySection).getAllByTestId(/history-entry-/);
    expect(entries).toHaveLength(2);

    // First entry: alice changed state from Backlog to In Progress
    expect(entries[0]).toHaveTextContent("alice@test.com");
    expect(entries[0]).toHaveTextContent("state");
    expect(entries[0]).toHaveTextContent("Backlog");
    expect(entries[0]).toHaveTextContent("In Progress");
  });
});

// ---------------------------------------------------------------------------
// 3.4 Issue detail — not found
// ---------------------------------------------------------------------------
describe("3.4 Issue detail — not found", () => {
  it("given no issue, when the detail view is rendered with null, then a not-found message is shown", () => {
    // Given / When
    render(<IssueDetailView issue={null} />);

    // Then
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });
});
