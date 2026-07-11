import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultPreparedCatalog, getPreparedCatalogData } from "../../src/catalog";
import { classifyPart } from "../../src/part-index/classify";
import type { PartDecodeDraft } from "../../src/types";

const indexes = getPreparedCatalogData(getDefaultPreparedCatalog()).normalizedIndexes;
const { search: _search, ...completeScanIndexes } = indexes;

function inspectPart(partNumber: string): PartDecodeDraft {
  return {
    device: {
      partNumber,
      vendor: "unknown",
      chipKind: "unknown"
    },
    fields: {}
  };
}

function candidateKeys(query: string, limit: number | undefined, useIndexes: typeof indexes): unknown[] {
  const classification = classifyPart(query, undefined, {
    indexes: useIndexes,
    mode: "search",
    ...(limit ? { limit } : {}),
    inspectPart,
    decoderPriority: () => 0
  });
  return classification.candidates.map((candidate) => [
    candidate.vendor,
    candidate.chipKind,
    candidate.partNumber,
    candidate.markingCode ?? "",
    candidate.source,
    candidate.matchKind,
    candidate.score
  ]);
}

test("sorted/trigram search indexes preserve the complete-scan result order", () => {
  const cases: Array<readonly [string, number | undefined]> = [
    ["MT29", 10],
    ["MT29", undefined],
    ["MTFC", 20],
    ["C9BJZ", 5],
    ["HBL064", undefined],
    ["BW2A2MZCNY", 50],
    ["M", 300],
    ["MT", 10],
    ["29F", 10],
    ["NC103", 10]
  ];

  for (const [query, limit] of cases) {
    assert.deepEqual(
      candidateKeys(query, limit, indexes),
      candidateKeys(query, limit, completeScanIndexes),
      `${query} limit=${String(limit)}`
    );
  }
});
