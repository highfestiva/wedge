/** urql log exchange — logs GraphQL operations for debugging. */

import { pipe, tap } from "wonka";
import type { Exchange } from "urql";

export const logExchange: Exchange = ({ forward }) => (ops$) => {
  const logged$ = pipe(
    ops$,
    tap((op) => {
      const name =
        (op.query.definitions[0] as { name?: { value: string } })?.name?.value ?? "unknown";
      console.log(`[wedge:graphql] ${op.kind}`, name);
    })
  );

  return pipe(
    forward(logged$),
    tap((result) => {
      if (result.error) {
        console.error("[wedge:graphql] error", result.error);
      }
    })
  );
};
