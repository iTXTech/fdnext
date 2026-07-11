import assert from "node:assert/strict";
import type { PartDecodeResult } from "../../src/index";
import { createEngine } from "../../src/index";
import { compileDecodePack, defaultDecodePack } from "../../src/decodepack";
import { embeddedResourceBundle } from "../../src/resources";

const compiledPack = compileDecodePack(defaultDecodePack);

export const integratedEngine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders,
  profileTables: compiledPack.profileTables
});

export interface IntegratedDecodeExpected {
  vendor: string;
  chipKind: string;
  partNumber?: string;
  markingCode?: string;
  productType?: string;
}

export function assertIntegratedDecode(query: string, expected: IntegratedDecodeExpected): PartDecodeResult {
  const result = integratedEngine.decodePart({ query, lang: "eng" });
  assert.equal(result.status, "ok", `${query} should decode through the prepared catalog`);
  assert.equal(result.device?.vendor.id, expected.vendor, `${query} vendor`);
  assert.equal(result.device?.chipKind, expected.chipKind, `${query} chip kind`);
  if (expected.partNumber !== undefined) {
    assert.equal(result.device?.partNumber, expected.partNumber, `${query} canonical PN`);
  }
  if (expected.markingCode !== undefined) {
    assert.equal(result.device?.markingCode, expected.markingCode, `${query} marking code`);
  }
  if (expected.productType !== undefined) {
    assert.equal(result.device?.productType, expected.productType, `${query} product type`);
  }
  return result;
}

export function assertIntegratedSearchIncludes(query: string, expected: string): void {
  const labels = integratedEngine.searchParts({ query, lang: "eng", limit: 50 }).items
    .map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(labels.includes(expected), `${query} should suggest ${expected}; got ${labels.join(", ")}`);
}

export function assertIntegratedSearchFirst(query: string, expected: string): void {
  const labels = integratedEngine.searchParts({ query, lang: "eng", limit: 1 }).items
    .map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(labels, [expected], `${query} should prefer a stable first catalog result`);
}

export function assertIntegratedMarkingSearch(
  markingCode: string,
  partNumber: string,
  expected: { vendor: string; chipKind: string; badge: string }
): void {
  const result = integratedEngine.searchParts({ query: markingCode, lang: "eng", limit: 20 });
  const item = result.items.find((candidate) => (
    candidate.device.markingCode === markingCode && candidate.device.partNumber === partNumber
  ));
  assert.ok(item, `${markingCode} should return ${partNumber}`);
  assert.equal(item.device.vendor.id, expected.vendor, `${markingCode} search vendor`);
  assert.equal(item.device.chipKind, expected.chipKind, `${markingCode} search chip kind`);
  assert.ok(item.badges?.includes(expected.badge), `${markingCode} should expose ${expected.badge}`);
  assert.ok(!item.fields?.some((field) => field.key === "marking_code"), `${markingCode} should not duplicate its identity as a field`);

  const relation = result.relations?.find((candidate) => (
    candidate.kind === "marking_for" &&
    candidate.source?.markingCode === markingCode &&
    candidate.target.partNumber === partNumber
  ));
  assert.ok(relation, `${markingCode} should expose a marking_for relation`);
  assert.equal(relation.action?.operation, "part.decode", `${markingCode} relation action`);
  assert.equal(relation.action?.input.query, partNumber, `${markingCode} relation target`);
}

export function resultField(result: PartDecodeResult, key: string): unknown {
  const field = result.blocks.flatMap((block) => block.fields).find((candidate) => candidate.key === key);
  return field?.display ?? field?.value;
}
