/**
 * Tests for Loading & Error States — TDD Red Phase
 *
 * Tests 9.1 – 9.5 from the frontend TDD plan.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardView } from "../components/BoardView";
import { IssueDetailView } from "../components/IssueDetailView";

// ---------------------------------------------------------------------------
// 9.1 Loading spinner shown while fetching issues
// ---------------------------------------------------------------------------
describe("9.1 Loading spinner shown on board", () => {
  it("given the board is loading, when rendered, then a loading spinner is visible", () => {
    // Given / When
    render(<BoardView loading={true} />);

    // Then
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 9.2 Loading spinner shown on issue detail
// ---------------------------------------------------------------------------
describe("9.2 Loading spinner shown on issue detail", () => {
  it("given the issue detail is loading, when rendered, then a loading indicator is visible", () => {
    // Given / When
    render(<IssueDetailView loading={true} />);

    // Then
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 9.3 Error message on query failure
// ---------------------------------------------------------------------------
describe("9.3 Error message on board query failure", () => {
  it("given the issues query fails, when rendered with an error, then an error message is displayed", () => {
    // Given / When
    render(<BoardView error="Could not reach server, please try again" />);

    // Then
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Could not reach server, please try again"
    );
  });
});

// ---------------------------------------------------------------------------
// 9.4 Toast/notification on mutation failure
// ---------------------------------------------------------------------------
describe("9.4 Toast/notification on mutation failure", () => {
  it("given an updateIssue mutation fails, when the error is passed, then an error message is displayed", () => {
    // Given / When
    render(<BoardView error="Failed to update issue" />);

    // Then
    expect(screen.getByTestId("error-message")).toHaveTextContent("Failed to update issue");
  });
});

// ---------------------------------------------------------------------------
// 9.5 Error message on issue detail query failure
// ---------------------------------------------------------------------------
describe("9.5 Error message on issue detail query failure", () => {
  it("given the issue detail query fails, when rendered with an error, then an error message is shown", () => {
    // Given / When
    render(<IssueDetailView error="Could not reach server, please try again" />);

    // Then
    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Could not reach server, please try again"
    );
  });
});
