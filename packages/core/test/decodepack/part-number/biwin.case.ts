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

assertPart("BWCTAKL11X128G", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA153 11.50x13.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC"
  },
  absentExtra: ["System", "Product Family", "Product Version", "Managed Family", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCMMQ511G08G", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 65536,
  package: "FBGA153 9.00x11.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Interface info", "Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWU2A0526B128G", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA153 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});
assertPart("BWCA2KZC-64G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA254 11.50x13.00",
  extra: {
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("BWCA2KZC-64G");

assertPart("BW2A2MZC02-256G", {
  vendor: "biwin",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA254 11.50x13.00",
  extra: {
    "Storage Density": "256GB UFS",
    "DRAM Density": "64Gb",
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("BW2A2MZC02-256G");
