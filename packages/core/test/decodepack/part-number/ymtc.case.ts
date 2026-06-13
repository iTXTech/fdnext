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

assertPart("YMEC6A1TC1A2C1", {
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 262144,
  dieProfileField: "TAS",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC000",
    "Product Family": "YMTC EC000 eMMC",
    "Storage Interface": "eMMC 5.1",
    "Process Alias": "X2-9060",
    "Layer Count": 128,
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMEC8A2TB3A2C3", {
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "JGS",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC110",
    "Product Family": "YMTC EC110 eMMC",
    "Storage Interface": "eMMC 5.1",
    "Process Alias": "X1-9050",
    "Layer Count": 64,
    "Die Stack": "QDP (4-die)",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ 85°C"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMUS8A1TC1A2C1", {
  vendor: "ymtc",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "TAS",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0/1.2",
  extra: {
    Controller: "UFS 3.1 Controller",
    "Storage Interface": "UFS 3.1",
    "Process Alias": "X2-9060",
    "Layer Count": 128,
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMC6G001TB51AA1C0", {
  vendor: "ymtc",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "WDS",
  cellField: "TLC",
  package: "BGA-132, 12x18",
  extra: {
    "Process Alias": "X3-9070",
    "Layer Count": 232,
    "Die Density": "256Gb",
    "Die Count": 1,
    "Plane Count": 6,
    "Product Class": "Commercial"
  },
  absentExtra: ["Product Generation"]
});

assertPart("YMN0WQA2B1CC4C", {
  vendor: "ymtc",
  type: "NAND",
  densityMbit: 2789212.16,
  dieProfileField: "HUS",
  cellField: "QLC",
  package: "BGA-132, 12x18",
  extra: {
    "Process Alias": "X2-6070",
    "Layer Count": 128,
    "Die Density": "1.33Tb",
    "Die Count": 2,
    "Plane Count": 6,
    "Product Class": "Client"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X3-9060", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WYS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X3-9060",
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Plane Count": 4,
    "Speed Grade": "ONFI 5.0; Max Speed=2400MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X39060", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WYS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X3-9060",
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Plane Count": 4,
    "Speed Grade": "ONFI 5.0; Max Speed=2400MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X3-9070", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WDS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X3-9070",
    "Layer Count": 232,
    "Die Density": "1Tb",
    "Plane Count": 6,
    "Speed Grade": "ONFI 5.0; Max Speed=2400MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-9060", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WTS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X4-9060",
    "Layer Count": 160,
    "Die Density": "512Gb",
    "Plane Count": 4,
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-9070", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "SQS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X4-9070",
    "Layer Count": 267,
    "Die Density": "1Tb",
    "Plane Count": 6,
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-6080", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "PTS",
  cellField: "QLC",
  extra: {
    "Process Alias": "X4-6080",
    "Layer Count": 267,
    "Die Density": "2Tb",
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});
