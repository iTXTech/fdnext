import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";
import { collectBlockIds, collectResultFields, searchItemControllerValues } from "./_helpers";

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
const richIdentifierController = richIdentifierHit.fields?.find((field) => field.key === "controller");
assert.ok(Array.isArray(richIdentifierController?.value), "identifier search should expose controller lists");
assert.ok((richIdentifierController.value as unknown[]).includes("JMF608"));
assert.ok((richIdentifierController.value as unknown[]).includes("SM3270AC"));
const sataIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:sata" }).items
  .find((item) => item.label === "2C84643CA500");
assert.deepEqual(searchItemControllerValues(sataIdentifierHit), ["SM2244LT", "SM2246EN", "SM2246XT", "YS9083XT"]);
const unionIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: ["if:sata", "if:usb20"] }).items
  .find((item) => item.label === "2C84643CA500");
const unionIdentifierControllers = searchItemControllerValues(unionIdentifierHit);
assert.ok(!unionIdentifierControllers.includes("JMF608"));
assert.ok(unionIdentifierControllers.includes("SM2246EN"));
assert.ok(unionIdentifierControllers.includes("SM3270AC"));
const nvmeIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:nvme" }).items
  .find((item) => item.label === "2C84643CA500");
assert.deepEqual(searchItemControllerValues(nvmeIdentifierHit), []);
assert.equal(engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:nvme" }).status, "ok");
const partSearchControllerHit = engine.searchParts({ query: "MT29F512G08CMCAB", lang: "eng", limit: 5, controllerGroup: "if:usb20" }).items
  .find((item) => item.device.partNumber === "MT29F512G08CMCAB");
assert.ok(searchItemControllerValues(partSearchControllerHit).includes("SM3270AC"));
