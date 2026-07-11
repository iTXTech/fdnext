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

assertRuleDecode("MTFC4GACAJCN-1M WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 32768,
  package: "VFBGA-153, 11.5x13x1.0, SAC 302",
  extra: {
    "Product Generation": "Fourth",
    "Product Version": "eMMC 5.0",
    "Special Option": "2MB MAX boot area / 100% MAX enhanced"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Component Generation", "Product Family", "Group"]
});

assertRuleDecode("MTFC8GLTEA-WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 65536,
  package: "WFBGA-153, 11.5x13x0.8",
  extra: {
    "NAND Component": "L",
    "Controller Code": "T",
    "Package Code": "EA",
    "Controller Revision": "Rev 19"
  }
});

assertRuleDecode("MTFC256GASAONS-IT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 2097152,
  package: "TFBGA-153, 11.5x13x1.2",
  extra: {
    "Product Version": "UFS 2.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertRuleDecode("MTFC64GASAOEA-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "B16C",
  package: "WFBGA-153, 11.5x13x0.8, LF35",
  extra: {
    "Component Density": "256Gb",
    "Component Width": "x8",
    "Product Version": "UFS 2.1",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertRuleDecode("MTFC128GARATEK-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "B27B",
  package: "VFBGA-153, 11.5x13x0.9",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertRuleDecode("MTFC512GAXATHJ-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "B47R",
  package: "VFBGA-153, 11.0x13x1.0",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertRuleDecode("MTFC64GBCAVAL-AIT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  extra: {
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertRuleDecode("MTFC128GBCAQTC-AIT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 1048576,
  package: "LFBGA-153, 11.5x13x1.3",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Product Family": "Micron e.MMC 5.1 TLC Pearl",
    "Product Version": "eMMC 5.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group", "Reference Status", "Inference Source", "source", "status"]
});

assertRuleDecode("MTFC1TAYAXHR-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 8388608,
  extra: {
    "Product Version": "UFS 4.0"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertRuleDecode("MTFC256GZZZZZZ-WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  absentExtra: ["NAND Component", "Controller Code", "Package Code"]
});

assertRuleDecode("MTFC256GZZZZZZWT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  absentExtra: ["NAND Component", "Controller Code", "Package Code"]
});


assertRuleDecode("MTFDDAC128MAG-1G12AA", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 1048576,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 9.5mm",
    "Product Family": "Micron C300 SSD",
    "Sector Size": "512B",
    "Product Generation": "1st Gen",
    "NAND Component": "32Gb MLC x8 3.3V (34nm)",
    "Component Density": "32Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Hardware Feature Code"]
});

assertRuleDecode("MTFDDAK120MAV-1AE12ABYYES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500 SSD",
    "Sector Size": "512B",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Component Density": "128Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Special Option": "Self-encrypting drive (SED)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDEAC200MBB-1AE12ABYY", {
  vendor: "micron",
  type: "SAS",
  densityMbit: 1638400,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SAS 6.0 Gb/s",
    "Form Factor": "2.5-inch, 9.5mm",
    "Product Family": "Micron M500DC SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAV120MAZ-1AE12ABHAES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "M.2, 80mm x 22mm x 3.50mm",
    "Product Family": "Micron M510 SSD",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Special Option": "Self-encrypting drive (SED)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Customer Designator", "Product Family Code", "NAND Component Code", "Hardware Feature Code"]
});

assertRuleDecode("MTFDDAT120MAZ-1AE12ABHAES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "mSATA",
    "Product Family": "Micron M510 SSD",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Special Option": "Self-encrypting drive (SED)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Customer Designator", "Product Family Code", "NAND Component Code", "Hardware Feature Code"]
});

