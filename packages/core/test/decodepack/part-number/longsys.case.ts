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

assertRuleDecode("FEMDNN256G-A3A5607-08", {
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

assertRuleDecode("FEUDNN128G-C2H14", {
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

assertRuleDecode("FEPRF6432-58A1930", {
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

assertRuleDecode("FUPRFA832-C2A56N1", {
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
assertRuleDecode("FEUDME128G-C8H09", {
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

assertRuleDecode("FEUDNN512G-C2G07", {
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

for (const [partNumber, densityMbit, packageName] of [
  ["FEUDNN064G-C2A46", 524288, "FBGA-153, 11.5x13x0.8"],
  ["FEUDNN128G-C2A44", 1048576, "FBGA-153, 11.5x13x0.8"],
  ["FEUDNN256G-C2A44", 2097152, "FBGA-153, 11.5x13x1.0"]
] as const) {
  assertRuleDecode(partNumber, {
    vendor: "longsys",
    type: "UFS",
    densityMbit,
    package: packageName,
    cellField: "TLC",
    extra: {
      "Storage Interface": "UFS 2.2",
      "Speed Grade": "HS-Gear3 2L",
      "NAND Technology": "3D TLC"
    },
    absentExtra: ["Config Code", "Package Code", "Reference Status", "source", "status"]
  });
}
