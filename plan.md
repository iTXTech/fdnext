# fdnext Aggressive API and DSL Migration Plan

This plan focuses only on fdnext. It assumes a breaking migration with no FlashDetector API compatibility, no legacy response compatibility, and no frontend-specific contract. Phases describe implementation order, but the target release lands as one clean fdnext API/DSL model.

Internal bridge code is allowed during implementation only when it keeps the migration reviewable. Such bridge code must not become public SDK, HTTP, CLI, or documented behavior, and must be deleted before the breaking release is considered ready.

## Principles

- fdnext becomes a storage-chip parsing engine, not a FlashDetector-compatible NAND service.
- PN decode and PN search are universal across all chip categories.
- NAND Flash ID decode and search are NAND-specific capabilities, not generic ID endpoints.
- The engine owns result semantics, field grouping, supported actions, and capability metadata.
- Consumers render structured blocks and field values; they do not infer chip-specific layout from raw fields.
- Public data keys stay stable, canonical, and untranslated. Labels and display strings are separate.
- No full-PN enum tables for parsing. PN support stays rule/DSL driven from structured tokens.
- No compatibility aliases for old metadata keys, endpoint names, or response shapes.
- Tests and schemas are migration guardrails, not a final cleanup task.

## Target Taxonomy

Use a layered taxonomy so future chips can join without bending NAND terms:

- `domain`: broad area, initially `memory`, later `power`, `controller`, or `unknown`.
- `chipKind`: concrete chip kind, initially `raw_nand`, `on_die_ecc_nand`, `managed_nand`, `dram`; later `nor`, `pmic`, etc.
- `productType`: product-line subtype, for example `emmc`, `ufs`, `emcp`, `umcp`, `e2nand`, `lpddr5x`, `lpddr4x`, `ddr5`.
- `idScheme`: identifier namespace, for example `nand.flash_id`. This prevents Flash ID behavior from leaking into DRAM, NOR, or PMIC flows.

Taxonomy rules:

- Keep physical properties such as `slc`, `mlc`, `tlc`, `qlc`, die stack, bus width, and voltage as fields, not `productType`, unless a vendor uses the term as a real product-line name.
- Treat `emcp` and `umcp` as package/product categories that may contain storage and DRAM components. The final result must be able to represent components or relations instead of flattening everything into one storage-only identity.
- Treat FBGA and other package markings as marking codes linked to parts. They should normally live in a marking index or relation, not in the generic identifier API.
- Keep `idScheme` for decodable identifier namespaces such as NAND Flash ID, not for every short marking printed on a package.

## Target API Surface

Replace the current endpoint and SDK surface with these canonical operations:

- `decodePart(input)`: universal PN decode.
- `searchParts(input)`: universal PN search and autocomplete.
- `decodeIdentifier(input)`: typed identifier decode; requires or infers an `idScheme`.
- `searchIdentifiers(input)`: typed identifier search; requires or infers an `idScheme`.
- `getCapabilities()`: engine resource/rule/capability inventory.

HTTP routes should mirror the operation names directly:

- `POST /parts/decode`
- `POST /parts/search`
- `POST /identifiers/decode`
- `POST /identifiers/search`
- `GET /capabilities`

Do not keep `/decode`, `/searchPn`, `/decodeId`, `/searchId`, `/summary`, or `/summaryId`.

## Target Response Shape

All operations return a small structured envelope. Keep common fields boring and stable; put chip-specific data in typed blocks, relations, actions, and operation-specific payload fields.

```json
{
  "schemaVersion": "fdnext.result.v1",
  "operation": "part.decode",
  "status": "ok",
  "input": {
    "query": "MT62F1G64D4EK-023 WT:B",
    "normalized": "MT62F1G64D4EK-023WT:B",
    "constraints": {}
  },
  "device": {
    "domain": "memory",
    "chipKind": "dram",
    "productType": "lpddr5x",
    "partNumber": "MT62F1G64D4EK-023WT:B",
    "vendor": {
      "id": "micron",
      "name": "Micron"
    }
  },
  "blocks": [],
  "relations": [],
  "actions": [],
  "warnings": []
}
```

