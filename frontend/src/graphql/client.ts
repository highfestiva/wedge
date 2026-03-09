/** urql Client configuration for the Wedge frontend. */

import { createClient, fetchExchange } from "@urql/core";

const config = {
  url: "/graphql",
  exchanges: [fetchExchange],
  fetchOptions: {
    headers: {
      "X-User": "anonymous",
    },
  },
};

export const client = Object.assign(createClient(config), {
  url: config.url,
  fetchOptions: config.fetchOptions,
});
