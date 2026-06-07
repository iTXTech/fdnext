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

assertPart("SM662GXC-BFS", {
  vendor: "siliconmotion",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "100-ball BGA",
  extra: {
    "Product Family": "Ferri-eMMC",
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ +85°C",
    "Package Code": "100-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM662PBC-BFS", {
  vendor: "siliconmotion",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-eMMC",
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Operation Temperature": "-40°C ~ +105°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM671PEF-BFS", {
  vendor: "siliconmotion",
  type: "UFS",
  densityMbit: 4194304,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-UFS",
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "HS-Gear4 x2",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Industrial",
    "Operation Temperature": "-40°C ~ +85°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});
