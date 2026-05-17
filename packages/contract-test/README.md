# @itxtech/fdnext-contract-test

Result contract and schema validation test suite for fdnext.

## Overview

`@itxtech/fdnext-contract-test` validates that the fdnext engine's output conforms to the published result schemas (`fdnext.result.v1` and `fdnext.capabilities.v2`). It provides:

- **Schema Validator** — A lightweight JSON Schema validator (`validateSchema`) that checks fdnext results against their declared schemas without external dependencies.
- **Contract Checks** — `runContractChecks()` exercises all core operations (part decode, part search, identifier decode, identifier search, capabilities) and validates each response against the schema.
- **Contract Engine** — `createContractEngine()` assembles a fully-configured engine with default DecodePack and embedded resources for testing.

## Usage

### Run Contract Checks

```bash
pnpm -C packages/contract-test test
```

Or from the monorepo root:

```bash
pnpm contract:check
```

### Programmatic API

```ts
import { runContractChecks, validateSchema, createContractEngine } from "@itxtech/fdnext-contract-test";

// Run all contract checks
const summary = runContractChecks();
console.log(`Checked ${summary.checked} operations: ${summary.operations.join(", ")}`);

// Validate a single result against the schema
import { fdnextResultJsonSchema } from "@itxtech/fdnext-core";
const errors = validateSchema(fdnextResultJsonSchema, someResult);
```

## Fixtures

The `fixtures/` directory contains reference response snapshots used by the contract test suite.

## Documentation

- [Server API](https://github.com/iTXTech/fdnext/blob/master/docs/SERVER_API.md) — Response schema and contract documentation

## License

AGPL-3.0-or-later — See [LICENSE](https://github.com/iTXTech/fdnext/blob/master/LICENSE) for details.
