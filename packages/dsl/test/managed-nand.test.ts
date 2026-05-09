import assert from "node:assert/strict";
import type { FieldValue, PartDecodeResult } from "../../core/src/index";
import { createEngine } from "../../core/src/index";
import { embeddedResources } from "../../resources/index";
import managedNandPnJson from "../../resources/resources/managed-nand-pn.json" with { type: "json" };
import { compileRulesToDecoders, defaultDslRules } from "../src/index";

const engine = createEngine({
  resources: embeddedResources,
  decoders: compileRulesToDecoders(defaultDslRules)
});

interface TestPartInfo {
  partNumber: string;
  rawVendor?: string;
  type?: string;
  rawDensity?: number;
  density?: string;
  processNode?: string;
  cellLevel?: string;
  classification?: Record<string, unknown>;
  voltage?: string;
  interface?: Record<string, unknown>;
  package?: string;
  extraInfo: Record<string, unknown>;
}

function fields(result: PartDecodeResult): FieldValue[] {
  return result.blocks.flatMap((block) => block.fields);
}

function firstField(result: PartDecodeResult, ...keys: string[]): FieldValue | undefined {
  const all = fields(result);
  for (const key of keys) {
    const field = all.find((item) => item.key === key);
    if (field) return field;
  }
  return undefined;
}

function fieldText(field: FieldValue | undefined): unknown {
  return field ? field.display ?? field.value : undefined;
}

function partType(result: PartDecodeResult): string | undefined {
  const product = firstField(result, "product_type");
  if (product?.display) return product.display;
  if (result.device?.chipKind === "on_die_ecc_nand") return "On-die ECC NAND";
  if (result.device?.chipKind === "raw_nand") return "NAND";
  if (result.device?.chipKind === "dram") return "DRAM";
  return typeof product?.value === "string" ? product.value : result.device?.chipKind;
}

function densityField(result: PartDecodeResult): FieldValue | undefined {
  return firstField(result, "density", "storage_density", "dram_density");
}

function detect(partNumber: string): TestPartInfo {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  const density = densityField(result);
  const extraInfo: Record<string, unknown> = {};
  for (const field of fields(result)) {
    if (["vendor", "chip_kind", "product_type", "part_number"].includes(field.key)) continue;
    extraInfo[field.label] = fieldText(field);
  }
  return {
    partNumber,
    rawVendor: result.device?.vendor.id,
    type: partType(result),
    rawDensity: typeof density?.value === "number" ? density.value : undefined,
    density: density?.display,
    processNode: fieldText(firstField(result, "process_node")) as string | undefined,
    cellLevel: fieldText(firstField(result, "cell_level")) as string | undefined,
    voltage: fieldText(firstField(result, "voltage", "dram_voltage")) as string | undefined,
    package: fieldText(firstField(result, "package")) as string | undefined,
    extraInfo
  };
}

function extra(info: TestPartInfo): Record<string, unknown> {
  return info.extraInfo;
}

function assertKnownOrOmitted(actual: unknown, expected: unknown, message: string): void {
  if (expected === "Unknown" && actual === undefined) {
    return;
  }
  assert.equal(actual, expected, message);
}

