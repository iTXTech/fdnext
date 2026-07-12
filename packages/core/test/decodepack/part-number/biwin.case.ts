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

assertRuleDecode("BWEFMA016GN9RE", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 131072,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "MLC",
  extra: {
    "Product Class": "Automotive, AEC-Q100 Grade 2",
    "NAND Technology": "MLC"
  },
  absentExtra: ["Config Code", "Package Code", "source", "status"]
});

assertRuleDecode("BWEFMI128GN223", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "TLC",
  extra: {
    "Product Class": "Industrial Wide Temperature",
    "Operation Temperature": "-40°C ~ +85°C"
  }
});

assertRuleDecode("BWCMAQB11T16GI", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 131072,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "MLC"
});

assertRuleDecode("BWCZZZZZZZ16GI", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 131072,
  absentExtra: ["Package", "NAND Technology", "Cell Level"]
});

assertRuleDecode("BWCE2ENH-16G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 131072,
  package: "FBGA-221, 11.50x13.00",
  extra: {
    "Storage Density": "16GB eMMC",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR3"
  }
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

assertRuleDecode("BWCK1KZC02-64G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-144, 8.00x9.50",
  extra: {
    "Product Family": "ePoP4X",
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Package Code", "Config Code", "Controller Code", "Reference Status", "source", "status"]
});

assertRuleDecode("BWCL1EZC-32G-X", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 262144,
  package: "FBGA-144, 8.60x10.40",
  extra: {
    "Product Family": "ePoP4X",
    "Storage Density": "32GB eMMC",
    "DRAM Density": "16Gb"
  }
});

assertRuleDoesNotMatch("BWCK1KZC02");

assertRuleDecode("BWCD28NP-32G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 262144,
  package: "FBGA-136, 10.00x10.00",
  extra: {
    "Product Family": "ePoP3",
    "Storage Density": "32GB eMMC",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR3"
  }
});

assertRuleDecode("BWCSAFEJ02-64G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-201, 8.00x9.50",
  extra: {
    "Product Family": "ePoP5X",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR5X"
  }
});

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

assertRuleDecode("BW3Z9ZZZKG256G", {
  vendor: "biwin",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA-297, 11.50x13.00",
  extra: {
    "Storage Density": "256GB UFS",
    "DRAM Density": "64Gb",
    "DRAM Type": "LPDDR5X",
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Config Code", "Package Code"]
});

assertRuleDecode("BWEFMI008GN929", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 65536,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "SLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "Win-pSLC (TLC NAND)",
    "Special Option": "pSLC Mode",
    "Product Class": "Industrial Wide Temperature"
  }
});

assertRuleDecode("BWEFMI128GN929", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA-153, 11.50x13.00x1.10",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC",
    "Product Class": "Industrial Wide Temperature"
  }
});
