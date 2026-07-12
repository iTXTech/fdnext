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
  package: "BGA-153, 11.5x13x1.2",
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
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND 7250 / EM122-class",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDINBDG4-8G-Q", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 65536,
  dieProfileField: "15nm",
  cellField: "MLC",
  package: "BGA-153, 11.5x13x0.8",
  extra: {
    "Product Family": "iNAND 7250 / EM122-class",
    "Storage Interface": "eMMC 5.1",
    "Operation Temperature": "-25°C ~ 85°C",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Technology", "Product Generation"]
});

assertRuleDecode("SDINBDG4-64G-XI", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "15nm",
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Product Class": "Industrial Extended Temperature",
    "Operation Temperature": "-40°C ~ 85°C"
  },
  absentExtra: ["NAND Technology", "Product Generation"]
});

assertRuleDecode("SDINADF4-16G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "15nm",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x0.9",
  extra: {
    "Product Family": "iNAND 7232",
    "Storage Interface": "eMMC 5.0",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertRuleDecode("SDINADF4-128G-HQ", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Product Family": "iNAND 7232",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Commercial",
    "Production Status": "Engineering Sample"
  }
});

assertRuleDecode("SDIN9DW4-32G-Q", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 262144,
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND Extreme",
    "Storage Interface": "eMMC 5.0",
    "Production Status": "Engineering Sample"
  }
});

assertRuleDecode("SDINFDK4-128G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND MC EU521",
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDINFEO2-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS4",
  cellField: "TLC",
  extra: {
    "Product Family": "iNAND MC EU551",
    "Storage Interface": "UFS 3.1",
    "Layer Count": 96,
    "Die Count": 4
  },
  absentExtra: ["NAND Technology", "Product Generation", "Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("SDINFDO4-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS4",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND MC EU551",
    "Storage Interface": "UFS 3.1",
    "Layer Count": 96
  },
  absentExtra: ["NAND Technology", "Product Generation"]
});

assertRuleDecode("SDINBDI4-64G-H", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND CL EM151",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertRuleDecode("SDINHFT4-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  cellField: "TLC",
  package: "BGA-153, 9x13",
  extra: {
    "Product Family": "iNAND MC EU711",
    "Storage Interface": "UFS 4.1",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertRuleDecode("SDINHFT4-1T00", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 8388608,
  cellField: "TLC",
  extra: {
    "Product Family": "iNAND MC EU711",
    "Storage Interface": "UFS 4.1"
  }
});

assertRuleDecode("SDINDDH6-128G-ZA2", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  package: "BGA-153, 11.5x13x1.2",
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
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND Ultra",
    "Storage Interface": "eMMC 4.41"
  },
  absentExtra: ["NAND Technology"]
});

assertRuleDecode("SDINBDA4-128G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND MC EM131",
    "Storage Interface": "eMMC 5.1"
  }
});

assertRuleDecode("SDINFDQ6-512G-ZA1", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "BiCS5",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Product Family": "iNAND AT EU552",
    "Storage Interface": "UFS 3.1"
  }
});

assertRuleDecode("SDINHDL6-1T00-ZA", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "BiCS8",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Product Family": "iNAND AT EU752",
    "Storage Interface": "UFS 4.1"
  }
});

assertRuleDecode("SDIN7DP4-16G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND Extreme",
    "Storage Interface": "eMMC 4.5"
  },
  absentExtra: ["NAND Technology"]
});

assertRuleDecode("SDIN7DP4-64G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.4"
});

assertRuleDecode("SDIN7CP4-128G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  cellField: "MLC",
  package: "BGA-169, 12x16x1.6",
  extra: {
    "Product Family": "iNAND Extreme",
    "Storage Interface": "eMMC 4.5"
  }
});

assertRuleDecode("SDIN5C4-64G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "24nm",
  package: "BGA-169, 12x16",
  extra: {
    "Product Family": "iNAND legacy eMMC",
    "Storage Interface": "eMMC 4.41"
  }
});

