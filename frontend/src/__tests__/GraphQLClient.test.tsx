import { describe, it, expect, vi } from "vitest";

// Mock urql to prevent real network calls when testing App rendering
vi.mock("urql", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => [{ fetching: false, data: undefined, error: undefined }],
  useMutation: () => [{ fetching: false, data: undefined, error: undefined }, vi.fn()],
}));

import React from "react";
import { render } from "@testing-library/react";
import { client } from "../graphql/client";

describe("GraphQL Client (Part A)", () => {
  // -----------------------------------------------------------------------
  // Test A.1 — Client is created with correct URL
  // -----------------------------------------------------------------------
  it("A.1 — client is created with url set to /graphql", () => {
    // Given the exported client from src/graphql/client.ts
    // When the module is imported
    // Then it exports a client object with url set to "/graphql"
    expect(client).toBeDefined();
    expect(client.url).toBe("/graphql");
  });

  // -----------------------------------------------------------------------
  // Test A.2 — Client includes X-User header in fetchOptions
  // -----------------------------------------------------------------------
  it("A.2 — client includes X-User header in fetchOptions", () => {
    // Given the exported client from src/graphql/client.ts
    // When inspecting the client's fetchOptions
    // Then the headers include an X-User header
    const opts =
      typeof client.fetchOptions === "function"
        ? client.fetchOptions()
        : client.fetchOptions;
    expect(opts).toBeDefined();
    const headers = opts?.headers as Record<string, string> | undefined;
    expect(headers).toBeDefined();
    expect(headers!["X-User"]).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Test A.3 — App renders inside urql Provider without error
  // -----------------------------------------------------------------------
  it("A.3 — App renders inside urql Provider without throwing", async () => {
    // Given the full <App /> component (which includes its own BrowserRouter)
    // When rendered
    // Then no error is thrown about missing urql context
    const { App } = await import("../App");
    expect(() => {
      render(<App />);
    }).not.toThrow();
  });
});
