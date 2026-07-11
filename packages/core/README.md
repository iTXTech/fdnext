# @itxtech/fdnext-core

Core parsing engine for fdnext — the one-stop memory chip intelligence platform.

## Overview

`@itxtech/fdnext-core` is the primary fdnext package. It provides the engine, built-in DecodePack rules, embedded resources, shared runtime, CLI, type system, result contracts, and field registry. The core has **no runtime network dependencies**, making it suitable for embedding in Node.js, browsers, and serverless environments.

### Key Responsibilities

- **Engine** — `createEngine()` initializes the decoding and search pipeline. Applications should create one long-lived engine per process, app, worker isolate, or frontend runtime.
- **Prepared Catalog** — `prepareCatalog()` creates reusable immutable resource state for the uncommon case where multiple differently configured engines must share one dataset.
- **DecodePack Rules** — Built-in PN / typed identifier JSON rules plus compiler, check, and explain tools.
- **Embedded Resources** — Built-in FDB, MDB, controller groups, language packs, and PN suggestion indexes.
- **Part Number Decoding** — Decode raw NAND, eMMC, UFS, DRAM, eMCP/uMCP, and other memory chip part numbers into structured results.
- **Typed Identifier Decoding** — Deep inspection of NAND Flash IDs through a typed identifier API.
- **FDB / MDB Search** — Database search against embedded Flash Database (FDB) and Marking Database (MDB) resources.
- **Result Contract** — Typed result schema (`fdnext.result.v1`) and capabilities schema (`fdnext.capabilities.v2`) with JSON Schema export.
- **Field Registry** — Canonical field key definitions (`field-registry.ts`) and field display profiles for consistent cross-vendor output.
- **Processor Pipeline** — Extensible `beforeOperation` / `afterOperation` hooks for custom middleware.
- **Runtime** — `createRuntime()` provides shared dispatch, HTTP routing, CORS, fetch, and External Link provider support.
- **CLI** — The `fdnext` bin provides decode, search, capabilities, and DecodePack diagnostics.

## Installation

```bash
pnpm add @itxtech/fdnext-core
```

The package also installs the `fdnext` command:

```bash
fdnext part decode MT29F64G08CBABA eng
fdnext decodepack check
```

## Quick Start

```ts
import { createEngine } from "@itxtech/fdnext-core";
// Create once during application startup and reuse for every operation.
const engine = createEngine();

// Decode a part number
console.log(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }));

// Decode a NAND Flash ID
console.log(engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }));

// Search parts
console.log(engine.searchParts({ query: "MT29", lang: "eng", limit: 10 }));
```

## Exports

| Export Path | Description |
| :--- | :--- |
| `@itxtech/fdnext-core` | Main entry — `createEngine`, operation input/result types, capabilities, and JSON schemas |
| `@itxtech/fdnext-core/runtime` | Runtime entry — `createRuntime`, HTTP dispatch/fetch helpers, CORS options, and External Link provider types |
| `@itxtech/fdnext-core/decodepack` | DecodePack maintenance entry — compiler, checker, explain tools, default pack, and NAND die profile tables |

Browser integrations that run fdnext locally should use the main `createEngine()` entry. The `runtime` entry is for HTTP adapters, and the `decodepack` entry is for rule maintenance tooling.

`FdnextEngine` is designed as a long-lived object. Do not construct one per request or per decode/search call. If an application genuinely needs multiple engine configurations over the same custom resources, prepare those resources once:

```ts
import { createEngine, prepareCatalog } from "@itxtech/fdnext-core";

const catalog = prepareCatalog(resources);
const publicEngine = createEngine({ catalog });
const chineseEngine = createEngine({ catalog, fallbackLang: "chs" });
```

## SDK Methods

| Method | Description |
| :--- | :--- |
| `engine.decodePart(input)` | Decode a single part number |
| `engine.searchParts(input)` | Search part numbers; omitted `limit` returns every prefix/substring match, while an explicit `limit` selects top-K |
| `engine.decodeIdentifier(input)` | Decode a typed identifier (e.g. NAND Flash ID) |
| `engine.searchIdentifiers(input)` | Search typed identifiers |
| `engine.getCapabilities(input?)` | Query server/engine capabilities, resource inventory, and decoder list |

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — SDK setup, browser resources, and deployment notes
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP response contract and result schema
- [Terminology](https://github.com/iTXTech/fdnext/blob/master/docs/pn_code/terminology.md) — Canonical field keys and naming conventions

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
