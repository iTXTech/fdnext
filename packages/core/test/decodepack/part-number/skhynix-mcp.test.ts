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
  assertPart,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertPart("H2DTDG8UD1MYR", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "26nm",
  cellField: "MLC",
  widthField: "x8",
  package: "VLGA",
  extra: {
    "Product Version": "E2NAND2.0",
    "Block size": "2MB (8KB page)",
    "ECC enabled": "Yes"
  }
});

assertPart("H2JTDG8UD1BMS", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "16nm",
  cellField: "MLC",
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "EMI Shielded",
    "Die Density": "64Gb",
    "Die Count": 2
  }
});

assertPart("H2JT1T8QD1MMR", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 1048576,
  dieProfileField: "16nm",
  cellField: "MLC",
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Block size": "4MB",
    "Special Option": "Non Shielded",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

assertPart("H23QDG8UD1ACS", {
  vendor: "skhynix",
  type: "E3NAND",
  densityMbit: 131072,
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Generation": "1ynm E3NAND",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "EMI Shielded",
    "Die Density": "64Gb",
    "Die Count": 2
  }
});

assertPart("H23Q1T8QK1MYR", {
  vendor: "skhynix",
  type: "E3NAND",
  densityMbit: 1048576,
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Generation": "1ynm E3NAND",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "Non Shielded",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

for (const partNumber of [
  "H26M31001HPR",
  "H26M78208CMRX",
  "H28U64222MMR",
  "H2JTDG8UD1BMS",
  "H23Q1T8QK1MYR"
]) {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(firstField(result, "die_stack"), undefined, `${partNumber} should not expose die_stack`);
  assert.ok(firstField(result, "die_count"), `${partNumber} should expose die_count`);
}

assertPart("H9TQ17ABJTMCUR-KUM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 131072,
  package: "FBGA-221, 11.5x13",
  extra: {
    "Product Mode": "CI-MCP",
    "Product Family": "e-NAND",
    "Storage Density": "16GB",
    "Storage Interface": "eMMC 5.0",
    "Cell Level": "MLC",
    "Product Generation": "1st generation eMCP",
    "Die Count": 2,
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Width": "x32",
    "DRAM Die Stack": 2,
    "Channel Count": 1,
    "CS Count": 2,
    "DRAM Voltage": "VDD1 1.8V / VDD2/VDDCA/VDDQ 1.2V",
    "DRAM Speed": "LPDDR3-1866",
    "Speed Grade": "eMMC 200MHz",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["CE Count", "Density Code", "Config Code"]
});

assertPart("H9TQ27ADFTMCUR-KUM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 262144,
  package: "FBGA-221, 11.5x13",
  extra: {
    "Product Mode": "CI-MCP",
    "Product Family": "e-NAND",
    "Storage Density": "32GB",
    "Storage Interface": "eMMC 5.1",
    "Cell Level": "MLC",
    "Product Generation": "1st generation eMCP",
    "Die Count": 2,
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Width": "x32",
    "DRAM Die Stack": 3,
    "Channel Count": 1,
    "CS Count": 2,
    "DRAM Voltage": "VDD1 1.8V / VDD2/VDDCA/VDDQ 1.2V",
    "DRAM Speed": "LPDDR3-1866",
    "Speed Grade": "eMMC 400MHz",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["Product Version", "CE Count", "Density Code", "Config Code"]
});

assertPart("H9TQ64A8GTACUR-KUM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 65536,
  package: "FBGA-221, 11.5x13",
  extra: {
    "Product Mode": "CI-MCP",
    "Product Family": "e-NAND",
    "Storage Density": "8GB",
    "Storage Interface": "eMMC 5.1",
    "Cell Level": "MLC",
    "Product Generation": "2nd generation eMCP",
    "Die Count": 1,
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Width": "x32",
    "DRAM Die Stack": 1,
    "DRAM Voltage": "VDD1 1.8V / VDD2/VDDCA/VDDQ 1.2V",
    "DRAM Speed": "LPDDR3-1866",
    "Speed Grade": "eMMC 200MHz",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["Product Version", "CE Count", "Density Code", "Config Code"]
});

assertPart("H9TP32A4GDBCPR-KGM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 32768,
  package: "FBGA-162, 11.5x13",
  extra: {
    "Product Mode": "CI-MCP",
    "Product Family": "e-NAND",
    "Storage Density": "4GB",
    "Storage Interface": "eMMC 4.41",
    "Cell Level": "MLC",
    "Product Generation": "3rd generation eMCP",
    "Die Count": 1,
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDDR2",
    "DRAM Width": "x32",
    "DRAM Die Stack": 1,
    "DRAM Voltage": "1.8V/1.2V/1.2V/1.2V",
    "DRAM Speed": "LPDDR2-1066",
    "Speed Grade": "eMMC 52MHz",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["CE Count", "Density Code", "Config Code"]
});

assertSkhynixEmcpRuleMatches("H9HP52ACPMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP52ACPMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "FBGA-254, 11.5x13",
  extra: {
    "Storage Density": "64GB",
    "Storage Interface": "eMMC 5.1",
    "Cell Level": "MLC",
    "Die Count": 4,
    "DRAM Density": "32Gb",
    "DRAM Die Stack": 4,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Type": "LPDDR4X",
    "DRAM Voltage": "1.8V/1.1V/0.6V",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version", "CE Count"]
});

assertSkhynixEmcpRuleMatches("H9HP27ADAMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP27ADAMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 262144,
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "FBGA-254, 11.5x13",
  extra: {
    "Storage Density": "32GB",
    "Storage Interface": "eMMC 5.1",
    "Cell Level": "MLC",
    "Die Count": 2,
    "DRAM Density": "24Gb",
    "DRAM Die Stack": 4,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Type": "LPDDR4X",
    "DRAM Voltage": "1.8V/1.1V/0.6V",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version", "CE Count"]
});

assertSkhynixEmcpRuleMatches("H9HP99ADAMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP99ADAMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "FBGA-254, 11.5x13",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version", "Density Code", "Config Code"]
});

