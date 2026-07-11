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

assertRuleDecode("SUGNM1126A6BPIET-046BT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA-149/224, 8.0x9.5x1.0, 0.5",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "046BT Fully Tested"
  },
  absentExtra: ["Product Family", "Product Mode", "NAND Component", "Package Code", "Product Generation"]
});
assertRuleDecode("FNUGNM1126A6BPIET-046BT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA-149/224, 8.0x9.5x1.0, 0.5",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "046BT Fully Tested"
  },
  absentExtra: ["Product Family", "Product Mode", "NAND Component", "Package Code", "Product Generation"]
});
assertRuleDecode("SMCNM1126A6BPIET-062UT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA-149/224, 8.0x9.5x1.0, 0.5",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Product Mode": "MCP PoP",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "062UT Untested"
  },
  absentExtra: ["Product Family", "NAND Component", "Package Code", "Product Generation"]
});
assertRuleDecode("SMKJ6Z4ZZ4D4TGFAK-PG", {
  vendor: "spectek",
  type: "eMCP",
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V, eMMC VCCM/VCCQM: 3.3V/1.8V or 3.3V",
  package: "TFBGA-153, 11.5x13, 0.50 pitch 1.10 thick",
  extra: {
    "Storage Density": "4GB eMMC",
    "Storage Interface": "eMMC",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Product Family": "SpecTek All-in-One",
    "Product Mode": "LPDDR + MLC eMMC",
    "Special Option": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "Controller": "Phison 8200 V4.41 EF",
    "Speed Grade": "PG Partial Good Mixed Bins"
  },
  absentExtra: ["Controller Code", "Package Code", "Product Generation"]
});
assertRuleDecode("SMKJ6Z4ZZ4D4TGFAK-053BT", {
  vendor: "spectek",
  type: "eMCP",
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V, eMMC VCCM/VCCQM: 3.3V/1.8V or 3.3V",
  package: "TFBGA-153, 11.5x13, 0.50 pitch 1.10 thick",
  extra: {
    "Storage Density": "4GB eMMC",
    "Storage Interface": "eMMC",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Product Family": "SpecTek All-in-One",
    "Product Mode": "LPDDR + MLC eMMC",
    "Special Option": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "Controller": "Phison 8200 V4.41 EF",
    "Speed Grade": "053BT Fully Tested at 70 degrees"
  },
  absentExtra: ["Controller Code", "Package Code", "Product Generation"]
});
assertRuleDecode("SUJ52A1GCFDI-BT", {
  vendor: "spectek",
  type: "eMMC",
  densityMbit: 8192,
  package: "TFBGA-169/392, 12x16x1.2",
  extra: {
    "Component Density": "8Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Product Family": "SpecTek Flash + Controller",
    "Controller Revision": "Rev 6",
    "Speed Grade": "BT B Grade Fully Tested"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Generation"]
});
assertRuleDecode("SUJ52A128GASAKDI-FT", {
  vendor: "spectek",
  type: "UFS",
  densityMbit: 1048576,
  package: "TFBGA-169/392, 12x16x1.2",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Component Density": "256Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Product Family": "SpecTek Flash + Controller",
    "Controller": "SMI SM2750",
    "Controller Revision": "Rev 35",
    "Special Option": "AB firmware, Standard mode",
    "Speed Grade": "FT Fully Tested at 90 degrees"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Generation"]
});

assertRuleDecode("TF10G1BAHA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1024,
  dieProfileField: "24nm",
  cellField: "SLC",
  package: "TSOP-48",
  extra: {
    "Original Vendor": "Kioxia",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertRuleDecode("TU56G2LAJA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 65536,
  cellField: "MLC",
  extra: {
    "Original Vendor": "Kioxia",
    "Die Count": 2,
    "CE Count": 2
  }
});

assertRuleDecode("T27HGA5A1V", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 4194304,
  density: "512GB",
  dieProfileField: "BiCS6",
  cellField: "TLC",
  package: "BGA-154",
  extra: {
    "Layer Count": 162,
    "Original Vendor": "Kioxia",
    "Die Count": 4,
    "CE Count": 4
  }
});

assertRuleDecode("ST15G24APA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 32768,
  cellField: "TLC",
  package: "TSOP-48",
  extra: {
    "Original Vendor": "Samsung",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertRuleDecode("HA5AG64AVA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV5",
  cellField: "TLC",
  package: "BGA-132",
  extra: {
    "Original Vendor": "SKhynix",
    "Die Count": 2,
    "CE Count": 2
  }
});

assertRuleDecode("IA1AG67AWA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N28A",
  cellField: "QLC",
  package: "BGA-132",
  extra: {
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertRuleDecode("IA1AG6KAVA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B27A",
  cellField: "TLC",
  package: "BGA-132",
  extra: {
    "Layer Count": 96,
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  },
  absentExtra: ["Product Generation"]
});

assertRuleDecode("IA1AG6KAIA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B27B",
  cellField: "TLC",
  package: "BGA-132",
  extra: {
    "Layer Count": 96,
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  },
  absentExtra: ["Product Generation"]
});

assertRuleDecode("DT57G2LALC", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "TSOP-48",
  extra: {
    "Original Vendor": "Sandisk",
    "Die Count": 2,
    "CE Count": 2
  }
});


assertNotFound("SM671PAC-BFS");
