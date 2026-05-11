# fdnext

[简体中文](README-zh.md)

`fdnext` is a one-stop parsing solution for memory chips. It covers memory-chip part-number parsing, NAND Flash ID decoding through the typed identifier API, managed NAND and DRAM PN decoding, bundled data resources, HTTP and CLI access, result contract checks, and FDB / MDB maintenance tooling.

The project is organized as a strict TypeScript monorepo, but its public goal is the memory-chip parsing workflow: identify the device, normalize the result, enrich it with local resources, expose it through SDK / server / CLI entrypoints, and keep the underlying data reproducible.

## Features

- Memory-chip PN and typed identifier parsing through `@itxtech/fdnext-core`
- JSON DSL rule packs for PN and identifier decoders through `@itxtech/fdnext-dsl`
- Embedded `fdb`, `mdb`, language packs, managed NAND PN suggestions, DRAM PN suggestions, and Micron FBGA code resources
- Managed NAND and DRAM PN decoding coverage with vendor-specific token rules
- Micron FBGA lookup support through the unified `mdb.json` resource flow
- Shared runtime dispatch layer with Hapi, Cloudflare Workers, and Aliyun FC adapter entrypoints
- External Link result contract for platform-owned enrichment links
- CLI commands for part decode/search, identifier decode/search, and capabilities workflows
- TypeScript FDB generator with raw FlashDB cleanup, vendor remapping, controller aggregation, and MDB crawling helpers
- Result-schema and behavior contract tests for the public fdnext API

## Parsing Coverage

| Area | Product families | Currently covered vendors |
| --- | --- | --- |
| NAND PN | Raw NAND, eMMC, UFS, eMCP/uMCP, E2NAND | Samsung, SK hynix, SanDisk / Western Digital, KIOXIA, Micron, YMTC, Kingston, Longsys, BIWIN, Silicon Motion |
| DRAM PN | DRAM part-number families covered by current rule packs, including density, generation, package, die stack, speed, revision, and temperature fields where inferable | Micron, Crucial, SK hynix, Samsung, Nanya, Elpida, CXMT, ISSI, Winbond |

## Packages

| Package | Purpose |
| --- | --- |
| `@itxtech/fdnext-core` | Decode/search engine, public SDK types, resource loading helpers, and operation pipeline |
| `@itxtech/fdnext-dsl` | JSON DSL rule packs and PN / identifier compiler |
| `@itxtech/fdnext-resources` | Publishable embedded data resources |
| `@itxtech/fdnext-runtime` | Platform-neutral dispatch, HTTP routing, and External Link providers |
| `@itxtech/fdnext-server` | Hapi HTTP server adapter |
| `@itxtech/fdnext-cf-workers` | Cloudflare Workers adapter |
| `@itxtech/fdnext-aliyun-fc` | Aliyun Function Compute / custom runtime adapter |
| `@itxtech/fdnext-cli` | Command-line interface |
| `@itxtech/fdnext-fdbgen` | FDB/MDB generation and crawl tools |
| `@itxtech/fdnext-contract-test` | Result contract checks |

## Requirements

- Node.js `>= 24`
- `pnpm` as declared by `packageManager` in `package.json`

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## Usage Documentation

README only provides the project overview. The unified documentation index is [docs/README.md](docs/README.md); integration, runtime, and maintenance usage lives under `docs/`:

- [Integration guide](docs/INTEGRATION.md) for SDK, browser, HTTP server, deployment, and endpoint usage
- [Cloudflare Workers deployment](docs/CF_WORKERS.md) for Wrangler config, local dev, and deployment
- [FDBGen documentation](docs/FDBGEN.md) for FDB generation, MDB crawling, input layouts, cleanup rules, and crawler behavior
- [DSL specification](docs/DSL_SPEC.md) for PN and typed identifier rule authoring
- [PN code reference index](docs/pn_code/README.md) for vendor/product-line references
- [PN reference confidence policy](docs/pn_code/reference_policy.md) for rule admission and source confidence
- [Cross-vendor terminology](docs/pn_code/terminology.md) for canonical public field keys

## Rule and Data Maintenance

PN rules are intentionally data-driven. New decoding coverage should be added as structured JSON DSL packs, not as complete PN allowlists.

Useful locations:

- `packages/dsl/src/rules/packs/` for PN DSL packs
- `packages/dsl/src/identifier/packs/` for typed identifier DSL packs such as NAND Flash ID
- `packages/dsl/src/rules/default-rules.ts` for PN pack registration
- `packages/dsl/src/identifier/default-rules.ts` for identifier pack registration
- `packages/dsl/test/managed-nand.test.ts`, `packages/dsl/test/dram.test.ts`, and `packages/dsl/test/metadata-audit.test.ts` for rule validation
- `packages/resources/resources/lang/eng.json` and `packages/resources/resources/lang/chs.json` for user-visible metadata labels
- `docs/pn_code/` for PN reference notes and confidence policy

When adding or renaming public fields, update the DSL sources, language packs, tests, and documentation together. Maintenance metadata such as source confidence should stay inside DSL-internal metadata or documentation and must not leak into public result fields.

## Validation

Focused checks:

```bash
pnpm -C packages/dsl test
pnpm -C packages/dsl typecheck
pnpm -C packages/resources typecheck
git diff --check
```

Full repo checks:

```bash
pnpm test
pnpm typecheck
pnpm contract:check
```

The normal test suite validates the fdnext result schema, operation behavior, DSL output, resources, server, CLI checks, and result contract fixtures.

## Data References

- Flash database reference: [iTXTech/fdfdb](https://github.com/iTXTech/fdfdb)

## License

`fdnext` is released under `AGPL-3.0-or-later`. See [LICENSE](LICENSE).
