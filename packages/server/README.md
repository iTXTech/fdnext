# @itxtech/fdnext-server

Native Node.js HTTP server adapter for fdnext.

## Overview

`@itxtech/fdnext-server` exposes the fdnext runtime through the native Node.js `node:http` server. The shared `@itxtech/fdnext-core/node-http` bridge translates Node requests and responses to the Fetch API contract used by every runtime adapter.

The server itself is a thin adapter — all HTTP routing, response contracts, and External Link handling are delegated to `@itxtech/fdnext-core`.

## Installation

```bash
pnpm add @itxtech/fdnext-server
```

## Quick Start

### Development (from monorepo)

```bash
pnpm install
pnpm server:dev
```

With a custom resource directory:

```bash
pnpm -C packages/server dev -- --resources /path/to/resources
```

### Production

```bash
pnpm -C packages/server build
pnpm server:start
```

### Binary

After building, the `fdnext-server` binary is available:

```bash
fdnext-server [--host 0.0.0.0] [--port 8080] [--resources /path/to/resources]
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--host` | `0.0.0.0` | Bind address |
| `--port` | `8080` | Listen port |
| `--resources` | embedded | External resource directory (overrides built-in resources) |

### PM2 Deployment

The monorepo root provides `ecosystem.config.cjs`:

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs fdnext-server
```

### Docker

See `Dockerfile` in the repository root for a minimal container image.

## Programmatic API

```ts
import { createHttpServer } from "@itxtech/fdnext-server";

const app = createHttpServer({
  host: "0.0.0.0",
  port: 8080,
  resourceDir: "/path/to/resources", // optional
  cors: { origins: ["https://app.example.com"] }, // optional; env is used when omitted
  searchLimit: 300                    // optional HTTP hard maximum
});

await app.listen();

// app.server is a native node:http Server
// Access the engine directly
const result = app.engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
```

## CORS

The Node.js server reads `FDNEXT_CORS_ORIGINS`, using the same behavior as the Cloudflare Workers adapter:

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

If the variable is unset, the server does not emit CORS response headers. Programmatic integrations can pass `cors` to `createHttpServer()`; an explicit option takes precedence over the environment.

JSON responses use `Cache-Control: no-cache`. Responses of at least 1 KiB are gzip-compressed when the client advertises gzip support, with `Vary: Accept-Encoding` set automatically.

## Search Limit

HTTP search defaults to a hard maximum of 300 results. Set `FDNEXT_SEARCH_LIMIT` for the Node process or pass `searchLimit` to `createHttpServer()` to change it. A request query `limit` can only select a smaller value.

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Server startup and deployment
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — Full HTTP route table, parameters, and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
