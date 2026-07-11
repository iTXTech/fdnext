import assert from "node:assert/strict";
import {
  FDNEXT_VERSION,
  fdnextControllerGroupIds
} from "@itxtech/fdnext-core";
import { createContractEngine } from "../src/index";
import { assertCapabilitiesBuildTime, fdnextPackageVersion } from "./_helpers";

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();
assert.equal(FDNEXT_VERSION, fdnextPackageVersion);
assert.equal(sdkCapabilities.server.version, fdnextPackageVersion);
assert.match(sdkCapabilities.server.build.commitHash, /^(?:[0-9a-f]{7}|unknown)$/);
assert.notEqual(sdkCapabilities.server.build.commitHash, "dev", "contract tests must load build metadata from dist");
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
