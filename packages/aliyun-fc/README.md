# @itxtech/fdnext-aliyun-fc

Aliyun Function Compute (FC) adapter for fdnext.

## Overview

`packages/aliyun-fc` provides a Node.js HTTP handler and a source-level custom runtime entry for deploying fdnext on Alibaba Cloud Function Compute. It wraps `@itxtech/fdnext-core` in a standard `http.createServer` handler.

The current repository build only emits declarations for this adapter. Runtime deployments should bundle the source entry from `packages/aliyun-fc/src/index.ts`; package metadata intentionally does not declare a runtime `main` / `exports` / `bin` target until a publish bundle is added.

## Source Usage

### Custom Runtime Entry

```ts
import { startAliyunFc } from "./src/index";

startAliyunFc();
```

The server listens on `FC_SERVER_PORT`, `PORT`, or `9000` by default, binding to `0.0.0.0`.

### As a Handler

```ts
import { createAliyunFcHandler } from "./src/index";
import { createServer } from "node:http";

const handler = createAliyunFcHandler();
const server = createServer(handler);
server.listen(9000);
```

### Local Source Runtime

For a local smoke run of the source entry:

```bash
pnpm -C packages/aliyun-fc exec tsx src/bin.ts
```

## CORS

CORS is controlled via the `FDNEXT_CORS_ORIGINS` environment variable:

```text
FDNEXT_CORS_ORIGINS=*
FDNEXT_CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

- `*` — allow all origins
- Multi-origin — comma, space, or newline separated; matched exactly against request `Origin`
- `OPTIONS` preflight returns `204`

## Source API

| Export | Description |
| :--- | :--- |
| `createAliyunFcHandler(options?)` | Create an HTTP request handler for use with `http.createServer` |
| `startAliyunFc(options?)` | Start a standalone HTTP server (custom runtime entry) |

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Serverless adapter setup
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP routes and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
