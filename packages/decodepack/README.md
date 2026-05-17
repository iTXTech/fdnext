# @itxtech/fdnext-decodepack

Default iTXTech fdnext DecodePack rules and compiler — the data-driven rule engine for part number and typed identifier decoding.

## Overview

`@itxtech/fdnext-decodepack` provides the complete DecodePack rule ecosystem for fdnext:

- **JSON Rule Packs** — Vendor-specific part number (PN) and NAND Flash ID decoding rules expressed as structured JSON.
- **Compiler** — `compileDecodePack()` transforms JSON specs into executable decoders consumable by `@itxtech/fdnext-core`.
- **Diagnostics** — `checkDecodePack()` validates rule consistency; `explainPartDecode()` / `explainIdentifierDecode()` produce step-by-step decode traces.
- **Default Pack** — `defaultDecodePack` bundles all built-in vendor rules for immediate use.

### Rule Architecture

Rules are organized as JSON packs under `src/rules/packs/` (PN rules) and `src/identifier/packs/` (identifier rules). Each pack targets a specific vendor and product line (e.g. `samsung-ufs-token.json`, `skhynix-emcp-token.json`).

A `PartDecodeSpec` defines:
- **Match** — Prefix or regex pattern to select the decoder.
- **Normalize** — Input preprocessing (trim, uppercase, remove characters).
- **Token Decoder** — Structured token parsing via `steps` (take, map, takeLongest, tpl, fallback, mul, etc.) and `assign` for output mapping.
- **Shared Tables** — Cross-rule lookup tables (density, die profile, package codes, etc.).

## Installation

```bash
pnpm add @itxtech/fdnext-decodepack
```

## Quick Start

```ts
import { compileDecodePack, defaultDecodePack } from "@itxtech/fdnext-decodepack";

// Compile the default rule pack
const compiled = compileDecodePack(defaultDecodePack);

// Use with @itxtech/fdnext-core
import { createEngine } from "@itxtech/fdnext-core";
const engine = createEngine({
  decoders: compiled.partDecoders,
  identifierDecoders: compiled.identifierDecoders
});
```

### Diagnostics

```ts
import { checkDecodePack, explainPartDecode, defaultDecodePack } from "@itxtech/fdnext-decodepack";

// Validate rule pack consistency
const check = checkDecodePack(defaultDecodePack);

// Step-by-step decode trace
const explanation = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G");
```

## Exports

| Export | Description |
| :--- | :--- |
| `defaultDecodePack` | Pre-assembled DecodePack with all built-in vendor rules |
| `compileDecodePack(pack)` | Compile a DecodePack into executable part and identifier decoders |
| `checkDecodePack(pack)` | Validate rule consistency and report issues |
| `explainPartDecode(pack, pn, opts?)` | Produce a step-by-step decode trace for a part number |
| `explainIdentifierDecode(pack, id, opts?)` | Produce a step-by-step decode trace for a typed identifier |
| `defaultPartDecodeSpecs` | Raw array of all built-in PN decode specs |
| `defaultIdentifierDecodeSpecs` | Raw array of all built-in identifier decode specs |

## Directory Structure

```
src/
├── compiler.ts              # DecodePack → executable decoder compiler
├── default-decodepack.ts    # Default pack assembly
├── types.ts                 # DecodePack type definitions
├── nand-die-profile.ts      # NAND die profile helpers
├── rules/
│   ├── default-rules.ts     # PN rule registry
│   ├── packs/               # Vendor JSON rule packs (PN)
│   └── tables/              # Shared lookup tables
└── identifier/
    ├── default-rules.ts     # Identifier rule registry
    └── packs/               # Vendor JSON rule packs (Flash ID)
```

## Testing

```bash
pnpm -C packages/decodepack test
pnpm -C packages/decodepack typecheck
```

## Documentation

- [DecodePack Specification](https://github.com/iTXTech/fdnext/blob/master/docs/DECODEPACK.md) — Full authoring guide for PN and identifier rules
- [Terminology](https://github.com/iTXTech/fdnext/blob/master/docs/pn_code/terminology.md) — Canonical field keys and naming conventions
- [PN Code Reference Index](https://github.com/iTXTech/fdnext/blob/master/docs/pn_code/README.md) — Vendor/product-line reference documents

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
