# FDBGen

The `@itxtech/fdnext-fdbgen` workspace provides FDB/MDB maintenance. This guide covers generation, normalization, PN–ID associations, and data audits.

## Features

- Merge PN and Flash ID data from multiple sources, including raw FlashDB directories (`smff/smufd/smssd/jm/mk/ma/sf/al/cbm/is/ps/ys/fc`).
- Normalize vendor names and vendor/PN/Flash ID keys.
- Correct vendor ownership using deterministic PN prefixes, such as moving `MT29F...` out of an incorrect Samsung bucket.
- Remove invalid IDs, incomplete PN aliases, and dangling `iddb.n` references.
- Backfill `iddb.n` (`vendor partNumber` reverse references).
- Aggregate and deduplicate `info.controllers`.
- Produce stable, sorted JSON for review.

## Setup and build

Use a repository checkout with Node.js 24.11+ and pnpm 12+. Run `pnpm install` at the root, then:

```bash
pnpm -C packages/fdbgen build
```

## CLI usage

Run the built CLI:

```bash
node packages/fdbgen/dist/cli.js build --input <dataset-dir> --output <fdb.json> --version <ver> [options]
```

Or use root scripts:

```bash
pnpm fdbgen:generate --input <dataset-dir> --output <fdb.json> --version <ver> [options]
pnpm fdbgen:audit
pnpm fdbgen:audit:trace
```

To regenerate the bundled FDB from the raw source dataset:

```bash
pnpm fdbgen:generate -- --input ../fdfdb --output packages/core/resources/fdb.json --version <ver> --pretty
```

The MDB crawler:

```bash
node packages/fdbgen/dist/cli.js crawl-mdb --file <mdb.json> [options]
```

Or:

```bash
pnpm fdbgen:crawl-mdb -- --file <mdb.json> [options]
```

SpecTek queries submit the legacy ASPX form at `https://www.spectek.com/menus/mark_code.aspx` and parse the response table. Default coverage includes NAND `PF*` / `PX*` and DRAM `PB*` / `PE*` / `PEB*` / `PP*` / `PPE*` / `PU*` marking prefixes. Slash-combined prefixes expand into full PNs before MDB storage: `SGG/SMA256M16V70SG8REF` becomes `SGG256M16V70SG8REF` and `SMA256M16V70SG8REF`.

Micron candidates are generated from prefix profiles and queried through the official FBGA decoder API. Defaults include letter grids for `C9/D8/D9/Z8/Z9`, numeric ranges for `NC/NW/NY/NX/NQ/NV` and `JQ/JW/JY/JZ`, and segmented ranges for `JWA/JWB/JWC/JWD/JYA/JYB/JYC`. Extend profiles for new ranges rather than adding crawler entry points. Supplemental `--codes` inputs route by prefix: known Micron profiles use the Micron API; `P*` uses SpecTek.

### Options

- `--input <dir>`: required input directory.
- `--output <file>`: required output path.
- `--version <ver>`: required `info.version`.
- `--meta <file>`: optional metadata override JSON.
- `--extra <file>`: repeatable extra merge file; defaults to `input/extra/*.json` when omitted.
- `--name <name>`: override `info.name`.
- `--exclude-controller <name>`: exclude controllers, repeatable or comma-separated. The default blacklist includes `3281FL` / `3379FL`.
- `--pretty`: format JSON; enabled by default for `crawl-mdb`.

`info.version` must be explicit. Generation always writes the current UTC `info.time` as ISO 8601 with milliseconds (`YYYY-MM-DDTHH:mm:ss.sssZ`), matching `server.build.buildTime`. Metadata, extra files, and CLI options cannot override it. FDB metadata has no `website` field.

Extraction tools should use the [FDBGen v1 support-list format](FDBGEN_FORMAT_V1.md).

Additional `crawl-mdb` options:

