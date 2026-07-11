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
  assertRuleDraftDieProfile,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSkhynixEmcpRuleMatches,
  assertSkhynixHn8RuleMatches,
  assertSubtitle
} from "./_helpers";

assertRuleDecode("H25T2TB88E-X321-N", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV6",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25FTB0",
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Die Count": 8,
    "Packing Type": "Normal (Tray)"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25G9TM18E", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV5",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25FT4MMI",
    "Layer Count": 96,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T0QM18E", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV5Q",
  cellField: "QLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25GQM0",
    "Layer Count": 96,
    "Die Density": "1Tb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T1TD48C-X630", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 2097152,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 4
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T2TC88C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T2TD88C-X682", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T2TD88C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T3TC88C-X658-R", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "HYV8",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  package: "BGA-152, 14x18x1.35",
  extra: {
    "Layer Count": 238,
    "Die Density": "1Tb",
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2,
    "Packing Type": "Tape & Reel"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
});

const skhynixH25Hyv9KnownPackages = [
  {
    partNumber: "H25T0TD18CX655",
    densityMbit: 1048576,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 1,
    package: "BGA-152, 14x18x1.0"
  },
  {
    partNumber: "H25T1TD28CX656",
    densityMbit: 2097152,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "BGA-152, 14x18x1.0"
  },
  {
    partNumber: "H25T2TD48CX657",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-152, 14x18x1.0"
  },
  {
    partNumber: "H25T3TD88CX676",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-152, 14x18x1.35"
  },
  {
    partNumber: "H25T3TD88CX658",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-152, 14x18x1.35"
  },
  {
    partNumber: "H25T4TDG8CX658",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-152, 14x18x1.35"
  },
  {
    partNumber: "H25T2TD48CX659",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.0"
  },
  {
    partNumber: "H25T3TD88CX660",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  },
  {
    partNumber: "H25T4TDG8CX660",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  },
  {
    partNumber: "H25T2TD48CX862",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T3TD88CX860",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.35"
  },
  {
    partNumber: "H25T0TD18CX826",
    densityMbit: 1048576,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 1,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T1TD28CX828",
    densityMbit: 2097152,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T2TD48CX809",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T3TD88CX811",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.35"
  },
  {
    partNumber: "H25T4TDG8CX813",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.5"
  }
];

for (const item of skhynixH25Hyv9KnownPackages) {
  assertRuleDecode(item.partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit: item.densityMbit,
    dieProfileField: "HYV9",
    cellField: "TLC",
    voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
    package: item.package,
    extra: {
      "Layer Count": 321,
      "Die Density": "1Tb",
      "Die Count": item.dieCount,
      "CE Count": item.ceCount,
      "R/B Count": item.rbCount,
      "Channel Count": item.channelCount
    },
    absentExtra: [...skhynixH25RawInternalExtra, "Speed Grade", "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
  });
}

const skhynixH25V9hKnownPackages = [
  {
    partNumber: "H25T0TG18GX807",
    densityMbit: 1048576,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 1,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T1TG28GX840",
    densityMbit: 2097152,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T2TG48GX842",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T3TG88GX844",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.35"
  },
  {
    partNumber: "H25T2TG48GX846",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.0"
  },
  {
    partNumber: "H25T3TG88GX848",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  },
  {
    partNumber: "H25T4TGG8GX848",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  }
];

for (const item of skhynixH25V9hKnownPackages) {
  assertRuleDecode(item.partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit: item.densityMbit,
    dieProfileField: "HYV9H",
    cellField: "TLC",
    package: item.package,
    extra: {
      "Layer Count": 321,
      "Die Density": "1Tb",
      "Die Count": item.dieCount,
      "CE Count": item.ceCount,
      "R/B Count": item.rbCount,
      "Channel Count": item.channelCount,
      "Plane Count": 4,
      "Speed Grade": "Max Speed=3600MT/s"
    },
    absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
  });
}

assertRuleDecode("H25T0TG18G-X807", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV9H",
  cellField: "TLC",
  package: "BGA-154, 11.5x13.5x1.0",
  absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
});

const skhynixH25V9hDashResult = engine.decodePart({ query: "H25T0TG18G-X807", lang: "eng" });
assert.equal(skhynixH25V9hDashResult.input.normalized, "H25T0TG18GX807", "H25 -X package suffix should normalize without dash");
assert.equal(skhynixH25V9hDashResult.device?.partNumber, "H25T0TG18GX807", "H25 -X package suffix should resolve to the canonical no-dash PN");

assertRuleDecode("H25T0TD18C-X655N", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV9",
  cellField: "TLC",
  package: "BGA-152, 14x18x1.0",
  extra: {
    "Layer Count": 321,
    "Die Density": "1Tb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1,
    "Packing Type": "Normal (Tray)"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T0QAXXBX569A", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  cellField: "QLC",
  extra: {
    "Wafer": "Yes",
    "Packing Type": "Wafer"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T0QA18CX542", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV7Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 176
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T4QM88G", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "HYV9Q",
  cellField: "QLC",
  voltage: "Vcc: 2.50V (2.35-2.75V) or 2.50V (2.28-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Layer Count": 321,
    "Die Density": "2Tb",
    "Die Count": 8,
    "CE Count": 4,
    "Plane Count": 6,
    "Speed Grade": "Max Speed=3200MT/s"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T6QM88G", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 67108864,
  cellField: "QLC",
  voltage: "Vcc: 2.50V (2.35-2.75V) or 2.50V (2.28-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
});

const skhynixH25V9qKnownPackages = [
  {
    partNumber: "H25T3QM48GX817",
    densityMbit: 8388608,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.0"
  },
  {
    partNumber: "H25T4QM88GX819",
    densityMbit: 16777216,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  },
  {
    partNumber: "H25T5QMG8GX819",
    densityMbit: 33554432,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "BGA-316, 14x18x1.35"
  },
  {
    partNumber: "H25T1QM18GX834",
    densityMbit: 2097152,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T2QM28GX836",
    densityMbit: 4194304,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T3QM48GX822",
    densityMbit: 8388608,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.0"
  },
  {
    partNumber: "H25T4QM88GX824",
    densityMbit: 16777216,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.35"
  },
  {
    partNumber: "H25T5QMG8GX830",
    densityMbit: 33554432,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "BGA-154, 11.5x13.5x1.7"
  }
];

for (const item of skhynixH25V9qKnownPackages) {
  assertRuleDecode(item.partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit: item.densityMbit,
    dieProfileField: "HYV9Q",
    cellField: "QLC",
    package: item.package,
    extra: {
      "Layer Count": 321,
      "Die Density": "2Tb",
      "Die Count": item.dieCount,
      "CE Count": item.ceCount,
      "R/B Count": item.rbCount,
      "Channel Count": item.channelCount,
      "Plane Count": 6,
      "Speed Grade": "Max Speed=3200MT/s"
    },
    absentExtra: [...skhynixH25RawInternalExtra, "Special Option", "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
  });
}

assertRuleDecode("H25T3TCG8C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "HYV7",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25T4TMG8C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "HYV6",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25GTM0",
    "Layer Count": 128,
    "Die Density": "1Tb",
    "Die Count": 16,
    "CE Count": 4
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDraftDieProfile("vendor.skhynix.h25.gt-package.v2", "H25G9TC18CX488", "HYV7");
assertRuleDecode("H25G9TC18CX488", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDraftDieProfile("vendor.skhynix.h25.gt-package.v2", "H25G9TD18CX576", "HYV8");
assertRuleDecode("H25G9TD18CX576", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV8",
  cellField: "TLC",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});
