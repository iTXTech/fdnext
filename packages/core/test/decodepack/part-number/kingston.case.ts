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

assertRuleDecode("EMMC64G-TY29", {
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 524288,
  package: "11.5x13.0x0.8",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Config Code": "TY29",
    "Product Class": "Commercial"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("EMMC128-IY29", {
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 1048576,
  package: "11.5x13.0x0.8",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Temperature"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("E04GS14DXI", {
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 32768,
  package: "FBGA-153, 9.0x7.5x0.8",
  cellField: "MLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "Product Class": "Industrial Temperature",
    "Operation Temperature": "-40°C ~ +85°C"
  },
  absentExtra: ["Config Code", "Package Code"]
});

assertRuleDecode("UFS128-CY14", {
  vendor: "kingston",
  type: "UFS",
  densityMbit: 1048576,
  package: "BGA-153, 11x13x0.85",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "G4 4P"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("UFS32G-TXA7", {
  vendor: "kingston",
  type: "UFS",
  densityMbit: 262144,
  package: "BGA-153, 11.5x13x0.85",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Speed Grade": "G4 2L"
  },
  absentExtra: ["NAND Technology", "Config Code", "Package Code", "source", "status"]
});

assertRuleDecode("64EM32-M4GTY9B", {
  vendor: "kingston",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-254, 11.5x13.0x1.0",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("64EM32-N3HTX29", {
  vendor: "kingston",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-221, 11.5x13.0x1.1",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR3"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("64EM32-M4GTY9B");

assertRuleDecode("64EP32-M5BTB9M", {
  vendor: "kingston",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-201, 8x9.5x0.7",
  extra: {
    "Product Family": "ePoP",
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR5X"
  },
  absentExtra: ["Config Code", "Package Code", "source", "status"]
});
