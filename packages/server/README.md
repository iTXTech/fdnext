# @itxtech/fdnext-server

Hapi HTTP server adapter for fdnext.

## Overview

`@itxtech/fdnext-server` wraps the fdnext runtime in a [Hapi](https://hapi.dev/) HTTP server. It translates Hapi requests into runtime dispatch calls, providing a production-ready HTTP API for part number decoding, Flash ID inspection, and database search.

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
  resourceDir: "/path/to/resources"  // optional
});

await app.listen();

// Access the engine directly
const result = app.engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
```

## CORS

The Hapi server defaults to allowing all origins (`*`), suitable for local development or deployments where CORS is managed by an upstream gateway.

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Server startup and deployment
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — Full HTTP route table, parameters, and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
