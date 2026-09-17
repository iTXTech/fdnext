# Integration guide (Node.js / browser / server)

`@itxtech/fdnext-core` provides platform-independent parsing with no runtime network dependency. It includes DecodePack JSON rules, a compiler, default resources, and a shared runtime.

This guide covers embedding fdnext in Node.js, browsers, and servers. [HTTP API](SERVER_API.md) owns routes, query parameters, response structures, and CORS behavior.

## 1. Node.js library

```bash
pnpm add @itxtech/fdnext-core
```

Use the installed CLI with `pnpm exec fdnext part decode MT29F64G08CBABA eng`. Rule diagnostics are covered in [DecodePack maintenance tools](DECODEPACK.md#7-maintenance-tools).

| Entry point | Purpose |
| --- | --- |
| `@itxtech/fdnext-core` | Engine, input/output types, capabilities, and JSON schemas |
| `@itxtech/fdnext-core/runtime` | HTTP dispatch/fetch, CORS, and external link providers |
| `@itxtech/fdnext-core/node-http` | Node request/response to Fetch API bridge |
| `@itxtech/fdnext-core/cli` | CLI integration |
| `@itxtech/fdnext-core/decodepack` | Rule compilation, checks, explanation, default packs, and shared tables |

```ts
import { createEngine } from "@itxtech/fdnext-core";
// Create once at startup and reuse for all requests.
const engine = createEngine();

console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
```

Keep one long-lived `FdnextEngine` per process, application, Worker isolate, or browser runtime. Do not call `createEngine()` for every HTTP request, decode, or search.

To replace default resources, for example for a data refresh, load your own `FdnextResourceBundle` (`loadResourcesFromYourStore` below is an application-provided loader):

```ts
import { createEngine, type FdnextResourceBundle } from "@itxtech/fdnext-core";

const resources: FdnextResourceBundle = await loadResourcesFromYourStore();
const engine = createEngine({ resources });
```

Use `PreparedCatalog` only when multiple engines with genuinely different configurations must share immutable resource parsing and search indexes:

```ts
import { createEngine, prepareCatalog } from "@itxtech/fdnext-core";

const catalog = prepareCatalog(resources);
const primaryEngine = createEngine({ catalog });
const chineseEngine = createEngine({ catalog, fallbackLang: "chs" });
```

`prepareCatalog()` caches by resource object identity. Treat resources as immutable after preparation. It is an optimization for multiple configurations, not a reason to create engines per request.

### 1.1 Processor pipeline and SDK methods

The core supports operation-level processors:

```ts
const engine = createEngine({
  processors: [
    {
      beforeOperation(ctx) {
        if (ctx.operation === "part.decode") {
          console.log(ctx.query);
        }
      },
      afterOperation(ctx, result) {
        return result;
      }
    }
  ]
});

const response = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
```

Common SDK methods:

- `engine.decodePart(input)` / `engine.searchParts(input)`
- `engine.decodeIdentifier(input)` / `engine.searchIdentifiers(input)`
- `engine.getCapabilities()`

### 1.2 Runtime dispatch and external links

`@itxtech/fdnext-core/runtime` provides shared dispatch, HTTP routing, and external link providers. Node.js and Workers adapters call this runtime rather than maintaining separate routes.

```ts
import { createRuntime } from "@itxtech/fdnext-core/runtime";

const runtime = createRuntime({
  externalLinkProviders: [
    {
      id: "docs",
      resolveLinks(ctx) {
        if (ctx.facts.vendor === "micron") {
          return [{
            id: "micron.home",
            label: "Micron",
            url: "https://www.micron.com/",
            category: "vnd",
            priority: 10
          }];
        }
        return [];
      }
    }
  ]
});

const response = await runtime.dispatch({
  operation: "part.decode",
  input: { query: "MT29F64G08CBABA", lang: "eng" },
  meta: { adapter: "custom" }
});
```

External links appear in `result.links` or search `items[].links`:

```ts
interface ExternalLink {
  id: string;
  label: string;
  url: string;
  category?: "vnd" | "ds" | "mkt" | "ref" | "tl" | "com" | "ads";
  image?: string;
  hint?: string;
  fieldKey?: string;
  priority?: number;
}
```

The runtime drops links without `id/label/url`, permits only `http:`, `https:`, and `mailto:` URLs, and sorts by `priority`.

### Result v2 migration

`fdnext.result.v2` abbreviates link categories: `vendor → vnd`, `datasheet → ds`, `marketplace → mkt`, `reference → ref`, `tool → tl`, and `community → com`. It adds `ads` for advertising, self-promotion, and service referrals. `ds/ref` describe reference uses; other resources are not automatically technical evidence. Category and `hint` are independent. Keep advertising visibly labeled and exclude it from general result copying; links may be exported separately. Old category names are outside the v2 schema, so update providers and strict consumers together, not just display labels.

Successful PN/FID decodes include `summary: { brief: FieldValue[], full: ResultBlock[] }`. `brief` orders key fields by device type; `full` retains all parameter and component groups. Both preserve field keys, translations, units, and values. DRAM includes type, density, width, speed, and voltage. Managed NAND retains device and component capacities separately; MCP DRAM has its own `dram` block; 3D XPoint retains Deck semantics.

Summaries select only visible fields actually returned. They do not infer missing capacities, component counts, or supplies. `full` matches `blocks`; `relations/warnings` remain separate and are not replaced by summaries. Read marking and full PN identity from `device` and `input.query`. `subtitle` also includes DRAM speed/voltage, managed interfaces/protocols, and XPoint Deck information.

## 2. Browser integration

Bundle fdnext with Vite, Webpack, Rollup, or esbuild:

- Use `createEngine()` and its decode/search/capabilities methods for local browser queries. `/runtime` is for HTTP adapters.
- Create and reuse one engine at startup, not on each component render or query.
- Default FDB/MDB, translations, and PN search resources are embedded. No extra JSON download or hosting is required.
- Custom PN resource structures and deduplication are covered in [Search resources (Chinese)](pn_code/authoring.md#搜索资源).
- Default PN and typed identifier decoders are included. Pass `decoders` / `identifierDecoders` only to select or replace rules.
- `/decodepack` provides check/explain/compile tooling; ordinary frontend queries do not need it directly.
- SDK `searchParts()` / `searchIdentifiers()` without `limit` return all matches for in-memory pagination. A positive integer enables top-K truncation. Default PN search includes prefix and substring matches.
- HTTP search limits are defined in [Common parameters](SERVER_API.md#3-common-parameters).
- Add custom DecodePack fields to search with `createEngine({ partSearchProjection: ["fields.<key>"] })`. Default search dependencies remain included.

### 2.1 Embedded resources

The core npm package ships resources embedded in its bundle, without separate raw `resources/*.json` files. Use the default engine above.

### 2.2 Custom external resources

Only host your own resource JSON when replacing the default databases or translations. Assemble these application-owned files into `FdnextResourceBundle`; the core npm package does not supply them separately. This example uses `/fdnext-resources/`:

```ts
import { createEngine } from "@itxtech/fdnext-core";

async function loadJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`);
  return res.json();
}

const [flashDatabase, packageMarkings, managedNandParts, dramParts, chs, eng] = await Promise.all([
  loadJson("/fdnext-resources/fdb.json"),
  loadJson("/fdnext-resources/mdb.json"),
  loadJson("/fdnext-resources/managed-nand-pn.json"),
  loadJson("/fdnext-resources/dram-pn.json"),
  loadJson("/fdnext-resources/lang/chs.json"),
  loadJson("/fdnext-resources/lang/eng.json")
]);

const engine = createEngine({
  resources: {
    partIndex: {
      rawNand: flashDatabase,
      managedNand: managedNandParts,
      dram: dramParts
    },
    identifierIndex: {
      nandFlash: flashDatabase
    },
    markingIndex: {
      packageMarkings
    },
    vendorIndex: {},
    translationIndex: { chs, eng }
  }
});
```

## 3. HTTP server

`@itxtech/fdnext-server` uses native `node:http`. It bridges Node requests/responses and the Fetch API through `@itxtech/fdnext-core/node-http`; the shared runtime handles routes.

### 3.1 Run from the repository

```bash
pnpm install
pnpm server:dev
```

To use an external resource directory:

```bash
pnpm -C packages/server dev -- --resources ./resources
```

Supply the directory yourself; it is not included in npm packages. Required files are `fdb.json`, `mdb.json`, `lang/chs.json`, and `lang/eng.json`. Optional files are `managed-nand-pn.json`, `dram-pn.json`, and `controller-groups.json`.

Build and run the production entry:

```bash
pnpm -C packages/server build
pnpm server:start
```

### 3.2 Docker

Use the root [Dockerfile](../Dockerfile).

### 3.3 PM2

After building, use the root `ecosystem.config.cjs`:

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs fdnext-server
```

### 3.4 Published package and programmatic use

```bash
pnpm add @itxtech/fdnext-server
pnpm exec fdnext-server --host 0.0.0.0 --port 8080
```

| Option | Default | Meaning |
| --- | --- | --- |
| `--host` | `0.0.0.0` | Bind address |
| `--port` | `8080` | Listening port |
| `--resources` | Embedded resources | Application-supplied resource directory |

```ts
import { createHttpServer } from "@itxtech/fdnext-server";

const app = createHttpServer({
  host: "0.0.0.0",
  port: 8080,
  cors: { origins: ["https://app.example.com"] },
  searchLimit: 300
});
await app.listen();
// app.server is a node:http Server; app.engine exposes SDK operations.
```

Add `resourceDir: "./resources"` to replace embedded resources. Explicit `cors` / `searchLimit` override environment configuration; see [HTTP API](SERVER_API.md) for variable semantics and HTTP behavior.

### 3.5 Build metadata

Standard bundles embed a short Git `commitHash` and the current UTC `buildTime` in ISO 8601 format with milliseconds (`YYYY-MM-DDTHH:mm:ss.sssZ`). CI and serverless builds can override these with `FDNEXT_COMMIT_HASH` and `FDNEXT_BUILD_TIME`. Time overrides are normalized to the same format; invalid values fail the build. Servers/CLIs run from source without injected metadata use process startup time in that format.

Both core and Worker adapter builds inject this metadata so a global-scope `Date` fallback does not record the Unix epoch as the build time.

## 4. Serverless adapters

[Cloudflare Workers](CF_WORKERS.md) covers the Worker entry, Wrangler, and Dashboard configuration.
