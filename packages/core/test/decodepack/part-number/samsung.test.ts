import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertDecodePackDieProfile,
  assertRuleDraftDieProfile,
  engineWithoutFdb,
  fieldText,
  firstField,
  testPart
} from "./_helpers";

function assertDecodePackDieProfileAbsent(partNumber: string): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(firstField(result, "die_codename"), undefined, `${partNumber} should not emit an ambiguous die profile`);
}

function assertSamsungRawDieStack(partNumber: string, expected: string | undefined): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "die_stack")), expected, `${partNumber} die_stack`);
  assert.ok(firstField(result, "die_count"), `${partNumber} should keep die_count`);
}

function assertSamsungRawConfiguration(
  partNumber: string,
  expected: { ceCount?: number; rbCount?: number; specialOption?: string }
): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(firstField(result, "ce_count")?.value, expected.ceCount, `${partNumber} ce_count`);
  assert.equal(firstField(result, "rb_count")?.value, expected.rbCount, `${partNumber} rb_count`);
  assert.equal(fieldText(firstField(result, "special_option")), expected.specialOption, `${partNumber} special_option`);
}

function assertSamsungRawVoltage(voltageCode: string, expected: string): void {
  const partNumber = `K9XVGY8${voltageCode}5M`;
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "voltage")), expected, `${partNumber} voltage`);
}

function assertSamsungRawPackage(packageCode: string, expected: string): void {
  const partNumber = `K9XVGY8J5M-${packageCode}`;
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "package")), expected, `${partNumber} package`);
  assert.equal(firstField(result, "lead_free"), undefined, `${partNumber} should not expose lead_free`);
  assert.equal(firstField(result, "halogen_free"), undefined, `${partNumber} should not expose halogen_free`);
  assert.equal(firstField(result, "cu"), undefined, `${partNumber} should not expose cu`);
}

function assertSamsungRawPackageAbsent(partNumber: string): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(firstField(result, "package"), undefined, `${partNumber} should not expose package without package token`);
}

