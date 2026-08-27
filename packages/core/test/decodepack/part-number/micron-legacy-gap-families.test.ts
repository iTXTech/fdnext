import assert from "node:assert/strict";
import {
  assertRuleDecode,
  assertRuleDoesNotMatch,
  engine,
  firstField
} from "./_helpers";

for (const [partNumber, dramSpeed] of [
  ["MT29D26A22B41BABHS-5 IT", "LPDDR-400 CL3"],
  ["MT29D26A12B21BAAJD-6 IT ES", "LPDDR-333 CL3"],
  ["MT29D28A22BA1CABHS-75 IT", "LPDDR-266 CL3"]
] as const) {
  assertRuleDecode(partNumber, {
    vendor: "micron",
    type: "eMCP",
    extra: {
      "Product Mode": "SLC NAND + LPDDR + MLC eMMC",
      "Product Family": "Micron All-in-One",
      "Storage Interface": "eMMC + Parallel NAND",
      "DRAM Type": "LPDRAM",
      "DRAM Speed": dramSpeed,
      "Operation Temperature": "Industrial (-40°C ~ 85°C)"
    },
    absentExtra: [
      "Storage Density",
      "DRAM Density",
      "Package",
      "Config Code",
      "Package Code"
    ]
  });
}

assertRuleDecode("MT29FCA8GDACABXC5:A", {
  vendor: "micron",
  type: "managed_nand",
  densityMbit: 65536,
  extra: {
    "Storage Density": "8GB ClearNAND",
    "Product Family": "Micron ClearNAND",
    "Storage Interface": "Parallel NAND",
    "Cell Level": "MLC",
    "Special Option": "Integrated error management"
  },
  absentExtra: ["Package", "Speed Grade", "Product Mode"]
});

assertRuleDecode("MT29FEN64GDKCAAXDQ-10ES:A", {
  vendor: "micron",
  type: "managed_nand",
  densityMbit: 524288,
  package: "LFBGA-100, 14x18x1.4",
  extra: {
    "Storage Density": "64GB ClearNAND",
    "Product Family": "Micron ClearNAND",
    "Product Mode": "Enhanced ClearNAND",
    "Storage Interface": "Parallel NAND",
    "Cell Level": "MLC",
    "Special Option": "Integrated error management",
    "Speed Grade": "104MT/s (52MHz)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: []
});

for (const [partNumber, densityMbit, storageDensity] of [
  ["N2M400FDB311A3CE", 32768, "4GB eMMC"],
  ["N2M400GDB321A3CF", 65536, "8GB eMMC"],
  ["N2M400HDB321A3CE", 131072, "16GB eMMC"],
  ["N2M400JDB341A3CF", 262144, "32GB eMMC"]
] as const) {
  assertRuleDecode(partNumber, {
    vendor: "micron",
    type: "eMMC",
    densityMbit,
    extra: {
      "Storage Density": storageDensity,
      "Product Version": "eMMC 4.41",
      "Operation Temperature": "Extended (-40°C ~ 85°C)",
      "Voltage": "3.0V",
      "Package": "LBGA-100, 14x18x1.4"
    },
    absentExtra: ["Controller", "Controller Revision"]
  });
}

assertRuleDoesNotMatch("vendor.micron.clearnand.v1", "MT29F64G08CBABAWP:B");
assertRuleDoesNotMatch("vendor.micron.emmc.n2m400.v1", "N2M400FDB311A3C");

const unknownN2m = engine.decodePart({ query: "N2M400KDA345K3BE", lang: "eng" });
assert.equal(unknownN2m.status, "ok");
assert.equal(unknownN2m.device.productType, "emmc");
assert.equal(firstField(unknownN2m, "density"), undefined);
assert.equal(firstField(unknownN2m, "package"), undefined);
assert.equal(firstField(unknownN2m, "operation_temperature"), undefined);
assert.equal(firstField(unknownN2m, "cell_level"), undefined);
assert.equal(firstField(unknownN2m, "device_width"), undefined);
assert.equal(firstField(unknownN2m, "voltage")?.value, "3.0V");
assert.equal(firstField(unknownN2m, "die_count")?.value, 4);

const unknownMt29dSpeed = engine.decodePart({ query: "MT29D26A22B41BABHS-8IT", lang: "eng" });
assert.equal(unknownMt29dSpeed.device.productType, "emcp");
assert.equal(firstField(unknownMt29dSpeed, "dram_speed"), undefined);
assert.equal(firstField(unknownMt29dSpeed, "die_revision"), undefined);
assert.equal(firstField(unknownMt29dSpeed, "operation_temperature")?.value, "Industrial (-40°C ~ 85°C)");

const unknownClearNandSpeed = engine.decodePart({ query: "MT29FEN64GDKCAAXZZ-99ES:A", lang: "eng" });
assert.equal(unknownClearNandSpeed.device.chipKind, "managed_nand");
assert.equal(firstField(unknownClearNandSpeed, "storage_density")?.value, "64GB ClearNAND");
assert.equal(firstField(unknownClearNandSpeed, "package"), undefined);
assert.equal(firstField(unknownClearNandSpeed, "speed_grade"), undefined);
