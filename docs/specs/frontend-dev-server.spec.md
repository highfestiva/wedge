# Frontend Dev Server & Proxy

## Overview

The frontend uses Vite as its development server and build tool. The Vite dev server proxies `/graphql` requests to the backend API.

## Proxy Configuration

- **Source:** [frontend/vite.config.ts](../../frontend/vite.config.ts)
- All requests to `/graphql` are proxied to the backend API server.
- The proxy target is configurable via the `API_PROXY_TARGET` environment variable.
- Default: `http://localhost:8000` (for local development).
- In Docker Compose: set to `http://backend:8000` (Docker DNS resolution).

```ts
proxy: {
  "/graphql": {
    target: process.env.API_PROXY_TARGET || "http://localhost:8000",
    changeOrigin: true,
  },
},
```

## Dev Server Settings

- **Port:** 3000
- **Plugin:** `@vitejs/plugin-react`
