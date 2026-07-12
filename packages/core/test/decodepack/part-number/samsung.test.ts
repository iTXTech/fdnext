import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertDecodePackDieProfile,
  assertNoAdditionalFields,
  assertRuleDraftDieProfile,
  assertSearchPnIncludes,
  compiledPack,
  engineWithoutFdb,
  fieldText,
  firstField,
  partNumberPnJson,
  resourceEntries,
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

function assertSamsungRawPostDashSuffix(
  suffix: string,
  expected: { productClass?: string; operationTemperature?: string; badBlock?: string; specialOption?: string }
): void {
  const partNumber = `K9XVGY8J5M-${suffix}`;
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "package")), "FBGA-316", `${partNumber} package`);
  assert.equal(fieldText(firstField(result, "product_class")), expected.productClass, `${partNumber} product_class`);
  assert.equal(fieldText(firstField(result, "operation_temperature")), expected.operationTemperature, `${partNumber} operation_temperature`);
  assert.equal(fieldText(firstField(result, "bad_block")), expected.badBlock, `${partNumber} bad_block`);
  assert.equal(fieldText(firstField(result, "special_option")), expected.specialOption, `${partNumber} special_option`);
}

function assertSamsungRawLookupPartNumbers(partNumber: string, expected: string[]): void {
  const decoder = compiledPack.partDecoders.find((candidate) => candidate.id === "vendor.samsung.token.v1");
  const matched = decoder?.match(partNumber);
  assert.ok(decoder && matched, `${partNumber} should match Samsung raw NAND rule`);
  const draft = decoder.decode(matched);
  assert.deepEqual(draft.meta?.lookupPartNumbers, expected, `${partNumber} FDB lookup PN candidates`);
}

