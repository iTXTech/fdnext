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

const skhynixH25RawSamples = [
  ["H25QEM8A1B", 262144, "HYV4M", "MLC", 76, "256Gb", 1, 1, 1],
  ["H25QFT8A1A", 524288, "HYV4", "TLC", 72, "512Gb", 1, 1, 1],
  ["H25QFT8B3A", 1048576, "HYV4", "TLC", 72, "512Gb", 2, 2, 2],
  ["H25QFT8D4A", 2097152, "HYV4", "TLC", 72, "512Gb", 4, 4, 2],
  ["H25QFT8F4A", 4194304, "HYV4", "TLC", 72, "512Gb", 8, 4, 2],
  ["H25QFT8F6A", 4194304, "HYV4", "TLC", 72, "512Gb", 8, 8, 2],
  ["H25QFT8G4A", 8388608, "HYV4", "TLC", 72, "512Gb", 16, 4, 2],
  ["H25QFTMA1A", 524288, "HYV4", "TLC", 72, "512Gb", 1, 1, 1],
  ["H25QFTMB3A", 1048576, "HYV4", "TLC", 72, "512Gb", 2, 2, 2],
  ["H25QFTMD4A", 2097152, "HYV4", "TLC", 72, "512Gb", 4, 4, 2],
  ["H25QFTMF4A", 4194304, "HYV4", "TLC", 72, "512Gb", 8, 4, 2],
  ["H25QFTMF6A", 4194304, "HYV4", "TLC", 72, "512Gb", 8, 8, 2],
  ["H25QFTMG4A", 8388608, "HYV4", "TLC", 72, "512Gb", 16, 4, 2],
  ["H25BFT8A1M", 524288, "HYV5", "TLC", 96, "512Gb", 1, 1, 1],
  ["H25BFT8B3M", 1048576, "HYV5", "TLC", 96, "512Gb", 2, 2, 2],
  ["H25BFT8D4M", 2097152, "HYV5", "TLC", 96, "512Gb", 4, 4, 2],
  ["H25BFT8F4M", 4194304, "HYV5", "TLC", 96, "512Gb", 8, 4, 2],
  ["H25BFT8F6M", 4194304, "HYV5", "TLC", 96, "512Gb", 8, 8, 2],
  ["H25JGT8A1M", 1048576, "HYV6", "TLC", 128, "1Tb", 1, 1, 1],
  ["H25JGT8B3M", 2097152, "HYV6", "TLC", 128, "1Tb", 2, 2, 2],
  ["H25JGQ8A1M8R", 1048576, "HYV5Q", "QLC", 96, "1Tb", 1, 1, 1]
] as const;

for (const [partNumber, densityMbit, dieProfileField, cellField, layerCount, dieDensity, dieCount, ceCount, channelCount] of skhynixH25RawSamples) {
  const expectedExtra: Record<string, unknown> = {
    "Layer Count": layerCount,
    "Die Density": dieDensity,
    "Die Count": dieCount,
    "CE Count": ceCount,
    "Channel Count": channelCount
  };
  const absentInternalExtra = partNumber[6] === "M" ? skhynixH25RawInternalExtra.filter((key) => key !== "Product Class") : skhynixH25RawInternalExtra;
  if (partNumber[6] === "M") {
    expectedExtra["Product Class"] = "Enterprise";
  }
  assertRuleDecode(partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit,
    dieProfileField,
    cellField,
    widthField: "x8",
    extra: expectedExtra,
    absentExtra: [...absentInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
  });
}

assertRuleDecode("H25BFT8A1B", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV6",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
  extra: {
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25JGT8A1A", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV5",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Layer Count": 96,
    "Die Density": "1Tb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25JGT8F4M9R-BDJ", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "HYV6",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Layer Count": 128,
    "Die Density": "1Tb",
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2,
    "Package": "LBGA-152, 14x18x1.35",
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Bad block": "Include Bad Block",
    "Operation Temperature": "Commercial 2 (0~85C)",
    "Speed Grade": "1200 MT/s"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
});

assertRuleDecode("H25JGT8FAM", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "HYV6",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
  extra: {
    "Layer Count": 128,
    "Die Density": "1Tb",
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2,
    "Special Option": "IF Chip"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
});

const skhynixH25LooseRawSamples = [
  [
    "H25BFT4D1C",
    {
      densityMbit: 2097152,
      cellField: "TLC",
      widthField: "x8",
      voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
      extra: {
        "Die Density": "512Gb",
        "Die Count": 4,
        "CE Count": 1,
        "R/B Count": 1,
        "Channel Count": 1
      }
    }
  ],
  [
    "H25BFT4M9R",
    {
      cellField: "TLC",
      widthField: "x8",
      voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
      extra: {
        "Die Density": "512Gb"
      }
    }
  ],
  [
    "H25BFT8A2B",
    {
      densityMbit: 524288,
      dieProfileField: "HYV6",
      cellField: "TLC",
      widthField: "x8",
      voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
      extra: {
        "Layer Count": 128,
        "Die Density": "512Gb",
        "Die Count": 1
      }
    }
  ],
  [
    "H25BFT9TC1",
    {
      cellField: "TLC",
      voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.80V (1.70-1.95V) or 1.20V (1.14-1.26V)",
      extra: {
        "Die Density": "512Gb"
      }
    }
  ],
  [
    "H25G9TC1",
    {
      cellField: "TLC"
    }
  ],
  [
    "H25JGT4D1C",
    {
      densityMbit: 4194304,
      cellField: "TLC",
      widthField: "x8",
      voltage: "Vcc: 3.30V (2.70-3.60V) or 2.50V (2.35-2.75V), VccQ: 1.20V (1.14-1.26V)",
      extra: {
        "Die Density": "1Tb",
        "Die Count": 4,
        "CE Count": 1,
        "R/B Count": 1,
        "Channel Count": 1
      }
    }
  ],
  [
    "H25Q1FT8A1",
    {
      voltage: "Vcc: 3.30V (2.70-3.60V), VccQ: 1.80V (1.70-1.95V)",
      extra: {
        "CE Count": 4,
        "R/B Count": 4,
        "Channel Count": 2,
        "Special Option": "IF Chip"
      }
    }
  ]
] as const;

const h25RawDecoder = compiledPack.partDecoders.find((decoder) => decoder.id === "vendor.skhynix.h25.raw.v2");
assert.ok(h25RawDecoder, "H25 raw decoder should be compiled");

for (const [partNumber, expected] of skhynixH25LooseRawSamples) {
  assert.ok(h25RawDecoder.match(partNumber), `${partNumber} should match the relaxed H25 raw decoder`);
  assertRuleDecode(partNumber, {
    vendor: "skhynix",
    type: "NAND",
    ...expected,
    absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
  });
}
