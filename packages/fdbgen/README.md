# @itxtech/fdnext-fdbgen

FDB generation, MDB crawling, auditing, and data maintenance tools for fdnext.

## Overview

`@itxtech/fdnext-fdbgen` is the data pipeline toolkit for maintaining fdnext's Flash Database (FDB) and Marking Database (MDB). It provides:

- **FDB Generation** — Build `fdb.json` from raw vendor datasets with normalization, deduplication, and controller blacklisting.
- **FDB Audit** — Quality checks on generated FDB files (vendor stats, fanout analysis, issue detection).
- **Extra Audit** — Validate candidate `extra.json` merge files against existing FDB/extra data and optionally cross-check with the DecodePack engine.
- **MDB Crawling** — Automated crawling of Micron FBGA and SpecTek marking codes with concurrent HTTP requests, incremental save, and resume support.
- **Normalization** — Part number, Flash ID, vendor name, controller name, and package normalization utilities.
- **FDBGen v1 Support List** — Parser and builder for the standardized support-list JSON format.

## Installation

```bash
pnpm add @itxtech/fdnext-fdbgen
```

## CLI Usage

The `fdnext-fdbgen` binary provides four subcommands:

### Build FDB

```bash
fdnext-fdbgen build --input <dir> --output <file> --version <ver> [options]
```

| Flag | Description |
| :--- | :--- |
| `--input <dir>` | Input dataset directory |
| `--output <file>` | Output fdb.json path |
| `--version <ver>` | Required `info.version` |
| `--meta <file>` | Optional metadata JSON |
| `--extra <file>` | Extra merge JSON (repeatable) |
| `--exclude-controller <name>` | Exclude controller (repeatable) |
| `--pretty` | Pretty-print JSON output |

### Audit FDB

```bash
fdnext-fdbgen audit --file <fdb.json> [--json] [--max-samples <n>] [--fail-on-issues]
fdnext-fdbgen audit --input <dir> --version <ver> --trace-sources [--json]
```

### Audit Extra

```bash
fdnext-fdbgen audit-extra --candidate <extra.json> [--base-extra <file>] [--base-fdb <file>] [--decodepack] [--json]
```

### Crawl MDB

```bash
fdnext-fdbgen crawl-mdb --file <mdb.json> [options]
```

| Flag | Description |
| :--- | :--- |
| `--codes <path>` | Supplemental MDB code JSON |
| `--start-from <code>` | Resume from a specific code segment |
| `--micron-max <n>` | Micron FBGA upper bound (default 1000) |
| `--concurrency <n>` | Max concurrent requests (default 5) |
| `--delay-ms <n>` | Delay between requests |
| `--save-each-hit` | Flush after every hit |

## Programmatic API

```ts
import { generateFdb, auditFdb, crawlMdb } from "@itxtech/fdnext-fdbgen";

// Generate FDB
generateFdb({
  inputDir: "/path/to/dataset",
  outputFile: "/path/to/fdb.json",
  version: "1.0.0"
});

// Audit FDB
const result = auditFdb(fdbData, { maxSamples: 8 });
```

## Documentation

- [FDBGen Guide](https://github.com/iTXTech/fdnext/blob/master/docs/FDBGEN.md) — Full generation, crawling, and audit documentation
- [FDBGen v1 Format](https://github.com/iTXTech/fdnext/blob/master/docs/FDBGEN_FORMAT_V1.md) — Support-list JSON format specification

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
