import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";
import { collectResultFields } from "./_helpers";

const engine = createContractEngine();

assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "dram", strict: true } }).status,
  "ok"
);
const rejected = engine.decodePart({
  query: "MT62F1G64D4EK-023 WT:B",
  lang: "eng",
  constraints: { chipKind: "managed_nand", strict: true }
});
assert.equal(rejected.status, "not_found");
assert.ok(rejected.warnings.some((warning) => warning.code === "constraint_mismatch"));
const rejectedChs = engine.decodePart({
  query: "MT62F1G64D4EK-023 WT:B",
  lang: "chs",
  constraints: { chipKind: "managed_nand", strict: true }
});
assert.ok(rejectedChs.warnings.some((warning) => warning.message.includes("strict 约束")));
assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "managed_nand" } }).device?.chipKind,
  "managed_nand"
);

const marking = engine.searchParts({ query: "C9BJZ", lang: "eng", limit: 5 });
const markingItem = marking.items.find((item) => item.device.markingCode === "C9BJZ" && item.device.partNumber === "CT40A1G8SA-62M:E");
assert.ok(markingItem, "Micron FBGA marking search should return a structured part candidate");
assert.equal(markingItem.device.chipKind, "dram");
assert.equal(markingItem.device.markingCode, "C9BJZ");
assert.ok(!markingItem.fields?.some((field) => field.key === "marking_code"));
const markingRelation = marking.relations?.find((relation) => relation.kind === "marking_for" && relation.source?.markingCode === "C9BJZ");
assert.ok(markingRelation);
assert.ok(markingRelation.action);
assert.equal(markingRelation.action.operation, "part.decode");
assert.equal(markingRelation.action.input.constraints?.chipKind, "dram");

const markingDecode = engine.decodePart({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecode.status, "ok");
assert.equal(markingDecode.device?.partNumber, "CT40A1G8SA-62M:E");
assert.equal(markingDecode.device?.markingCode, "C9BJZ");
assert.ok(!collectResultFields(markingDecode.blocks).some((field) => field.key === "marking_code"));
assert.ok(!markingDecode.relations.some((relation) => relation.kind === "marking_for"), "FBGA decode results should not repeat device marking identity as a relation");

for (const [markingCode, firstPartNumber] of [
  ["PF232", "FBMM60A21K1BAAH4"],
  ["PFA02", "FBMM58A1GL1BAAH4"],
  ["PFF01", "FBML74ANAKDMAAK3"]
] as const) {
  const spectekMarkingDecode = engine.decodePart({ query: markingCode, lang: "eng" });
  assert.equal(spectekMarkingDecode.status, "ok");
  assert.equal(spectekMarkingDecode.device?.partNumber, firstPartNumber);
  assert.equal(spectekMarkingDecode.device?.markingCode, markingCode);
  assert.ok(spectekMarkingDecode.blocks.length > 0);
  assert.ok((spectekMarkingDecode.candidates?.length ?? 0) >= 2);
  assert.ok(!collectResultFields(spectekMarkingDecode.blocks).some((field) => field.key === "marking_code"));
  assert.ok(!spectekMarkingDecode.warnings.some((warning) => warning.code === "ambiguous_part"));
}

const markingDecodeAsIdentifier = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecodeAsIdentifier.status, "invalid_input");
assert.ok(markingDecodeAsIdentifier.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingDecodeAsNandFlashId = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng", idScheme: "nand.flash_id" });
assert.equal(markingDecodeAsNandFlashId.status, "invalid_input");
assert.ok(markingDecodeAsNandFlashId.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifier = engine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
assert.equal(markingSearchAsIdentifier.status, "invalid_input");
assert.ok(markingSearchAsIdentifier.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifierChs = engine.searchIdentifiers({ query: "C9BJZ", lang: "chs" });
assert.ok(markingSearchAsIdentifierChs.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
