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
  ["H25JGQ8A1M8R", 1048576, "HYV6Q", "QLC", 128, "1Tb", 1, 1, 1]
] as const;

for (const [partNumber, densityMbit, dieProfileField, cellField, layerCount, dieDensity, dieCount, ceCount, channelCount] of skhynixH25RawSamples) {
  assertPart(partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit,
    dieProfileField,
    cellField,
    widthField: "x8",
    extra: {
      "Layer Count": layerCount,
      "Die Density": dieDensity,
      "Die Count": dieCount,
      "CE Count": ceCount,
      "Channel Count": channelCount
    },
    absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Series", "Reference Status", "Inference Source"]
  });
}
