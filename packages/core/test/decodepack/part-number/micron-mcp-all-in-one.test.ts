import assert from "node:assert/strict";
import {
  compiledPack,
  detect,
  engine,
  firstField,
  partNumberPnJson,
  resourceEntries,
  skhynixH25RawInternalExtra,
  skhynixHn8RuleIds,
  assertDecodePackDieProfile,
  assertDecodedPartNumber,
  assertDieProfileFromFdbProcess,
  assertFdbDoesNotOverrideDecodePackFields,
  assertFieldBlock,
  assertHiddenComponentRelations,
  assertHiddenPublicField,
  assertIdentifierRelation,
  assertKioxiaManagedRuleMatches,
  assertKioxiaRawSuffixTopology,
  assertMicronDecodePackDieProfile,
  assertMicronManagedFbgaMarking,
  assertNoAdditionalFields,
  assertNotFound,
  assertRuleDecode,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertRuleDecode("MT29RZ4C4DZZMGMF-18W.80C", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  widthField: "x16",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.8V/1.2V; eMMC VCCM: 1.8V",
  package: "VFBGA-168, 12x12x0.85, PoP",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR2-S4 + SLC NAND",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDDR2-S4",
    "DRAM Width": "x32",
    "Package Configuration": "1 NAND Flash, 1 LPDRAM, 0 eMMC",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "80C"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type", "Config Code", "Package Code", "Speed Grade"]
});

assertRuleDecode("MT29RZ1CVCZZHGTN-18 W.85H", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  widthField: "x16",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.8V/1.2V",
  package: "BGA-121, 7.5x8x0.8",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR2-S4 + SLC NAND",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "512Mb",
    "DRAM Type": "LPDDR2-S4",
    "DRAM Width": "x16",
    "Package Configuration": "1 NAND Flash, 1 LPDRAM, 0 eMMC",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "85H"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type", "Config Code", "Package Code", "Speed Grade"]
});

for (const [partNumber, packageName] of [
  ["MT29RZ2B1DZZHGSP-25W.418", "WFBGA-162, 8x10.5x0.8"],
  ["MT29RZ4B2DZZHHTB-18I.80F", "VFBGA-162, 8x10.5x0.9"],
  ["MT29UZ4B8DZZHGPB-107 W.84Z", "WFBGA-221, 11.5x13x0.8"],
  ["MT29RZ4C2DZZHGSK-18 W.80E", "WFBGA-162, 11.5x13x0.9"],
  ["MT29RZ4B4DZZHGPL-18 W.80U", "WFBGA-162, 11.5x13x0.8"]
] as const) {
  assertRuleDecode(partNumber, {
    vendor: "micron",
    type: "eMCP",
    package: packageName,
    absentExtra: ["Config Code", "Package Code"]
  });
}

assertRuleDecode("MT29AZ5A3CHHWD-18AIT.84F", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  widthField: "x8",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.2V/1.2V",
  package: "BGA-162, 8.0x10.5x0.9",
  extra: {
    "Product Mode": "SLC NAND + LPDDR2",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "LPDDR2",
    "DRAM Width": "x32",
    "Package Configuration": "1 NAND Flash, 2 LPDRAM",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Automotive industrial (-40°C ~ 85°C)",
    "Die Revision": "84F"
  },
  absentExtra: ["Product Family", "Config Code", "Package Code", "Speed Grade", "Special Option"]
});

assertRuleDecode("MT29GZ9A9BPMET-046AUT.265", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 16384,
  widthField: "x8",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.1V/0.6V",
  package: "VFBGA-149, 8.0x9.5x1.0",
  extra: {
    "Product Mode": "SLC NAND + LPDDR4",
    "Storage Density": "16Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Package Configuration": "2 NAND Flash, 1 LPDRAM",
    "DRAM Speed": "LPDDR4-4266",
    "Operation Temperature": "Automotive Ultra (-40°C ~ 125°C)",
    "Die Revision": "265"
  },
  absentExtra: ["Product Family", "Config Code", "Package Code", "Speed Grade", "Special Option"]
});

assertRuleDecode("MT29GZ6A9BPGET-046AIT.293", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 8192,
  widthField: "x8",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.1V/0.6V",
  package: "VFBGA-149, 8.0x9.5x1.0",
  extra: {
    "Product Mode": "SLC NAND + LPDDR4",
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Package Configuration": "1 NAND Flash, 1 LPDRAM",
    "DRAM Speed": "LPDDR4-4266",
    "Operation Temperature": "Automotive industrial (-40°C ~ 85°C)",
    "Die Revision": "293"
  },
  absentExtra: ["Product Family", "Config Code", "Package Code", "Speed Grade", "Special Option"]
});

for (const partNumber of [
  "MT29GZ9A9BPMET-046AIT.265",
  "MT29GZ9A9BPMET-046AAT.265",
  "MT29GZ9A9BPMET-046AUT.265",
  "MT29GZ6A9BPGET-046AIT.293",
  "MT29GZ6A9BPGET-046AAT.293"
]) {
  assertSearchPnIncludes(partNumber, `Micron ${partNumber.replace(".", "")}`);
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.device.vendor?.id, "micron", `${partNumber} should decode as Micron`);
  assert.equal(result.device.productType, "emcp", `${partNumber} should decode as eMCP`);
  assert.equal(firstField(result, "storage_density")?.value, partNumber.includes("GZ9A") ? "16Gb NAND" : "8Gb NAND");
  assert.equal(firstField(result, "dram_density")?.value, "16Gb");
  assert.equal(firstField(result, "package")?.value, "VFBGA-149, 8.0x9.5x1.0");
  assert.equal(firstField(result, "dram_speed")?.value, "LPDDR4-4266");
  assert.equal(
    firstField(result, "operation_temperature")?.value,
    partNumber.includes("AUT")
      ? "Automotive Ultra (-40°C ~ 125°C)"
      : partNumber.includes("AAT")
        ? "Automotive (-40°C ~ 105°C)"
        : "Automotive industrial (-40°C ~ 85°C)"
  );
}

assertRuleDecode("MT29JZZZ2DWMAFJV-6IES.63m", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V; eMMC VCCM/VCCQM: 1.8V/1.8V",
  package: "VFBGA-168, 12x12x1.0, PoP",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR + SLC eMMC",
    "Storage Density": "256MB eMMC",
    "Storage Interface": "eMMC",
    "Product Version": "eMMC 4.2/4.3",
    "DRAM Density": "2Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Package Configuration": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "DRAM Speed": "LPDDR-333 CL3",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Production Status": "Engineering Sample",
    "Die Revision": "63M"
  },
  absentExtra: ["Config Code", "Package Code", "Speed Grade", "Special Option"]
});
assertHiddenPublicField("MT29AZ5A3CHHWD-18AIT.84F", "density", 4096);
assertHiddenComponentRelations("MT29AZ5A3CHHWD-18AIT.84F");

for (const partNumber of [
  "MT29RZ4C4DZZMGMF-18W.80C",
  "MT29AZ5A3CHHWD-18AIT.84F",
  "MT29JZZZ2DWMAFJV-6IES.63m"
]) {
  assertNoAdditionalFields(partNumber);
}
