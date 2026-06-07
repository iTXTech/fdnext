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

assertPart("MT29FB16T08GALAAM5-TES:B", {
  vendor: "micron",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "N28A",
  cellField: "QLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70–3.60V) or 2.50V (2.35–2.75V), VccQ: 1.20V (1.14–1.26V)",
  package: "132-ball LBGA 12x18x1.50",
  extra: {
    "NAND Technology": "HSC NAND",
    "Product Mode": "IO Expander",
    "Interface Type": "NV-DDR3 only",
    "Controller Revision": "IOE Gen 1 Rev.A",
    "Special Option": "FortisMax",
    "Production Status": "Engineering Samples",
    "Die Density": "1Tb",
    "Die Count": 16,
    "CE Count": 2,
    "Layer Count": 96
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code",
    "Feature Code",
    "Die Code",
    "Controller"
  ]
});

assertPart("MT29F2G08ABDHC-ET:D", {
  vendor: "micron",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  topology: {
    ce: 1,
    ch: 1,
    rb: 1,
    die: 1
  },
  voltage: "Vcc: 3.3V (2.70–3.60V), VccQ: 1.8V (1.70–1.95V)",
  interface: {
    async: false,
    sync: true
  },
  absentExtra: ["Revision Code", "Suffix Code", "Package Code"]
});

assertRuleDraftDieProfile("vendor.micron.token.v1", "MT29F2T08GBLBH", "N69R");
assertMicronDecodePackDieProfile("MT29F2T08GBLBH", "N69R", 276);
assertFdbDoesNotOverrideDecodePackFields();
assertRuleDraftDieProfile("vendor.micron.hsc.mt29fb.v1", "MT29FB64T08GDLBBN2-QJES:B", "N69R");

assertDecodedPartNumber("MT29F2G08ABDHC-ETD", "MT29F2G08ABDHC-ET:D");
assertDecodedPartNumber("MT29FB16T08GALAAM5-TESB", "MT29FB16T08GALAAM5-TES:B");
assertSearchPnIncludes("MT29F2G08ABDHC-ETD", "Micron MT29F2G08ABDHC-ET:D");
assertSearchPnIncludes("MT29FB16T08GALAAM5-TESB", "Micron MT29FB16T08GALAAM5-TES:B");

assertPart("MT29FB8T08EALAAM5-QK:E", {
  vendor: "micron",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "B47R",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70–3.60V) or 2.50V (2.35–2.75V), VccQ: 1.20V (1.14–1.26V)",
  package: "132-ball LBGA 12x18x1.50",
  extra: {
    "NAND Technology": "HSC NAND",
    "Product Mode": "IO Expander",
    "Interface Type": "NV-DDR3 only",
    "Controller Revision": "IOE Gen 1 Rev.A",
    "Special Option": "Performance QK Enterprise",
    "Die Density": "512Gb",
    "Die Count": 16,
    "CE Count": 2,
    "Layer Count": 176
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code",
    "Feature Code",
    "Die Code",
    "Controller"
  ]
});

assertPart("MT29FB64T08GDLBBN2-QJES:B", {
  vendor: "micron",
  type: "NAND",
  densityMbit: 67108864,
  dieProfileField: "N69R",
  cellField: "QLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70–3.60V) or 2.50V (2.35–2.75V), VccQ: 1.20V (1.14–1.26V)",
  extra: {
    "NAND Technology": "HSC NAND",
    "Product Mode": "IO Expander",
    "Interface Type": "NV-DDR3/NV-LPDDR4",
    "Controller Revision": "IOE Gen 2 Rev.A",
    "Special Option": "Performance QJ Enterprise",
    "Production Status": "Engineering Samples",
    "Die Density": "2Tb",
    "Die Count": 32,
    "CE Count": 2,
    "Layer Count": 276
  },
  absentExtra: [
    "Product Family",
    "Package",
    "Package Code",
    "Feature Code",
    "Die Code",
    "Config Code",
    "Controller",
    "source",
    "status",
    "Reference Status",
    "Inference Source"
  ]
});

assertPart("NC103", {
  vendor: "micron",
  markingCode: "NC103",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "N28A",
  cellField: "QLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70–3.60V) or 2.50V (2.35–2.75V), VccQ: 1.20V (1.14–1.26V)",
  package: "132-ball LBGA 12x18x1.50",
  extra: {
    "NAND Technology": "HSC NAND",
    "Product Mode": "IO Expander",
    "Interface Type": "NV-DDR3 only",
    "Controller Revision": "IOE Gen 1 Rev.A",
    "Special Option": "FortisMax",
    "Production Status": "Engineering Samples",
    "Die Density": "1Tb",
    "Die Count": 16,
    "CE Count": 2,
    "Layer Count": 96
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code",
    "Controller"
  ]
});
