# Public field terminology

Collected: 2026-05-15; field contract updated: 2026-09-12.

This document defines canonical field keys shared across vendors. Results use `device` for identity, `subtitle` for a display summary, and `blocks[].fields[]` for details. Each field has stable `key/value/unit/display` semantics. Language packs supply labels, display text, block titles, and warnings without changing keys. PN means part number; die means an individual semiconductor die.

Maintenance rules:

- DecodePack rules emit canonical snake_case keys directly, without legacy aliases or runtime conversions. Adding/renaming fields requires updating source rules, shared tables, `packages/core/src/field-registry.ts`, `packages/core/resources/lang/eng.json`, `chs.json`, and tests. Add retired keys to the metadata audit denylist.
- Maintenance metadata ownership is defined in [Reference policy (Chinese)](reference_policy.md).
- Omit unknown values; do not emit `Unknown`, empty arrays, or NAND-only default slots to fill an old response shape.
- `vendor`, `chip_kind`, `product_type`, `part_number`, `identifier`, `id_scheme`, and `marking_code` belong in `device`, not duplicated in detail fields.
- Parsing tokens such as `config_code`, `package_code`, `controller_code`, `die_code`, `feature_code`, and other `*_code` values remain internal. Do not expose them in `fields.*`, detail blocks, or labels named `Code`. Prefer semantic fields such as `package`, `controller`, `controller_revision`, `die_revision`, `die_codename`, `process_node`, and `special_option`. Pure clues such as `nand_component`, design IDs, or generation codes also remain internal when they lack stable readable semantics.
- Capacity fields use numeric Mbit throughout rules, shared tables, and results. `density`, `storage_density`, `component_density`, `die_density`, `dram_density`, and `dram_die_density` must have positive numeric `value` and `unit = Mbit`. NAND/managed-NAND displays use bytes; DRAM displays use bits. Interfaces and product types have their own fields. Omit unknown capacity rather than using zero/string placeholders or legacy string conversions.

## Field groups

`packages/core/src/field-profiles.ts` is the single source of detail field placement and order, selected by chip kind or identifier scheme. The field registry defines types, units, labels, formatting, and importance. Add new fields to their applicable profiles, once per profile. Identity stays in `device`; internal tokens stay out of detail groups.

| Context | Group |
| --- | --- |
| Raw NAND die density, die/CE/channel/plane counts, page/block geometry | `geometry` |
| Managed NAND internal density, geometry, and NAND interface | `components`; device/storage capacity and external interface belong in `storage` |
| Standalone DRAM die density, die/CS/bank/channel counts | `geometry`; process, die revision, and family stay with primary specifications in `dram` |
| MCP/eMCP/uMCP DRAM subsystem | DRAM density, die count, and timings in `dram`, separate from NAND components |
| Standalone DRAM CAS latency and meaningful speed grades | `timing`; interface modes and ECC state in `interface` |
| NAND Flash ID die density/counts and page/block geometry | `geometry`; NAND interface in `interface` |
| Marking year digit, week, die revision, diffusion and encapsulation locations | `marking`; package properties in `package`, controller revision in `controllers` |

Known public fields absent from a profile still enter `additional` to preserve information. Intentional cases include unknown chip kinds and the Flash ID `enterprise` flag. Fields with established semantics in normal product lines should have explicit groups.

## Public values and deduplication

