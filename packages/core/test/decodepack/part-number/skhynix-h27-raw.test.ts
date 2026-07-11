import assert from "node:assert/strict";
import {
  assertDecodePackDieProfile,
  assertRuleDecode,
  assertRuleDraftDieProfile,
  assertRuleDraftDieProfileMeta,
  compiledPack
} from "./_helpers";

const h27AbsentExtra = ["Product Generation", "Reference Status", "Inference Source", "Generation Code", "Package Code", "Config Code"];
const obsoleteRawRuleId = ["vendor", "skhynix", "token", "v1"].join(".");
const obsoleteH2RawRuleId = ["vendor", "skhynix", "h2", "raw", "v2"].join(".");

assert.equal(
  compiledPack.partDecoders.some((decoder) => decoder.id === obsoleteRawRuleId),
  false,
  "obsolete SK hynix raw v1 rule should not be compiled"
);

assert.equal(
  compiledPack.partDecoders.some((decoder) => decoder.id === obsoleteH2RawRuleId),
  false,
  "obsolete generic SK hynix fallback should not be compiled"
);

assert.equal(
  compiledPack.partDecoders.some((decoder) => decoder.id === "vendor.skhynix.h27.raw.v2" && decoder.check("H2EUXG8M1MYR")),
  true,
  "H2E product type should use the H27 v2 ordering rule"
);

assert.equal(
  compiledPack.partDecoders.some((decoder) => decoder.id === "vendor.skhynix.h27.raw.v2" && decoder.check("H2NUCG8T2E")),
  true,
  "H2N product type should use the H27 v2 ordering rule"
);

assertRuleDraftDieProfile("vendor.skhynix.h27.raw.v2", "H27Q4T8LQA3R-BDH", "HYV4");
assertRuleDraftDieProfileMeta("vendor.skhynix.h27.raw.v2", "H27Q4T8LQA3R-BDH", "HYV4");
assertDecodePackDieProfile("H27Q4T8LQA3R-BDH", "HYV4", 72);

assertRuleDecode("H2EQ4T8LQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  package: "LFBGA-316, 14x18x1.35, B",
  extra: {
    "Special Option": "Emulated",
    "Layer Count": 72,
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H2NQ4T8LQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  package: "LFBGA-316, 14x18x1.35, B",
  extra: {
    "Special Option": "NVDIMM",
    "Layer Count": 72,
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8LQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70~3.60V), VccQ: 1.80V (1.70~1.95V)",
  package: "LFBGA-316, 14x18x1.35, B",
  extra: {
    "Layer Count": 72,
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4,
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Bad block": "Include Bad Block",
    "Operation Temperature": "Commercial 2 (0~85C)",
    "Speed Grade": "667 MT/s"
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8L4A3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Product Mode": "Sequential Row Read Enable",
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 2,
    "R/B Count": 2,
    "Channel Count": 1
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4TMLQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Product Class": "Enterprise"
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4TOLQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Interface Note": "Structure 2"
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4TLLQA3R-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Interface Note": "Customized ECC"
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8LQA3A-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Wafer": "Yes",
    "Packing Type": "Wafer (Material 1)",
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8LQA31-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Wafer": "Yes",
    "Packing Type": "Whole Wafer",
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8LQA3C-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Wafer": "Yes",
    "Packing Type": "Partial Wafer (Packing Type 1)",
    "Die Density": "256Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 4
  },
  absentExtra: h27AbsentExtra
});

assertRuleDecode("H27Q4T8LQA3L-BDH", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV4",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Lead free": "No",
    "Bad block": "Include Bad Block",
    "Operation Temperature": "Commercial 2 (0~85C)",
    "Speed Grade": "667 MT/s"
  },
  absentExtra: h27AbsentExtra
});

assertRuleDraftDieProfile("vendor.skhynix.h27.raw.v2", "H27Q1T8PFB", "HYV3");
assertDecodePackDieProfile("H27Q1T8PFB", "HYV3", 48);

assertRuleDecode("H27Q1T8PFB", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV3",
  cellField: "TLC",
  widthField: "x8",
  extra: {
    "Layer Count": 48,
    "Die Density": "256Gb",
    "Die Count": 4,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 1
  },
  absentExtra: h27AbsentExtra
});

assertRuleDraftDieProfile("vendor.skhynix.h27.raw.v2", "H27Q1T8YEC", "HYV2");
assertDecodePackDieProfile("H27Q1T8YEC", "HYV2", 36);

assertRuleDecode("H27Q1T8YEC", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV2",
  cellField: "MLC",
  widthField: "x8",
  extra: {
    "Layer Count": 36,
    "Die Density": "128Gb",
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2
  },
  absentExtra: h27AbsentExtra
});

assertRuleDraftDieProfile("vendor.skhynix.h27.raw.v2", "H27UCG8T2E", "HY16");

assertRuleDecode("H27UCG8T2E", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 65536,
  dieProfileField: "16nm",
  cellField: "MLC",
  widthField: "x8",
  voltage: "Vcc: 3.30V (2.70~3.60V), VccQ: 3.30V (2.70~3.60V)",
  extra: {
    "Product Mode": "Sequential Row Read Disable",
    "Die Density": "64Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: h27AbsentExtra
});
