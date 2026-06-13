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

assertPart("MTFC4GACAJCN-1M WT", {
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

assertPart("MTFC8GLTEA-WT", {
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

assertPart("MTFC256GASAONS-IT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 2097152,
  package: "TFBGA-153, 11.5x13x1.2",
  extra: {
    "Product Version": "UFS 2.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertPart("MTFC64GASAOEA-WT", {
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

assertPart("MTFC128GARATEK-WT", {
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

assertPart("MTFC512GAXATHJ-WT", {
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

assertPart("MTFC64GBCAVAL-AIT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  extra: {
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertPart("MTFC128GBCAQTC-AIT", {
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

assertPart("MTFC1TAYAXHR-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 8388608,
  extra: {
    "Product Version": "UFS 4.0"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertPart("MTFC256GZZZZZZ-WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  absentExtra: ["NAND Component", "Controller Code", "Package Code"]
});

assertPart("MTFC256GZZZZZZWT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  absentExtra: ["NAND Component", "Controller Code", "Package Code"]
});

assertMicronManagedFbgaMarking("JW101", "MT29C1G12MABAAHB-75IT", "emcp");
assertMicronManagedFbgaMarking("JZ018", "MT29VZZZ7D7DQKWL-062W97Y", "umcp");
assertMicronManagedFbgaMarking("JZ101", "MTFC64GAOALEA-WTES", "emmc");

assertPart("MTFDHBL064TDP-1AT12AIYY", {
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
    "Product Generation": "1st Generation",
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

assertPart("MTFDHBM1T0TDP-1AT12AIYY", {
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

assertPart("MTFDHBK1T0TDP-1AT12AIYY", {
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

assertPart("MTFDHBL064TDQ-1AT12ATYY", {
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

assertPart("MTFDHBK128TDQ-1AT12ATYY", {
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

assertPart("MTFDHBL128TDP-AAT12AIYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA-291, 16x20x1.2, type 1620",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Product Class": "Engineering samples",
    "Production Status": "Engineering samples"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDoesNotMatch("vendor.micron.ssd.2100ai-at.v1", "MTFDHBL064TDP-1AT12ITYY");