testPart("KLMAG1JETD-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 131072,
  dieProfileField: "14nm",
  extra: {
    "Die Density": "128Gb",
    "Die Stack": "SDP (1-die)",
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Interface info", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLM8G1GETF-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 65536,
  dieProfileField: "14nm",
  extra: {
    "Die Density": "64Gb",
    "Die Stack": "SDP (1-die)",
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Interface info", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLMBG2JETD-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 262144,
  dieProfileField: "14nm",
  extra: {
    "Die Density": "128Gb",
    "Product Version": "eMMC 5.1",
    "Die Stack": "DDP (2-die)"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLMDG1NCAB-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "SSV8",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Stack": "SDP (1-die)",
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMGD6001BM-B421", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 262144,
  package: "221Ball FBGA 11.5x13x1.0",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR3",
    "Storage Density": "32GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "Package Code": "221 FBGA",
    "Config Code": "B421"
  },
  absentExtra: ["Group", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMGE6001BM-B421", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 131072,
  package: "BGA221",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR3",
    "Storage Density": "16GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866",
    "Package Code": "221 FBGA",
    "Config Code": "B421"
  },
  absentExtra: ["Group", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMDT6001ZM-A625", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 131072,
  package: "144 FBGA",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR4X",
    "Storage Density": "16GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMDP6001DA-B425", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 524288,
  package: "254 FBGA",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR4X",
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMFN60012B-B214", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 65536,
  package: "221 FBGA",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR3",
    "Storage Density": "8GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KM5L9000CM-B424", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 1048576,
  package: "254 FBGA",
  extra: {
    "Product Mode": "uMCP",
    "Product Family": "UFS + LPDDR4X",
    "Storage Density": "128GB UFS",
    "Storage Interface": "UFS 2.2",
    "DRAM Density": "48Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KM8V9001JM-B813", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 1048576,
  package: "254 FBGA",
  extra: {
    "Product Mode": "uMCP",
    "Product Family": "UFS + LPDDR4X",
    "Storage Density": "128GB UFS",
    "Storage Interface": "UFS 2.2",
    "DRAM Density": "64Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMJS9001RM-BG01", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 2097152,
  package: "297 FBGA",
  extra: {
    "Product Mode": "uMCP",
    "Product Family": "UFS + LPDDR5",
    "Storage Density": "256GB UFS",
    "Storage Interface": "UFS 3.1",
    "DRAM Density": "96Gb",
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "LPDDR5-6400"
  },
  absentExtra: ["Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("K9AFGD8J0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "SSV3",
  cellField: "TLC",
  extra: {
    "Layer Count": 48,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AFGD8J0E", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "SSV6C",
  cellField: "TLC",
  extra: {
    "Layer Count": 120,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV4",
  cellField: "TLC",
  extra: {
    "Layer Count": 64,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0A", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV5",
  cellField: "TLC",
  extra: {
    "Layer Count": 92,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8H0A", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV5",
  cellField: "TLC",
  extra: {
    "Layer Count": 92,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0B", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV6",
  cellField: "TLC",
  extra: {
    "Layer Count": 128,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0E", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV6P",
  cellField: "TLC",
  extra: {
    "Layer Count": 133,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0D", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV7",
  cellField: "TLC",
  extra: {
    "Layer Count": 176,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0F", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV8",
  cellField: "TLC",
  extra: {
    "Layer Count": 236,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9AHGD8J0H", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "SSV8P",
  cellField: "TLC",
  extra: {
    "Layer Count": 236,
    "Die Count": 1,
    "CE Count": 1
  }
});

testPart("K9DVGY8J5E", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV6P",
  cellField: "TLC",
  extra: {
    "Layer Count": 133,
    "Die Count": 16,
    "CE Count": 4
  }
});

testPart("K9DYGY8J5B", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "SSV8",
  cellField: "TLC",
  extra: {
    "Layer Count": 236,
    "Die Count": 16,
    "CE Count": 4
  }
});

testPart("K9DYGY8J5B-CCK0", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "SSV8",
  cellField: "TLC",
  package: "FBGA-316",
  extra: {
    "Layer Count": 236,
    "Die Count": 16,
    "CE Count": 4,
    "Operation Temperature": "Commercial",
    "Bad block": "Special Handling"
  },
  absentExtra: ["Lead free", "Halogen free", "CU"]
});

testPart("K9DYGY8J5D", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "SSV9",
  cellField: "TLC",
  extra: {
    "Layer Count": 280,
    "Die Count": 16,
    "CE Count": 4
  }
});

test("Samsung raw NAND die profiles are resolved from DecodePack rules", () => {
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9DYGY8J5B", "SSV8");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9DYGY8J5D", "SSV9");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XVGB8J1M", "SSV4Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XVGY8J5M", "SSV4Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XVGY8J5A", "SSV5Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XVGD8J5C", "SSV7Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K99UGY8J5C", "SSV7Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XVGD8J5D", "SSV9Q");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9AHGD8H0A", "SSV5");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9UKGB8S7F", "SS14M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9PKGY8S4B", "SS14M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9PMGY8S7M", "SSV3M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9UUGB8S7M", "SSV3M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9GBG08U0A", "SS27M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9ABGD8U0B", "SS27");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F1GD8D0E", "SS21S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F1GD8D0F", "SS16S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F2GD8D0D", "SS16S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F4GD8D0E", "SS21S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F8GD8D0C", "SS27S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9F8GD8D0D", "SS21S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9FBGD8D0A", "SS14S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9FCGD8D0M", "SSV3S");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9GCG08U0M", "SS21M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9MRGD8D0M", "SSV2M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9GFG08U0A", "SSV4M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9GFG08U0B", "SSV5M");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9ADGD8J0C", "SSV2");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9AFGD8J0M", "SSV3");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9AFGD8J0E", "SSV6C");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9AHGD8J0H", "SSV8P");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9AKGD8D0E", "SSV9HS");
  assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9XYGD8D0M", "SSV9HSQ");
  assertDecodePackDieProfile("K9XVGB8J1M", "SSV4Q", 64);
  assertDecodePackDieProfile("K9XVGY8J5M", "SSV4Q", 64);
  assertDecodePackDieProfile("K9XVGY8J5A", "SSV5Q", 92);
  assertDecodePackDieProfile("K9XVGD8J5C", "SSV7Q", 176);
  assertDecodePackDieProfile("K99UGY8J5C", "SSV7Q", 176);
  assertDecodePackDieProfile("K9XVGD8J5D", "SSV9Q", 280);
  assertDecodePackDieProfile("K9AHGD8H0A", "SSV5", 92);
  assertDecodePackDieProfile("K9UKGB8S7F", "14nm");
  assertDecodePackDieProfile("K9PKGY8S4B", "14nm");
  assertDecodePackDieProfile("K9PMGY8S7M", "SSV3M", 48);
  assertDecodePackDieProfile("K9UUGB8S7M", "SSV3M", 48);
  assertDecodePackDieProfile("K9GBG08U0A", "27nm");
  assertDecodePackDieProfile("K9ABGD8U0B", "27nm");
  assertDecodePackDieProfile("K9F1GD8D0E", "21nm");
  assertDecodePackDieProfile("K9F1GD8D0F", "16nm");
  assertDecodePackDieProfile("K9F2GD8D0D", "16nm");
  assertDecodePackDieProfile("K9F4GD8D0E", "21nm");
  assertDecodePackDieProfile("K9F8GD8D0C", "27nm");
  assertDecodePackDieProfile("K9F8GD8D0D", "21nm");
  assertDecodePackDieProfile("K9FBGD8D0A", "14nm");
  assertDecodePackDieProfile("K9FCGD8D0M", "SSV3S", 48);
  assertDecodePackDieProfile("K9GCG08U0M", "21nm");
  assertDecodePackDieProfile("K9MRGD8D0M", "SSV2M", 32);
  assertDecodePackDieProfile("K9GFG08U0A", "SSV4M", 64);
  assertDecodePackDieProfile("K9GFG08U0B", "SSV5M", 92);
  assertDecodePackDieProfile("K9ADGD8J0C", "SSV2", 32);
  assertDecodePackDieProfile("K9AFGD8J0M", "SSV3", 48);
  assertDecodePackDieProfile("K9AFGD8J0E", "SSV6C", 120);
  assertDecodePackDieProfile("K9AHGD8J0H", "SSV8P", 236);
  assertDecodePackDieProfile("K9AKGD8D0E", "SSV9HS", 286);
  assertDecodePackDieProfile("K9XYGD8D0M", "SSV9HSQ", 280);
  assertDecodePackDieProfileAbsent("K9ABGD8D0M");
  assertDecodePackDieProfileAbsent("K9ABGD8D0A");
  assertDecodePackDieProfileAbsent("K9ADGD8D0A");
});

testPart("K9OVGD8J2B", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "TLC",
  extra: {
    "Die Count": 8,
    "CE Count": 4,
    "R/B Count": 2
  }
});

testPart("K9NAGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16384,
  cellField: "SLC",
  extra: {
    "Die Stack": "DSP (4-die x2)",
    "Die Count": 8,
    "CE Count": 1
  }
});

testPart("K9MAGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16384,
  cellField: "MLC",
  extra: {
    "Die Stack": "DSP (4-die x2)",
    "Die Count": 8,
    "CE Count": 1
  }
});

testPart("K9T20D8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 2,
  cellField: "SLC",
  extra: {
    "Die Count": 1
  }
});

