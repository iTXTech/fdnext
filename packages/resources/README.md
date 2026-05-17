# @itxtech/fdnext-resources

Embedded FDB, MDB, PN suggestion indexes, and language resources for fdnext.

## Overview

`@itxtech/fdnext-resources` bundles all the static data resources that the fdnext engine needs at runtime. It provides a single `embeddedResourceBundle` object that can be passed directly to `createEngine()`, eliminating the need for filesystem or network access in browser and serverless environments.

### Bundled Resources

| Resource | File | Description |
| :--- | :--- | :--- |
| **Flash Database (FDB)** | `resources/fdb.json` | Comprehensive NAND Flash chip database — part numbers, Flash IDs, controllers, and vendor metadata |
| **Marking Database (MDB)** | `resources/mdb.json` | Micron FBGA and SpecTek marking code reverse-lookup database |
| **Managed NAND PN Index** | `resources/managed-nand-pn.json` | PN suggestion index for eMMC, UFS, eMCP, uMCP, and other managed NAND products |
| **DRAM PN Index** | `resources/dram-pn.json` | PN suggestion index for DDR/LPDDR DRAM products |
| **Controller Groups** | `resources/controller-groups.json` | Controller group definitions for projection views (interface, era) |
| **Language — English** | `resources/lang/eng.json` | English field labels and translations |
| **Language — Chinese** | `resources/lang/chs.json` | Simplified Chinese field labels and translations |

## Installation

```bash
pnpm add @itxtech/fdnext-resources
```

## Usage

### Node.js / Bundler

```ts
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";
import { createEngine } from "@itxtech/fdnext-core";
import { compileDecodePack, defaultDecodePack } from "@itxtech/fdnext-decodepack";

const compiled = compileDecodePack(defaultDecodePack);
const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiled.partDecoders,
  identifierDecoders: compiled.identifierDecoders
});
```

### Browser (fetch static JSON)

For browser environments, serve the `resources/` directory as static files and load them via `fetch()`. See the [Integration Guide](../../docs/INTEGRATION.md) for detailed browser setup.

## Exports

| Export | Description |
| :--- | :--- |
| `embeddedResourceBundle` | Pre-loaded resource bundle ready for `createEngine()` |
| `getEmbeddedResourceBundle()` | Function form of the same bundle |
| `EmbeddedResourceBundle` | TypeScript interface for the resource bundle shape |

## Directory Structure

```
├── index.ts                        # Bundle assembly and exports
└── resources/
    ├── fdb.json                    # Flash Database
    ├── mdb.json                    # Marking Database
    ├── managed-nand-pn.json        # Managed NAND PN suggestion index
    ├── dram-pn.json                # DRAM PN suggestion index
    ├── controller-groups.json      # Controller group definitions
    └── lang/
        ├── eng.json                # English translations
        └── chs.json                # Chinese translations
```

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md) — Browser resource loading patterns
- [FDBGen Guide](https://github.com/iTXTech/fdnext/blob/master/docs/FDBGEN.md) — How FDB and MDB are generated

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
