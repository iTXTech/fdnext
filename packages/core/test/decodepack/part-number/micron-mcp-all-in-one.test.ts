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
