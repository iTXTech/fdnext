import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { confirmBaseline } from "../src/index";

const thisDir = dirname(fileURLToPath(import.meta.url));
const baselinePath = resolve(thisDir, "..", "fixtures", "baseline.json");

const summary = confirmBaseline(baselinePath);

assert.equal(summary.checked, 38);
assert.deepEqual(summary.endpointCounts, {
  decode: 19,
  decodeId: 11,
  searchPn: 2,
  searchId: 2,
  summary: 2,
  summaryId: 2
});

process.stdout.write(`Baseline confirmed: ${summary.checked} fixtures\n`);