assertRuleDecode("SDIN5C2-32G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 262144,
  dieProfileField: "24nm",
  package: "BGA-169, 12x16"
});

assertRuleDecode("SDIN7DP2-4G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 32768,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND OEM",
    "Storage Interface": "eMMC 4.51"
  }
});

assertRuleDecode("SDIN9DS2-64G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "iNAND 5130",
    "Storage Interface": "eMMC 5.0"
  }
});

assertRuleDecode("SDINADB4-16G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "A19nm",
  cellField: "TLC",
  package: "BGA-153, 11.5x13x0.8",
  extra: {
    "Product Family": "iNAND 7132",
    "Storage Interface": "eMMC 5.0+"
  }
});

assertRuleDecode("SDIN8CE4-128G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  package: "BGA-169, 12x16x1.4",
  extra: {
    "Product Family": "Industrial iNAND",
    "Storage Interface": "eMMC 4.51"
  }
});

assertRuleDecode("SDINBDD4-128G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "BiCS2",
  cellField: "TLC",
  package: "BGA-153",
  extra: {
    "Product Family": "iNAND 7350"
  }
});

assertRuleDecode("SDINBDJ4-16G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "15nm",
  cellField: "MLC",
  package: "BGA-153",
  extra: {
    "Product Family": "iNAND CL EM102"
  }
});

assertRuleDecode("SDIN8DR1-16G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "A19nm",
  cellField: "TLC",
  package: "BGA-153",
  extra: {
    "Storage Interface": "eMMC 4.51"
  },
  absentExtra: ["Product Family"]
});

assertRuleDecode("SDINHFR4-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS8",
  cellField: "QLC",
  package: "BGA-153",
  extra: {
    "Product Family": "iNAND MC EU721",
    "Storage Interface": "UFS 4.1"
  }
});

assertRuleDecode("SDINHFT4-128G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "BiCS6",
  cellField: "TLC",
  package: "BGA-153, 9x13",
  extra: {
    "Layer Count": 162,
    "Storage Interface": "UFS 4.1"
  }
});

assertRuleDecode("SDINHFT2-512G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "BiCS6",
  cellField: "TLC",
  package: "BGA-153, 9x13",
  extra: {
    "Product Family": "iNAND MC EU711",
    "Storage Interface": "UFS 4.0"
  }
});

assertRuleDecode("SDINFEO4-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS4",
  cellField: "TLC",
  package: "11.5x13x1.0",
  extra: {
    "Product Family": "iNAND MC EU561",
    "Storage Interface": "UFS 3.1"
  }
});

assertRuleDecode("SDINFD04-256G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 2097152,
  package: "BGA-153",
  extra: {
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Product Family", "Process", "Cell Level"]
});

const sandiskManagedDecoder = compiledPack.partDecoders.find((decoder) => decoder.id === "vendor.sndk.inand.managed.v1");
assert.ok(sandiskManagedDecoder?.match("SDINBDG4-32G"));
assert.ok(sandiskManagedDecoder?.match("SDINFDO4-256G"));
assert.ok(sandiskManagedDecoder?.match("SDINHFT4-256G"));
assert.ok(sandiskManagedDecoder?.match("SDINLDZ4-128G"));
assertRuleDoesNotMatch("vendor.sndk.inand.managed.v1", "SDIN5C4-64G");
assertRuleDoesNotMatch("vendor.sndk.inand.legacy-emmc.v1", "SDINBDG4-32G");

assertRuleDecode("SDIN7DP4-16G-Q", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 131072,
  cellField: "MLC",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Technology"]
});

assertRuleDecode("SDINBDZ4-128G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 1048576,
  package: "BGA-153",
  extra: {
    "Storage Interface": "eMMC 5.1"
  },
  absentExtra: ["Product Family", "NAND Technology", "Process", "Cell Level"]
});

assertRuleDecode("SDINLDZ4-128G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  package: "BGA-153",
  absentExtra: ["Product Family", "Storage Interface", "NAND Technology", "Process", "Cell Level"]
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
