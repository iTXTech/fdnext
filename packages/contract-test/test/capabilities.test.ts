import assert from "node:assert/strict";
import {
  FDNEXT_VERSION,
  fdnextBlockIds,
  fdnextChipKinds,
  fdnextControllerGroupIds,
  fdnextDomains,
  fdnextIdSchemes,
  fdnextProductTypes
} from "../../core/src/index";
import { fdnextFieldKeys } from "../../core/src/field-registry";
import { embeddedResourceBundle } from "../../core/src/resources";
import { createContractEngine } from "../src/index";
import { assertCapabilitiesBuildTime, fdnextPackageVersion } from "./_helpers";

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();
assert.equal(FDNEXT_VERSION, fdnextPackageVersion);
assert.equal(sdkCapabilities.server.version, fdnextPackageVersion);
assert.equal(sdkCapabilities.server.build.commitHash, "dev");
assertCapabilitiesBuildTime(sdkCapabilities);
assert.equal(sdkCapabilities.fdb.version, engine.getVersion());
assert.equal(sdkCapabilities.inventory.controllers.count, sdkCapabilities.inventory.controllers.items.length);
assert.equal(sdkCapabilities.inventory.controllers.defaultGroups, "all");
assert.deepEqual(
  sdkCapabilities.inventory.controllers.groups.map((group) => group.id),
  [...fdnextControllerGroupIds]
);
for (const group of sdkCapabilities.inventory.controllers.groups) {
  assert.equal(group.count, group.items?.length ?? 0, `${group.id} controller group count should match items`);
}
const controllerItems = new Set(sdkCapabilities.inventory.controllers.items);
const allControllerGroup = sdkCapabilities.inventory.controllers.groups.find((group) => group.id === "all");
assert.ok(allControllerGroup, "all controller group should be reported");
assert.equal(allControllerGroup.title, "全部主控");
assert.equal(allControllerGroup.exclusive, true);
assert.equal(allControllerGroup.count, controllerItems.size);
assert.deepEqual(allControllerGroup.items, sdkCapabilities.inventory.controllers.items);
const selectedControllerGroup = sdkCapabilities.inventory.controllers.groups.find((group) => group.id === "selected");
assert.ok(selectedControllerGroup, "selected controller group should be reported");
assert.equal(selectedControllerGroup.title, "精选主控");
assert.equal(selectedControllerGroup.exclusive, true);
assert.ok(selectedControllerGroup.items?.includes("CBM2199EE"));
assert.ok(selectedControllerGroup.items?.includes("SM2269XT"));
assert.ok(!sdkCapabilities.inventory.controllers.groups.find((group) => group.id === "if:sata")?.exclusive);
for (const group of sdkCapabilities.inventory.controllers.groups.filter((item) => item.id !== "all")) {
  for (const controller of group.items ?? []) {
    assert.ok(controllerItems.has(controller), `${group.id} should only include known controllers`);
  }
}
const engCapabilities = engine.getCapabilities({ lang: "eng" });
const engAllControllerGroup = engCapabilities.inventory.controllers.groups.find((group) => group.id === "all");
const engSelectedControllerGroup = engCapabilities.inventory.controllers.groups.find((group) => group.id === "selected");
assert.equal(engAllControllerGroup?.title, "All controllers");
assert.equal(engSelectedControllerGroup?.title, "Selected controllers");
assert.deepEqual(engAllControllerGroup?.items, sdkCapabilities.inventory.controllers.items);
const capabilityMetrics = new Map(sdkCapabilities.inventory.metrics.map((item) => [item.id, item]));
assert.deepEqual(
  sdkCapabilities.inventory.metrics.map((item) => [item.id, item.label]),
  [["controllers", "主控型号"], ["flash_ids", "NAND Flash ID"], ["part_numbers", "料号记录"], ["micron_fbga", "Micron FBGA"]]
);
assert.equal(capabilityMetrics.get("controllers")?.count, sdkCapabilities.inventory.controllers.count);
assert.deepEqual(
  engCapabilities.inventory.metrics.map((item) => item.label),
  ["Controller models", "NAND Flash IDs", "Part numbers", "Micron FBGA"]
);
assert.ok(sdkCapabilities.inventory.metrics.every((item) => item.count > 0));
assert.ok(sdkCapabilities.decoders.partNumber.some((decoder) => decoder.id === "vendor.micron.dram.component.v1"));
assert.ok(sdkCapabilities.decoders.identifier.some((decoder) => decoder.idScheme === "nand.flash_id"));
const micronFbgaCapability = sdkCapabilities.capabilities.find((capability) => capability.name === "marking.lookup.micron.fbga");
assert.deepEqual(
  micronFbgaCapability?.chipKinds,
  ["raw_nand", "managed_nand", "dram"],
  "Micron FBGA lookup capability should report raw NAND, managed NAND, and DRAM support"
);
const mutatedCapabilities = engine.getCapabilities();
mutatedCapabilities.inventory.controllers.items.splice(0);
mutatedCapabilities.inventory.controllers.groups[0]?.items?.splice(0);
assert.equal(engine.getCapabilities().inventory.controllers.items.length, sdkCapabilities.inventory.controllers.count);
assert.equal(
  engine.getCapabilities().inventory.controllers.groups[0]?.items?.length,
  sdkCapabilities.inventory.controllers.groups[0]?.items?.length
);

