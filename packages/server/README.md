# @itxtech/fdnext-server

Native Node.js HTTP server for fdnext, using the shared core runtime and bundled resources.

## Quick start

Use Node.js 24.11+ and pnpm 12+:

```bash
pnpm add @itxtech/fdnext-server
pnpm exec fdnext-server --host 127.0.0.1 --port 8080
```

In another terminal:

```bash
curl 'http://127.0.0.1:8080/parts/decode?query=MT29F64G08CBABA&lang=eng'
curl 'http://127.0.0.1:8080/identifiers/search?query=2C64&lang=eng&limit=10'
```

CLI defaults are `--host 0.0.0.0` and `--port 8080`. Optional `--resources ./resources` loads application-supplied JSON instead of embedded resources.

## Programmatic use

```ts
import { createHttpServer } from "@itxtech/fdnext-server";

const app = createHttpServer({ host: "127.0.0.1", port: 8080 });
await app.listen();
```

`app.server` is a native `node:http` server; `app.engine` exposes the SDK.

Set `FDNEXT_CORS_ORIGINS` to `*` or a comma/space/newline-separated origin list; unset means no CORS headers. `FDNEXT_SEARCH_LIMIT` sets the search cap (positive safe integer, default 300). Explicit `cors` and `searchLimit` options override these variables.

See the [HTTP API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) for routes, parameters, and response fields.
