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
  assertRuleDecode,
  assertRuleDoesNotMatch,
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertRuleDecode("SDINBDA6-256G-XI1", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 2097152,
  dieProfileField: "BiCS3",
  extra: {
    "Product Family": "iNAND IX EM132",
    "Storage Interface": "eMMC 5.1",
    "Layer Count": 64,
    "Product Class": "Industrial Extended Temperature"
  },
  absentExtra: ["Product Version", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});


assertRuleDecode("SDZFLDMA-2T00-E503", {
  vendor: "sndk",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "BiCS8",
  cellField: "QLC",
  package: "BGA-154, MUX",
  extra: {
    "Die Count": 8,
    "Channel Count": 1,
    "Plane Count": 4,
    "Package Configuration": "ODP (8-die)",
    "Product Class": "Enterprise",
    "Assembly": "Pb-free (others)"
  }
});

assertRuleDecode("SDUNEI3MM-1T00CE", {
  vendor: "sndk",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "BiCS5",
  cellField: "TLC",
  package: "BGA-132/304",
  extra: {
    "Layer Count": 112,
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Plane Count": 2,
    "Package Configuration": "ODP (8-die), 3 ODT",
    "Product Class": "Consumer",
    "Assembly": "Pb-free (100% tin)",
    "Special Option": "Standard Commercial",
    "Production Status": "2nd Gen"
  },
  absentExtra: ["Channel Count"]
});

assertRuleDecode("SDUNCIAMA-032G", {
  vendor: "sndk",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "BiCS4",
  cellField: "TLC",
  package: "BGA-132/304",
  extra: {
    "Layer Count": 96,
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Plane Count": 2,
    "Package Configuration": "SDP (1-die), 0 ODT",
    "Product Class": "Consumer",
    "Assembly": "Pb-free (100% tin)"
  },
  absentExtra: ["Channel Count"]
});

assertRuleDecode("SDUNCIAMA-032GB-DDR300", {
  vendor: "sndk",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "BiCS4",
  cellField: "TLC",
  package: "BGA-132/304",
  extra: {
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Product Class": "Consumer"
  },
  absentExtra: ["Channel Count", "Special Option", "Production Status"]
});

assertRuleDecode("SDZNNMDHER-032G", {
  vendor: "sndk",
  type: "NAND",
  cellField: "MLC",
  package: "LGA",
  extra: {
    "Die Count": 8,
    "Segment": "Enterprise Component"
  }
});

assertRuleDecode("SDINBDG4-32G-ZA3", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 262144,
  extra: {
    "Product Family": "iNAND 7250 / EM122-class",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDINFDK4-128G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  extra: {
    "Product Family": "iNAND MC EU521",
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDINDDH6-128G-ZA2", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  extra: {
    "Product Family": "iNAND AT EU312",
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDIN7DU2-8G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 65536,
  dieProfileField: "19nm",
  extra: {
    "Product Family": "iNAND Ultra",
    "Storage Interface": "eMMC 4.41",
    "NAND Technology": "X2 MLC NAND"
  }
});

assertRuleDecode("SDIN5C4-64G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "24nm",
  extra: {
    "Product Family": "iNAND legacy eMMC",
    "Storage Interface": "eMMC 4.41"
  }
});

assertRuleDecode("SDIS4BH-008G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 65536,
  extra: {
    "Product Family": "iSSD SATA / MTR-5"
  }
});

assertRuleDecode("SDIS5BK-032G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 262144,
  extra: {
    "Product Family": "iSSD i100",
    "Storage Interface": "SATA 6Gb/s"
  }
});

assertRuleDecode("SDIS6BM-016G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 131072,
  extra: {
    "Product Family": "iSSD i110"
  }
});


assertNotFound("SDINZZZ9-128G-ABC");
assertNotFound("SDISZZZ-016G");
