import assert from "node:assert/strict";
import { createContractEngine } from "../src/index";
import { collectBlockIds, collectResultFields } from "./_helpers";

const engine = await createContractEngine();

const dramDecode = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" });
assert.equal(dramDecode.subtitle, "LPDDR5X · Micron · 64Gb · x64");
assert.ok(collectResultFields(dramDecode.blocks).some((field) => (
  field.key === "dram_density" &&
  (field as { unit?: unknown }).unit === "Mbit" &&
  (field as { display?: unknown }).display === "64Gb"
)));
assert.ok(!collectBlockIds(dramDecode).includes("identity"));
assert.ok(!collectResultFields(dramDecode.blocks).some((field) => field.key === "vendor" || field.key === "part_number" || field.key === "chip_kind" || field.key === "product_type"));
assert.ok(!dramDecode.relations.some((relation) => relation.kind === "identifier_for"));
assert.equal("actions" in dramDecode, false);
const dramDecodeChs = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "chs" });
assert.ok(dramDecodeChs.blocks.some((block) => block.id === "geometry" && block.label === "几何信息"));
assert.ok(dramDecodeChs.blocks.some((block) => block.id === "package" && block.label === "封装"));
assert.ok(collectResultFields(dramDecodeChs.blocks).some((field) => field.key === "operation_temperature" && (field as { display?: string }).display === "无线温度范围 (-25°C ~ 85°C)"));
assert.ok(!collectResultFields(dramDecodeChs).some((field) => field.key === "special_options"));
const nandDecode = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
assert.ok(nandDecode.subtitle?.startsWith("NAND Flash · Micron · 8GB MLC"));
assert.ok(collectResultFields(nandDecode.blocks).some((field) => (
  field.key === "density" &&
  (field as { unit?: unknown }).unit === "Mbit" &&
  (field as { display?: unknown }).display === "8GB"
)));
const micron2dNandDecode = engine.decodePart({ query: "MT29F4G08ABAEA", lang: "eng" });
assert.equal(micron2dNandDecode.subtitle, "NAND Flash · Micron · 512MB SLC · M70M");
assert.ok(collectResultFields(micron2dNandDecode.blocks).some((field) => field.key === "die_codename" && field.value === "25nm"));
assert.ok(collectResultFields(micron2dNandDecode.blocks).some((field) => field.key === "process_alias" && field.value === "M70M"));
const intelPlainNandDecode = engine.decodePart({ query: "29F512G08EBHAF", lang: "eng" });
assert.equal(intelPlainNandDecode.device?.vendor.id, "intel");
for (const key of ["ce_count", "rb_count", "channel_count"] as const) {
  assert.ok(collectResultFields(nandDecode.blocks).some((field) => field.key === key && field.value === 1), `NAND decode should expose ${key}`);
}
const micronFbgaNandDecode = engine.decodePart({ query: "NW711", lang: "eng" });
const micronFbgaController = collectResultFields(micronFbgaNandDecode.blocks).find((field) => field.key === "controller");
assert.ok(Array.isArray((micronFbgaController as { value?: unknown }).value), "NAND decode should expose all supported controllers as a list");
assert.ok(((micronFbgaController as { value: unknown[] }).value).includes("SM3270AC"));
const nandIdentifierRelations = nandDecode.relations.filter((relation) => relation.kind === "identifier_for" && relation.target.idScheme === "nand.flash_id");
assert.ok(nandIdentifierRelations.length > 1);
assert.ok(nandIdentifierRelations.every((relation) => (
  relation.action?.operation === "identifier.decode" &&
  relation.action.input.constraints?.idScheme === "nand.flash_id" &&
  relation.action.input.query === relation.target.identifier &&
  /^[0-9A-F]+$/.test(relation.action.input.query)
)));
