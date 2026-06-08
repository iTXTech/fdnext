import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";
import { collectBlockIds, collectResultFields, controllerFieldValues, searchItemControllerValues } from "./_helpers";

const engine = createContractEngine();

const inferredIdentifier = engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" });
assert.equal(inferredIdentifier.status, "ok");
assert.equal(inferredIdentifier.input.constraints.idScheme, "nand.flash_id");
assert.equal(inferredIdentifier.device?.idScheme, "nand.flash_id");
assert.ok(inferredIdentifier.subtitle?.includes("Micron"));
assert.ok(!collectBlockIds(inferredIdentifier).includes("identity"));
assert.ok(!collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "vendor" || field.key === "identifier" || field.key === "id_scheme"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "geometry"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "timing"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "controllers"));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "blocks_per_lun")));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "timing_mode_async")));
assert.ok(collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "revision"));
assert.ok(collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "enterprise"));
assert.ok(inferredIdentifier.relations.some((relation) => relation.kind === "identifier_for" && relation.source?.idScheme === "nand.flash_id"));
assert.ok(inferredIdentifier.relations.some((relation) => relation.action?.operation === "part.decode" && relation.action.input.query));
assert.ok(!inferredIdentifier.relations.some((relation) => /\s/.test(String(relation.target.partNumber ?? ""))));
assert.ok(!inferredIdentifier.relations.some((relation) => /\s/.test(String(relation.action?.input.query ?? ""))));
const micronIdentifierRelation = inferredIdentifier.relations.find((relation) => relation.target.partNumber === "MT29F64G08CBABA");
assert.ok(micronIdentifierRelation);
assert.equal(micronIdentifierRelation.action?.input.query, "MT29F64G08CBABA");
assert.equal(micronIdentifierRelation.action?.input.constraints?.vendor, "micron");
assert.equal(micronIdentifierRelation.action?.input.constraints?.chipKind, "raw_nand");

const skhynixIdentifier = engine.decodeIdentifier({ query: "AD0000000000", lang: "eng" });
assert.equal(skhynixIdentifier.status, "ok");
for (const key of ["redundant_area_size", "simultaneously_programmed_pages", "interface_type", "ecc_level", "edo", "interleave", "cache"] as const) {
  assert.ok(collectResultFields(skhynixIdentifier.blocks).some((field) => field.key === key), `NAND Flash ID decode should expose ${key}`);
}

const inferredIdentifierSearch = engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2 });
assert.equal(inferredIdentifierSearch.status, "ok");
assert.equal(inferredIdentifierSearch.input.constraints.idScheme, "nand.flash_id");
assert.ok(inferredIdentifierSearch.items.every((item) => item.device.idScheme === "nand.flash_id"));
assert.ok(inferredIdentifierSearch.items.every((item) =>
  (item.relations ?? []).every((relation) =>
    !/\s/.test(String(relation.target.partNumber ?? "")) &&
    !/\s/.test(String(relation.action?.input.query ?? ""))
  )
));
const micronIdentifierSearch = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10 });
assert.ok(micronIdentifierSearch.items.every((item) => item.device.vendor.id !== "unknown"), "identifier search should expose inferred vendors");
const richIdentifierHit = micronIdentifierSearch.items.find((item) => item.label === "2C84643CA500");
assert.ok(richIdentifierHit);
assert.deepEqual(searchItemControllerValues(richIdentifierHit), [], "identifier search should not expose controller fields");
assert.ok((richIdentifierHit.relations ?? []).some((relation) => relation.target.partNumber), "identifier search should retain part-number relations");
const sataIdentifierDecode = engine.decodeIdentifier({ query: "2C84643CA500", lang: "eng", controllerGroup: "if:sata" });
assert.deepEqual(controllerFieldValues(sataIdentifierDecode), ["SM2244LT", "SM2246EN", "SM2246XT", "YS9083XT"]);
const partSearchControllerHit = engine.searchParts({ query: "MT29F512G08CMCAB", lang: "eng", limit: 5 }).items
  .find((item) => item.device.partNumber === "MT29F512G08CMCAB");
assert.deepEqual(searchItemControllerValues(partSearchControllerHit), [], "part search should not expose controller fields");