- `--file <path>`: required MDB file.
- `--codes <path>`: optional supplemental code JSON. `references/micron-fbga-codes.json` stores historical exceptions outside default profiles as a top-level string array. Known Micron prefixes route to Micron, `P*` to SpecTek; unknown prefixes are skipped.
- `--header <prefix>`: limit the crawl, repeatable or comma-separated; routes prefixes automatically. For example, `--header PEB --header PPE` selects those SpecTek DRAM ranges, while `--header D9 --header NW` selects Micron ranges.
- `--micron-header <prefix>` / `--spectek-header <prefix>`: explicitly limit the vendor's prefixes; repeatable or comma-separated.
- `--start-from <code>`: resume from a code or segment, such as `D9N`, `NW101`, `JW101`, `JYA01`, `PB002`, or `PEB01`.
- `--micron-max <n>`: exclusive upper bound for Micron numeric ranges; default 1000 for two-character prefixes and 100 for segmented three-character prefixes.
- `--spectek-max <n>`: exclusive SpecTek upper bound; otherwise calculated per prefix.
- `--delay-ms <n>`: delay between requests in milliseconds.
- `--user-agent <ua>`: custom HTTP User-Agent.
- `--concurrency <n>`: maximum concurrent requests, default 5.
- `--flush-hits <n>`: write MDB after this many hits, default 20.
- `--save-each-hit`: write after every hit.
- `--no-save-each-hit`: write only at completion.

`audit` checks FDB quality without modifying the database:

```bash
pnpm fdbgen:audit
pnpm fdbgen:audit -- --json
pnpm exec tsx ./packages/fdbgen/src/cli.ts audit --file packages/core/resources/fdb.json --max-samples 12
pnpm exec tsx ./packages/fdbgen/src/cli.ts audit --input ../fdfdb --version <ver> --trace-sources --max-samples 12
```

- `--file <path>`: FDB to inspect; the root script defaults to `packages/core/resources/fdb.json`.
- `--input <dir>`: generate a temporary FDB from raw/structured input and audit it without writing `fdb.json`.
- `--version <ver>`: version for temporary generation with `--input`.
- `--trace-sources`: with `--input`, include source controller, file, line/record index, raw record, normalized values, and merge decisions.
- `--json`: structured report for scripts or CI.
- `--max-samples <n>`: samples per issue, default 8.
- `--fail-on-issues`: exit 2 if any issue is found; otherwise findings are reported without failure.

Audits check:

