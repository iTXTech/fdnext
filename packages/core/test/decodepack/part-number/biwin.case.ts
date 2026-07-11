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

assertRuleDecode("BWCTAKL11X128G", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA-153, 11.50x13.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC"
  },
  absentExtra: ["System", "Product Family", "Product Version", "Managed Family", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("BWCMMQ511G08G", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 65536,
  package: "FBGA-153, 9.00x11.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Interface info", "Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("BWU2A0526B128G", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA-153, 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("BWU3AKG26D256G", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 2097152,
  package: "FBGA-153, 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Product Class": "Consumer"
  },
  absentExtra: ["Config Code", "Reference Status", "source", "status"]
});

assertRuleDecode("TCUFMA512GNAC8", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 4194304,
  package: "FBGA-153, 11.50x13.00x1.20",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "NAND Technology": "3D TLC",
    "Interface Type": "HS-Gear4 2L"
  },
  absentExtra: ["Config Code", "Reference Status", "source", "status"]
});

assertRuleDecode("BWEFMA128GN923", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Controller": "SP1800",
    "Interface Type": "HS400"
  },
  absentExtra: ["Grade Code", "Config Code", "Reference Status", "source", "status"]
});

assertRuleDecode("BWEFMD064GN729", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 524288,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Standard"
  },
  absentExtra: ["Controller", "Interface Type", "Grade Code", "Config Code", "source", "status"]
});
assertRuleDecode("BWCA2KZC-64G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-254, 11.50x13.00",
  extra: {
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("BWCA2KZC-64G");

assertRuleDecode("BW2A2MZC02-256G", {
  vendor: "biwin",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA-254, 11.50x13.00",
  extra: {
    "Storage Density": "256GB UFS",
    "DRAM Density": "64Gb",
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("BW2A2MZC02-256G");

assertRuleDecode("BW3A2EYAKG256G", {
  vendor: "biwin",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA-297, 11.50x13.00",
  extra: {
    "Storage Density": "256GB UFS",
    "DRAM Density": "64Gb",
    "DRAM Type": "LPDDR5X",
    "Storage Interface": "UFS 3.1",
    "Controller": "SM2753"
  },
  absentExtra: ["Config Code", "Reference Status", "source", "status"]
});

assertNoAdditionalFields("BW3A2EYAKG256G");
