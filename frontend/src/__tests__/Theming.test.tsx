/**
 * Tests for Theming — TDD Red Phase
 *
 * Tests 8.1 – 8.5 from the frontend TDD plan.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../components/ThemeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

// ---------------------------------------------------------------------------
// 8.1 Default theme is applied
// ---------------------------------------------------------------------------
describe("8.1 Default theme is applied", () => {
  it("given no localStorage entry, when ThemeToggle mounts, then the default theme is light", () => {
    // Given — localStorage is clear (beforeEach)

    // When
    render(<ThemeToggle />);

    // Then
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

// ---------------------------------------------------------------------------
// 8.2 Toggle switches to dark theme
// ---------------------------------------------------------------------------
describe("8.2 Toggle switches to dark theme", () => {
  it("given light theme is active, when the toggle is clicked, then data-theme becomes dark", async () => {
    // Given
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // When
    await user.click(screen.getByTestId("theme-toggle"));

    // Then
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// 8.3 Toggle switches back to light theme
// ---------------------------------------------------------------------------
describe("8.3 Toggle switches back to light theme", () => {
  it("given dark theme is active, when the toggle is clicked again, then data-theme becomes light", async () => {
    // Given
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByTestId("theme-toggle")); // to dark

    // When
    await user.click(screen.getByTestId("theme-toggle")); // back to light

    // Then
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

// ---------------------------------------------------------------------------
// 8.4 Theme preference persisted in localStorage
// ---------------------------------------------------------------------------
describe("8.4 Theme preference persisted in localStorage", () => {
  it("given light theme, when toggled to dark, then localStorage contains 'dark'", async () => {
    // Given
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // When
    await user.click(screen.getByTestId("theme-toggle"));

    // Then
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// 8.5 Theme restored from localStorage on load
// ---------------------------------------------------------------------------
describe("8.5 Theme restored from localStorage on load", () => {
  it("given localStorage contains 'dark', when ThemeToggle mounts, then data-theme is dark", () => {
    // Given
    localStorage.setItem("theme", "dark");

    // When
    render(<ThemeToggle />);

    // Then
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
