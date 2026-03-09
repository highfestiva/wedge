import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pipe, map, makeSubject, toObservable } from "wonka";
import type { Operation, OperationResult, ExchangeInput } from "urql";
import { logExchange } from "../graphql/logExchange";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeOperation(kind: "query" | "mutation", name: string): Operation {
  return {
    kind,
    key: 1,
    query: { definitions: [{ kind: "OperationDefinition", name: { value: name } }] } as unknown as Operation["query"],
    variables: {},
    context: {
      url: "/graphql",
      requestPolicy: "cache-first",
    },
  } as unknown as Operation;
}

function runExchange(operation: Operation, result?: Partial<OperationResult>) {
  const { source: ops$, next: pushOp } = makeSubject<Operation>();
  const { source: results$ } = makeSubject<OperationResult>();

  const forward: ExchangeInput["forward"] = (s) =>
    pipe(
      s,
      map(
        () =>
          ({
            operation,
            data: result?.data ?? null,
            error: result?.error ?? undefined,
          } as unknown as OperationResult)
      )
    );

  const exchangeFn = logExchange({
    forward,
    client: {} as ExchangeInput["client"],
    dispatchDebug: (() => {}) as ExchangeInput["dispatchDebug"],
  });

  const output = exchangeFn(ops$);

  // Consume one value
  const values: OperationResult[] = [];
  pipe(
    output,
    toObservable
  ).subscribe((val) => values.push(val));

  pushOp(operation);

  return values;
}

describe("LogExchange (Part D)", () => {
  // -----------------------------------------------------------------------
  // Test D.4 — Log exchange logs outgoing query operations
  // -----------------------------------------------------------------------
  it("D.4 — logs outgoing query operations", () => {
    // Given the log exchange is in the pipeline
    const op = makeOperation("query", "Issues");

    // When a query operation passes through
    runExchange(op);

    // Then console.log is called with the operation name and type
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("query"),
      expect.stringContaining("Issues")
    );
  });

  // -----------------------------------------------------------------------
  // Test D.5 — Log exchange logs outgoing mutation operations
  // -----------------------------------------------------------------------
  it("D.5 — logs outgoing mutation operations", () => {
    // Given the log exchange is in the pipeline
    const op = makeOperation("mutation", "UpdateIssue");

    // When a mutation operation passes through
    runExchange(op);

    // Then console.log is called with the operation name and type
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("mutation"),
      expect.stringContaining("UpdateIssue")
    );
  });

  // -----------------------------------------------------------------------
  // Test D.6 — Log exchange logs errors from responses
  // -----------------------------------------------------------------------
  it("D.6 — logs errors from responses", () => {
    // Given the log exchange is in the pipeline
    const op = makeOperation("query", "Issue");

    // When an error result is received
    runExchange(op, { error: { message: "Not found" } as unknown as OperationResult["error"] });

    // Then console.error is called with error details
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("error"),
      expect.anything()
    );
  });
});
