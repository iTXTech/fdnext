# @itxtech/fdnext-runtime

Platform-neutral HTTP and operation dispatch runtime for fdnext.

## Overview

`@itxtech/fdnext-runtime` is the shared runtime layer that sits between the core engine and platform-specific adapters (Hapi, Cloudflare Workers, Aliyun FC). It provides:

- **Unified Dispatch** — A single `dispatch()` API for all fdnext operations (`part.decode`, `part.search`, `identifier.decode`, `identifier.search`, `capabilities`, `index`).
- **HTTP Route Resolution** — Maps HTTP `GET`/`HEAD` requests to fdnext operations with parameter parsing (query, lang, limit, controllerGroup, constraints, idScheme).
- **External Link Provider** — Pluggable system for attaching platform-specific external links to decode/search results via the `links` contract.
- **CORS Management** — Configurable CORS handling with wildcard and multi-origin support, driven by `FDNEXT_CORS_ORIGINS` environment variable.
- **Web Fetch API** — A `fetch()` method compatible with the standard Web Fetch API for Cloudflare Workers and similar environments.

### Architecture

```
Platform Adapters (Hapi / CF Workers / Aliyun FC)
        │
        ▼
  @itxtech/fdnext-runtime   ← HTTP routing, dispatch, CORS, External Links
        │
        ▼
  @itxtech/fdnext-core       ← Engine, decoders, result building
```

All adapters delegate to the same runtime instance, ensuring consistent routing and response behavior across platforms.

## Installation

```bash
pnpm add @itxtech/fdnext-runtime
```

## Quick Start

```ts
import { createFdnextRuntime } from "@itxtech/fdnext-runtime";

const runtime = createFdnextRuntime();

// Dispatch an operation programmatically
const response = await runtime.dispatch({
  operation: "part.decode",
  input: { query: "MT29F64G08CBABA", lang: "eng" }
});

// Handle a raw HTTP request
const httpResponse = await runtime.handleHttp({
  method: "GET",
  url: "/parts/decode?query=MT29F64G08CBABA&lang=eng",
  headers: {}
});

// Use as a Web Fetch handler (Cloudflare Workers style)
const fetchResponse = await runtime.fetch(new Request("https://example.com/parts/decode?query=MT29F64G08CBABA"));
```

### External Link Provider

```ts
const runtime = createFdnextRuntime({
  externalLinkProviders: [{
    id: "docs",
    resolveLinks(ctx) {
      if (ctx.facts.vendor === "micron") {
        return [{
          id: "micron.home",
          label: "Micron",
          url: "https://www.micron.com/",
          category: "vendor",
          priority: 10
        }];
      }
      return [];
    }
  }]
});
```

## HTTP Routes

| Path | Operation | Description |
| :--- | :--- | :--- |
| `/` | `index` | Health check — server name and fdnext version |
| `/capabilities` | `capabilities` | Engine capabilities, resource inventory, decoder list |
| `/parts/decode` | `part.decode` | Decode a single part number |
| `/parts/search` | `part.search` | Search part numbers |
| `/identifiers/decode` | `identifier.decode` | Decode a typed identifier |
| `/identifiers/search` | `identifier.search` | Search typed identifiers |

## Exports

| Export | Description |
| :--- | :--- |
| `createFdnextRuntime(options?)` | Create a runtime instance with engine, dispatch, HTTP handler, and fetch |
| `parseFdnextCorsOrigins(value)` | Parse CORS origins from string or array |
| `createFdnextCorsOptionsFromEnv(env)` | Read CORS config from environment variables |
| `FDNEXT_CORS_ORIGINS_ENV` | Environment variable name constant |

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Runtime dispatch and External Link usage
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — Full HTTP route table and response contracts
- [CF Workers Deployment](https://github.com/iTXTech/fdnext/blob/master/docs/CF_WORKERS.md) — Cloudflare Workers specific deployment

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
