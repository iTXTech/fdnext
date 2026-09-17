# @itxtech/fdnext-contract-test

Repository test suite for `fdnext.result.v2` and `fdnext.capabilities.v2`. The build emits declarations only; this package has no runtime `main` / `exports` entry.

## Run checks

From the repository root, using Node.js 24.11+ and pnpm 12+:

```bash
pnpm install
pnpm contract:check
```

This builds the core, server, and Workers packages before checking contracts. Run `pnpm -C packages/contract-test test` for the package test suite. Use `check:prepared` / `test:prepared` only when those builds still match current sources.

## Source API

In a TypeScript script inside `packages/contract-test`:

```ts
import { runContractChecks, validateSchema, createContractEngine } from "./src/index";
import { fdnextResultJsonSchema } from "@itxtech/fdnext-core";

const summary = runContractChecks();
console.log(`Checked ${summary.checked} operations: ${summary.operations.join(", ")}`);

const engine = createContractEngine();
const result = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
console.log(validateSchema(fdnextResultJsonSchema, result));
```

`validateSchema()` uses Ajv and returns an error array. `runContractChecks()` covers part decode/search, identifier decode/search, and capabilities, throwing on invalid results. `createContractEngine()` reuses an engine with default rules and resources. Check inputs are defined in `src/index.ts`; package behavior tests are in `test/`.

See [Validation (Chinese)](https://github.com/iTXTech/fdnext/blob/master/docs/TESTING.md) for check selection and build reuse.