Search operations use the same header but return `items` instead of a decoded `device`:

```json
{
  "schemaVersion": "fdnext.result.v1",
  "operation": "part.search",
  "status": "ok",
  "input": {
    "query": "MT62",
    "normalized": "MT62",
    "constraints": {}
  },
  "items": [],
  "warnings": []
}
```

Field values must be typed:

```json
{
  "key": "density",
  "label": "Density",
  "value": 65536,
  "unit": "Mbit",
  "display": "64Gb",
  "importance": "primary"
}
```

Field design rules:

- Do not include a top-level `resolution` object in v1. `status` is enough for normal control flow.
- Do not expose `confidence` or floating-point probabilities. Classification may rank candidates internally, but public output should avoid pretending that rule-based parsing has statistical certainty.
- Do not include top-level `capabilities` in every result. Use `GET /capabilities` for inventory and `actions` for runnable next steps from a specific decoded result.
- Do not include `explicit`; if callers force `vendor`, `chipKind`, or `productType`, keep those values in `input.constraints`.
- Keep `ruleId`, matched tokens, ranking scores, and source-resource names out of the default response. They may be exposed later through an explicit diagnostics option, but they are not part of the core public contract.
- For ambiguity, return `status: "ambiguous"` with a small `candidates` array. Candidate ordering may use internal scores, but the score itself should not be public unless a later diagnostics mode needs it.
- Avoid old paired fields such as `density` plus `rawDensity`. A single typed field should carry `value`, `unit`, and optional `display`.
- Omit unknown fields instead of filling public results with `Unknown`, empty arrays, or NAND-shaped defaults.
- Keep canonical data in `key`, `value`, `unit`, and identity IDs. Treat `label` and `display` as presentation fields generated from the field registry and language pack.
- Use structured `warnings` for partial or inferred output. Do not encode uncertainty by leaking reference metadata or adding vague fields to `extraInfo`.

## Phase 0: Schema and Migration Guardrails

Status: Complete on 2026-05-10. Implemented as a standalone migration-guardrail phase with public result types, JSON Schema, a central field registry, representative fixtures, schema/metadata tests, and bridge-rule documentation.

Goal: make the target contract precise before replacing the engine internals.

Tasks:

- [x] Define TypeScript types and JSON Schema for `FdnextResult`, `DeviceIdentity`, `FieldValue`, `ResultBlock`, `Relation`, `Action`, `Capability`, and operation input objects.
- [x] Define canonical enums for:
  - operations such as `part.decode`, `part.search`, `identifier.decode`, `identifier.search`
  - result statuses such as `ok`, `not_found`, `ambiguous`, `unsupported`, `invalid_input`
  - capability names
- [x] Create a central field registry with canonical keys, value kinds, units, default labels, display formatters, and recommended blocks.
- [x] Create representative schema fixtures for raw NAND, On-die ECC NAND, eMMC, UFS, eMCP/uMCP, DRAM, Micron FBGA marking lookup, and NAND Flash ID.
- [x] Add snapshot/schema tests for the fixtures before broad implementation work starts.
- [x] Add metadata leakage tests that reject DSL maintenance metadata such as reference, source, reference status, and inference notes inside public device fields.
- [x] Document the temporary internal bridge rule: legacy `FlashInfo` / `FlashIdInfo` adapters may exist only inside core while migrating and must be removed in Phase 8.

Exit criteria:

- [x] The new public schema is reviewable without reading old `FlashInfo` code.
- [x] At least one fixture per current product family validates against schema.
- [x] The migration can add new operations behind tests before deleting old internals.

Implementation evidence:

- `packages/core/src/result.ts` defines the result, identity, field, relation, action, capability, status, operation, taxonomy, and operation input types.
- `packages/core/src/result-schema.ts` exports JSON Schema for result envelopes, capability inventory, and all operation input objects.
- `packages/core/src/field-registry.ts` centralizes canonical field definitions, units, labels, formatters, recommended blocks, and default importance.
- `packages/core/test/fixtures/fdnext-result/*.json` covers raw NAND, On-die ECC NAND, eMMC, UFS, eMCP, DRAM, Micron FBGA marking lookup, and NAND Flash ID.
- `packages/core/test/result-contract.test.ts` validates fixtures against the schema, checks field registry labels/formatters, checks operation input schemas, and rejects public metadata leakage.
- `docs/API_MIGRATION.md` documents the temporary internal bridge rule and its Phase 8 removal requirement.

