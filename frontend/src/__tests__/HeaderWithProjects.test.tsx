import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import type { Project } from "../types";

// ---------------------------------------------------------------------------
// urql mock
// ---------------------------------------------------------------------------
let mockQueryResult: { fetching: boolean; data?: unknown; error?: unknown } = {
  fetching: false,
  data: undefined,
  error: undefined,
};

vi.mock("urql", () => ({
  useQuery: () => [mockQueryResult],
  useMutation: () => [
    { fetching: false, data: undefined, error: undefined },
    vi.fn(),
  ],
}));

import { Header } from "../components/Header";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    name: "Alpha",
    prefix: "ALP",
    description: null,
    createdAt: "2025-01-01",
    ...overrides,
  };
}

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location-display">{loc.pathname}</div>;
}

function renderHeader(initialPath = "/projects/ALP/board") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/projects/:projectPrefix/board"
          element={
            <>
              <Header />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockQueryResult = { fetching: false, data: undefined, error: undefined };
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// Part B — Header with project fetching
// ===========================================================================
describe("Header with Projects (Part B)", () => {
  // -----------------------------------------------------------------------
  // Test B.14 — Shows empty project selector while loading
  // -----------------------------------------------------------------------
  it("B.14 — shows project selector with no options while loading", () => {
    // Given useQuery for projects returns fetching: true
    mockQueryResult = { fetching: true };

    // When Header is rendered
    renderHeader();

    // Then the project selector is present but has no project options
    const selector = screen.getByTestId("project-selector");
    expect(selector).toBeInTheDocument();
    const options = selector.querySelectorAll("option");
    // It may have 0 options, or at most a placeholder
    expect(options.length).toBeLessThanOrEqual(1);
  });

  // -----------------------------------------------------------------------
  // Test B.15 — Renders fetched projects in the selector
  // -----------------------------------------------------------------------
  it("B.15 — renders fetched projects in the selector", () => {
    // Given useQuery returns two projects
    const proj1 = makeProject({ id: "proj-1", name: "Alpha", prefix: "ALP" });
    const proj2 = makeProject({ id: "proj-2", name: "Beta", prefix: "BET" });
    mockQueryResult = {
      fetching: false,
      data: { projects: [proj1, proj2] },
    };

    // When Header is rendered
    renderHeader();

    // Then the selector contains options for both projects
    expect(screen.getByTestId("project-option-ALP")).toBeInTheDocument();
    expect(screen.getByTestId("project-option-BET")).toBeInTheDocument();
    expect(screen.getByTestId("project-option-ALP").textContent).toBe("Alpha");
    expect(screen.getByTestId("project-option-BET").textContent).toBe("Beta");
  });

  // -----------------------------------------------------------------------
  // Test B.16 — Selecting a project navigates to its board
  // -----------------------------------------------------------------------
  it("B.16 — selecting a project navigates to its board", async () => {
    // Given the header is rendered with projects
    const user = userEvent.setup();
    const proj1 = makeProject({ id: "proj-1", name: "Alpha" });
    const proj2 = makeProject({ id: "proj-2", name: "Beta", prefix: "BET" });
    mockQueryResult = {
      fetching: false,
      data: { projects: [proj1, proj2] },
    };
    renderHeader("/projects/ALP/board");

    // When a different project is selected
    const selector = screen.getByTestId("project-selector");
    await user.selectOptions(selector, "BET");

    // Then the URL changes to the new project's board
    expect(screen.getByTestId("location-display").textContent).toBe(
      "/projects/BET/board"
    );
  });
});
