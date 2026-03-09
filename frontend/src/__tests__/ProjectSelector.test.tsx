/**
 * Tests for Project Selector — TDD Red Phase
 *
 * Tests 7.1 – 7.3 from the frontend TDD plan.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectSelector } from "../components/ProjectSelector";
import type { Project } from "../types";

const projects: Project[] = [
  { id: "p1", name: "Wedge", prefix: "WDG", description: null, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p2", name: "Other", prefix: "OTH", description: null, createdAt: "2026-01-01T00:00:00Z" },
];

// ---------------------------------------------------------------------------
// 7.1 Project selector renders all projects
// ---------------------------------------------------------------------------
describe("7.1 Project selector renders all projects", () => {
  it("given projects, when rendered, then all projects appear as options", () => {
    // Given / When
    render(<ProjectSelector projects={projects} currentProjectPrefix="WDG" />);

    // Then
    expect(screen.getByTestId("project-option-WDG")).toHaveTextContent("Wedge");
    expect(screen.getByTestId("project-option-OTH")).toHaveTextContent("Other");
  });
});

// ---------------------------------------------------------------------------
// 7.2 Selecting a project calls onSelect
// ---------------------------------------------------------------------------
describe("7.2 Selecting a project navigates to its board", () => {
  it("given projects, when a different project is selected, then onSelect is called with the project prefix", async () => {
    // Given
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ProjectSelector projects={projects} currentProjectPrefix="WDG" onSelect={onSelect} />);

    // When
    await user.selectOptions(screen.getByTestId("project-selector"), "OTH");

    // Then
    expect(onSelect).toHaveBeenCalledWith("OTH");
  });
});

// ---------------------------------------------------------------------------
// 7.3 Current project is highlighted / selected
// ---------------------------------------------------------------------------
describe("7.3 Current project is highlighted / selected", () => {
  it("given projects and currentProjectPrefix, when rendered, then the current project is selected in the dropdown", () => {
    // Given / When
    render(<ProjectSelector projects={projects} currentProjectPrefix="WDG" />);

    // Then
    expect(screen.getByTestId("project-selector")).toHaveValue("WDG");
  });
});
