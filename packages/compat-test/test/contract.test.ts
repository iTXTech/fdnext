import assert from "node:assert/strict";
import { createEngine } from "../../core/src/index";
import { createContractEngine, runContractChecks } from "../src/index";

const summary = runContractChecks();

assert.equal(summary.checked, 5);
assert.deepEqual(summary.operations, ["part.decode", "part.search", "identifier.decode", "identifier.search", "capabilities"]);

const engine = createContractEngine();

assert.equal(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }).device?.chipKind, "raw_nand");
assert.equal(engine.decodePart({ query: "EMMC04G-WT32", lang: "eng" }).device?.chipKind, "managed_nand");
assert.equal(engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" }).device?.chipKind, "dram");

const inferredIdentifier = engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" });
assert.equal(inferredIdentifier.status, "ok");
assert.equal(inferredIdentifier.input.constraints.idScheme, "nand.flash_id");
assert.equal(inferredIdentifier.device?.idScheme, "nand.flash_id");
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "identity"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "geometry"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "timing"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "controllers"));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "blocks_per_lun")));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "timing_mode_async")));
assert.ok(inferredIdentifier.relations.some((relation) => relation.kind === "identifier_for" && relation.source?.idScheme === "nand.flash_id"));

const inferredIdentifierSearch = engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2 });
assert.equal(inferredIdentifierSearch.status, "ok");
assert.equal(inferredIdentifierSearch.input.constraints.idScheme, "nand.flash_id");
assert.ok(inferredIdentifierSearch.items.every((item) => item.device.idScheme === "nand.flash_id"));

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
assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "managed_nand" } }).device?.chipKind,
  "managed_nand"
);

const marking = engine.searchParts({ query: "C9BJZ", lang: "eng", limit: 5 });
const markingItem = marking.items.find((item) => item.device.markingCode === "C9BJZ" && item.device.partNumber === "CT40A1G8SA-62M:E");
assert.ok(markingItem, "Micron FBGA marking search should return a structured part candidate");
assert.equal(markingItem.device.chipKind, "dram");
assert.ok(markingItem.fields?.some((field) => field.key === "marking_code" && field.value === "C9BJZ"));
assert.ok(marking.relations?.some((relation) => relation.kind === "marking_for" && relation.source?.markingCode === "C9BJZ"));
assert.ok(markingItem.actions?.some((action) => action.operation === "part.decode" && action.input.constraints?.chipKind === "dram"));

const markingDecodeAsIdentifier = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecodeAsIdentifier.status, "invalid_input");
assert.ok(markingDecodeAsIdentifier.warnings.some((warning) => warning.code === "missing_id_scheme"));
const markingDecodeAsNandFlashId = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng", idScheme: "nand.flash_id" });
assert.equal(markingDecodeAsNandFlashId.status, "invalid_input");
assert.ok(markingDecodeAsNandFlashId.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifier = engine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
assert.equal(markingSearchAsIdentifier.status, "invalid_input");
assert.ok(markingSearchAsIdentifier.warnings.some((warning) => warning.code === "missing_id_scheme"));

const dramDecode = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" });
assert.ok(!dramDecode.relations.some((relation) => relation.kind === "identifier_for"));
assert.ok(!dramDecode.actions.some((action) => action.operation === "identifier.search" || action.operation === "identifier.decode"));
const nandDecode = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
assert.ok(nandDecode.relations.some((relation) => relation.kind === "identifier_for" && relation.target.idScheme === "nand.flash_id"));
assert.ok(nandDecode.actions.some((action) => (
  action.operation === "identifier.decode" &&
  action.input.constraints?.idScheme === "nand.flash_id" &&
  /^[0-9A-F]+$/.test(action.input.query)
)));

const ambiguousEngine = createEngine({
  resources: {
    fdbRaw: {},
    mdbRaw: {},
    langRaw: {},
    managedNandPnRaw: [{ vendor: "micron", pn: "TESTPART" }],
    dramPnRaw: [{ vendor: "micron", pn: "TESTPART" }]
  },
  decoders: [{
    id: "test-dram",
    priority: 100,
    check: (partNumber) => partNumber === "TESTPART",
    decode: () => ({ vendor: "micron", type: "DRAM", density: 1024 })
  }]
});
const ambiguous = ambiguousEngine.decodePart({ query: "TESTPART", lang: "eng" });
assert.equal(ambiguous.status, "ambiguous");
assert.ok((ambiguous.candidates?.length ?? 0) >= 2);
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "dram"));
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "managed_nand"));

process.stdout.write(`Contract confirmed: ${summary.checked} fixtures\n`);