assertSkhynixEmcpRuleMatches("H9AG9G5ANBX100", ["vendor.skhynix.emcp.h9a.v1"]);
assertPart("H9AG9G5ANBX100", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-254",
  extra: {
    "Storage Density": "64GB",
    "Storage Interface": "eMMC 5.0",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25°C ~ 85°C",
    "Speed Grade": "LPDDR4X-4266 CL32 / eMMC 52MHz",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version"]
});

assertPart("H9QT0GECN6X145", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  voltage: "UFS: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "FBGA-254",
  extra: {
    "Storage Density": "128GB",
    "Storage Interface": "UFS 2.2",
    "Product Generation": "4th generation uMCP",
    "DRAM Density": "48Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x8",
    "DRAM Voltage": "VDD1: 1.8V, VDD2: 1.1V, VDDQ: 0.6V",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25°C ~ 85°C",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version", "Config Code", "Reserved Code", "Serial Code"]
});

assertPart("H9QXXXXCN6X145", {
  vendor: "skhynix",
  type: "uMCP",
  voltage: "UFS: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "FBGA-254",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Product Generation": "4th generation uMCP",
    "DRAM Speed": "LPDDR4X-4266",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System", "Product Mode", "Product Family", "Product Version", "Storage Density", "DRAM Width", "Config Code", "Reserved Code", "Serial Code"]
});

assertPart("H9HQ15ACPMADAR-KEM", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  package: "FBGA-254",
  extra: {
    "Storage Density": "128GB",
    "Storage Interface": "UFS",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["System", "Product Family", "Product Version"]
});

for (const partNumber of [
  "H9TQ17ABJTMCUR-KUM",
  "H9HP52ACPMADAR-KMM",
  "H9AG9G5ANBX100",
  "H9QT0GECN6X145",
  "H9HQ15ACPMADAR-KEM"
]) {
  assertNoAdditionalFields(partNumber);
}
