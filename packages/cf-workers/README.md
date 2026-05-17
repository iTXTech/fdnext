# @itxtech/fdnext-cf-workers

Cloudflare Workers adapter for fdnext.

## Overview

`@itxtech/fdnext-cf-workers` exposes the fdnext engine as a Cloudflare Worker. It wraps `@itxtech/fdnext-core` in a standard Workers `fetch()` handler, providing a zero-infrastructure deployment path for the fdnext HTTP API.

The adapter is a thin bridge — all HTTP routing, response contracts, CORS, and External Link handling are delegated to the shared runtime.

## Installation

```bash
pnpm add @itxtech/fdnext-cf-workers
```

## Quick Start

### Default Export

```ts
import worker from "@itxtech/fdnext-cf-workers";

export default worker;
```

### Custom Runtime Options

```ts
import { createCfWorkersAdapter } from "@itxtech/fdnext-cf-workers";
import type { ExternalLinkProvider } from "@itxtech/fdnext-core";

const myLinks: ExternalLinkProvider = {
  id: "product-page",
  resolveLinks(ctx) {
    if (!ctx.facts.partNumber) return [];
    return [{
      id: "product-page",
      label: "Product page",
      url: `https://example.com/parts/${encodeURIComponent(ctx.facts.partNumber)}`,
      category: "datasheet",
      priority: 10
    }];
  }
};

export default createCfWorkersAdapter({
  externalLinkProviders: [myLinks]
});
```

## CORS

CORS is controlled via the `FDNEXT_CORS_ORIGINS` Worker environment variable:

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

- `*` — allow all origins
- Multi-origin — comma/space separated, matched exactly against request `Origin`

## Deployment

```bash
# Local development
pnpm cf-workers:dev

# Dry-run deploy
pnpm cf-workers:deploy:dry-run

# Production deploy
pnpm cf-workers:deploy
```

See `wrangler.jsonc` in the repository root for the Wrangler configuration.

## Exports

| Export | Description |
| :--- | :--- |
| `createCfWorkersAdapter(options?)` | Create a custom Workers entrypoint with optional runtime options |
| `default` | Pre-configured Workers entrypoint using default settings |

## Documentation

- [Cloudflare Workers Deployment](https://github.com/iTXTech/fdnext/blob/master/docs/CF_WORKERS.md) — Full deployment guide, Wrangler config, and Workers Builds setup
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP routes and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
