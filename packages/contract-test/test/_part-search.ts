import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";

export const engine = createContractEngine();

export function assertNoDuplicatePartSearchItems(query: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 });
  const seen = new Set<string>();
  for (const item of result.items) {
    const key = `${item.device.vendor.id}\0${item.device.partNumber ?? item.label}\0${item.device.chipKind}`;
    assert.equal(
      seen.has(key),
      false,
      `${query} should not return duplicate FBGA/raw PN items for ${item.device.partNumber ?? item.label}`
    );
    seen.add(key);
  }
}

export function assertPartClassification(query: string, chipKind: string, productType?: string): void {
  const result = engine.decodePart({ query, lang: "eng" });
  assert.equal(result.status, "ok", query);
  assert.equal(result.device?.chipKind, chipKind, query);
  if (productType) {
    assert.equal(result.device?.productType, productType, query);
  }
}
