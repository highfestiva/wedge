/**
 * Tests for Create Issue — TDD Red Phase
 *
 * Tests 6.1 – 6.5 from the frontend TDD plan.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateIssueForm } from "../components/CreateIssueForm";

// ---------------------------------------------------------------------------
// 6.1 Create issue form renders required fields
// ---------------------------------------------------------------------------
describe("6.1 Create issue form renders required fields", () => {
  it("given the form, when rendered, then inputs for title, description, state, priority, labels, and assignee are present", () => {
    // Given / When
    render(<CreateIssueForm projectId="proj-1" />);

    // Then
    expect(screen.getByTestId("input-title")).toBeInTheDocument();
    expect(screen.getByTestId("input-description")).toBeInTheDocument();
    expect(screen.getByTestId("input-state")).toBeInTheDocument();
    expect(screen.getByTestId("input-priority")).toBeInTheDocument();
    expect(screen.getByTestId("input-labels")).toBeInTheDocument();
    expect(screen.getByTestId("input-assignee")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6.2 Submitting the form fires createIssue mutation
// ---------------------------------------------------------------------------
describe("6.2 Submitting the form fires onSubmit", () => {
  it("given a title is filled, when the form is submitted, then onSubmit is called with correct input", async () => {
    // Given
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CreateIssueForm projectId="proj-1" onSubmit={onSubmit} />);

    // When
    await user.type(screen.getByTestId("input-title"), "New Issue");
    await user.click(screen.getByTestId("submit-btn"));

    // Then
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        title: "New Issue",
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 6.3 Validation — title is required
// ---------------------------------------------------------------------------
describe("6.3 Validation — title is required", () => {
  it("given no title, when form is submitted, then a validation error is shown and onSubmit is not called", async () => {
    // Given
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CreateIssueForm projectId="proj-1" onSubmit={onSubmit} />);

    // When — submit without typing a title
    await user.click(screen.getByTestId("submit-btn"));

    // Then
    expect(screen.getByTestId("validation-error")).toHaveTextContent("Title is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 6.4 After creation, board updates with new issue
// ---------------------------------------------------------------------------
describe("6.4 After creation, board updates with new issue", () => {
  it("given the form submitted successfully, when onSubmit returns, then the parent can update the board", async () => {
    // Given
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CreateIssueForm projectId="proj-1" onSubmit={onSubmit} />);

    // When
    await user.type(screen.getByTestId("input-title"), "Created Issue");
    await user.click(screen.getByTestId("submit-btn"));

    // Then — onSubmit was called, which the parent uses to update the board
    expect(onSubmit).toHaveBeenCalledTimes(1);
    // The actual board update is tested in the integration/BoardView tests
  });
});

// ---------------------------------------------------------------------------
// 6.5 After creation, form closes / resets
// ---------------------------------------------------------------------------
describe("6.5 After creation, form closes / resets", () => {
  it("given the onClose callback, when cancel is clicked, then onClose is called", async () => {
    // Given
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateIssueForm projectId="proj-1" onClose={onClose} />);

    // When
    await user.click(screen.getByTestId("cancel-btn"));

    // Then
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
