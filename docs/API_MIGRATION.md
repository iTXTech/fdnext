# fdnext API Migration Notes

This document records migration-only rules for the breaking fdnext API work. It is not a compatibility guide for old FlashDetector contracts.

## Phase 0 Result Contract

Phase 0 defines the public result contract before engine internals are replaced:

- TypeScript contract: `packages/core/src/result.ts`
- JSON Schema contract: `packages/core/src/result-schema.ts`
- Field registry: `packages/core/src/field-registry.ts`
- Schema fixtures: `packages/core/test/fixtures/fdnext-result/*.json`
- Capability fixture: `packages/core/test/fixtures/fdnext-capabilities.json`
- Guardrail test: `packages/core/test/result-contract.test.ts`

The contract uses canonical, untranslated data keys. Display labels and formatted strings are generated from the field registry and language layer, while canonical values stay in `key`, `value`, `unit`, identity IDs, relations, and operation names.

## Temporary Internal Bridge Rule

Legacy `FlashInfo` and `FlashIdInfo` objects may be consumed by internal core adapters while the engine is being migrated. Those adapters are implementation scaffolding only:

- They must stay inside `packages/core`.
- They must not be exported as new SDK behavior.
- They must not appear in HTTP routes, CLI output, documentation examples, or schema fixtures.
- They must not preserve old endpoint names, response aliases, translated keys, or `extraInfo` metadata leakage as public behavior.
- They must be removed before Phase 8 can be considered complete.

New public SDK, HTTP, CLI, and fixture work should target `FdnextResult` and the operation inputs directly.
