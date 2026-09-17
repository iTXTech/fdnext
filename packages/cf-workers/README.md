# @itxtech/fdnext-cf-workers

Repository adapter for fdnext's standard HTTP API on Cloudflare Workers.

From the repository root, using Node.js 24.11+ and pnpm 12+:

```bash
pnpm install
pnpm cf-workers:dev
```

The configured entry builds to `dist/index.js`. `createCfWorkersAdapter()` is exported for custom workspace integrations. To preview and deploy with an authenticated Cloudflare account:

```bash
pnpm cf-workers:deploy:dry-run
pnpm cf-workers:deploy
```

See the [Workers guide](https://github.com/iTXTech/fdnext/blob/master/docs/CF_WORKERS.md) for configuration and deployment.
