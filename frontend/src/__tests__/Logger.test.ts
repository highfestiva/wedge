import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../utils/logger";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Logger (Part D)", () => {
  // -----------------------------------------------------------------------
  // Test D.1 — Logger info outputs with correct tag prefix
  // -----------------------------------------------------------------------
  it("D.1 — info outputs with [wedge:graphql] prefix", () => {
    // Given a logger instance created with tag "graphql"
    const logger = createLogger("graphql");

    // When logger.info("request sent") is called
    logger.info("request sent");

    // Then console.log is called with the prefix and message
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:graphql]"),
      "request sent"
    );
  });

  // -----------------------------------------------------------------------
  // Test D.2 — Logger error outputs with correct tag prefix
  // -----------------------------------------------------------------------
  it("D.2 — error outputs with [wedge:board] prefix", () => {
    // Given a logger instance created with tag "board"
    const logger = createLogger("board");

    // When logger.error("fetch failed") is called
    logger.error("fetch failed");

    // Then console.error is called with the prefix and message
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:board]"),
      "fetch failed"
    );
  });

  // -----------------------------------------------------------------------
  // Test D.3 — Logger warn outputs with correct tag prefix
  // -----------------------------------------------------------------------
  it("D.3 — warn outputs with [wedge:issue] prefix", () => {
    // Given a logger instance created with tag "issue"
    const logger = createLogger("issue");

    // When logger.warn("unexpected state") is called
    logger.warn("unexpected state");

    // Then console.warn is called with the prefix and message
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("[wedge:issue]"),
      "unexpected state"
    );
  });
});
