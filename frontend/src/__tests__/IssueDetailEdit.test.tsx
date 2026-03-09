/**
 * Tests for Issue Detail View — Editing — TDD Red Phase
 *
 * Tests 4.1 – 4.6 from the frontend TDD plan.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IssueDetailView } from "../components/IssueDetailView";
import type { Issue } from "../types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "WDG-1",
    title: "Editable issue",
    description: "Original description",
    state: "Backlog",
    priority: "none",
    labels: ["bug"],
    creator: "alice@test.com",
    assignee: "bob@test.com",
    project: "proj-1",
    url: "/issues/WDG-1",
    comments: [],
    history: [],
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 4.1 Editing title fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.1 Editing title fires onUpdateField", () => {
  it("given an issue displayed, when the title is changed and blurred, then onUpdateField is called with the new title", () => {
    // Given
    const onUpdateField = vi.fn();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    const titleEl = screen.getByTestId("issue-title");
    titleEl.textContent = "New Title";
    fireEvent.blur(titleEl);

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("title", "New Title");
  });
});

// ---------------------------------------------------------------------------
// 4.2 Changing state via dropdown fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.2 Changing state via dropdown", () => {
  it("given an issue in Backlog, when a different state is selected, then onUpdateField is called with the new state", async () => {
    // Given
    const onUpdateField = vi.fn();
    const user = userEvent.setup();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    await user.selectOptions(screen.getByTestId("issue-state"), "In Progress");

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("state", "In Progress");
  });
});

// ---------------------------------------------------------------------------
// 4.3 Changing priority via dropdown fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.3 Changing priority via dropdown", () => {
  it("given an issue with priority none, when high is selected, then onUpdateField is called", async () => {
    // Given
    const onUpdateField = vi.fn();
    const user = userEvent.setup();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    await user.selectOptions(screen.getByTestId("issue-priority"), "high");

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("priority", "high");
  });
});

// ---------------------------------------------------------------------------
// 4.4 Changing assignee fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.4 Changing assignee", () => {
  it("given an issue, when the assignee is changed, then onUpdateField is called with the new assignee", async () => {
    // Given
    const onUpdateField = vi.fn();
    const user = userEvent.setup();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    const input = screen.getByTestId("issue-assignee");
    await user.clear(input);
    await user.type(input, "carol@test.com");

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("assignee", expect.stringContaining("carol"));
  });
});

// ---------------------------------------------------------------------------
// 4.5 Editing labels fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.5 Editing labels", () => {
  it("given an issue with labels, when labels are changed, then onUpdateField is called with the updated labels array", async () => {
    // Given
    const onUpdateField = vi.fn();
    const user = userEvent.setup();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    const input = screen.getByTestId("issue-labels");
    await user.clear(input);
    await user.type(input, "feature, improvement");

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("labels", expect.arrayContaining(["feature"]));
  });
});

// ---------------------------------------------------------------------------
// 4.6 Editing description fires updateIssue mutation
// ---------------------------------------------------------------------------
describe("4.6 Editing description", () => {
  it("given an issue, when the description is modified and blurred, then onUpdateField is called", async () => {
    // Given
    const onUpdateField = vi.fn();
    const user = userEvent.setup();
    render(<IssueDetailView issue={makeIssue()} onUpdateField={onUpdateField} />);

    // When
    const textarea = screen.getByTestId("issue-description");
    await user.clear(textarea);
    await user.type(textarea, "Updated description");
    fireEvent.blur(textarea);

    // Then
    expect(onUpdateField).toHaveBeenCalledWith("description", "Updated description");
  });
});
