import assert from "node:assert/strict";
import { runContractChecks } from "../src/index";

const summary = await runContractChecks();

assert.equal(summary.checked, 5);
assert.deepEqual(summary.operations, ["part.decode", "part.search", "identifier.decode", "identifier.search", "capabilities"]);

process.stdout.write(`Contract confirmed: ${summary.checked} fixtures\n`);