- Top-level vendors against the known FDB vendor set.
- `iddb` keys and PN `id/f` references for complete 6-byte / 12-hex-character IDs.
- Dangling PN `id/f`, `a`, and `iddb.n` references.
- Conflicts between deterministic PN prefixes and vendor buckets.
- Synthetic labels, description fragments, date codes, unusual punctuation, or controller-only records in PN tables.
- Low-confidence ID records missing PN references or controller support.
- [PN–ID associations](#pn-and-flash-id-associations): conflicts, bidirectional integrity, and unknown reasons.

`--trace-sources` builds a temporary provenance map inside fdbgen; it is not written to the final FDB. Reports show the originating controller parser, file, line or JSON record, raw contents, normalized vendor/PN/ID, and decisions such as `add_part_id`, `merge_part_payload`, and `merge_flash_payload`. They retain matching facts from both sides and reasons for removed relations. ID/field-level conflicts in source `s/p/b` values and observable long-ID truncation are separate warnings. Some controller inputs are already truncated to six bytes before merging; lost bytes cannot be recovered, and `00/FF` wildcard masks cannot be inferred from them. Full source values are retained only in provenance.

`audit-extra` checks candidate extra files before merging:

```bash
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-extra ../fdfdb/extra/base.json --base-fdb packages/core/resources/fdb.json --decodepack
pnpm fdbgen:audit-extra -- --candidate ../fdfdb/extra/sky.json --base-fdb packages/core/resources/fdb.json --json --out ../fdfdb/sky.audit.json
```

- `--candidate <path>`: required candidate extra file.
- `--base-extra <path>`: existing extra file for same-vendor/PN differences in `fid/id/l/c/m/d/e/r/n/t/a/f`.
- `--base-fdb <path>`: generated FDB for ID coverage, relation fanout, controller support, and `iddb.n` checks.
- `--decodepack`: load the core/DecodePack engine at the CLI layer to check candidate PN vendor, process, cell, and topology conflicts using the shared association rules.
- `--json`, `--max-samples <n>`, and `--fail-on-issues`: as above; `--out <path>` writes the report to a file.

## Input directories

### Raw FlashDB

The repository source dataset is `../fdfdb`, separate from generated `packages/core/resources/fdb.json`. Finding any raw controller subdirectory selects raw mode, with a fixed controller merge order:

```text
smff/
smufd/
smssd/
jm/
mk/
ma/
sf/
al/
cbm/
is/
ps/
ys/
fc/
extra/
  base.json
  sky.json
```

### Structured input

If no raw subdirectory is found, the input directory accepts these optional paths: `fdb.json`, `meta.json`, `extra/*.json`, `vendors/*.json`, `iddb/*.json`, and `flashids/*.json`.

```text
dataset/
  fdb.json
  meta.json
  extra/
    base.json
    sky.json
  vendors/
    micron.json
    samsung.json
  iddb/
    micron.json
  flashids/
    vendor_patch.json
```

## JSON examples

`vendors/micron.json`:

```json
{
  "MT29F64G08CBABA": {
    "id": ["2C64444BA900"],
    "l": "20nm",
    "c": "MLC",
    "t": ["SM2258XT"],
    "m": "sample",
    "d": 1,
    "e": 1,
    "r": 1,
    "n": 1
  }
}
```

`iddb/micron.json`:

```json
{
  "2C64444BA900": {
    "s": 16,
    "p": 256,
    "b": 1024,
    "t": ["SM2258XT"]
  }
}
```

`meta.json` accepts either `{"info": {...}}` or a direct object:

```json
{
  "info": {
    "name": "iTXTech fdnext FDB",
    "controllers": ["SM2258XT"]
  }
}
```

`extra/base.json` or `extra/sky.json`:

```json
{
  "schemaVersion": "fdnext.fdb.extra.v1",
  "priority": 100,
  "info": {
    "controllers": ["PS3111"]
  },
  "controllerBlacklist": ["3281FL", "3379FL"],
  "vendors": {
    "phison": {
      "TA17GABCH0": {
        "t": ["PS3111"]
      }
    },
    "sndk": {
      "SDTNQGAMA-008G": {
        "fid": ["45DE949376570000"],
        "l": "BiCS3",
        "c": "TLC"
      }
    }
  },
  "iddb": {
    "98D598B27654": {
      "t": ["PS3111"]
    }
  }
}
```

## Merge and normalization

Extra files use `fdnext.fdb.extra.v1`; generated FDB uses `fdnext.fdb.v1`. Schemas are [extra](schemas/fdnext.fdb.extra.v1.schema.json) and [FDB](schemas/fdnext.fdb.v1.schema.json). Root `schemaVersion` is optional when reading existing data, but must match when supplied. New FDB output includes `"schemaVersion": "fdnext.fdb.v1"`.

### Vendor modules

Each supported vendor has a file in `packages/fdbgen/src/vendors/` for aliases (such as `sandisk/sndk` and `westerndigital/wd → sndk`), PN-prefix ownership (such as `MT29* → micron`), and vendor-specific package suffix cleanup (Micron / SK hynix / SpecTek).

The main generator parses, merges, and writes controller data. It delegates vendor ownership and PN cleanup to the vendor registry.

### Controller modules

Raw parsing is split by controller vendor under `packages/fdbgen/src/controllers/`:

| Module | Input directories |
| --- | --- |
| `silicon-motion.ts` | `smff`, `smufd`, `smssd` |
| `jmicron.ts` | `jm` |
| `maxiotek.ts` | `mk` |
| `maxio.ts` | `ma` |
| `sand-force.ts` | `sf` |
| `alcor-micro.ts` | `al` |
| `chips-bank.ts` | `cbm` |
| `innostor.ts` | `is` |
| `phison.ts` | `ps` |
| `yeestor.ts` | `ys` |
| `first-chip.ts` | `fc` |

The registry maintains a fixed loading order. Alcor `al/` supports legacy CSV and standard v1c/v1f JSON; FirstChip `fc/` supports tab-delimited `.txt`, legacy JSON arrays, and v1c/v1f JSON; Innostor `is/` supports `.ini` and v1c/v1f JSON; Phison `ps/` supports legacy arrays and standard UFD support lists such as `ufd.json`.

Standard v1 JSON is parsed by `parseFdnextFdbgenV1`, then imported through `mergeFdnextFdbgenV1SupportList` / `mergeSupportListEntry`. These shared components handle PN cleanup, vendor-prefix admission, controller normalization, trusted PN insertion, and untrusted PN fallback to `iddb`. JSON IDs must be complete hex bytes with a prefix supported by the current NAND Flash ID decoders: Micron, Intel, Samsung, SK hynix, KIOXIA, SanDisk, YMTC, or SpecTek. Unsupported controller aliases are excluded through the shared blacklist, not individual parsers.

Phison UFD PNs enter the `phison` table with one-way relations: `f` points to IDs available from that PN, and `a` points to original-vendor PNs. Only PNs matching Phison's 10-character form enter this table. Micron FBGA/marking inputs have their PN cleared by the v1 entry callback before controller support is merged into `iddb[id].t`.

### Loading order

Raw mode loads `smff`, `smufd`, `smssd`, `jm`, `mk`, `ma`, `sf`, `al`, `cbm`, `is`, `ps`, `ys`, and `fc`, then extra files and CLI metadata overrides.

Structured mode loads `fdb.json`, `vendors/*.json`, `iddb/*.json`, `flashids/*.json`, then extra files (merging `info/vendors/iddb`) and CLI metadata overrides. Extra files sort by descending priority, then filename (`base.json` before `sky.json` at equal priority).

### Vendor aliases

- `sandisk` / `sndk` / `western digital` / `westerndigital` / `wd` → `sndk`
- `toshiba` / `toshiba-iver` → `kioxia`
- `hynix` → `skhynix`
- `septeck` → `spectek`
- `stm` → `st`

### Vendor ownership

High-confidence PN prefixes reassign vendor ownership:

- `MT29*` / `MTFC*` / `MTFD*` → `micron`
- `K9*` / `KLM*` / `KLU*` / `KMD*` / `KMF*` / `KMN*` / `KMV*` → `samsung`
- `HY27*` / `H27*` / `H25*` / `H26*` / `H2D*` / `H2J*` / `H9A*` / `H9H*` / `H9Q*` / `H9T*` → `skhynix`
- `TC58*` / `TH58*` / `THG*` → `kioxia`
- `SD*` / `S34*` / `S35*` / `SANDISK*` / `SNDK*` / `DFT*` / `MDT*` / `05xxx*` → `sndk`
- `JS29F*` / `I29F*` / `PF29F*` / `PC29F*` / `PD29F*` → `intel`
- `FBNL*` / `FNNL*` / `FNN*` / `FXXL*` → `spectek`
- `NAND*` / `M29F*` → `st`
- `YM*` / `YMN*` / `XT*` → `ymtc`

### Keys and fields

- Uppercase PN keys and remove spaces, commas, `&`, `.`, and `|`.
- Remove whitespace and uppercase IDs; reject non-hex input, incomplete hex byte pairs, or invalid lengths.
- Deduplicate arrays such as `id/f/a/t/n/controllers`.
- Extra PN payload `fid` forces the primary Flash ID from a trusted source. `fid` and `id` are mutually exclusive; generated FDB writes only `id`.
- Extra root `priority` follows DecodePack semantics: higher first, default 0. When a higher-priority file supplies `id/fid`, lower-priority files cannot replace that PN identity, but may fill missing non-identity fields and append controllers/aliases.
- The winning `id/fid` overrides raw input as the authoritative ID. Records such as sky Micron entries can use `id` without needing `fid`.
- Generated `fdnext.fdb.v1` output rejects `fid`.
- `l` normalization, valid keys, and fallback follow [NAND profiles (Chinese)](pn_code/nand_die_profile.md#fdbgen-回退规格); invalid values report `part.invalid_die_profile`.
- Micron/SpecTek retain full PNs, including package, grade, and revision suffixes. DecodePack `lookupPartNumbers` is for lookup fallback, not deleting semantic suffixes from FDB identity. Do not invent packages for short source PNs.
- SK hynix H25 X suffixes are normalized without dropping them: `H25T2TB88E-X321-N → H25T2TB88EX321N`, `H25T1TD48C-X630 → H25T1TD48CX630`. Synthetic labels such as `GEN2-X321` are rejected. Exact package evidence can supplement `pkg/sg/pc/vol/so/pl` as public `package/nand_interface.rating/product_class/voltage/special_option/plane_count`. `sg` cannot override a PN-decoded rating or die capability in `nand_interface.capability`.
- Remove obvious cross-vendor contamination: Samsung `K9` keys shorter than 10 characters or containing `X` in the final three characters; `MT29F...` records ending in Intel process tokens; `29F.../PF29F...` records matching Micron raw token structures such as `...GBLBE`, `...CUCBB`, or `...EBHAF`. Bare Intel `29F...` with process codes at least `G` normalizes to `PF29F...`.
- Numeric fields `s/p/b/d/e/r/n` accept finite numbers only.
- Merge `*_1` or trailing-`-` PNs into their explicit base PN when one exists.
- Retain PN nodes still referenced by source aliases even if they have little information. Removing an incorrect ID edge must preserve PN identity and alias relations without inventing capacity or IDs.
- Apply the controller blacklist to `info.controllers`, PN `t`, and `iddb.t`. Defaults exclude `3281FL/3379FL`; extend through `--exclude-controller` or extra root `controllerBlacklist`.

### Backfilling

- Each PN `id` backfills `"<vendor> <partNumber>"` into `iddb[flashId].n`; the referenced PN must exist.
- PN `f` is one-way and does not backfill `iddb.n`.
- `info.controllers` combines controllers from metadata/extra files, PN `t`, and IDDB `t`.

### Output order

Vendors, PNs, and IDs sort lexicographically. Object keys have stable output order for version control and review.

## PN and Flash ID associations

### Matching and brands

Generation and audits share `packages/fdbgen/src/relation-matcher.ts`. One reused engine independently decodes both sides with empty FDB/MDB resources, preventing an association from proving itself through enrichment. PN `id/f` and `iddb.n` use the same decision: only `conflict` is pruned; `unknown` is retained.

Read ID `B5` identifies SpecTek and `2C` identifies Micron; PN reverse references do not override recognized ID identity. Cross-brand relations sharing Micron native dies may remain. Do not prune solely on brand mismatch or generate relations by globally replacing ID prefixes. `id/iddb.n` remove other cross-vendor identity references; `f` can carry external-brand relations with the one-way semantics above.

`compatible` means compatible under available rules, not a unique PN, quality grade, or measured real-world accuracy.

### Process, native density, and topology

- Compare canonical die keys. Micron `L04A/L84A` or `L85A/L85C` are distinct even with identical nm labels or capacities. Intersections of coarse families such as `TSB24` with `TSB24A/B`, or BiCS, mean only that conflict has not been established. All candidate profiles must be disjoint before pruning for a die conflict.
- Matching supplies `part.nativeDieDensity` and `identifier.nativeDieDensity` in Mbit. Native density constrains process alongside die profile, cell type, and layer count; equal capacity does not establish the same die. Ordinary PN calculations use `density / die_count` per die, `die_count / ce_count` dies per CE, and `density / ce_count` per CE. ID `density/die_count` describe the current target/CE. Check integrality, positivity, and each side's capacity consistency first.
- Prefer explicit die profiles for native density. Grade, half-page, partial-CE availability, and pSLC effective capacity must not be inverted into native capacity. See [SpecTek grading and native dies (Chinese)](pn_code/spectek_nand.md#分级与原生-die). If B5 cannot establish grade, do not hard-compare effective capacity; exact dies and explicit native densities still participate. PFPT A still checks topology; other partial-availability marks cannot assume full-package topology.
- Without native-die mapping, BiCS M/S operating modes are not pruned solely for cell/effective-density differences; TLC/QLC conflicts are still checked. Vendor page/block/plane granularities are not globally comparable. Source `iddb.s/p/b` is not used in relation decisions.

Matching facts also retain dies per CE, capacity per CE, cell type, layers, profile candidates, capacity sources, and uncertainty reasons. Same-family SK hynix density variants are defined in [SK hynix NAND (Chinese)](pn_code/skhynix_nand.md#3d--4d-die-规格补充).

### Unknowns and resource consumption

- Inconsistent decode results, unparsed/managed PNs, explicit placeholder IDs (`980000000000`, `EC0000…`), generic old Intel SLC layouts, and ambiguous old/new Hynix `79 A5 00` encodings remain `unknown`; do not fabricate mappings from them. The `50504E` PPN signature is not ordinary raw-NAND geometry.
- Source PN `c/l/d/e` observations may be wrong. Relations use independent DecodePack facts; runtime enrichment does not override already-decoded PN fields.
- SpecTek PN results also expose FDB ID/controller relations; PN rules still determine density, cell type, grade, and package. ID-to-PN brand inference only fills unknown brands. Multi-ID profile enrichment retains canonical keys instead of collapsing distinct dies with identical display labels.

Full samples, measurement methods, and limitations are in the [FDB 87 association audit (Chinese)](pn_code/evidence/pn-flash-id-matching-2026-09.md).

## Output structure

Generated output contains `schemaVersion`, `info`, `iddb`, and top-level vendor objects such as `micron`, `samsung`, and `kioxia`.

## Source API

In a TypeScript script inside `packages/fdbgen`:

```ts
import { generateFdb, auditFdb } from "./src/index";

const fdb = generateFdb({
  inputDir: "./dataset",
  version: "<ver>",
  outputFile: "./fdb.json",
  pretty: true
});
const audit = auditFdb(fdb, { maxSamples: 8 });
```

MDB crawling:

```ts
import { crawlMdb } from "./src/index";

await crawlMdb({
  file: "./mdb.json",
  pretty: true
});
```

Types are defined in `packages/fdbgen/src/types.ts`.