function assertSamsungRawOrganization(
  organizationCode: string,
  expected: { width?: string; interfaceType: string; interfaceNote?: string }
): void {
  const partNumber = `K9XVG${organizationCode}J5M`;
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(result.device?.vendor.id, "samsung", `${partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "device_width")), expected.width, `${partNumber} device_width`);
  assert.equal(fieldText(firstField(result, "interface_type")), expected.interfaceType, `${partNumber} interface_type`);
  assert.equal(fieldText(firstField(result, "interface_note")), expected.interfaceNote, `${partNumber} interface_note`);
  assert.equal(firstField(result, "toggle"), undefined, `${partNumber} should not expose legacy toggle field`);
  assert.equal(firstField(result, "special_option"), undefined, `${partNumber} organization notes should not use special_option`);
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
    "Die Count": 1,
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
    "Die Count": 1,
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
    "Die Count": 2
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

for (const [partNumber, densityMbit, dieDensity, dieCount, productVersion, controller, interfaceType, packageName] of [
  ["KLM4G1YEMD-C031", 32768, "32Gb", 1, "eMMC 5.0", "eMMC 5.0 Controller", "HS400", undefined],
  ["KLMAG2WEMB-B031", 131072, "64Gb", 2, "eMMC 5.0", "eMMC 5.0 Controller", "HS400", "BGA-153, 11.5x13"],
  ["KLMDGAGEAC-B001", 1048576, "64Gb", 16, "eMMC 4.5", "eMMC 4.5 Controller", "HS200", "BGA-153, 11.5x13"]
] as const) {
  testPart(partNumber, {
    vendor: "samsung",
    type: "eMMC",
    densityMbit,
    package: packageName,
    extra: {
      "Die Density": dieDensity,
      "Die Count": dieCount,
      "Product Version": productVersion,
      "Controller": controller,
      "Interface Type": interfaceType
    },
    absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
  });
}

test("Samsung legacy eMMC W/Y NAND tokens do not guess cell level", () => {
  for (const partNumber of ["KLM4G1YEMD-C031", "KLMAG2WEMB-B031"]) {
    const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
    assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
    assert.equal(firstField(result, "cell_level"), undefined, `${partNumber} cell_level`);
  }
});

assertSearchPnIncludes("KLM4G1YEMD-C031", "Samsung KLM4G1YEMD-C031");

for (const [partNumber, densityMbit, packageName, operationTemperature] of [
  ["KLMCG8GESD-B04Q", 524288, "BGA-153, 11.5x13x1.0", "-40°C ~ 105°C Automotive Grade 2"],
  ["KLMBG4GESD-B04Q", 262144, "BGA-153, 11.5x13x1.0", "-40°C ~ 105°C Automotive Grade 2"],
  ["KLMBG4GEUF-B04Q", 262144, "BGA-153, 11.5x13x0.8", "-40°C ~ 105°C Automotive Grade 2"],
  ["KLMDG8JEUD-B04P", 1048576, "BGA-153, 11.5x13x1.2", "-40°C ~ 95°C Automotive Grade 3"],
  ["KLMCG1RCTE-B041", 524288, "BGA-153, 11.5x13x0.8", "-25°C ~ 85°C"],
  ["KLMCG8GEND-B041", 524288, "BGA-153, 11.5x13x1.0", "-25°C ~ 85°C"]
] as const) {
  testPart(partNumber, {
    vendor: "samsung",
    type: "eMMC",
    densityMbit,
    package: packageName,
    extra: {
      "Product Version": "eMMC 5.1",
      "Interface Type": "HS400",
      "Operation Temperature": operationTemperature
    },
    absentExtra: ["Package Code", "Reference Status", "Inference Source", "source", "status"]
  });
}

testPart("KLMDG1NCAB-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "SSV8",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 1,
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLMDG1NCABB041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "SSV8",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 1,
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMGD6001BM-B421", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 262144,
  package: "FBGA-221, 11.5x13x1.0",
  extra: {
    "Storage Density": "32GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "Package Code": "FBGA-221",
    "Config Code": "B421"
  },
  absentExtra: ["Group", "Product Mode", "Product Family", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMGE6001BM-B421", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 131072,
  package: "BGA-221",
  extra: {
    "Storage Density": "16GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866",
    "Package Code": "FBGA-221",
    "Config Code": "B421"
  },
  absentExtra: ["Group", "Product Mode", "Product Family", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMDT6001ZM-A625", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 131072,
  package: "FBGA-144",
  extra: {
    "Storage Density": "16GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMDP6001DA-B425", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 524288,
  package: "FBGA-254",
  extra: {
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMFN60012B-B214", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 65536,
  package: "FBGA-221",
  extra: {
    "Storage Density": "8GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KM5L9000CM-B424", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 1048576,
  package: "FBGA-254",
  extra: {
    "Storage Density": "128GB UFS",
    "Storage Interface": "UFS 2.2",
    "DRAM Density": "48Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KM8V9001JM-B813", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 1048576,
  package: "FBGA-254",
  extra: {
    "Storage Density": "128GB UFS",
    "Storage Interface": "UFS 2.2",
    "DRAM Density": "64Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KM8F8001JA-B813", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA-254",
  extra: {
    "Storage Density": "256GB UFS",
    "Storage Interface": "UFS 2.1",
    "DRAM Density": "64Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KMJS9001RM-BG01", {
  vendor: "samsung",
  type: "uMCP",
  densityMbit: 2097152,
  package: "FBGA-297",
  extra: {
    "Storage Density": "256GB UFS",
    "Storage Interface": "UFS 3.1",
    "DRAM Density": "96Gb",
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "LPDDR5-6400"
  },
  absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
});

for (const [partNumber, densityMbit, storageDensity, storageInterface, dramSpeed] of [
  ["KM2B8001CM-BB01", 2097152, "256GB UFS", "UFS 2.1", "LPDDR4X-3733"],
  ["KM2H7001CM-B518", 524288, "64GB UFS", "UFS 2.1", "LPDDR4X-4266"],
  ["KM2L9001CM-B518", 1048576, "128GB UFS", "UFS 2.2", "LPDDR4X-4266"],
  ["KM2V7001CM-B706", 1048576, "128GB UFS", "UFS 2.1", "LPDDR4X-3733"]
] as const) {
  testPart(partNumber, {
    vendor: "samsung",
    type: "uMCP",
    densityMbit,
    package: "FBGA-254",
    extra: {
      "Storage Density": storageDensity,
      "Storage Interface": storageInterface,
      "DRAM Density": "48Gb",
      "DRAM Type": "LPDDR4X",
      "DRAM Speed": dramSpeed
    },
    absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
  });
}

for (const partNumber of ["KMGD6001BM-B421", "KM5L9000CM-B424", "KM8F8001JA-B813", "KMJS9001RM-BG01", "KM2L9001CM-B518"]) {
  assertNoAdditionalFields(partNumber);
}

test("Samsung MCP resource PNs expose complete structured core fields", () => {
  const samsungMcpParts = resourceEntries(partNumberPnJson).filter((entry): entry is { vendor: string; pn: string } => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    return item.vendor === "samsung" && typeof item.pn === "string" && item.pn.startsWith("KM");
  });
  assert.equal(samsungMcpParts.length, 66, "Samsung MCP resource audit count");
  for (const { pn } of samsungMcpParts) {
    const result = engineWithoutFdb.decodePart({ query: pn, lang: "eng" });
    assert.equal(result.status, "ok", `${pn} should decode`);
    assert.ok(result.device?.productType, `${pn} product type`);
    for (const field of ["storage_density", "storage_interface", "dram_type", "dram_density", "dram_speed", "package"]) {
      assert.ok(firstField(result, field), `${pn} ${field}`);
    }
  }
});

for (const [partNumber, type, storageDensity, storageInterface, dramDensity, dramType, dramSpeed, packageName] of [
  ["KM3P6001CM-B517", "eMCP", "64GB eMMC", "eMMC 5.1", "48Gb", "LPDDR4X", "LPDDR4X-4266", "FBGA-254"],
  ["KM3V6001CM-B705", "eMCP", "128GB eMMC", "eMMC 5.1", "48Gb", "LPDDR4X", "LPDDR4X-3733", "FBGA-254"],
  ["KM3V6001CA-B708", "eMCP", "128GB eMMC", "eMMC 5.1", "48Gb", "LPDDR4X", "LPDDR4X-4266", "FBGA-254"],
  ["KM4X60002M-B321", "eMCP", "32GB eMMC", "eMMC 5.1", "24Gb", "LPDDR4X", "LPDDR4X-4266", "FBGA-254"],
  ["KM8F8001LM-B813", "uMCP", "256GB UFS", "UFS 2.1", "80Gb", "LPDDR4X", "LPDDR4X-4266", "FBGA-254"],
  ["KM8F8001MM-B813", "uMCP", "256GB UFS", "UFS 2.1", "96Gb", "LPDDR4X", "LPDDR4X-4266", "FBGA-254"],
  ["KMAIA001PM-B819", "uMCP", "256GB UFS", "UFS 3.1", "64Gb", "LPDDR5", "LPDDR5-6400", "FBGA-297"],
  ["KMJIA001RM-BC07", "uMCP", "256GB UFS", "UFS 3.1", "96Gb", "LPDDR5", "LPDDR5-6400", "FBGA-297"],
  ["KMQX60013A-B419", "eMCP", "32GB eMMC", "eMMC 5.1", "16Gb", "LPDDR3", "LPDDR3-1866", "FBGA-221"],
  ["KMRP60014M-B614", "eMCP", "64GB eMMC", "eMMC 5.1", "32Gb", "LPDDR3", "LPDDR3-1866", "FBGA-221"]
] as const) {
  testPart(partNumber, {
    vendor: "samsung",
    type,
    package: packageName,
    extra: {
      "Storage Density": storageDensity,
      "Storage Interface": storageInterface,
      "DRAM Density": dramDensity,
      "DRAM Type": dramType,
      "DRAM Speed": dramSpeed
    },
    absentExtra: ["Product Mode", "Product Family", "Config Code", "Package Code", "Reference Status", "Inference Source", "source", "status"]
  });
}

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

testPart("K9AHGD8J0C", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 524288,
  density: "64GB",
  dieProfileField: "SSV6P",
  cellField: "TLC",
  widthField: "x8",
  detailFields: {
    "Product Generation": 6,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    Process: "SSV6P",
    "Layer Count": 133,
    "Interface Type": "Toggle DDR"
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
    "Product Class": "Commercial",
    "Operation Temperature": "0~70C",
    "Special Option": "Special Handling"
  },
  absentExtra: ["Bad block", "Lead free", "Halogen free", "CU"]
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

test("Samsung raw NAND organization emits interface marker without legacy toggle notes", () => {
  assertSamsungRawOrganization("00", { interfaceType: "NONE" });
  assertSamsungRawOrganization("08", { width: "x8", interfaceType: "SDR" });
  assertSamsungRawOrganization("16", { width: "x16", interfaceType: "SDR" });
  assertSamsungRawOrganization("32", { width: "x32", interfaceType: "SDR" });
  assertSamsungRawOrganization("64", { width: "x64", interfaceType: "SDR" });
  assertSamsungRawOrganization("Z8", { width: "x8", interfaceType: "SDR", interfaceNote: "SSD" });
  assertSamsungRawOrganization("D8", { width: "x8", interfaceType: "Toggle DDR" });
  assertSamsungRawOrganization("Y8", { width: "x8", interfaceType: "Toggle DDR", interfaceNote: "HP" });
  assertSamsungRawOrganization("B8", { width: "x8", interfaceType: "Toggle DDR", interfaceNote: "HP w/ FBI Chip" });
  assertSamsungRawOrganization("W8", { width: "x8", interfaceType: "Toggle DDR", interfaceNote: "Wafer" });
  for (const organizationCode of ["K8", "S8", "A8", "C8"]) {
    assertSamsungRawOrganization(organizationCode, { width: "x8", interfaceType: "Toggle DDR" });
  }
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

test("Samsung raw NAND post-dash temperature token splits class and range", () => {
  assertSamsungRawPostDashSuffix("C0B", { badBlock: "Include Bad Block" });
  assertSamsungRawPostDashSuffix("C30", { productClass: "Wafer Level 3" });
  assertSamsungRawPostDashSuffix("CC0", { productClass: "Commercial", operationTemperature: "0~70C" });
  assertSamsungRawPostDashSuffix("CE0", { productClass: "Extended Commercial", operationTemperature: "-25~85C" });
  assertSamsungRawPostDashSuffix("CI0", { productClass: "Industrial", operationTemperature: "-40~85C" });
  assertSamsungRawPostDashSuffix("CF0", { productClass: "Automotive Grade 3", operationTemperature: "-40~85C" });
  assertSamsungRawPostDashSuffix("CH0", { productClass: "Automotive Grade 2", operationTemperature: "-40~105C" });
  assertSamsungRawPostDashSuffix("CS0", { productClass: "SmartMedia BLACK", operationTemperature: "0~55C" });
  assertSamsungRawPostDashSuffix("CB0", { productClass: "SmartMedia BLUE", operationTemperature: "0~55C" });
});

test("Samsung raw NAND records DecodePack-derived FDB lookup PN before package suffix", () => {
  assertSamsungRawLookupPartNumbers("K9DYGY8J5B", ["K9DYGY8J5B"]);
  assertSamsungRawLookupPartNumbers("K9DYGY8J5B-CCK0", ["K9DYGY8J5B"]);
});

test("Samsung raw NAND post-dash bad-block token emits strategy labels only", () => {
  assertSamsungRawPostDashSuffix("CCA", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "Apple Bad Block"
  });
  assertSamsungRawPostDashSuffix("CCB", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "Include Bad Block"
  });
  assertSamsungRawPostDashSuffix("CCD", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "Daisychain Sample"
  });
  assertSamsungRawPostDashSuffix("CCE", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "Enterprise MLC"
  });
  assertSamsungRawPostDashSuffix("CCJ", { productClass: "Commercial", operationTemperature: "0~70C" });
  assertSamsungRawPostDashSuffix("CCK", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    specialOption: "Special Handling"
  });
  assertSamsungRawPostDashSuffix("CCL", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "1-5 Bad Block"
  });
  assertSamsungRawPostDashSuffix("CCN", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "ini 0 blk, add 10 blk"
  });
  assertSamsungRawPostDashSuffix("CCS", {
    productClass: "Commercial",
    operationTemperature: "0~70C",
    badBlock: "All Good Block"
  });
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
  assertSamsungRawPackage("Q", "TSOP-II-44/40");
  assertSamsungRawPackage("S", "TSOP-I-48");
  assertSamsungRawPackage("T", "BGA-152");
  assertSamsungRawPackage("Z", "WELP-48");
});

test("Samsung raw NAND separates legacy SDR and modern Toggle DDR package tables", () => {
  const legacyJ = engineWithoutFdb.decodePart({ query: "K9F1208U0C-JIB00", lang: "eng" });
  assert.equal(legacyJ.device?.vendor.id, "samsung", "legacy J package vendor");
  assert.equal(legacyJ.device?.chipKind, "raw_nand", "legacy J package chip kind");
  assert.equal(fieldText(firstField(legacyJ, "package")), "FBGA", "legacy SDR J package token");
  assert.equal(fieldText(firstField(legacyJ, "operation_temperature")), "-40~85C", "legacy J temperature");

  const legacyP = engineWithoutFdb.decodePart({ query: "K9F1208U0C-PIB00", lang: "eng" });
  assert.equal(fieldText(firstField(legacyP, "package")), "TSOP-I-48", "legacy SDR P package token");
  assert.equal(fieldText(firstField(legacyP, "operation_temperature")), "-40~85C", "legacy P temperature");

  const legacyD = engineWithoutFdb.decodePart({ query: "K9F1208U0C-DCB0", lang: "eng" });
  assert.equal(fieldText(firstField(legacyD, "package")), "TBGA-63", "legacy SDR D package token");
  const legacyF = engineWithoutFdb.decodePart({ query: "K9F1208U0C-FCB0", lang: "eng" });
  assert.equal(fieldText(firstField(legacyF, "package")), "WSOP", "legacy SDR F package token");
  const legacySsd = engineWithoutFdb.decodePart({ query: "K9F12Z8U0C-PCB0", lang: "eng" });
  assert.equal(fieldText(firstField(legacySsd, "package")), "TSOP-I-48", "legacy Z8 SSD package context");

  assertSamsungRawPackage("D", "FBGA-316");
  assertSamsungRawPackage("F", "FBGA-308");
});

testPart("KLUCG4J1BB", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "14nm",
  cellField: "MLC",
  extra: {
    "Die Density": "128Gb",
    "Die Count": 4,
    "Product Version": "UFS 2.0",
    "Controller": "UFS 2.0 G2-2Lane Controller"
  },
  absentExtra: ["NAND Component", "CE Count", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUDGAG1BD", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "16nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 16,
    "Product Version": "UFS 2.0",
    "Controller": "UFS 2.0 G2-2Lane Controller"
  },
  absentExtra: ["NAND Component", "CE Count", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUGGAR1FA-B2C1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 8388608,
  package: "BGA-153, 11.5x13x1.4",
  extra: {
    "Product Version": "UFS 2.1",
    "Controller": "UFS 2.1 G3-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUEG8UHDB-C2E1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "SSV5",
  extra: {
    "Die Density": "256Gb",
    "Die Count": 8,
    "Product Version": "UFS 3.1",
    "Controller": "UFS 3.1/3.0/2.2 G4-2Lane Controller"
  },
  absentExtra: ["NAND Component", "CE Count", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUEG8U1YB-B0CP", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "SSV5",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Die Density": "256Gb",
    "Die Count": 8,
    "Product Version": "UFS 2.1",
    "Controller": "UFS 2.1 G3-2Lane Controller (Automotive Grade only)",
    "Operation Temperature": "-40°C ~ 95°C Automotive Grade 3"
  },
  absentExtra: ["Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUFG8RHDA-B2D1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "SSV5",
  package: "BGA-153, 11.5x13x1.0",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 8,
    "Product Version": "UFS 3.0",
    "Controller": "UFS 3.1/3.0/2.2 G4-2Lane Controller",
    "Operation Temperature": "-25°C ~ 85°C Extended Commercial"
  },
  absentExtra: ["Package Code", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUFG8RHHF-F0G1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "SSV8",
  package: "BGA-153, 9x13",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 8,
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
  package: "BGA-153, 9x13",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 4,
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUGGGRHKF-F0H1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "SSV8",
  cellField: "TLC",
  package: "BGA-153, 9x13",
  extra: {
    "Die Density": "512Gb",
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Die Count", "Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUFG4NHKH-F0H1", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  cellField: "TLC",
  package: "BGA-153, 9x13",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 4,
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUGGARHUF-F0HQ", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 8388608,
  cellField: "TLC",
  dieProfileField: "SSV8",
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 16,
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller (Automotive)",
    "Operation Temperature": "-40°C ~ 105°C Automotive Grade 2"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

testPart("KLUGGARHUF-F0HP", {
  vendor: "samsung",
  type: "UFS",
  densityMbit: 8388608,
  package: "BGA-153, 11.5x13x1.2",
  extra: {
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller (Automotive)",
    "Operation Temperature": "-40°C ~ 95°C Automotive Grade 3"
  },
  absentExtra: ["Package Code", "Reference Status", "Inference Source", "source", "status"]
});

for (const [partNumber, densityMbit, packageName, controller, operationTemperature] of [
  [
    "KLUCG1RHVF-B0EP",
    524288,
    "BGA-153, 11.5x13x1.2",
    "UFS 3.1 G4-2Lane Controller (Automotive)",
    "-40°C ~ 95°C Automotive Grade 3"
  ],
  [
    "KLUEG8UHYB-B0EP",
    2097152,
    "BGA-153, 11.5x13x1.2",
    "UFS 3.1/2.1 G4-2Lane Controller (Automotive Grade only)",
    "-40°C ~ 95°C Automotive Grade 3"
  ],
  [
    "KLUDG4UHDB-B2E1",
    1048576,
    "BGA-153, 11.5x13x0.8",
    "UFS 3.1/3.0/2.2 G4-2Lane Controller",
    "-25°C ~ 85°C Extended Commercial"
  ],
  [
    "KLUFG4LHGC-B0E1",
    4194304,
    "BGA-153, 11x13x1.0",
    "UFS 3.1 G4-2Lane Controller",
    "-25°C ~ 85°C Extended Commercial"
  ]
] as const) {
  testPart(partNumber, {
    vendor: "samsung",
    type: "UFS",
    densityMbit,
    package: packageName,
    extra: {
      "Product Version": "UFS 3.1",
      "Controller": controller,
      "Operation Temperature": operationTemperature
    },
    absentExtra: ["Package Code", "Reference Status", "Inference Source", "source", "status"]
  });
}