testPart("K91AGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16384,
  cellField: "TLC",
  extra: {
    "Die Count": 16
  }
});

testPart("K9JAGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 16384,
  cellField: "MLC",
  extra: {
    "Die Count": 3
  }
});

testPart("K98VGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "QLC",
  extra: {
    "Die Count": 32
  }
});

testPart("K9YVGD8D0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "QLC",
  extra: {
    "Die Count": 16
  }
});

testPart("K9XVGB8J1M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV4Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 64,
    "Die Count": 8,
    "CE Count": 2
  }
});

testPart("K9XVGY8J5M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV4Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 64,
    "Die Count": 8,
    "CE Count": 4
  }
});

testPart("K9XVGY8J5A", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV5Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 92,
    "Die Count": 8,
    "CE Count": 4
  }
});

testPart("K9XVGD8J5C", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV7Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 176,
    "Die Count": 8,
    "CE Count": 4
  }
});

testPart("K99UGY8J5C", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "SSV7Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 176,
    "Die Count": 4,
    "CE Count": 4
  }
});

testPart("K9XVGD8J5D", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "SSV9Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 280,
    "Die Count": 8,
    "CE Count": 4
  }
});

test("Samsung raw NAND exposes die_stack only for DSP topology", () => {
  assertSamsungRawDieStack("K9NAGD8D0M", "DSP (4-die x2)");
  assertSamsungRawDieStack("K9MAGD8D0M", "DSP (4-die x2)");
  for (const partNumber of [
    "K9T20D8D0M",
    "K91AGD8D0M",
    "K9JAGD8D0M",
    "K98VGD8D0M",
    "K9YVGD8D0M",
    "K9XVGB8J1M",
    "K9XVGY8J5M",
    "K9XVGY8J5A",
    "K9XVGD8J5C",
    "K99UGY8J5C",
    "K9XVGD8J5D"
  ]) {
    assertSamsungRawDieStack(partNumber, undefined);
  }
});