assertRuleDecode("MTFDDAK032SBD-1AH12ITYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 262144,
  cellField: "SLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "NAND Component": "64Gb x8 3.3V (20nm)",
    "Operation Temperature": "Industrial temperature and grade",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK064SBD-1AK12ITYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 524288,
  cellField: "SLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Product Family": "Micron M500IT SSD",
    "NAND Component": "128Gb x8 3.3V (20nm)",
    "Operation Temperature": "Industrial temperature and grade"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAY120MBD-AAK12AIYYES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "M.2, 60mm x 22mm x 3.50mm",
    "Product Family": "Micron M500IT SSD",
    "NAND Component": "128Gb x8 3.3V (20nm)",
    "Product Generation": "1st Gen",
    "Operation Temperature": "Auto industrial temperature",
    "Production Status": "Engineering Sample",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAY240MBD-1AK12AIYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 1966080,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "M.2, 60mm x 22mm x 3.50mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "Operation Temperature": "Auto industrial temperature"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK060MBD-2AH12ITYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 491520,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "2nd Gen",
    "NAND Component": "64Gb x8 3.3V (20nm)",
    "Operation Temperature": "Industrial temperature and grade"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK120MBD-1AE12ITYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Operation Temperature": "Industrial temperature and grade",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAT060MBD-1AH12AIYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 491520,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "mSATA",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "64Gb x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAT120MBD-AAK12AIYYES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 983040,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "mSATA",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Production Status": "Engineering Sample",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK060MBD-1AH12AIRA", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 491520,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "64Gb x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK240MBD-AAK12AIRAES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 1966080,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Production Status": "Engineering Sample",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK160MBD-1AE12AIYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 1310720,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "1st Gen",
    "NAND Component": "128Gb MLC x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAK060MBD-2AH12AIYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 491520,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron M500IT SSD",
    "Product Generation": "2nd Gen",
    "NAND Component": "64Gb x8 3.3V (20nm)",
    "Operation Temperature": "Auto industrial temperature",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Product Family Code", "NAND Component Code", "Additional Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDGAL175SAH-1NA4ABES", {
  vendor: "micron",
  type: "managed_nand",
  densityMbit: 1433600,
  cellField: "SLC",
  extra: {
    "Storage Interface": "PCIe Gen2",
    "Form Factor": "2.5-inch, 15mm",
    "Product Family": "Micron P320 SSD",
    "NAND Component": "16Gb SLC x8 3.3V (34nm)",
    "Special Option": "Bootable",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Hardware Feature Code"]
});

assertRuleDecode("MTFDGAR1400MAX-1JAABES", {
  vendor: "micron",
  type: "managed_nand",
  densityMbit: 11468800,
  cellField: "MLC",
  extra: {
    "Storage Interface": "PCIe Gen2",
    "Form Factor": "Half height, half length x8",
    "Product Family": "Micron P420m SSD",
    "NAND Component": "32Gb MLC x8 3.3V (25nm)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Hardware Feature Code"]
});

assertRuleDecode("MTFDDAK480TGA-1BC16ABYYES", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 3932160,
  cellField: "TLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 7mm",
    "Product Family": "Micron 5400 PRO SSD",
    "NAND Component": "512Gb TLC x8 2.5V (3D)",
    "Special Option": "Self-encrypting drive (TCG eSSC)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAV1T9TGB-1BC15TAYY", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 15728640,
  cellField: "TLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "M.2, 80mm x 22mm",
    "Product Family": "Micron 5400 MAX SSD",
    "Product Class": "TAA Compliant",
    "Special Option": "Self-encrypting drive (TCG OPAL)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKCC30T7TGR-1BK1JABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 251658240,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "U.3, 2.5-inch, 15mm, SFF-8639",
    "Product Family": "Micron 6500 ION SSD",
    "Sector Size": "512B",
    "Special Option": "OCP 2.0 + Non-SED"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKBN30T7TGR-1BK4DABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 251658240,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "E1.L, 9.5mm including enclosure",
    "Product Family": "Micron 6500 ION SSD",
    "Sector Size": "4KiB",
    "Special Option": "OCP 2.0 + TCG Opal"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTEDBTH008MBA-1K1", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 65536,
  extra: {
    "Storage Interface": "SATA 3.0 Gb/s",
    "Form Factor": "SSD, 40mm x 50mm",
    "Product Family": "Micron EK470 SSD",
    "Sector Size": "512B",
    "Product Generation": "1st Gen",
    "NAND Component": "32Gb NAND x8 3.3V (25nm)",
    "Component Density": "32Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V"
  },
  absentExtra: ["NAND Component Code", "Hardware Feature Code", "Security Feature Set"]
});

assertRuleDecode("MTFDLAL61T4THL-1BK4DABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 503316480,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen5",
    "Form Factor": "U.2, 2.5-inch, 15mm, SFF-8639",
    "Product Family": "Micron 6550 ION SSD",
    "Product Generation": "1st Gen",
    "Sector Size": "4KiB",
    "Special Option": "OCP 2.5 + SED (TCG Opal)"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Customer Designator"]
});

assertRuleDecode("MTFDKBZ480TFR-1BC4ZABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 3932160,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "E1.S bare board, 5.9mm",
    "Product Family": "Micron 7450 PRO SSD",
    "Product Generation": "1st Gen",
    "Sector Size": "4KiB",
    "Special Option": "Non-SED"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Customer Designator"]
});

assertRuleDecode("MTFDKCC15T3TGQ-1BK1DABYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 125829120,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "U.3, 2.5-inch, 15mm, SFF-8639",
    "Product Family": "Micron 7500 MAX SSD",
    "Product Generation": "1st Gen",
    "Sector Size": "512B",
    "Special Option": "OCP 2.0 + TCG Opal 2.01",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Customer Designator"]
});

