# @itxtech/fdnext-core

Core parsing engine for fdnext — the one-stop memory chip intelligence platform.

## Overview

`@itxtech/fdnext-core` is the foundational package of the fdnext monorepo. It provides the engine, type system, result contracts, and field registry that all other packages build upon. The core is a pure-logic library with **no runtime network dependencies**, making it suitable for embedding in Node.js, browsers, and serverless environments.

### Key Responsibilities

- **Engine** — `createEngine()` initializes the decoding and search pipeline, wiring together decoders, resources, and processors.
- **Part Number Decoding** — Decode raw NAND, eMMC, UFS, DRAM, eMCP/uMCP, and other memory chip part numbers into structured results.
- **Typed Identifier Decoding** — Deep inspection of NAND Flash IDs through a typed identifier API.
- **FDB / MDB Search** — Database search against embedded Flash Database (FDB) and Marking Database (MDB) resources.
- **Result Contract** — Typed result schema (`fdnext.result.v1`) and capabilities schema (`fdnext.capabilities.v2`) with JSON Schema export.
- **Field Registry** — Canonical field key definitions (`field-registry.ts`) and field display profiles for consistent cross-vendor output.
- **Processor Pipeline** — Extensible `beforeOperation` / `afterOperation` hooks for custom middleware.
- **Micron FBGA Lookup** — Built-in Micron FBGA / SpecTek marking code reverse lookup.

## Installation

```bash
pnpm add @itxtech/fdnext-core
```

## Quick Start

```ts
import { createEngine } from "@itxtech/fdnext-core";
import { compileDecodePack, defaultDecodePack } from "@itxtech/fdnext-decodepack";
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";

const compiledPack = compileDecodePack(defaultDecodePack);
const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders,
  identifierDecoders: compiledPack.identifierDecoders
});

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
| `@itxtech/fdnext-core` | Main entry — `createEngine`, types, result schema, field registry, field profiles |
| `@itxtech/fdnext-core/node` | Node.js resource loader — `loadResourcesFromDir()` for loading resources from a filesystem directory |

## SDK Methods

| Method | Description |
| :--- | :--- |
| `engine.decodePart(input)` | Decode a single part number |
| `engine.searchParts(input)` | Search part numbers, returns a ranked list |
| `engine.decodeIdentifier(input)` | Decode a typed identifier (e.g. NAND Flash ID) |
| `engine.searchIdentifiers(input)` | Search typed identifiers |
| `engine.getCapabilities(input?)` | Query server/engine capabilities, resource inventory, and decoder list |
| `engine.registerProcessor(processor)` | Register a before/after operation processor |
| `engine.getFdb()` / `getMdb()` / `getLang()` | Access raw resource bundles |
| `engine.translateString(key, lang)` | Translate a field key using the loaded language pack |
| `engine.getHumanReadableDensity(density, useByte)` | Format a density value (Mbit) to human-readable string |

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — SDK setup, browser resources, and deployment notes
- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — HTTP response contract and result schema
- [Terminology](https://github.com/iTXTech/fdnext/blob/master/docs/pn_code/terminology.md) — Canonical field keys and naming conventions

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
