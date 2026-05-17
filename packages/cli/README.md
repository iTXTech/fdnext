# @itxtech/fdnext-cli

Command-line interface for fdnext decoding, search, and DecodePack diagnostics.

## Overview

`@itxtech/fdnext-cli` provides a terminal interface to the full fdnext engine. It supports part number decoding, Flash ID inspection, database search, DecodePack validation, and step-by-step decode tracing — all with JSON output.

## Installation

```bash
pnpm add @itxtech/fdnext-cli
```

After installation, the `fdnext` binary is available.

## Usage

```
fdnext part decode <partNumber> [lang]
fdnext part search <query> [lang] [limit]
fdnext id decode <identifier> [lang] [idScheme]
fdnext id search <query> [lang] [limit] [idScheme]
fdnext capabilities [lang]
fdnext decodepack check
fdnext decodepack explain part <partNumber> [specId]
fdnext decodepack explain id <identifier> [idScheme]
```

### Options

| Option | Description |
| :--- | :--- |
| `--controller-group <group\|all>` | Controller projection view (repeatable, comma-separated) |

### Environment Variables

| Variable | Description |
| :--- | :--- |
| `FDNEXT_RESOURCES` | Path to an external resource directory (overrides built-in resources) |

## Examples

```bash
# Decode a part number
fdnext part decode MT29F64G08CBABA eng

# Search parts
fdnext part search MT29 eng 10

# Decode a NAND Flash ID
fdnext id decode 2C64444BA900 eng

# Validate DecodePack
fdnext decodepack check

# Trace a decode step-by-step
fdnext decodepack explain part BWCA2KZC-64G
```

All commands output JSON to stdout. Within the monorepo, use `pnpm cli` as a shortcut.

## Documentation

- [Integration Guide](https://github.com/iTXTech/fdnext/blob/master/docs/INTEGRATION.md)
- [DecodePack Specification](https://github.com/iTXTech/fdnext/blob/master/docs/DECODEPACK.md)

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
