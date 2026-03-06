/**
 * Tests for Comments — Adding — TDD Red Phase
 *
 * Tests 5.1 – 5.4 from the frontend TDD plan.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentsSection } from "../components/CommentsSection";

// ---------------------------------------------------------------------------
// 5.1 Submitting a comment fires addComment callback
// ---------------------------------------------------------------------------
describe("5.1 Submitting a comment fires addComment", () => {
  it("given text in the comment textarea, when submit is clicked, then onAddComment is called with the body", async () => {
    // Given
    const onAddComment = vi.fn();
    const user = userEvent.setup();
    render(<CommentsSection comments={[]} onAddComment={onAddComment} />);

    // When
    await user.type(screen.getByTestId("comment-input"), "Great work!");
    await user.click(screen.getByTestId("comment-submit"));

    // Then
    expect(onAddComment).toHaveBeenCalledWith("Great work!");
  });
});

// ---------------------------------------------------------------------------
// 5.2 New comment appears in the list after mutation
// ---------------------------------------------------------------------------
describe("5.2 New comment appears after add", () => {
  it("given existing comments, when a new comment is added (via rerender), then it appears at the end", () => {
    // Given
    const initial = [{ id: "c1", author: "alice@test.com", body: "First", createdAt: "2026-01-01T00:00:00Z" }];
    const { rerender } = render(<CommentsSection comments={initial} />);

    // When — simulate parent adding the comment after mutation
    const updated = [
      ...initial,
      { id: "c2", author: "bob@test.com", body: "Second", createdAt: "2026-01-01T01:00:00Z" },
    ];
    rerender(<CommentsSection comments={updated} />);

    // Then
    const bodies = screen.getAllByTestId("comment-body");
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toHaveTextContent("Second");
  });
});

// ---------------------------------------------------------------------------
// 5.3 Empty comment submission is prevented
// ---------------------------------------------------------------------------
describe("5.3 Empty comment submission is prevented", () => {
  it("given the comment textarea is empty, when rendered, then the submit button is disabled", () => {
    // Given / When
    render(<CommentsSection comments={[]} />);

    // Then
    expect(screen.getByTestId("comment-submit")).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 5.4 Comment textarea is cleared after submission
// ---------------------------------------------------------------------------
describe("5.4 Comment textarea is cleared after submission", () => {
  it("given a comment is submitted, when onAddComment succeeds, then the textarea is empty", async () => {
    // Given
    const onAddComment = vi.fn();
    const user = userEvent.setup();
    render(<CommentsSection comments={[]} onAddComment={onAddComment} />);

    // When
    await user.type(screen.getByTestId("comment-input"), "My comment");
    await user.click(screen.getByTestId("comment-submit"));

    // Then
    expect(screen.getByTestId("comment-input")).toHaveValue("");
  });
});
