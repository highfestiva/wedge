/**
 * Tests for Routing — TDD Red Phase
 *
 * Tests 10.1 – 10.4 from the frontend TDD plan.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BoardView } from "../components/BoardView";
import { IssueDetailView } from "../components/IssueDetailView";
import { NotFound } from "../components/NotFound";
import type { Issue } from "../types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "id-1",
    identifier: "WDG-1",
    title: "Routable issue",
    description: null,
    state: "Backlog",
    priority: "none",
    labels: [],
    creator: "alice@test.com",
    assignee: null,
    project: "proj-1",
    url: "/issues/WDG-1",
    comments: [],
    history: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/projects/:projectId/board"
          element={<BoardView issues={[makeIssue()]} />}
        />
        <Route
          path="/projects/:projectId/issues/:identifier"
          element={<IssueDetailView issue={makeIssue()} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// 10.1 Board route renders board view
// ---------------------------------------------------------------------------
describe("10.1 Board route renders board view", () => {
  it("given the route /projects/proj-1/board, when rendered, then the board view component is shown", () => {
    // Given / When
    renderWithRouter(["/projects/proj-1/board"]);

    // Then
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 10.2 Issue detail route renders detail view
// ---------------------------------------------------------------------------
describe("10.2 Issue detail route renders detail view", () => {
  it("given the route /projects/proj-1/issues/WDG-1, when rendered, then the issue detail view is shown", () => {
    // Given / When
    renderWithRouter(["/projects/proj-1/issues/WDG-1"]);

    // Then
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 10.3 Unknown route shows 404 or fallback
// ---------------------------------------------------------------------------
describe("10.3 Unknown route shows 404", () => {
  it("given an unknown route, when rendered, then a not-found page is shown", () => {
    // Given / When
    renderWithRouter(["/does-not-exist"]);

    // Then
    expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 10.4 Clicking an issue card navigates to its detail
// ---------------------------------------------------------------------------
describe("10.4 Clicking an issue card navigates to detail", () => {
  it("given the board is rendered, when an issue card is clicked, then navigation to the detail route occurs", async () => {
    // Given
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/projects/proj-1/board"]}>
        <Routes>
          <Route
            path="/projects/:projectId/board"
            element={
              <BoardView
                issues={[makeIssue()]}
                onIssueClick={(id) => {
                  // In a real app this would use navigate()
                  // For the test, we verify the callback is triggered
                  window.history.pushState({}, "", `/projects/proj-1/issues/${id}`);
                }}
              />
            }
          />
          <Route
            path="/projects/:projectId/issues/:identifier"
            element={<IssueDetailView issue={makeIssue()} />}
          />
        </Routes>
      </MemoryRouter>
    );

    // When
    await user.click(screen.getByTestId("issue-card-WDG-1"));

    // Then
    expect(window.location.pathname).toContain("WDG-1");
  });
});