function assertPart(
  partNumber: string,
  expected: {
    rawVendor: string;
    type: string;
    rawDensity?: number;
    density?: string;
    processNode?: string;
    cellLevel?: string;
    classification?: Record<string, unknown>;
    voltage?: string;
    interface?: Record<string, unknown>;
    package?: string;
    extra?: Record<string, unknown>;
    absentExtra?: string[];
  }
): void {
  const info = detect(partNumber);
  assert.equal(info.rawVendor, expected.rawVendor, partNumber);
  assert.equal(info.type, expected.type, partNumber);

  if (expected.rawDensity !== undefined) {
    assert.equal(info.rawDensity, expected.rawDensity, partNumber);
  }
  if (expected.density !== undefined) {
    assertKnownOrOmitted(info.density, expected.density, partNumber);
  }
  if (expected.processNode !== undefined) {
    assertKnownOrOmitted(info.processNode, expected.processNode, partNumber);
  }
  if (expected.cellLevel !== undefined) {
    assertKnownOrOmitted(info.cellLevel, expected.cellLevel, partNumber);
  }
  if (expected.classification !== undefined) {
    assert.ok(info.classification == null || typeof info.classification === "object", partNumber);
  }
  if (expected.voltage !== undefined) {
    assertKnownOrOmitted(info.voltage, expected.voltage, partNumber);
  }
  if (expected.interface !== undefined) {
    assert.ok(info.interface == null || typeof info.interface === "object", partNumber);
  }
  if (expected.package !== undefined) {
    assertKnownOrOmitted(info.package, expected.package, partNumber);
  }
  if (expected.extra) {
    const extraInfo = extra(info);
    for (const [key, value] of Object.entries(expected.extra)) {
      assert.equal(extraInfo[key], value, `${partNumber} extraInfo.${key}`);
    }
  }
  if (expected.absentExtra) {
    const extraInfo = extra(info);
    for (const key of expected.absentExtra) {
      assert.equal(Object.hasOwn(extraInfo, key), false, `${partNumber} should not expose extraInfo.${key}`);
    }
  }
}

