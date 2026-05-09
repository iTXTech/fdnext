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

## Phase 8 Cleanup Rule

Phase 8 removed the temporary core bridge that translated old decode objects into fdnext results. Current SDK, HTTP, CLI, and fixture work must target `FdnextResult` and operation inputs directly:

- Do not add old endpoint names, response aliases, translated display-key maps, or bridge adapters.
- Internal DSL output should use canonical `fields` data and explicit `emit` metadata.
- Public behavior must stay on structured `device`, `blocks`, `relations`, `actions`, `warnings`, and operation-level hooks.