## Phase 1: Contract and Type System Replacement

Status: Complete on 2026-05-10. Replaced the public engine operation surface with fdnext result envelopes, added schema builders and field profiles, moved CLI/server/contract checks off the old endpoint contract, and removed old endpoint processor hooks.

Goal: remove NAND-shaped public types as the center of the engine.

Tasks:

- [x] Replace public `FlashInfo` / `FlashIdInfo` output contracts with `FdnextResult`, `DeviceIdentity`, `FieldValue`, `ResultBlock`, `Relation`, `Action`, and `Capability`.
- [x] Move language translation to label/display generation only; never translate object keys.
- [x] Create field profiles for `raw_nand`, `on_die_ecc_nand`, `managed_nand`, `dram`, and `nand.flash_id`.
- [x] Replace public response shaping with schema builders. During the migration, the builders may consume legacy internal decode objects, but the public SDK must expose only the new result envelope.
- [x] Remove response fields that exist only for old FlashDetector shape, such as mandatory empty `flashId`, `controller`, `url`, `interface`, or NAND classification defaults on non-NAND devices.
- [x] Replace endpoint-specific processor hooks with operation-level hooks such as `beforeOperation` / `afterOperation`, so processors are not tied to old names like `decode`, `searchPn`, or `summaryId`.

Exit criteria:

- [x] Core SDK returns only the new envelope.
- [x] No public output relies on translated field names.
- [x] DRAM output no longer carries NAND-only empty slots.
- [x] Old endpoint names no longer appear in public hook types.

Implementation evidence:

- `packages/core/src/types.ts` now exposes `FdnextEngine` operations (`decodePart`, `searchParts`, `decodeIdentifier`, `searchIdentifiers`, `getCapabilities`) and operation-level processor hooks.
- `packages/core/src/result-builder.ts` builds public schema envelopes from internal decode objects while keeping canonical keys untranslated.
- `packages/core/src/field-profiles.ts` defines block ordering for raw NAND, On-die ECC NAND, managed NAND, DRAM, and NAND Flash ID results.
- `packages/core/src/engine.ts` returns fdnext operation results directly and no longer exposes old public dispatch, summary, decode, or search method names.
- `packages/cli/src/index.ts` and `packages/server/src/index.ts` use the new operation names and routes without legacy command or endpoint aliases.
- `packages/compat-test` now runs result-schema contract checks instead of a FlashDetector baseline comparison.

## Phase 2: Unified Classification and Index Foundation

Status: Complete on 2026-05-10. Added normalized in-memory indexes, routed PN decode/search through `classifyPart`, supported explicit constraints and ambiguity, and made marking search return structured records and relations.

Goal: PN type inference becomes a first-class stage before decoding, and search stops depending on translated string suggestions.

Tasks:

- [x] Introduce the normalized internal records needed by classification before the full resource cleanup:
  - `partIndex`
  - `identifierIndex`
  - `markingIndex`
  - `vendorIndex`
- [x] Populate these indexes from the existing FDB, MDB, managed NAND PN, and DRAM PN resources without changing the on-disk resource package yet.
- [x] Add `classifyPart(query, constraints)` as the first internal stage for decode and search.
- [x] Support explicit constraints:
  - `chipKind`
  - `productType`
  - `vendor`
  - `strict`
- [x] Rank candidates internally by rule priority, match specificity, resource hit, token completeness, and vendor-prefix consistency.
- [x] Return `ambiguous` when candidates are close instead of silently choosing a misleading result.
- [x] Make `decodePart` consume the selected candidate and emit its result blocks.
- [x] Make `searchParts` use the same classifier so suggestions include `vendor`, `chipKind`, `productType`, `badges`, and a ready-to-run decode request.
- [x] Make marking-code search return structured relations to candidate parts instead of display strings.
- [x] Keep internal ranking scores out of normal API responses. Use `status`, candidate order, and warnings for public behavior.

