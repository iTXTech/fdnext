import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { createContractEngine } from "../src/index";

const engine = createContractEngine();
const SEARCH_MEDIAN_BUDGET_MS = 100;
const IDENTIFIER_SEARCH_MEDIAN_BUDGET_MS = 30;

function medianRuntimeMs(fn: () => unknown, iterations = 15): number {
  fn();
  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

function assertMedianBelow(name: string, budgetMs: number, fn: () => unknown): void {
  const median = medianRuntimeMs(fn);
  assert.ok(
    median < budgetMs,
    `${name} median ${median.toFixed(2)}ms should stay below ${budgetMs}ms`
  );
}

assertMedianBelow("part search Micron raw NAND prefix", SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.searchParts({ query: "MT29", lang: "eng", limit: 10 })
);
assertMedianBelow("part search Micron managed NAND prefix", SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.searchParts({ query: "MTFC", lang: "eng", limit: 20 })
);
assertMedianBelow("part search Micron FBGA marking", SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.searchParts({ query: "C9BJZ", lang: "eng", limit: 5 })
);
assertMedianBelow("part decode Micron FBGA marking", SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.decodePart({ query: "C9BJZ", lang: "eng" })
);
assertMedianBelow("part decode unmatched prefix", SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.decodePart({ query: "MTFC4G", lang: "eng" })
);
assertMedianBelow("identifier search NAND Flash ID prefix", IDENTIFIER_SEARCH_MEDIAN_BUDGET_MS, () =>
  engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10 })
);
