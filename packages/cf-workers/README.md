# @itxtech/fdnext-cf-workers

Cloudflare Workers adapter for fdnext.

## Overview

`packages/cf-workers` exposes the fdnext engine as a Cloudflare Worker source entry. It wraps `@itxtech/fdnext-core` in a standard Workers `fetch()` handler, providing a zero-infrastructure deployment path for the fdnext HTTP API.

The adapter is a thin bridge — all HTTP routing, response contracts, CORS, and External Link handling are delegated to the shared runtime.

The current repository deployment lets Wrangler bundle this adapter directly from `packages/cf-workers/src/index.ts`. The package metadata intentionally does not declare a runtime `main` / `exports` target until a publish bundle is added.

## Source Entry

The default deployment entry is:

```ts
import worker from "./src/index";

export default worker;
```

For custom runtime options, create a custom Worker source entry in this package and point `wrangler.jsonc` `main` at it:

```ts
import { createCfWorkersAdapter } from "./src/index";
import type { ExternalLinkProvider } from "@itxtech/fdnext-core/runtime";

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

For Cloudflare Workers Builds, keep the allowlist in the Dashboard if it should not be committed. The root `wrangler.jsonc` sets `keep_vars: true` so automatic deployments preserve existing Dashboard environment variables.

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

## Source API

| Export | Description |
| :--- | :--- |
| `createCfWorkersAdapter(options?)` | Create a custom Workers entrypoint with optional runtime options |
| `default` | Pre-configured Workers entrypoint using default settings |

## Documentation

- [Cloudflare Workers Deployment](https://github.com/iTXTech/fdnext/blob/master/docs/CF_WORKERS.md) — Full deployment guide, Wrangler config, and Workers Builds setup
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP routes and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