assertRuleDecode("MTFDLBQ3T8THG-2BP1JFCYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 31457280,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen5",
    "Form Factor": "E3.S 1T, 7.5mm",
    "Product Family": "Micron 7600 PRO SSD",
    "Product Generation": "2nd Gen",
    "NAND Component": "1024Gb TLC x8 2.5V",
    "Component Density": "1024Gb",
    "Component Width": "x8",
    "Component Voltage": "2.5V",
    "Sector Size": "512B",
    "Product Class": "FIPS",
    "Special Option": "OCP 2.5 + Non-SED"
  },
  absentExtra: ["NAND Component Code", "Customer Designator"]
});

assertRuleDecode("MTFDKBA512QGN-1BD1AABYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 4194304,
  cellField: "QLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "M.2, 80mm x 22mm, x4 PCIe",
    "Product Family": "Micron 2500 SSD",
    "Sector Size": "512B",
    "Special Option": "non-SED TCG Pyrite",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKCD256TGW-1BP15ABYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 2097152,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "M.2, 42mm x 22mm, x4 PCIe",
    "Product Family": "Micron 2650 SSD",
    "Sector Size": "512B",
    "Special Option": "Self-encrypting drive (TCG Opal)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKBA2T0TGD-1BK15ABYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 16777216,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "M.2, 80mm x 22mm, x4 PCIe",
    "Product Family": "Micron 3500 SSD",
    "Sector Size": "512B",
    "Special Option": "Self-encrypting drive (TCG Opal)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDLBA4T0THJ-1BP1KABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 33554432,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen5",
    "Form Factor": "M.2, 80mm x 22mm, x4 PCIe",
    "Product Family": "Micron 4600 SSD",
    "NAND Component": "1024Gb TLC x8 2.5V (3D)",
    "Sector Size": "512B",
    "Special Option": "MSFT"
  },
  absentExtra: ["NAND Component Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKCC12TBTGJ-1BC4ZABYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 104857600,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Form Factor": "U.3/U.2, 2.5-inch, 15mm, SFF-8639",
    "Product Family": "Micron 9400 MAX SSD",
    "Sector Size": "4KiB"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDKEL128THE-1BM15ATYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.3",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Product Family": "Micron 4100AT SSD",
    "Sector Size": "512B",
    "Operation Temperature": "Automotive (-40°C to +105°C)"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDKEL128THE-ABM15ATYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.3",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Product Family": "Micron 4100AT SSD",
    "Product Generation": "1st Gen",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDKEL220TGK-1BM45A2YY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1802240,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Product Family": "Micron 4150AT SSD",
    "Sector Size": "4KiB",
    "Operation Temperature": "Automotive (-40°C to +115°C)"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Firmware Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDKER1T8TGK-ABM45A2YYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 14745600,
  cellField: "TLC",
  extra: {
    "Storage Interface": "PCIe Gen4",
    "Product Family": "Micron 4150AT SSD",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["NAND Component", "NAND Component Code", "Firmware Code", "Hardware Feature Code", "Customer Designator"]
});

assertRuleDecode("MTFDDAC256MZZ-XYZ", {
  vendor: "micron",
  type: "SATA",
  densityMbit: 2097152,
  cellField: "MLC",
  extra: {
    "Storage Interface": "SATA 6.0 Gb/s",
    "Form Factor": "2.5-inch, 9.5mm"
  },
  absentExtra: ["Product Family", "Sector Size", "NAND Component", "Product Family Code", "NAND Component Code"]
});

assertRuleDecode("MTFDHBL064TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 524288,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.2, type 1620",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Product Version": "NVMe 1.3c",
    "Storage Interface": "PCIe Gen3 x4",
    "Sector Size": "512B",
    "Product Generation": "1st Gen",
    "NAND Technology": "Micron 3D TLC NAND Flash",
    "NAND Component": "512Gb TLC x8 3.3V (3D)",
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Special Option": "Self-encrypting drive (SED)",
    "Operation Temperature": "Automotive support, Industrial (-40°C to +95°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDHBM1T0TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 8388608,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.6, type 1620",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Sector Size": "512B",
    "Operation Temperature": "Automotive support, Industrial (-40°C to +95°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDHBK1T0TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 8388608,
  cellField: "TLC",
  package: "M.2-2230, 22x30x2.4, M-key",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDHBL064TDQ-1AT12ATYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 524288,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.2, type 1620",
  extra: {
    "Product Family": "Micron 2100AT SSD",
    "Product Version": "NVMe 1.3c",
    "Storage Interface": "PCIe Gen3 x4",
    "Operation Temperature": "Automotive (-40°C to +105°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDHBK128TDQ-1AT12ATYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "M.2-2230, 22x30x2.0, M-key",
  extra: {
    "Product Family": "Micron 2100AT SSD",
    "Storage Interface": "PCIe Gen3 x4",
    "Operation Temperature": "Automotive (-40°C to +105°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDecode("MTFDHBL128TDP-AAT12AIYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.2, type 1620",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDoesNotMatch("vendor.micron.ssd.modern.v1", "MTFDHBL064TDP-1AT12ITYY");
