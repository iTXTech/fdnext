# @itxtech/fdnext-aliyun-fc

Aliyun Function Compute (FC) adapter for fdnext.

## Overview

`@itxtech/fdnext-aliyun-fc` provides a Node.js HTTP handler and a standalone custom runtime entry for deploying fdnext on Alibaba Cloud Function Compute. It wraps `@itxtech/fdnext-core` in a standard `http.createServer` handler.

## Installation

```bash
pnpm add @itxtech/fdnext-aliyun-fc
```

## Quick Start

### Custom Runtime Entry

```ts
import { startAliyunFc } from "@itxtech/fdnext-aliyun-fc";

startAliyunFc();
```

The server listens on `FC_SERVER_PORT`, `PORT`, or `9000` by default, binding to `0.0.0.0`.

### As a Handler

```ts
import { createAliyunFcHandler } from "@itxtech/fdnext-aliyun-fc";
import { createServer } from "node:http";

const handler = createAliyunFcHandler();
const server = createServer(handler);
server.listen(9000);
```

### Binary

After building, the `fdnext-aliyun-fc` binary starts the custom runtime:

```bash
fdnext-aliyun-fc
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

## Exports

| Export | Description |
| :--- | :--- |
| `createAliyunFcHandler(options?)` | Create an HTTP request handler for use with `http.createServer` |
| `startAliyunFc(options?)` | Start a standalone HTTP server (custom runtime entry) |

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Serverless adapter setup
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP routes and response contracts

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