function assertSearchPnIncludes(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

function assertSearchPnFirst(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer managed NAND PN suggestions`);
}

function resourceEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const entries = (raw as Record<string, unknown>).entries;
  return Array.isArray(entries) ? entries : [];
}

assert.ok(Array.isArray(managedNandPnJson), "managed NAND PN resource should be a top-level minimal array");
const managedNandPn = resourceEntries(managedNandPnJson);
const managedNandPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);
const seenManagedNandPn = new Set<string>();
for (const entry of managedNandPn) {
  assert.equal(typeof entry, "object", "managed NAND PN entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "managed NAND PN entry should be keyed");
  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.pn, "string", "managed NAND PN entry should include pn");
  assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
  assert.deepEqual(Object.keys(record).sort(), ["pn", "vendor"], `${String(record.pn)} should only include vendor and pn`);
  const key = `${String(record.vendor)}\0${String(record.pn)}`;
  assert.ok(!seenManagedNandPn.has(key), `${String(record.pn)} should only appear once for ${String(record.vendor)}`);
  seenManagedNandPn.add(key);

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((key) => managedNandPnForbiddenKeys.has(key)),
    [],
    `managed NAND PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

assertPart("SDINBDA6-256G-XI1", {
  rawVendor: "sndk",
  type: "eMMC",
  rawDensity: 2097152,
  processNode: "BiCS3 64L",
  extra: {
    "Product Family": "iNAND IX EM132",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Extended Temperature",
    "Product Generation": "BiCS3 64L 3D NAND"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINBDG4-32G-ZA3", {
  rawVendor: "sndk",
  type: "eMMC",
  rawDensity: 262144,
  processNode: "2D NAND",
  extra: {
    "Product Family": "iNAND 7250 / EM122-class",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINFDK4-128G", {
  rawVendor: "sndk",
  type: "UFS",
  rawDensity: 1048576,
  processNode: "3D NAND",
  extra: {
    "Product Family": "iNAND MC EU521",
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINDDH6-128G-ZA2", {
  rawVendor: "sndk",
  type: "UFS",
  rawDensity: 1048576,
  processNode: "3D NAND",
  extra: {
    "Product Family": "iNAND AT EU312",
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINZZZ9-128G-ABC", {
  rawVendor: "sndk",
  type: "iNAND",
  rawDensity: 1048576
});

assertPart("THGBMNG5D1LBAIT", {
  rawVendor: "kioxia",
  type: "eMMC",
  rawDensity: 32768,
  processNode: "15 nm/1z",
  package: "BGA153",
  extra: {
    "Series Code": "BMN",
    "Storage Interface": "eMMC 5.0",
    "NAND Technology": "FG NAND"
  },
  absentExtra: ["Product Version", "Product Generation"]
});

assertPart("THGAMVT0T43BAB8", {
  rawVendor: "kioxia",
  type: "eMMC",
  rawDensity: 1048576,
  processNode: "BiCS4",
  package: "BGA",
  extra: {
    "Series Code": "AMV",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive AEC-Q100 Grade 2"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGJFRT3E88BATW", {
  rawVendor: "kioxia",
  type: "UFS",
  rawDensity: 8388608,
  processNode: "BiCS8",
  package: "BGA",
  extra: {
    "Series Code": "JFR",
    "Storage Interface": "UFS 4.1",
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGJFJT1T45BAB8", {
  rawVendor: "kioxia",
  type: "UFS",
  rawDensity: 2097152,
  processNode: "BiCS4",
  package: "BGA",
  extra: {
    "Series Code": "JFJ",
    "Storage Interface": "UFS 4.0",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGAFBT1T83BAA5", {
  rawVendor: "kioxia",
  type: "UFS",
  rawDensity: 2097152,
  processNode: "BiCS8",
  package: "BGA",
  extra: {
    "Series Code": "AFB",
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive AEC-Q100 Grade 3",
    "Speed Grade": "1160 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGVX1G7D2GLA08", {
  rawVendor: "kioxia",
  type: "E2NAND",
  rawDensity: 131072,
  processNode: "24 nm A-type",
  cellLevel: "MLC",
  package: "LGA52 (14 x 18 x 1.04)",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    Plane: 2
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("TCGVX1G7D2GLA08", {
  rawVendor: "kioxia",
  type: "E2NAND",
  rawDensity: 131072,
  processNode: "24 nm A-type",
  cellLevel: "MLC",
  package: "LGA52 (14 x 18 x 1.04)",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    Plane: 2
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("THGBX2G7D2JLA01", {
  rawVendor: "kioxia",
  type: "E2NAND",
  rawDensity: 131072,
  processNode: "19 nm/1x",
  cellLevel: "MLC",
  package: "LGA60",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    Plane: 2
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("MT29FB16T08GALAAM5-TES:B", {
  rawVendor: "micron",
  type: "On-die ECC NAND",
  rawDensity: 16777216,
  cellLevel: "QLC",
  classification: {
    ce: 0,
    ch: 1,
    rb: 0,
    die: 1
  },
  voltage: "Vcc: 2.5V/3.3V, VccQ: 1.2V",
  interface: {
    async: true,
    sync: false
  },
  package: "BGA132",
  extra: {
    Enterprise: "No",
    "Die Code": "A-Die",
    "Interface Type": "Async",
    "ECC enabled": "Yes"
  },
  absentExtra: [
    "System",
    "Product Family",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code"
  ]
});

assertPart("MT29FB8T08EALAAM5-QK:E", {
  rawVendor: "micron",
  type: "On-die ECC NAND",
  rawDensity: 8388608,
  cellLevel: "TLC",
  classification: {
    ce: 0,
    ch: 1,
    rb: 0,
    die: 1
  },
  voltage: "Vcc: 2.5V/3.3V, VccQ: 1.2V",
  interface: {
    async: true,
    sync: false
  },
  package: "BGA132",
  extra: {
    Enterprise: "No",
    "Die Code": "A-Die",
    "Interface Type": "Async",
    "ECC enabled": "Yes"
  },
  absentExtra: [
    "System",
    "Product Family",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code"
  ]
});

assertPart("NC103", {
  rawVendor: "micron",
  type: "On-die ECC NAND",
  rawDensity: 16777216,
  cellLevel: "QLC",
  classification: {
    ce: 0,
    ch: 1,
    rb: 0,
    die: 1
  },
  voltage: "Vcc: 2.5V/3.3V, VccQ: 1.2V",
  interface: {
    async: true,
    sync: false
  },
  package: "BGA132",
  extra: {
    "Micron Part Number": "MT29FB16T08GALAAM5-TES:B",
    Enterprise: "No",
    "Die Code": "A-Die",
    "Interface Type": "Async",
    "ECC enabled": "Yes"
  },
  absentExtra: [
    "System",
    "Product Family",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code"
  ]
});

assertPart("H26M78208CMRX", {
  rawVendor: "skhynix",
  type: "eMMC",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("H26M78208CMRN", {
  rawVendor: "skhynix",
  type: "eMMC",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Commercial / Mobile"
  }
});

assertPart("H26M91208HPRX", {
  rawVendor: "skhynix",
  type: "eMMC",
  density: "Unknown",
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("HN8T25DEHKX077N", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 4194304,
  package: "153FBGA",
  extra: {
    "Series Code": "DE",
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("HN8T35DZHKX079", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 8388608,
  package: "153FBGA",
  extra: {
    "Series Code": "DZ",
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("HN8G962EHKX037N", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 524288,
  package: "153FBGA",
  extra: {
    "Series Code": "2E",
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("H28SAO301MMR", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 4194304,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H28S8Q302CMR", {
  rawVendor: "skhynix",
  type: "UFS",
  rawDensity: 1048576,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H25T2TB88E-X321-N", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 4194304,
  processNode: "128L 4D NAND (V6 / H25FTB0)",
  cellLevel: "TLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Density Code": "2T",
    "Product Generation": "128-layer 4D NAND (V6 / H25FTB0)",
    "Component Density": "4Tbit package",
    "Product Class": "TLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25T1TD48C-X630", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 2097152,
  processNode: "238L 4D NAND (V8)",
  cellLevel: "TLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Density Code": "1T",
    "Product Generation": "238-layer 4D NAND (V8 / H25FTD0)",
    "Die Density": "512Gb"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25T2TC88C", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 4194304,
  processNode: "176L 4D NAND (V7 / H25FTC0)",
  cellLevel: "TLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Product Generation": "176-layer 4D NAND (V7 / H25FTC0)",
    "Component Density": "4Tbit package"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25T2TD88C-X682", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 4194304,
  processNode: "238L 4D NAND (V8 / H25FTD0)",
  cellLevel: "TLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Product Generation": "238-layer 4D NAND (V8 / H25FTD0)",
    "Component Density": "4Tbit package"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25T0QA18CX542", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 1048576,
  processNode: "176L 4D NAND QLC (V7Q)",
  cellLevel: "QLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Product Generation": "176-layer 4D NAND QLC (V7Q)",
    "Product Class": "QLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25T4QM88G", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 2097152,
  processNode: "321-layer 4D NAND QLC (V9Q)",
  cellLevel: "QLC",
  extra: {
    System: "SK hynix H25T NAND package",
    "Product Generation": "321-layer 4D NAND QLC (V9Q)",
    "Component Density": "2Tb die",
    "Product Class": "QLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25QEM8A1B", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 262144,
  processNode: "3D NAND V4 MLC",
  cellLevel: "MLC",
  extra: {
    System: "SK hynix H25 NAND",
    "Product Generation": "3D NAND V4 MLC",
    "Product Class": "MLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25JGQ8A1M8R", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 1048576,
  processNode: "3D NAND V5 QLC",
  cellLevel: "QLC",
  extra: {
    System: "SK hynix H25 NAND",
    "Product Generation": "3D NAND V5 QLC",
    "Product Class": "QLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H25G9TC18CX488", {
  rawVendor: "skhynix",
  type: "NAND",
  rawDensity: 524288,
  processNode: "176L 4D NAND (V7)",
  cellLevel: "TLC",
  extra: {
    System: "SK hynix H25 NAND",
    "Product Generation": "176L 4D NAND (V7)",
    "Product Class": "TLC"
  },
  absentExtra: ["Reference Status", "Inference Source"]
});

assertPart("H2DTDG8UD1MYR", {
  rawVendor: "skhynix",
  type: "E2NAND",
  rawDensity: 131072,
  processNode: "26nm",
  cellLevel: "MLC",
  deviceWidth: "x8",
  package: "VLGA",
  extra: {
    "Product Version": "E2NAND2.0",
    "Density Code": "DG",
    "Block size": "2MB (8KB page)",
    "ECC enabled": "Yes"
  }
});

assertPart("H2JTDG8UD1BMS", {
  rawVendor: "skhynix",
  type: "E2NAND",
  rawDensity: 131072,
  processNode: "1xnm class",
  cellLevel: "MLC",
  deviceWidth: "x8",
  package: "VLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Density Code": "DG",
    "Block size": "4MB",
    "ECC enabled": "Yes"
  }
});

assertPart("H9TQ17ABJTMCUR-KUM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 131072,
  package: "221Ball FBGA",
  extra: {
    System: "SK hynix CI-MCP",
    "Product Mode": "CI-MCP NAND DDR3",
    "Storage Density": "16GB e-NAND",
    "DRAM Density": "16Gb LPDDR3"
  }
});

assertPart("H9TP32A4GDBCPR-KGM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 32768,
  package: "162Ball FBGA",
  extra: {
    System: "SK hynix CI-MCP",
    "Product Mode": "CI-MCP NAND DDR2",
    "Storage Density": "4GB e-NAND"
  }
});

assertPart("H9HP52ACPMADAR-KMM", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 524288,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "eMCP NAND DDR4",
    "Storage Density": "64GB eMMC"
  },
  absentExtra: ["System"]
});

assertPart("H9AG9G5ANBX100", {
  rawVendor: "skhynix",
  type: "eMCP",
  rawDensity: 524288,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 eMCP",
    "Storage Interface": "eMMC 5.0"
  },
  absentExtra: ["System"]
});

assertPart("H9QT0GECN6X145", {
  rawVendor: "skhynix",
  type: "uMCP",
  rawDensity: 1048576,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 uMCP",
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System"]
});

assertPart("H9HQ15ACPMADAR-KEM", {
  rawVendor: "skhynix",
  type: "uMCP",
  rawDensity: 1048576,
  package: "254Ball FBGA",
  extra: {
    "Storage Density": "128GB UFS",
    "DRAM Density": "32Gb LPDDR4X"
  },
  absentExtra: ["System"]
});

assertPart("MTFC4GACAJCN-1M WT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 32768,
  package: "153-ball VFBGA 11.5x13x1.0 (SAC 302)",
  extra: {
    "NAND Component": "AC",
    "Controller Code": "AJ",
    "Package Code": "CN",
    "Product Generation": "Fourth",
    "Product Version": "eMMC 5.0",
    "Special Option": "2MB MAX boot area / 100% MAX enhanced"
  },
  absentExtra: ["Component Generation", "Product Family", "Group"]
});

assertPart("MTFC8GLTEA-WT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 65536,
  package: "153-ball WFBGA 11.5x13x0.8",
  extra: {
    "NAND Component": "L",
    "Controller Code": "T",
    "Package Code": "EA",
    "Controller Revision": "Rev 19"
  }
});

assertPart("MTFC256GASAONS-IT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 2097152,
  package: "153-ball TFBGA 11.5x13x1.2",
  extra: {
    "NAND Component": "AS",
    "Controller Code": "AO",
    "Package Code": "NS",
    "Product Version": "UFS 2.1"
  },
  absentExtra: ["Product Family", "Group"]
});

assertPart("MTFC64GBCAVAL-AIT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 524288,
  extra: {
    "NAND Component": "BC",
    "Controller Code": "AV",
    "Package Code": "AL",
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["Group"]
});

assertPart("MTFC128GBCAQTC-AIT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 1048576,
  package: "153-ball LFBGA 11.5x13x1.3",
  extra: {
    "NAND Component": "BC",
    "Controller Code": "AQ",
    "Package Code": "TC",
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Product Family": "Micron e.MMC 5.1 TLC Pearl",
    "Product Version": "eMMC 5.1"
  },
  absentExtra: ["Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("MTFC1TAYAXHR-WT", {
  rawVendor: "micron",
  type: "UFS",
  rawDensity: 8388608,
  extra: {
    "NAND Component": "AY",
    "Controller Code": "AX",
    "Package Code": "HR",
    "Product Version": "UFS 4.0"
  },
  absentExtra: ["Group"]
});

assertPart("MTFC256GZZZZZZ-WT", {
  rawVendor: "micron",
  type: "eMMC",
  rawDensity: 2097152,
  package: "Unknown",
  extra: {
    "NAND Component": "ZZ",
    "Controller Code": "ZZ",
    "Package Code": "ZZ"
  }
});

assertPart("YMEC6A1TC1A2C1", {
  rawVendor: "ymtc",
  type: "eMMC",
  rawDensity: 262144,
  processNode: "X2-9060 / TAS",
  cellLevel: "TLC",
  package: "BGA-153 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC000",
    "Product Family": "YMTC EC000 eMMC",
    "Storage Density": "32GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMEC8A2TB3A2C3", {
  rawVendor: "ymtc",
  type: "eMMC",
  rawDensity: 1048576,
  processNode: "X1-9050 / JGS",
  cellLevel: "TLC",
  package: "BGA-153 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC110",
    "Product Family": "YMTC EC110 eMMC",
    "Storage Density": "128GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "Die Stack": "QDP (4-die)",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ 85°C"
  },
  absentExtra: ["System", "Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMUS8A1TC1A2C1", {
  rawVendor: "ymtc",
  type: "UFS",
  rawDensity: 1048576,
  processNode: "X2-9060 / TAS",
  cellLevel: "TLC",
  package: "BGA-153 11.5x13x1.0/1.2",
  extra: {
    Controller: "UFS 3.1 Controller",
    "Storage Density": "128GB UFS",
    "Storage Interface": "UFS 3.1",
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMC6G001TB51AA1C0", {
  rawVendor: "ymtc",
  type: "NAND",
  rawDensity: 1048576,
  processNode: "X3-9070 / WDS",
  cellLevel: "TLC",
  package: "BGA-132 12x18",
  extra: {
    System: "UNIMOS",
    "Product Generation": "Gen 4 Xtacking 3.0",
    "Die Density": "256Gb",
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  }
});

assertPart("KLMAG1JETD-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 131072,
  processNode: "14nm",
  extra: {
    "Component Density": "16GB package",
    "Die Density": "128Gb",
    "Die Stack": "SDP (1-die)",
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Interface info", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KLM8G1GETF-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 65536,
  processNode: "14nm",
  extra: {
    "Component Density": "8GB package",
    "Die Density": "64Gb",
    "Die Stack": "SDP (1-die)",
    "Product Version": "eMMC 5.1",
    "Interface Type": "HS400"
  },
  absentExtra: ["Product Generation", "Interface info", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KLMBG2JETD-B041", {
  rawVendor: "samsung",
  type: "eMMC",
  rawDensity: 262144,
  processNode: "14nm",
  extra: {
    "Component Density": "32GB package",
    "Die Density": "128Gb",
    "Product Version": "eMMC 5.1",
    "Die Stack": "DDP (2-die)"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KMGD6001BM-B421", {
  rawVendor: "samsung",
  type: "eMCP",
  rawDensity: 262144,
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

assertPart("KMGE6001BM-B421", {
  rawVendor: "samsung",
  type: "eMCP",
  rawDensity: 131072,
  package: "BGA221",
  extra: {
    "Product Mode": "eMCP",
    "Product Family": "eMMC + LPDDR3",
    "Storage Density": "16GB eMMC",
    "Storage Interface": "eMMC",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866",
    "Package Code": "221 FBGA",
    "Config Code": "B421"
  },
  absentExtra: ["Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KLUEG8UHDB-C2E1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 2097152,
  processNode: "V5 92L",
  extra: {
    "Component Density": "256GB package",
    "Die Density": "256Gb",
    "Die Stack": "ODP (8-die)",
    "Product Version": "UFS 3.1",
    "Controller": "UFS 3.1/3.0/2.2 G4-2Lane Controller"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KLUFG8RHHF-F0G1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 4194304,
  processNode: "V8 236L",
  package: "BGA-153 9x13",
  extra: {
    "Component Density": "512GB package",
    "Die Density": "512Gb",
    "Die Stack": "ODP (8-die)",
    "Product Version": "UFS 4.0",
    "Controller": "UFS 4.0 G5-2Lane Controller"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KLUEG4RHKF-F0H1", {
  rawVendor: "samsung",
  type: "UFS",
  rawDensity: 2097152,
  processNode: "V8 236L",
  package: "BGA-153 9x13",
  extra: {
    "Component Density": "256GB package",
    "Die Density": "512Gb",
    "Die Stack": "QDP (4-die)",
    "Product Version": "UFS 4.1",
    "Controller": "UFS 4.1 G5-2Lane Controller"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("EMMC64G-TY29", {
  rawVendor: "kingston",
  type: "eMMC",
  rawDensity: 524288,
  package: "11.5x13.0x0.8",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Config Code": "TY29",
    "Storage Density": "64GB eMMC",
    "Product Class": "Commercial"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("EMMC128-IY29", {
  rawVendor: "kingston",
  type: "eMMC",
  rawDensity: 1048576,
  package: "11.5x13.0x0.8",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Temperature"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("UFS128-CY14", {
  rawVendor: "kingston",
  type: "UFS",
  rawDensity: 1048576,
  package: "11x13x0.85",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "G4 4P",
    "Storage Density": "128GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("64EM32-M4GTY9B", {
  rawVendor: "kingston",
  type: "eMCP",
  rawDensity: 524288,
  package: "FBGA254 11.5x13.0x1.0",
  extra: {
    "Product Family": "eMCP LPDDR4X",
    "Storage Interface": "eMMC 5.1",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEMDNN256G-A3A5607-08", {
  rawVendor: "longsys",
  type: "eMMC",
  rawDensity: 2097152,
  package: "FBGA153 11.5x13x1.0",
  extra: {
    "Product Family": "Commercial eMMC",
    "Storage Interface": "eMMC 5.1",
    "Storage Density": "256GB eMMC"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN128G-C2H14", {
  rawVendor: "longsys",
  type: "UFS",
  rawDensity: 1048576,
  package: "FBGA153 11.5x13x1.0",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Product Class": "Commercial"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEPRF6432-58A1930", {
  rawVendor: "longsys",
  type: "eMCP",
  rawDensity: 524288,
  package: "FBGA254 11.5x13x1.0",
  extra: {
    "Product Family": "eMCP4x",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FUPRFA832-C2A56N1", {
  rawVendor: "longsys",
  type: "uMCP",
  rawDensity: 1048576,
  package: "FBGA254 11.5x13x1.0",
  extra: {
    "Product Family": "uMCP4x",
    "Storage Density": "128GB UFS",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCTAKL11X128G", {
  rawVendor: "biwin",
  type: "eMMC",
  rawDensity: 1048576,
  package: "FBGA153 11.50x13.00",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC"
  },
  absentExtra: ["System", "Product Family", "Product Version", "Managed Family", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCMMQ511G08G", {
  rawVendor: "biwin",
  type: "eMMC",
  rawDensity: 65536,
  package: "FBGA153 9.00x11.00",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "Storage Density": "8GB eMMC"
  },
  absentExtra: ["Interface info", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWU2A0526B128G", {
  rawVendor: "biwin",
  type: "UFS",
  rawDensity: 1048576,
  package: "FBGA153 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Storage Density": "128GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDME128G-C8H09", {
  rawVendor: "longsys",
  type: "UFS",
  rawDensity: 1048576,
  package: "FBGA153 11.5x13x1.2",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "Gear4 2L",
    "Product Class": "Automotive"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN512G-C2G07", {
  rawVendor: "longsys",
  type: "UFS",
  rawDensity: 4194304,
  package: "FBGA153 11.5x13x1.0",
  cellLevel: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Storage Density": "512GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCA2KZC-64G", {
  rawVendor: "biwin",
  type: "eMCP",
  rawDensity: 524288,
  package: "FBGA254 11.50x13.00",
  extra: {
    "Product Family": "eMCP4X",
    "Storage Density": "64GB eMMC",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("BW2A2MZC02-256G", {
  rawVendor: "biwin",
  type: "uMCP",
  rawDensity: 2097152,
  package: "FBGA254 11.50x13.00",
  extra: {
    "Product Family": "uMCP LPDDR4X",
    "Storage Density": "256GB UFS",
    "DRAM Density": "64Gb",
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertSearchPnIncludes("BW2A2MZCNY", "BIWIN BW2A2MZCNY-512G");
assertSearchPnIncludes("FEUDME256G", "Longsys FEUDME256G-C8H09");
assertSearchPnIncludes("KMGD6001BM", "Samsung KMGD6001BM-B421");
assertSearchPnIncludes("THGJFRT1E45", "Kioxia THGJFRT1E45BATV");
assertSearchPnIncludes("YMUSAB5", "YMTC YMUSAB5TH3A1C1");
assertSearchPnFirst("EMMC", "Kingston EMMC04G-WT32");
