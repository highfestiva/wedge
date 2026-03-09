/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, afterEach } from "vitest";

describe("Vite Proxy Configuration (Part C)", () => {
  afterEach(() => {
    // Clean up env override
    delete process.env.API_PROXY_TARGET;
    vi.resetModules();
  });

  // -----------------------------------------------------------------------
  // Test C.1 — Proxy target defaults to localhost when env var is unset
  // -----------------------------------------------------------------------
  it("C.1 — proxy target defaults to http://localhost:8000", async () => {
    // Given API_PROXY_TARGET is not set
    delete process.env.API_PROXY_TARGET;

    // When the Vite config is loaded
    const config = await import("../../vite.config");
    const resolved =
      typeof config.default === "function"
        ? // defineConfig can return a function or object
          (config.default as unknown as { server: { proxy: Record<string, { target: string }> } })
        : config.default;

    // Then the /graphql proxy target is http://localhost:8000
    const proxyTarget = (resolved as { server: { proxy: Record<string, { target: string }> } })
      .server.proxy["/graphql"].target;
    expect(proxyTarget).toBe("http://localhost:8000");
  });

  // -----------------------------------------------------------------------
  // Test C.2 — Proxy target reads from API_PROXY_TARGET env var
  // -----------------------------------------------------------------------
  it("C.2 — proxy target reads from API_PROXY_TARGET env var", async () => {
    // Given API_PROXY_TARGET is set
    process.env.API_PROXY_TARGET = "http://backend:8000";

    // When the Vite config is loaded
    const config = await import("../../vite.config");
    const resolved =
      typeof config.default === "function"
        ? (config.default as unknown as { server: { proxy: Record<string, { target: string }> } })
        : config.default;

    // Then the /graphql proxy target matches the env var
    const proxyTarget = (resolved as { server: { proxy: Record<string, { target: string }> } })
      .server.proxy["/graphql"].target;
    expect(proxyTarget).toBe("http://backend:8000");
  });
});