- Keep the most informative canonical field for each meaning. Retain `speed_grade` only when it adds grading, test quality, CAS/RL/WL timing, or temperature information beyond `dram_speed`, such as `046BT Fully Tested` or `PG Partial Good Mixed Bins`. Omit repeated speed units and token echoes; do not add `1333Mbps/pin` beside `DDR3L-1333 (667MHz)`.
- Expose `Engineering Sample(s)` / `Early Engineering Sample(s)` only through `prod_status`, not again in `product_class`, `sku`, or `special_option`. Multiple tokens yielding the same status still produce one field; preserve source singular/plural wording.
- `voltage` / `dram_voltage` contain voltage information, without repeated DDR generation, DRAM type, or product-line text.
- Numeric generations use compact `GenN`, such as `Gen1`, `Gen2 eMCP`, or `Gen5 Xtacking 4.0`, in `generation_info`, `product_generation`, `dram_generation`, generation-valued `prod_status`, and other public generation values. Avoid `1st Gen`, `1st generation`, `Gen 1`, and `CXMT G3`. Internal `generation_code`/token names, vendor process aliases in `process_node`, and standards/proper names such as `PCIe Gen4` / `USB 3.2 Gen 1` retain their spelling. Migrate rules, tables, tests, and documents directly, without runtime normalization.
- `package` contains only package types, pin counts, dimensions, or special details confirmed by official materials, datasheets, catalogs, teardowns, or trusted distributors. Format: `TYPE[-PIN][, DIM][, SPECIAL]`, such as `FBGA-153, 11.5x13x1.0`, `BGA, 11.0x13.0x0.8`, or `WLGA`. If pins are unknown, emit the type without guessing; if only dimensions are confirmed, emit dimensions alone. Omit `mm`, `ball`, `pin`, and `Unknown`. An unexplained package token alone is not a public package value. See [Output and evidence (Chinese)](authoring.md#输出与证据).

## Identity, summaries, and relations

| Field | Meaning | Location |
| --- | --- | --- |
| `part_number` | Normalized PN | `device.partNumber` |
| `vendor` | Vendor display identity | `device.vendor` |
| `chip_kind` | Chip kind, such as `raw_nand`, `managed_nand`, or `dram` | `device.chipKind` |
| `product_type` | Product subtype: eMMC, UFS, SATA, SAS, NVMe, eMCP/uMCP, E2NAND/E3NAND, LPDDR5X, DDR4, etc. | `device.productType` |
| `identifier` | Typed identifier value, such as NAND Flash ID | `device.identifier` |
| `id_scheme` | Identifier namespace, such as `nand.flash_id` | `device.idScheme` |
| `marking_code` | FBGA/package marking code | `device.markingCode` |

`subtitle` is for quick display, not structured parsing. Typical forms:

- NAND PN: `NAND Flash · KIOXIA · 32GB MLC`
- Managed NAND: `eMCP · SAMSUNG · 8GB · 32Gb LPDDR4`
- DRAM: `LPDDR5X · Micron · 64Gb · x64`
- NAND Flash ID: `Micron · 8GB MLC · 1 die · 2 planes`

`relations[]` expresses:

- `identifier_for`: PN–NAND Flash ID association.
- `marking_for`: marking-code to real-PN association.
- `alternate_part`: a one-way relation from the current PN to another PN, such as a Phison PN to an original-vendor PN.
- `component`: storage/DRAM subcomponents of composite products such as eMCP/uMCP.

Put direct navigation to another decode operation in `relations[].action`; do not add a separate top-level `actions[]`.

### PN display and input

`input.query` is the original input, `input.normalized` is cleaned input, and `device.partNumber` is the display PN established by a rule or catalog. Tolerant matching keys may ignore `-` / `:`, but cannot serve directly as display values. Restore recognized ordering suffix separators at product-line boundaries; do not append a hyphen to a body-only input or invent suffixes. Search, candidates, and relation actions share this display logic. Explicit device-alias conversions, such as H25 `-X` normalization, still apply.

### Micron markings

A five-character FBGA code and a full marking with five leading trace characters resolve to the same device. `device.partNumber` remains the real PN; `device.markingCode` is the five-character FBGA code. `input.query` retains the original input and `input.normalized` retains the full normalized input, not just its FBGA suffix. Search also returns real PNs; full markings in FDB must not appear as additional devices. The old `micron_part_number` and `prod_date` fields are removed.

Full markings add only these `marking` fields, without a separate date code or an inferred full year:

| Field | Chinese label | Meaning |
| --- | --- | --- |
| `marking_year_digit` | 年码 | Final year digit as string `0`–`9`, preserving `0` |
| `marking_week` | 周次 | Even marking workweek from 2–52; display as two digits, such as `06` |
| `marking_die_revision` | Die版本 | Third marking character; does not override PN-decoded `die_revision` |
| `diffusion_loc` | 晶圆产地 | Wafer diffusion location |
| `encapsulation_loc` | 封装地 | Encapsulation location |

For example, `1CB2DJZ215` and `JZ215` both identify `MTFDHBL256TDQ-1AT12ATYY`. The full marking additionally gives year digit `1`, week `06`, die revision `B`, diffusion in Singapore, and encapsulation in Malaysia. Validate year and week separately. Omit unknown locations with a warning; original characters remain traceable in the full input. A five-character code alone does not create an empty marking group.

Source: [Micron CSN-11 Rev.BF, 05/2026, pages 3, 5, and 6](https://www.micron.com/content/dam/micron/global/public/products/broad-products/csns/csn11.pdf).

## NAND / managed NAND

| Field | Meaning | Example |
| --- | --- | --- |
| `density` | Current chip/storage capacity, `unit = Mbit`, byte display | `65536` / `8GB` |
| `component_density` | Total package/component capacity, often for MCP/eMCP/uMCP components; byte display | `524288` / `64GB` |
| `component_density_options` | Unresolved component-capacity candidates: distinct positive Mbit numbers, not a sum or range; mutually exclusive with scalar `component_density` | `[262144, 524288]` / `32GB / 64GB` |
| `component_voltage` | Package/component voltage, without product-line or generation text | `3.3V` |
| `storage_density` | MCP/eMCP/uMCP storage-subsystem capacity; byte display | `262144` / `32GB` |
| `die_density` | Capacity of one NAND die; byte display | `1024` / `128MB` |
| `die_codename` | Public NAND process name, labeled `Process` / `制程`; internal profile keys may be more specific | `BiCS4` / `20nm` |
| `process_alias` | Process codename or vendor alias, preserving independent clues such as `X3-9060` or `8T23` | `X3-9060` |
| `die_stack` | Non-numeric NAND stack structure or vendor structure code; pure counts use `die_count` | `DSP (4-die x2)`, `2-Deck` |
| `die_count` / `ce_count` / `rb_count` / `channel_count` / `plane_count` | NAND topology counts, consistently using `*_count` keys | `2` / `2` / `2` / `4` / `4` |
| `page_size` / `block_size` / `sector_size` | Page/block/sector geometry; byte fields use `unit = byte` | `16384` / `16KiB` |
| `half_page_and_size` | Half-page/page-size package feature | `true` |
| `generation_info` | NAND product generation, layers, or process node | `V8 236L` |
| `series_info` | Vendor series description | `3D-V4` |
| `storage_interface` | Managed NAND or MCP storage interface | `eMMC 5.1`, `UFS 4.0` |
| `nand_interface` | Structured NAND specification: device `rating` and die `capability`; not the external managed-NAND speed | `{ capability: "ONFI 4.1; Max Speed=1600MT/s" }` |
| `interface_type` | Interface mode, gear, channels, or HS mode | `HS400`, `Gear 4 / 2-Lane` |
| `interface_note` | Additional information from interface/width tables, not a default `Normal` | `HP w/ FBI Chip` |
| `toggle` | Toggle DDR marker | `DDR` |
| `controller` / `controller_revision` | Supported controllers or controller revision | `["SM2244LT", "SM3270AC"]`, `V4.41 EF` |
| `package_configuration` | Storage/DRAM/eMMC/UFS chip composition inside MCP/eMCP/uMCP, not dimensions | `4 LPDRAM, 1 UFS` |
| `form_factor` | Whole-device/module form factor for SSD/module products, distinct from chip package | `2.5-inch, 7mm` |
| `dram_configuration` | Actual DRAM composition when one MCP/eMCP/uMCP PN mixes die/PN tokens | `48Gb (4 x Y2BM) + 16Gb (2 x Y21N)` |
| `product_class` / `assembly` / `segment` / `sku` | Expanded vendor class, assembly, segment, or SKU tokens | `Automotive Grade 2`, `Client Component` |
| `operation_temperature` | Operating temperature range | `-40~105C` |
| `lead_free` / `halogen_free` / `wafer` / `multi_chip` / `cu` | Environmental, wafer, multi-chip, or copper-process flags | `true` |
| `bad_block` | Bad-block policy | `Include Bad Block` |
| `ecc_enabled` | Internal ECC state | `true` / `Yes` |

Conventions:

- Prefer `die_codename` for NAND process/generation matches, labeled `Process` / `制程`. A generation fully expressed by the process name in shared tables is not repeated in `generation_info`; independent product generations, Xtacking versions, series, and nodes may coexist. The result builder must not remove them merely because a die name exists. Public 2D values prefer lithography names such as `15nm`, `A19nm`, or `20nm`; Kioxia/SanDisk 3D values use `BiCS3`, `BiCS4`, or `BiCS4.5` without vendor/cell suffixes. `layer_count` is separate, in the main NAND decode block rather than package details. Full process aliases such as `X3-9060` and `8T23` use `process_alias`. Internal keys and FDB fallbacks are defined in [NAND profiles (Chinese)](nand_die_profile.md).
- Micron/Intel 2D raw NAND details keep lithography in `die_codename`, while summaries prefer die codenames from `process_alias`, such as `M70M` / `L84A`, over generic process names.
- `firmware_match` / `die_mark` are not public by default; internal naming follows the NAND profile reference.
- When `storage_interface` exactly duplicates `product_type`, retain the structured identity unless the interface adds a version, channel, gear, or other information.
- eMMC/UFS protocol versions belong directly in `storage_interface`. `product_version` retains versions such as NVMe at a different layer from the PCIe physical interface. Parallel NAND in MCP stays explicit in `product_mode`; a more specific controller protocol must not erase its companion interface. Preserve `PL_REG`, `DC`, and version-candidate ranges with their original meanings.
- NAND die capability uses `nand_interface.capability`; YMTC PN and raw NAND FDB device ratings use `nand_interface.rating`. Equal text may display once while retaining both scopes; different values display separately. `value` preserves both scopes and `display` formats them. The schema rejects old strings, empty objects/specifications, and unknown properties. Unmigrated PN ratings remain in `speed_grade`; do not discard test/grading information. Managed-NAND brief summaries must not use the internal NAND interface as the external interface.
- Vendor brands/series such as `iNAND`, `iSSD`, and `moviNAND` are not `product_type`; use stable semantic fields such as `product_family` when needed. Intermediate `system/group` variables are not public. SSD-type packages are classified by interface as `sata/sas/nvme`.

## NAND Flash ID

NAND Flash IDs use `decodeIdentifier` / `searchIdentifiers`. Both `input.constraints.idScheme` and device `idScheme` are `nand.flash_id`.

| Field | Meaning | Location/group |
| --- | --- | --- |
| `identifier` | NAND Flash ID | `device.identifier` |
| `id_scheme` | `nand.flash_id` | `device.idScheme` |
| `density` | ID-derived capacity | `geometry` |
| `die_density` / `die_stack` | Single-die capacity and non-numeric stack structure | `geometry` |
| `cell_level` | SLC / MLC / TLC / QLC | `geometry` |
| `die_count` / `ce_count` / `rb_count` / `channel_count` / `plane_count` | Topology counts | `geometry` |
| `page_size` / `block_size` / `pages_per_block` / `blocks_per_lun` | NAND geometry | `geometry` |
| `redundant_area_size` / `simultaneously_programmed_pages` | Spare-area size and simultaneously programmable pages | `geometry` |
| `voltage` / `interface_type` / `nand_interface` / `ecc_level` | Voltage, interface mode, NAND capability, and ECC requirements | `interface` |
| `timing_mode_async` / `edo` / `interleave` / `cache` / `revision` | Timing, EDO, interleave, cache, and revision extensions | `timing` |
| `enterprise` | Enterprise flag | `additional` |
| `controller` | Associated controllers | `controllers` |

Related PNs use `identifier_for` relations rather than concatenated translated strings. Attach `action` when navigation is available.

## DRAM

DRAM and MCP DRAM subsystems use these fields to distinguish them from NAND:

| Field | Meaning | Example |
| --- | --- | --- |
| `dram_type` | DRAM type | `LPDDR5X`, `DDR4`, `GDDR7` |
| `dram_density` | Total DRAM subsystem/chip capacity, `unit = Mbit` | `65536` / `64Gb` |
| `dram_die_density` | Capacity of one DRAM die | `16384` / `16Gb` |
| `dram_die_count` | Physical DRAM die count, distinct from NAND `die_count` | `4` |
| `cs_count` / `channel_count` | DRAM CS/rank or channel count; may coexist with `dram_die_count` | `2` |
| `dram_generation` | DRAM process/generation | `1y-nm LPDDR4X`, `LPDDR5X` |
| `dram_speed` | DRAM speed or speed bin | `8533 Mbps`, `DDR4-2666 CL19` |
| `dram_width` | Organization width, `unit = bit` | `16` / `x16` |
| `dram_voltage` | DRAM voltage/I/O information | `VDD2 1.8V / VDDQ 0.6V` |
| `cas_latency` | Expanded CAS latency token | `13` |
| `read_latency` | Source-defined RL; must not be relabeled CAS | `16` |
| `die_revision` | DRAM die/design revision | `Rev A`, `Rev E` |
| `solder_type` | Expanded solder/plating token | `100% matte Sn` |
| `special_option` | Addressing, CKE, layout, or other options outside die stacking | `Reduced page-size addressing` |
| `prod_status` | Production status, such as ES/MS/QS | `ES` |

Standalone DRAM conventions:

- `device.chipKind = "dram"`; `device.productType` uses short types such as `ddr4` or `lpddr5x`.
- `dram_type` and `product_type` omit vendor names and redundant `SDRAM/SGRAM` suffixes; do not use `Micron DDR5 SDRAM`.
- Do not copy `dram_density/dram_width` into other fields when already present in the main DRAM block.
- Vendor package/configuration tokens follow the public-value and package rules above.
- Default topology is allowed only after a vendor rule recognizes the package/topology token. A confirmed public package may default to `dram_die_count=1`; ordinary DDR may also default to `cs_count=1`. If package and die/CS recognition come from different tokens, use internal `meta.dramTopologyTokenRecognized`: `true` for a known token without publishable package details, `false` for an unknown token even when another position establishes a package. Explicit die/CS or stack layout always wins over defaults.
- Do not infer CS for LPDDR/GDDR. High capacity alone does not prove physical die count; topology evidence is required.
- `dram_die_count` is physical DRAM dies; `cs_count` is CS/rank count. PoP/MCP package information belongs in `package`. Reduced-page addressing, 2 CKE, and JEDEC/Flexframe layouts that are not die/CS facts belong in `special_option`.
- Speed/temperature/revision suffixes after `-` are not mandatory for recognizing the main structure. When absent, still return confirmed vendor, type, density, width, package, and die stacking.

For MCP/eMCP/uMCP with both NAND and DRAM:

- NAND storage uses `storage_*`, `component_density`, `die_density`, `die_count`, and `generation_info`.
- DRAM uses `dram_*`, with `dram_die_count` rather than storage `die_count`.
- Express subcomponents through `component` relations, rather than flattening storage and DRAM into product-specific keys.

## Result construction and information preservation

Resolve synonymous information at source rules, shared tables, and resource ingestion. Before removing a field, verify that every unique value and its scope has another public carrier. Equal numeric capacities at device/component/die scopes, or distinct protocols, cannot be deduplicated by text.

`hiddenFields` is currently used by source rules only for internal `density`: classification/search still use it while storage/DRAM fields carry public capacity. Used-key sets in grouping only determine which fields enter `additional`; `ensureProcessAliasField` adds independent process aliases. The result builder does not hide cross-field information through `pruneRedundantFields` or `suppressDieProfileDuplicateFields`.

Before/after measurements are in the [Field audit (Chinese)](field_information_audit.md#验证结果).
