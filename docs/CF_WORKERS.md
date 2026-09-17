# Cloudflare Workers deployment

This guide covers the repository adapter `@itxtech/fdnext-cf-workers`, which shares the core HTTP routes and external link providers.

For FlashMaster Classic or clients using legacy FlashDetector / FDWebServer routes, use [fd-server](../packages/fd-server/README.md).

## 1. Prerequisites

Complete [Development setup (Chinese)](TESTING.md#开发环境与入口). Deployment requires a Cloudflare account and Wrangler authentication. Wrangler can run without being added to repository dependencies:

```bash
pnpm dlx wrangler login
```

In CI, use `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` instead of interactive login.

## 2. Configuration

`packages/cf-workers/wrangler.jsonc` contains:

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "fdnext",
  "main": "dist/index.js",
  "compatibility_date": "2026-05-10",
  "workers_dev": true,
  "minify": true,
  "keep_vars": true,
  "build": {
    "command": "pnpm -C ../core build && pnpm build",
    "watch_dir": [
      "../core/src",
      "../core/resources",
      "src"
    ]
  }
}
```

- `main` points to the adapter bundle inside the package. Root scripts enter `packages/cf-workers` before invoking Wrangler.
- `build.command` builds the core, then the adapter. See [Build metadata](INTEGRATION.md#35-build-metadata) for injected values and overrides.
- `keep_vars` preserves Worker variables configured in the Cloudflare Dashboard across deployments.
- The entry uses the Web Fetch API and does not require `nodejs_compat`.
- `workers_dev` enables `*.workers.dev`. For a production domain, configure `route` / `routes`, or bind it in the Dashboard and keep Wrangler configuration consistent.

## 3. Cloudflare Workers Builds

For Git-connected Dashboard builds, explicitly build only the core and adapter. Root `pnpm build` builds the entire monorepo, including Node.js services. Configure the build command explicitly rather than relying on Wrangler's custom build step:

| Setting | Value |
| --- | --- |
| Root directory | Empty or repository root |
| Build command | `pnpm install --frozen-lockfile=false && pnpm cf-workers:build` |
| Deploy command | `pnpm cf-workers:deploy` |
| Non-production branch deploy command | `pnpm --dir packages/cf-workers dlx wrangler versions upload --config wrangler.jsonc` |

Set build variable `SKIP_DEPENDENCY_INSTALL=1` so the explicit pnpm command owns dependency installation instead of the platform choosing another package manager such as Bun.

Manage runtime `FDNEXT_CORS_ORIGINS` / `FDNEXT_SEARCH_LIMIT` in the Worker Dashboard; their meanings are in [HTTP API](SERVER_API.md). Do not also declare Dashboard-owned variables in Wrangler `vars`; `keep_vars` preserves them.

## 4. Local development

```bash
pnpm cf-workers:dev
```

Wrangler executes `build.command` before starting the Worker, usually at `http://127.0.0.1:8787`.

```bash
curl 'http://127.0.0.1:8787/'
curl 'http://127.0.0.1:8787/capabilities?lang=eng'
curl 'http://127.0.0.1:8787/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8787/identifiers/decode?query=2C,64,44,4B,A9,00'
```

Interpret responses using the [HTTP route overview](SERVER_API.md#2-route-overview).

## 5. HTTP settings

[HTTP API](SERVER_API.md) owns routes, parameters, responses, CORS, and search limits.

## 6. Manual deployment

Build locally:

```bash
pnpm cf-workers:build
```

Inspect the Wrangler bundle:

```bash
pnpm cf-workers:deploy:dry-run
```

Deploy:

```bash
pnpm cf-workers:deploy
```

Use the URL returned by Wrangler or your bound domain:

```bash
curl 'https://<worker>.<account>.workers.dev/'
curl 'https://<worker>.<account>.workers.dev/parts/search?query=MT29'
```

## 7. Custom external links

The default entry does not inject external link providers. The workspace package builds `dist/index.js` and exports `createCfWorkersAdapter()`. For a custom repository deployment, create an entry inside `packages/cf-workers` and set that package's Wrangler `main` to it:

```ts
import { createCfWorkersAdapter } from "./src/index";
import type { ExternalLinkProvider } from "@itxtech/fdnext-core/runtime";

const productPageLinks: ExternalLinkProvider = {
  id: "product-page",
  resolveLinks(context) {
    const partNumber = context.facts.partNumber;
    if (!partNumber) return [];
    return [
      {
        id: "product-page",
        label: "Product page",
        url: `https://example.com/parts/${encodeURIComponent(partNumber)}`,
        category: "ds",
        priority: 10
      }
    ];
  }
};

export default createCfWorkersAdapter({
  externalLinkProviders: [productPageLinks]
});
```

Provider contracts, URL filtering, and sorting are described in [Runtime dispatch and external links](INTEGRATION.md#12-runtime-dispatch-and-external-links).

## 8. Maintenance boundaries

- The adapter delegates `fetch()` to the shared runtime.
- HTTP routes, result contracts, and link filtering belong to `packages/core`.
- Do not add legacy aliases or Worker behavior that differs from the Node.js adapter.
- Resources are bundled into the Worker. Check final bundle size in Wrangler's dry-run output before deployment.
