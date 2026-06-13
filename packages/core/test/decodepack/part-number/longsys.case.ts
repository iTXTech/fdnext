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

assertPart("FEMDNN256G-A3A5607-08", {
  vendor: "longsys",
  type: "eMMC",
  densityMbit: 2097152,
  package: "FBGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "Commercial eMMC",
    "Storage Interface": "eMMC 5.1"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN128G-C2H14", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA-153, 11.5x13x1.0",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Product Class": "Commercial"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEPRF6432-58A1930", {
  vendor: "longsys",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-254, 11.5x13x1.0",
  extra: {
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("FEPRF6432-58A1930");

assertPart("FUPRFA832-C2A56N1", {
  vendor: "longsys",
  type: "uMCP",
  densityMbit: 1048576,
  package: "FBGA-254, 11.5x13x1.0",
  extra: {
    "Storage Density": "128GB UFS",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Product Family", "Reference Status", "Inference Source", "source", "status"]
});

assertNoAdditionalFields("FUPRFA832-C2A56N1");
assertPart("FEUDME128G-C8H09", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA-153, 11.5x13x1.2",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "Gear4 2L",
    "Product Class": "Automotive"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN512G-C2G07", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 4194304,
  package: "FBGA-153, 11.5x13x1.0",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});
