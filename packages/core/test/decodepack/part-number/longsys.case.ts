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

assertRuleDecode("FEMDME016G-A8A58", {
  vendor: "longsys",
  type: "eMMC",
  densityMbit: 131072,
  package: "FBGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "Automotive eMMC Grade2",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Storage Interface": "eMMC 5.1"
  },
  absentExtra: ["Series Code", "Config Code", "source", "status"]
});

assertRuleDecode("FEMDRW128G-88A19", {
  vendor: "longsys",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA-153, 11.5x13x1.0",
  extra: {
    "Product Family": "Industrial Wide-temperature eMMC",
    "Operation Temperature": "-40°C ~ +85°C"
  }
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

assertRuleDecode("F35SQA512M-VWT", {
  vendor: "longsys",
  type: "NAND",
  densityMbit: 512,
  cellField: "SLC",
  voltage: "Vcc: 2.7V-3.6V",
  package: "WSON-8, 6x5",
  extra: {
    "Interface Type": "SPI NAND x1/x2/x4",
    "Operation Temperature": "-40°C ~ +85°C",
    "Packing Type": "Tray"
  },
  absentExtra: ["Voltage Code", "Interface Code", "Version Code", "Density Code", "Package Code", "Temperature Code", "Packing Type Code", "source", "status"]
});

assertRuleDecode("F35UQA001G-WWR", {
  vendor: "longsys",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  voltage: "Vcc: 1.7V-1.95V",
  package: "WSON-8, 8x6",
  extra: {
    "Interface Type": "SPI NAND x1/x2/x4",
    "Operation Temperature": "-40°C ~ +85°C",
    "Packing Type": "Tape and Reel"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("F35UQB004G-W2R", {
  vendor: "longsys",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  voltage: "Vcc: 1.7V-1.95V",
  package: "WSON-8, 8x6",
  extra: {
    "Interface Type": "SPI NAND x1/x2/x4",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Operation Temperature": "-40°C ~ +105°C",
    "Packing Type": "Tape and Reel"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("FS35ND01G-S1Y2QWFI000", {
  vendor: "longsys",
  type: "NAND",
  densityMbit: 1024,
  cellField: "SLC",
  voltage: "Vcc: 2.7V-3.6V",
  package: "WSON-8, 8x6",
  extra: {
    "Interface Type": "SPI NAND x1/x2/x4",
    "Operation Temperature": "-40°C ~ +85°C",
    "Lead free": "Yes"
  },
  absentExtra: ["Version Code", "Flash Type Code", "Tracking Code", "Reserved Code", "Reference Status", "source", "status"]
});

assertRuleDecode("FS35ND04G-S2Y2QLFC000", {
  vendor: "longsys",
  type: "NAND",
  densityMbit: 4096,
  cellField: "SLC",
  voltage: "Vcc: 2.7V-3.6V",
  package: "LGA-8",
  extra: {
    "Interface Type": "SPI NAND x1/x2/x4",
    "Operation Temperature": "0°C ~ +70°C",
    "Lead free": "Yes"
  },
  absentExtra: ["Version Code", "Flash Type Code", "Package Code", "Temperature Code", "source", "status"]
});

assertNotFound("F35SQA001G");