Exit criteria:

- [x] Auto mode can distinguish current NAND, Managed NAND, and DRAM samples.
- [x] Explicit mode can force or reject a chip kind cleanly.
- [x] Search suggestions are structured objects, not parsed display strings.
- [x] Micron FBGA lookup works through `markingIndex` and returns related part records.

Implementation evidence:

- `packages/core/src/part-index.ts` builds normalized `partIndex`, `identifierIndex`, `markingIndex`, and `vendorIndex` records from current resources and implements `classifyPart`.
- `packages/core/src/device-inference.ts` centralizes product/chip-kind inference shared by classification and result building.
- `packages/core/src/engine.ts` now runs `classifyPart` before PN decode/search, uses `identifierIndex` for identifier search, handles strict constraint rejection, and emits ambiguous decode results without exposing internal scores.
- `packages/core/src/result-builder.ts` builds structured search suggestions with device identity, badges, fields, actions, and `marking_for` relations for marking-code hits.
- `packages/compat-test/test/contract.test.ts` covers auto NAND/Managed NAND/DRAM classification, explicit force/reject constraints, structured Micron FBGA search relations, and an ambiguous classification case.
- `packages/dsl/test/dram.test.ts` verifies FBGA marking search through structured fields, decode actions, and relations instead of parsing display strings.

## Phase 3: DSL v2

Status: Complete on 2026-05-10. Added DSL v2 taxonomy/profile/capability/emit schema, compiled emitted canonical fields/components into internal metadata, and made result building consume that metadata without leaking it.

Goal: make DSL describe classification, decoding, fields, and capabilities directly.

Tasks:

- [x] Extend PN DSL with:
  - `domain`
  - `chipKind`
  - `productType`
  - `capabilities`
  - `fieldProfile`
  - `emit`
- [x] Keep token operations, but make `assign` produce canonical internal fields instead of old `FlashInfo` fields.
- [x] Add explicit `fields` emission:
  - scalar fields
  - typed numeric fields with units
  - structured fields for voltage, interface, package, die stack, speed, temperature
- [x] Add explicit component emission for composite products such as eMCP/uMCP when storage and DRAM properties should not be flattened into one field set.
- [x] Keep reference and rule-quality notes inside DSL tables only; never emit them as user-visible extra info.
- [x] Split rule packs by vendor and product line where mixed packs blur classification.
- [x] Remove old metadata aliases from rules and tests instead of mapping them at runtime.

Exit criteria:

- [x] PN DSL can emit complete result envelopes without old response adapters.
- [x] DRAM and Managed NAND use field profiles instead of NAND-shaped defaults.
- [x] Composite packages can represent component fields without inventing product-specific public keys.
- [x] Metadata audit rejects old public key aliases and reference leakage.

Implementation evidence:

- `packages/dsl/src/types.ts` defines DSL v2 taxonomy fields, `fieldProfile`, `capabilities`, `$path`, `emit.fields`, and `emit.components`.
- `packages/dsl/src/compiler.ts` evaluates DSL v2 emit blocks into internal `__fdnext` metadata while keeping reference/source metadata inside rule tables only.
- `packages/core/src/result-builder.ts` consumes emitted fields, field profiles, and component metadata to build public blocks and `component` relations without exposing `__fdnext`.
- `packages/dsl/src/rules/packs/micron-dram-token.json`, `kingston-emmc-token.json`, and `biwin-emcp-token.json` include representative DRAM, Managed NAND, and composite eMCP DSL v2 metadata and emits.
- `packages/dsl/test/metadata-audit.test.ts` checks canonical emit keys, representative DSL v2 metadata, component relations, and no internal metadata leakage.
- `docs/DSL_SPEC.md` documents DSL v2 taxonomy, `$path`, `emit.fields`, `emit.components`, and canonical key constraints.

## Phase 4: Identifier DSL and NAND Flash ID Isolation

Status: Complete on 2026-05-10. Moved NAND Flash ID rules into typed identifier DSL with `idScheme: "nand.flash_id"`, routed identifier decode/search through scheme validation or safe inference, and added behavior tests that keep FBGA marking codes out of identifier APIs.

