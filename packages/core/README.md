# @itxtech/fdnext-core

Memory chip parsing engine with PN and NAND Flash ID decoding, database search, DecodePack rules, bundled resources, translations, and a CLI.

## Quick start

Use Node.js 24.11+ and pnpm 12+:

```bash
pnpm add @itxtech/fdnext-core
pnpm exec fdnext part decode MT29F64G08CBABA eng
```

```ts
import { createEngine } from "@itxtech/fdnext-core";

const engine = createEngine();
console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));
console.log(engine.searchParts({ query: "MT29", lang: "eng", limit: 10 }));
```

Create one engine per application, process, Worker isolate, or browser runtime and reuse it. Default resources are embedded; no separate JSON downloads are needed. For browser use, bundle the same SDK calls with your app. SDK search without `limit` returns all matches.

The root export provides the engine, types, and schemas. Subpaths `/runtime`, `/node-http`, `/cli`, and `/decodepack` provide HTTP dispatch, the Node/Fetch bridge, CLI integration, and rule tooling.

See the [Integration guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) for custom resources and runtime options.