test("Samsung raw NAND mode configuration follows nCE/RnB table", () => {
  assertSamsungRawConfiguration("K9XVGY8J0M", { ceCount: 1, rbCount: 1 });
  assertSamsungRawConfiguration("K9XVGY8J1M", { ceCount: 2, rbCount: 2 });
  assertSamsungRawConfiguration("K9XVGY8J2M", { ceCount: 4, rbCount: 2 });
  assertSamsungRawConfiguration("K9XVGY8J3M", { ceCount: 3, rbCount: 3 });
  assertSamsungRawConfiguration("K9XVGY8J4M", { ceCount: 4, rbCount: 1 });
  assertSamsungRawConfiguration("K9XVGY8J5M", { ceCount: 4, rbCount: 4 });
  assertSamsungRawConfiguration("K9XVGY8J6M", { ceCount: 6, rbCount: 2 });
  assertSamsungRawConfiguration("K9XVGY8J7M", { ceCount: 8, rbCount: 4 });
  assertSamsungRawConfiguration("K9XVGY8J8M", { ceCount: 8, rbCount: 2 });
  assertSamsungRawConfiguration("K9XVGY8J9M", { specialOption: "1st Block OTP" });
  assertSamsungRawConfiguration("K9XVGY8JAM", { specialOption: "Mask Option 1" });
  assertSamsungRawConfiguration("K9XVGY8JBM", {
    ceCount: 2,
    rbCount: 2,
    specialOption: "V4 512Gb eTLC HDP 168-FBGA"
  });
  assertSamsungRawConfiguration("K9XVGY8JCM", { ceCount: 16, rbCount: 4 });
  assertSamsungRawConfiguration("K9XVGY8JFM", { specialOption: "Fuse Option 1" });
  assertSamsungRawConfiguration("K9XVGY8JJM", {
    ceCount: 2,
    rbCount: 2,
    specialOption: "V3 256Gb eTLC HDP 316-FBGA"
  });
  assertSamsungRawConfiguration("K9XVGY8JLM", { specialOption: "Low Grade" });
});