Goal: Flash ID stays powerful but stops defining the whole engine.

Tasks:

- [x] Rename Flash ID DSL concepts around `idScheme: "nand.flash_id"`.
- [x] Move NAND Flash ID rules under typed identifier decoding.
- [x] Require `idScheme` for identifier decode/search unless the input can be confidently inferred as NAND Flash ID.
- [x] Emit NAND identifier result blocks:
  - identity
  - geometry
  - timing/ext fields
  - related part numbers
  - controllers
- [x] Represent related PN hits as `relations`, not embedded translated strings.
- [x] Remove generic `decodeFlashId` / `searchFlashId` naming from public SDK in favor of identifier APIs.
- [x] Keep marking codes out of this API unless they have a real decodable identifier scheme. FBGA should remain a marking/part relation.

Exit criteria:

- [x] Flash ID decode/search works only through `nand.flash_id`.
- [x] PN operations do not expose Flash ID actions unless the decoded device has NAND identifiers.
- [x] Non-NAND parts do not show Flash ID relations or actions.

Implementation evidence:

- `packages/dsl/src/identifier/` now owns NAND Flash ID packs and `defaultIdentifierRules`; every identifier pack declares `idScheme: "nand.flash_id"`.
- `packages/dsl/src/types.ts` and `packages/dsl/src/compiler.ts` expose `IdentifierDslRule` and `compileIdentifierRulesToDecoders`, producing typed `IdentifierDecoder` entries.
- `packages/core/src/engine.ts` uses `identifierDecoders`, validates or safely infers `nand.flash_id`, rejects marking-like input without a scheme, and rejects invalid NAND Flash ID byte strings even when the scheme is explicit.
- `packages/core/src/result-builder.ts`, `packages/core/src/field-registry.ts`, and `packages/core/src/field-profiles.ts` emit identifier identity, geometry, timing/ext, controller fields, and related PN hits as `identifier_for` relations.
- `packages/compat-test/test/contract.test.ts` covers inferred NAND Flash ID decode/search, FBGA marking rejection in identifier APIs, NAND PN identifier actions, and non-NAND PN absence of identifier relations/actions.
- `README.md`, `docs/DSL_SPEC.md`, `docs/INTEGRATION.md`, and `docs/pn_code/micron_dram.md` no longer advertise old public Flash ID DSL paths or old SDK/HTTP method names.
- Verification passed: `pnpm contract:check`, `pnpm -C packages/dsl test`, `pnpm -C packages/dsl typecheck`, `pnpm -C packages/resources typecheck`, `pnpm test`, `pnpm typecheck`, and `git diff --check`.

## Phase 5: Resource Model Cleanup

Status: Complete on 2026-05-10. Replaced raw FDB/MDB resource option names with a typed resource bundle, kept runtime indexes split by role, and made marking-code decode consume the same marking index as search.

Goal: resources describe facts and indexes for all supported chip kinds, not only FDB/MDB history.

Tasks:

- [x] Replace `fdbRaw`, `mdbRaw`, `managedNandPnRaw`, and `dramPnRaw` option names with a typed resource bundle.
- [x] Split indexes by role:
  - `partIndex`
  - `identifierIndex`
  - `markingIndex`
  - `vendorIndex`
  - `translationIndex`
- [x] Keep Micron FBGA data as a marking/part relation inside the unified resource model.
- [x] Store PN search indexes as structured records with `vendor`, `chipKind`, `productType`, `partNumber`, and optional `markingCode`.
- [x] Remove legacy assumptions that FDB is the authoritative center for all device kinds.
- [x] Keep the resource loader able to build typed resources from current JSON files until the new on-disk layout lands; do not expose that compatibility as public API.

Exit criteria:

- [x] Engine startup consumes the new typed resource bundle.
- [x] Search and decode use the same normalized resource records.
- [x] Resource package exports only new bundle names.

Implementation evidence:

