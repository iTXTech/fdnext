# DecodePack JSON reference

DecodePack expresses vendor part-number decoding as data. `@itxtech/fdnext-core/decodepack` compiles JSON specifications into core decoders. The default entry is `defaultDecodePack` with `compileDecodePack(defaultDecodePack)`.

This is a syntax/API reference. Repository rule maintenance follows [PN authoring (Chinese)](pn_code/authoring.md); check selection follows [Validation (Chinese)](TESTING.md).

## 1. Part rules: `PartDecodeSpec`

A minimal rule matches input and assigns values directly. This example identifies only a vendor prefix; product line, density, and full PN identity require subsequent structured rules.

```json
{
  "id": "vendor.micron.prefix.mt",
  "priority": 100,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "MT" },
  "set": {
    "device": { "domain": "memory", "vendor": "micron" }
  }
}
```

| Field | Meaning |
| --- | --- |
| `id` | Unique rule ID, preferably `vendor.<vendor>.<kind>.<name>` |
| `priority` | Higher values run first; default 0 |
| `normalize` | Input preprocessing steps |
| `match` | Matching condition |
| `set` | Values assigned directly to the native draft when no token decoder is needed |
| `tokenDecoder` | Structured token parsing |

### Normalization: `normalize`

Steps execute in order: `"trim"` removes surrounding whitespace, `"uppercase"` converts to uppercase, and `{ "remove": [...] }` removes each listed character.

These steps produce the matching/parsing string. Display PN normalization runs the same steps while preserving `-` / `:`; rule-declared separator boundaries then form `device.partNumber`. Rules remain responsible for assignments that explicitly rewrite device identity.

### Matching: `match`

`match.kind` accepts `"prefix"` (a prefix string in `value`) or `"regex"` (a regular expression string in `value`, with optional `flags`).

## 2. Token decoding: `tokenDecoder`

Token decoding handles fixed positions, optional prefixes, and table-driven fields. Steps consume `rest` into context variables; `assign` constructs the output.

The local tables below illustrate syntax, not vendor ordering-code evidence. Actual mappings follow PN authoring requirements and product-line sources.

```json
{
  "id": "vendor.kioxia.token.tc.v1",
  "priority": 920,
  "normalize": ["trim", "uppercase", { "remove": [" ", ",", "&", ".", "|"] }],
  "match": { "kind": "prefix", "value": "TC" },
  "tokenDecoder": {
    "stripPrefixes": ["TC"],
    "tables": {
      "density": { "G3": 8192 },
      "basePackage": { "XB": "BGA", "XL": "LGA" },
      "detailPackage": { "BGA:1": "BGA-224, 14x18x1.46" }
    },
    "steps": [
      { "op": "take", "len": 2, "to": "densityCode" },
      { "op": "map", "from": "densityCode", "table": "density", "to": "density" },
      { "op": "take", "len": 2, "to": "packageCode" },
      { "op": "map", "from": "packageCode", "table": "basePackage", "to": "basePackage" },
      { "op": "take", "len": 1, "to": "detailCode" },
      { "op": "tpl", "template": "{{basePackage}}:{{detailCode}}", "to": "detailKey" },
      { "op": "map", "from": "detailKey", "table": "detailPackage", "to": "detailPackageValue", "default": "" },
      { "op": "fallback", "primary": "detailPackageValue", "secondary": "basePackage", "to": "package" }
    ],
    "assign": {
      "device.partNumber": { "$var": "partNumber" },
      "device.domain": "memory",
      "device.vendor": "kioxia",
      "device.chipKind": "raw_nand",
      "fields.density": { "$var": "density" },
      "fields.package": { "$var": "package" },
      "meta.ruleId": "vendor.kioxia.token.tc.v1",
      "meta.fieldProfile": "raw_nand",
      "meta.capabilities": ["part.decode", "part.search"]
    }
  }
}
```

### Prefix stripping: `tokenDecoder.stripPrefixes`

Before `steps`, strip each declared prefix from the start of `rest` in sequence, only when `rest.startsWith(prefix)`.

### Shared tables: `DecodePack.sharedTables`