test("Samsung raw NAND voltage follows operating-voltage table", () => {
  assertSamsungRawVoltage("0", "NONE");
  assertSamsungRawVoltage("A", "Vcc: 1.65V~3.60V");
  assertSamsungRawVoltage("B", "Vcc: 2.70V (2.50V~2.90V)");
  assertSamsungRawVoltage("C", "Vcc: 5.00V (4.50V~5.50V)");
  assertSamsungRawVoltage("D", "Vcc: 2.65V (2.40V~2.90V)");
  assertSamsungRawVoltage("E", "Vcc: 2.30V~3.60V");
  assertSamsungRawVoltage("F", "Vcc: 3.30V (2.70V~3.60V); VccQ: 1.80V (1.70V~1.95V)");
  assertSamsungRawVoltage("H", "Vcc: 3.30V (2.70V~3.60V); VccQ: 1.80V (1.70V~1.95V)");
  assertSamsungRawVoltage("J", "Vcc: 2.50V (2.35V~2.75V); VccQ: 1.20V (1.14V~1.26V)");
  assertSamsungRawVoltage("Q", "Vcc: 1.80V (1.70V~1.95V)");
  assertSamsungRawVoltage("R", "Vcc: 1.80V (1.65V~1.95V)");
  assertSamsungRawVoltage("S", "Vcc: 3.30V (2.70V~3.60V); VccQ: 1.80V (1.65V~1.95V)");
  assertSamsungRawVoltage("T", "Vcc: 2.40V~3.00V");
  assertSamsungRawVoltage("U", "Vcc: 3.30V (2.70V~3.60V)");
  assertSamsungRawVoltage("V", "Vcc: 3.30V (3.00V~3.60V)");
  assertSamsungRawVoltage("W", "Vcc: 2.70V~5.50V");
});

test("Samsung raw NAND package code emits package-first short labels only", () => {
  assertSamsungRawPackageAbsent("K9XVGY8J5M");
  assertSamsungRawPackageAbsent("K9DYGY8J5B");
  assertSamsungRawPackage("C", "FBGA-316");
  assertSamsungRawPackage("D", "FBGA-316");
  assertSamsungRawPackage("F", "FBGA-308");
  assertSamsungRawPackage("X", "FBGA-108");
  assertSamsungRawPackage("1", "FBGA-168");
  assertSamsungRawPackage("8", "TSOP-I-48");
  assertSamsungRawPackage("9", "TSOP-I-56");
  assertSamsungRawPackage("Q", "TSOP-II-44(40)");
  assertSamsungRawPackage("S", "TSOP-I-48");
  assertSamsungRawPackage("T", "BGA-152");
  assertSamsungRawPackage("Z", "WELP-48");
});

testPart("KLUCG4J1BB", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "14nm",
  cellField: "MLC",
  extra: {
    "NAND Component": "K9GDGD8U0B",
    "Die Density": "128Gb",
    "Die Stack": "QDP (4-die)",
    "CE Count": 4,
    "Product Version": "UFS 2.0",
    "Controller": "UFS 2.0 G2-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUDGAG1BD", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "16nm",
  cellField: "MLC",
  extra: {
    "NAND Component": "K9GCGD8U0D",
    "Die Density": "64Gb",
    "Die Stack": "HDP (16-die)",
    "CE Count": 8,
    "Product Version": "UFS 2.0",
    "Controller": "UFS 2.0 G2-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUEG8UHDB-C2E1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "SSV5",
  extra: {
    "NAND Component": "K9AFGD8J0B",
    "Die Density": "256Gb",
    "Die Stack": "ODP (8-die)",
    "CE Count": 8,
    "Product Version": "UFS 3.1",
    "Controller": "UFS 3.1/3.0/2.2 G4-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUFG8RHHF-F0G1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "SSV8",
  package: "BGA-153 9x13",
  extra: {
    "Die Density": "512Gb",
    "Die Stack": "ODP (8-die)",
    "Product Version": "UFS 4.0",
    "Controller": "UFS 4.0 G5-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUEG4RHKF-F0H1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "SSV8",
  package: "BGA-153 9x13",
  extra: {
    "Die Density": "512Gb",
    "Die Stack": "QDP (4-die)",
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUFG4NHKH-F0H1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  cellField: "TLC",
  package: "BGA-153 9x13",
  extra: {
    "Die Density": "1Tb",
    "Die Stack": "QDP (4-die)",
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});