- `packages/core/src/types.ts` defines `FdnextResourceBundle` with `partIndex`, `identifierIndex`, `markingIndex`, `vendorIndex`, and `translationIndex`.
- `packages/core/src/engine.ts` consumes the typed bundle, builds part and identifier FDB datasets independently, and uses marking matches only when the query actually matched a package marking.
- `packages/core/src/loaders/node.ts` maps the current JSON files into the typed resource bundle without exposing old raw option names.
- `packages/resources/index.ts` now exports `embeddedResourceBundle` and `getEmbeddedResourceBundle`; old raw resource exports and `embeddedResources` are gone.
- `packages/core/src/part-index.ts` preserves structured part, identifier, marking, and vendor indexes; `packages/core/src/result-builder.ts` emits `marking_for` relations on marking-code decode.
- `packages/compat-test/test/contract.test.ts` asserts the new resource bundle export shape, rejects old resource export names, and covers marking-code decode through the shared marking index.
- `docs/INTEGRATION.md` shows the typed bundle shape for SDK and browser-loaded resources.
- Verification passed: `pnpm contract:check`, `pnpm -C packages/dsl test`, `pnpm test`, `pnpm typecheck`, and `git diff --check`.

## Phase 6: Server, CLI, and Documentation Cutover

Goal: all fdnext entrypoints speak the new contract.

Tasks:

- Replace HTTP server routes with the new POST/GET API surface.
- Update CLI commands around `part decode`, `part search`, `id decode`, and `id search`.
- Remove summary endpoints and commands. If summary text is still useful, generate it from result blocks as a presentation helper outside the canonical API contract.
- Rewrite `docs/INTEGRATION.md` for the new SDK and HTTP contract.
- Rewrite `docs/DSL_SPEC.md` for DSL v2 and identifier DSL.
- Update `docs/pn_code/terminology.md` to align field registry names with the new public schema.
- Remove compatibility-test expectations tied to FlashDetector response shape.

Exit criteria:

- No docs advertise old endpoints or old SDK methods.
- CLI and server output exactly match the new result envelope.
- Integration examples show automatic and explicit chip type selection.

## Phase 7: Test Suite Rewrite

Goal: finish converting the suite so tests validate the new model instead of old output parity.

Tasks:

- Replace compat baselines with schema and behavior tests.
- Add classifier tests for:
  - raw NAND
  - on-die ECC NAND
  - eMMC
  - UFS
  - eMCP/uMCP
  - DRAM
  - ambiguous prefixes such as `MTFC`
- Add strict explicit-mode tests.
- Add schema snapshot tests for representative decode and search results.
- Add metadata audit tests for canonical keys, units, labels, and no reference leakage.
- Add identifier tests scoped to `nand.flash_id`.
- Add server and CLI contract tests for the new operation names and POST request bodies.
- Add operation-hook tests proving processors observe new operation names rather than old endpoint strings.

Exit criteria:

- `pnpm test` validates schema, classification, DSL output, resources, server, and CLI.
- Tests no longer assert FlashDetector-compatible payload shape.

## Phase 8: Breaking Release Readiness

Goal: ship a clean fdnext major version with no hidden compatibility paths.

Tasks:

- Remove dead code for old dispatch processors and old endpoint names.
- Remove old summary-template code; summaries should be generated from blocks and fields.
- Remove temporary internal bridge adapters from legacy `FlashInfo` / `FlashIdInfo` objects to `FdnextResult`.
- Remove old resource option names and loader compatibility that only existed for migration.
- Run repository-wide searches for old names:
  - `FlashInfo`
  - `FlashIdInfo`
  - `searchPn`
  - `decodeId`
  - `summaryId`
  - `extraInfo` translated display keys
  - `toPublicFlashInfo`
  - `toPublicFlashIdInfo`
  - old processor hook names
- Run full validation:
  - `pnpm build`
  - `pnpm test`
  - `pnpm typecheck`
  - package-specific DSL/resource/server checks
- Tag as a breaking fdnext release.

Exit criteria:

- No public old API remains.
- No old response schema remains.
- New API can cover current NAND, Managed NAND, and DRAM, and has obvious extension points for NOR and PMIC.

## Non-Goals

- No FlashMaster migration plan in this document.
- No FlashDetector HTTP compatibility.
- No transitional dual API.
- No old key alias layer.
- No legacy response adapter.
- No frontend layout rules inside fdnext beyond semantic blocks, fields, relations, and actions.