assert.ok(embeddedResourceBundle.partIndex.rawNand);
assert.ok(embeddedResourceBundle.identifierIndex.nandFlash);
assert.ok(embeddedResourceBundle.markingIndex.packageMarkings);
assert.ok(embeddedResourceBundle.translationIndex.eng);
assert.equal("embeddedResources" in { embeddedResourceBundle }, false);
assert.equal("fdbRaw" in { embeddedResourceBundle }, false);

const lang = embeddedResourceBundle.translationIndex;
assert.deepEqual(Object.keys(lang.chs).sort(), Object.keys(lang.eng).sort(), "language packs must have 100% matching keys");
const requiredTranslationKeys = new Set([
  ...fdnextFieldKeys,
  ...fdnextChipKinds,
  ...fdnextProductTypes,
  ...fdnextIdSchemes,
  ...fdnextDomains,
  "true",
  "false",
  "Unknown",
  ...fdnextBlockIds.map((id) => `block.${id}`),
  "action.part.decode",
  "action.identifier.decode.nand_flash_id",
  "warning.empty_query",
  "warning.invalid_nand_flash_id",
  "warning.invalid_nand_flash_id.search",
  "warning.unsupported_id_scheme",
  "warning.constraint_mismatch.vendor",
  "warning.constraint_mismatch.chip_kind",
  "warning.constraint_mismatch.product_type",
  "warning.constraint_mismatch.strict",
  "warning.ambiguous_part",
  "subtitle.kind.raw_nand",
  "subtitle.kind.managed_nand",
  "subtitle.kind.dram",
  "subtitle.kind.memory",
  "subtitle.die_count",
  "subtitle.plane_count"
]);
assert.deepEqual(
  [...requiredTranslationKeys].filter((key) => !(key in lang.eng) || !(key in lang.chs)).sort(),
  [],
  "translation packs must cover every current public result key"
);
const obsoleteTranslationKeys = [
  "design_rev",
  "features",
  "intel_unsupported_3d_xpoint",
  "micron_f_e",
  "micron_f_m",
  "micron_f_r",
  "micron_f_s",
  "micron_f_t",
  "micron_f_x",
  "micron_f_z",
  "micron_otr_aat",
  "micron_otr_ait",
  "micron_otr_c",
  "micron_otr_it",
  "micron_otr_wt",
  "micron_p_es",
  "micron_p_ms",
  "micron_p_qs",
  "samsung_cbb_c",
  "spare_area_size_per_512b",
  "spectek_if_e",
  "spectek_if_f",
  "spectek_if_g",
  "spectek_if_m",
  "spectek_if_n",
  "special_options"
];
assert.deepEqual(
  obsoleteTranslationKeys.filter((key) => key in lang.eng || key in lang.chs),
  [],
  "obsolete translation keys must stay removed"
);