Top-level `sharedTables` are available to every token decoder's `map` / `takeLongest`. Lookup combines shared tables and local `tokenDecoder.tables`; a local table overrides a shared table of the same name.

Shared tables suit process, die, and controller profiles reused across product lines, mappings shared by PN/Flash ID/MPTool rules, and matching information such as `firmware_match` or `die_mark` that participates in decoding. See [Reference policy (Chinese)](pn_code/reference_policy.md) for evidence boundaries.

#### Table forms

Both `map` and `takeLongest` normalize these forms before lookup:

- Object: `{ "AB": { "package": "FBGA-78" } }` for independent values.
- Identity array: `["AB", "CD"]`, equivalent to `{ "AB": "AB", "CD": "CD" }`, for token allowlists and longest-prefix matching.
- Alias-entry array: `[{ "keys": ["AB", "CD"], "value": { "package": "FBGA-78" } }]` for keys sharing one value. Omit `value` to return each key itself.

Array keys must not repeat. `pnpm cli decodepack check` reports duplicates instead of allowing silent overwrite.

#### `nand.die_profile`

[NAND die profiles (Chinese)](pn_code/nand_die_profile.md) defines keys, fallbacks, and firmware naming; [Public fields](pn_code/terminology.md#nand--managed-nand) defines output semantics. Exact-key metadata is assigned explicitly as described below.

### Assignment expressions: `assign` / `DecodeExpr`

Values may be raw JSON (strings, numbers, booleans, `null`, objects, or arrays), or expressions:

- `{ "$var": "name" }`: read a context variable.
- `{ "$tpl": "..." }`: substitute `{{var}}` or `{{obj.key}}`, for example in URLs or composite keys.
- `{ "$path": "obj.key" }` or `{ "$path": ["obj", "key"] }`: read a nested context value.

When a PN rule already normalizes a token to a `nand.die_profile` key, commonly `processNode` / `processKey`, reuse that key for metadata:

```json
{
  "op": "map",
  "from": "processNode",
  "table": "nand.die_profile",
  "to": "processObj",
  "default": {}
}
```

```json
{
  "fields.die_codename": { "$var": "processNode" },
  "meta.nandDieProfileKey": { "$var": "processNode" }
}
```

`takeLongest` accepts `keyTo` to capture the matched table key when the input is not already a profile key.

Identifier bit-field `definition` can output `meta.nandDieProfileKey` or `meta.nandDieProfileKeys` directly. If the same definition already decoded the value, use `{"from": "die_codename"}` rather than duplicate a bit-field table. This is an explicit DecodePack declaration, not compiler inference from public fields.

The default context includes `partNumber` (normalized original input), `rest` (unconsumed input), and variables written by steps.

### Native draft output

```json
{
  "assign": {
    "device.partNumber": { "$var": "partNumber" },
    "device.domain": "memory",
    "device.vendor": "biwin",
    "device.chipKind": "managed_nand",
    "device.productType": "emcp",
    "fields.density": { "$var": "density" },
    "fields.storage_interface": { "$path": "densityKeyObj.storage_interface" },
    "fields.dram_density": { "$path": "densityKeyObj.dram_density" },
    "components": [
      {
        "role": "dram",
        "device": { "domain": "memory", "chipKind": "dram", "productType": "lpddr4x" },
        "fields": { "dram_density": { "$path": "densityKeyObj.dram_density" } }
      }
    ],
    "meta.ruleId": "vendor.biwin.emcp.v1",
    "meta.fieldProfile": "managed_nand",
    "meta.capabilities": ["part.decode", "part.search"]
  }
}
```

[Public field terminology](pn_code/terminology.md) defines field and component constraints; [Reference policy (Chinese)](pn_code/reference_policy.md) defines maintenance metadata boundaries.

## 3. Step operators

| Operator | Parameters | Behavior |
| --- | --- | --- |
| `take` | `len`, `to` | Consume a fixed length from `rest`. If too short, write `""` without consuming input. |
| `map` | `from`, `table`, `to`, `default` | Read `tables[table][context[from]]`, otherwise use `default`. Supports shared/local tables in all three forms. |
| `takeLongest` | `table`, `to`, `default`; optional `scope`, `scopeSeparator`, `keyTo` | Match table keys against the start of `rest`, longest first; consume the match and write its value. Supports all three table forms. With `scope`, try `${scope}${scopeSeparator ?? ":"}${token}` first, then unscoped keys. `keyTo` captures the matched key. |
| `stripIfPrefix` | `prefix`; optional `to` | Strip a matching prefix; optionally write whether it was stripped. |
| `markPartNumberSeparator` | `separator`; optional `if` | Declare a display separator at the current cursor without consuming input; details below. |
| `tpl` | `template`, `to` | Substitute `{{var}}` / `{{obj.key}}`; missing values become empty strings. |
| `fallback` | `primary`, `secondary`, `to` | Use `secondary` if `primary` is undefined, `null`, or an empty string. |
| `mul` | `a`, `b`, `to`; optional `default` | Compute `Number(context[a]) * Number(context[b])`; invalid results use `default` or 0. |
| `dieDensity` | `density`, `dieCount`, `to`; optional `default` | Divide positive finite Mbit density by a positive integer die count. Preserve numeric precision; invalid input uses numeric `default` or 0. |
| `set` | `to`, `value` | Set a context constant, commonly to initialize an object. |
| `merge` | `into`, `from` | Shallow `Object.assign(into, from)` when both are non-array objects. |
| `notEmpty` | `from`, `to` | Write `String(context[from]).length > 0`. |
| `mergeIf` | `if`, `into`, `from` | Merge non-array objects when `context[if]` is truthy. |

`markPartNumberSeparator.separator` is `-` or `:`; `if` can reference a parsed body variable, for example `{ "op": "markPartNumberSeparator", "separator": "-", "if": "generationCode" }`. Mark a boundary only when both sides contain actual characters and the condition holds. Failed parsing or a missing suffix does not insert a separator. Boundaries come from the parsing cursor and are shared by projection and full decode; they do not alter `partNumber`, `rest`, or the FDB lookup body. Multiple marks rebuild separators by character offset in the recognized portion; unparsed text after the final boundary retains its original punctuation.

`dieDensity` returns Mbit numbers, for example `262144 / 1 → 262144` and `1048576 / 2 → 524288`, never capacity strings. Composite lookup keys also use the numeric Mbit result.

## 4. Output and translation

`assign` produces an untranslated native draft; the result builder produces public results. [Public field terminology](pn_code/terminology.md) owns keys, grouping, translation, packages, and default topology. Platform links use [Runtime external links](INTEGRATION.md#12-runtime-dispatch-and-external-links).

## 5. Rule organization

Use separate JSON-array packs by vendor and chip/product line, such as `samsung-ufs-token.json`, rather than one pack for every product from a vendor.

- Packs: `packages/core/src/decodepack/rules/packs`
- Registration: `packages/core/src/decodepack/rules/default-rules.ts`

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

Repository TypeScript enables `resolveJsonModule`, and the bundler has a JSON loader.

## 6. Adding or validating a vendor decoder

Follow [PN completion criteria (Chinese)](pn_code/authoring.md#完成条件) for implementation and documentation, and [Validation (Chinese)](TESTING.md) for check selection.

## 7. Maintenance tools

DecodePack diagnostics support TypeScript APIs and CLI use:

```ts
import {
  checkDecodePack,
  compileDecodePack,
  type DecodePack,
  defaultDecodePack,
  explainPartDecode,
  validateDecodePack
} from "@itxtech/fdnext-core/decodepack";

const check = checkDecodePack(defaultDecodePack);
const compiled = compileDecodePack(defaultDecodePack);
const explain = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G");

// Validate custom packs first: validation freezes the pack and marks it for compilation.
const compileCustomPack = (pack: DecodePack) => compileDecodePack(validateDecodePack(pack));
```

From the repository:

```bash
pnpm cli decodepack check
pnpm cli decodepack explain part BWCA2KZC-64G
pnpm cli decodepack explain id 2C64444BA900
```

With a local installation of the published core, use `pnpm exec fdnext decodepack ...`; with a global installation, use `fdnext decodepack ...`.

### 7.1 Field projection

Compiled PN decoders accept arbitrary draft paths at runtime rather than a fixed search-field set:

```ts
for (const decoder of compiled.partDecoders) {
  const match = decoder.match(partNumber);
  if (!match) continue;
  const summary = decoder.project?.(match, [
    "device.vendor",
    "fields.density",
    "fields.package"
  ]);
  break;
}
```

The compiler traces dependencies backward from `assign` expressions and caches an execution plan per requested path set. It skips unrelated steps and stops after the last required step. Projected values must match full `decode()`. Projection retains `device.partNumber` and may include extra dependency fields; callers must not assume all unrequested fields are absent.

`DEFAULT_PART_SEARCH_PROJECTION` declares default search dependencies. See [Browser integration](INTEGRATION.md#2-browser-integration) for extending projection.

## 8. Identifier DecodePack

NAND Flash ID rules declare `idScheme: "nand.flash_id"`. Byte offsets and bit fields compile into an `IdentifierDecoder`.

### 8.1 Pack locations

- Packs: `packages/core/src/decodepack/identifier/packs/*.json`
- Registration: `packages/core/src/decodepack/identifier/default-rules.ts`

```ts
import rules from "./packs/xxx.json" with { type: "json" };
```

### 8.2 `IdentifierDecodeSpec`

Each pack is a JSON array with entries such as:

```json
{
  "id": "flashid.micron.v1",
  "idScheme": "nand.flash_id",
  "priority": 400,
  "match": { "kind": "prefix", "value": "2C" },
  "vendor": "micron",
  "definition": {
    "2": {
      "density": { "dq": [7, 6, 5, 4, 3], "def": { "9": 32768 } }
    }
  }
}
```

| Field | Meaning |
| --- | --- |
| `id` | Unique rule ID; built-in Flash ID rules use `flashid.<vendor>[.<family-or-profile>].vN` |
| `idScheme` | Identifier namespace; NAND Flash ID uses `nand.flash_id` |
| `priority` | Higher values run first |
| `match` | `prefix` / `regex` identifier matching |
| `vendor` | Vendor key for translation and display |
| `definition` | Bit-field definitions |

The vendor segment in built-in rule IDs must match `vendor`. Use `.` for hierarchy and `-` for compound words, not `_`. Do not repeat `identifier`, `nand_flash_id`, or `parallel` in the ID when the module and `idScheme` already express them.

### 8.3 Byte offsets and bit fields

- Top-level `definition` keys are **1-based byte offsets encoded as strings**: `"1"` is the manufacturer byte, `"2"` is the second byte.
- NAND Flash IDs use a 12-hex-character / 6-byte baseline; the internal decoder appends zeroes to shorter input.
- `dq` lists bits in the specified concatenation order. `def` maps bit-field numbers encoded as strings to number/string/boolean values.
- Optional `when` restricts a rule by 1-based byte offsets, for example `{ "2": ["05", "09"] }`.
- Use canonical field keys such as `interface_type`, `timing_mode_async`, and `ecc_level`.
- A field may be an array of rules. The compiler selects the first whose `when` matches and whose `def` resolves, allowing exact-byte tables before legacy bit-field fallbacks.

### 8.4 Built-in NAND Flash ID postprocessing

The core handles corrections that cannot be expressed as pure bit fields:

- Samsung: byte 2 `0xDE` forces density to 64 Gbit.
- SK hynix: `plane_count = simultaneously_programmed_pages`.
- SK hynix: byte 6 at least `0x50` (14nm+) removes inapplicable timing/interface/ECC detail fields.
- Kioxia / Western Digital: when both are valid, `plane_count = plane_count / die_count`.

### 8.5 Adding or validating an identifier decoder

Register at the [pack locations](#81-pack-locations) and respect the vendor scope in [AGENTS.md (Chinese)](../AGENTS.md). Cover changed behavior in the corresponding identifier tests; use the validation guide for check selection.
