import assert from "node:assert/strict";
import type { FieldValue, PartDecodeResult } from "../../core/src/index";
import { createEngine } from "../../core/src/index";
import { embeddedResourceBundle } from "../../resources/index";
import managedNandPnJson from "../../resources/resources/managed-nand-pn.json" with { type: "json" };
import { compileDecodePack, defaultDecodePack } from "../src/index";

const compiledPack = compileDecodePack(defaultDecodePack);

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders
});

interface TestPartInfo {
  partNumber: string;
  vendor?: string;
  markingCode?: string;
  type?: string;
  densityMbit?: number;
  density?: string;
  processField?: string;
  cellField?: string;
  topology?: Record<string, unknown>;
  voltage?: string;
  interface?: Record<string, unknown>;
  package?: string;
  detailFields: Record<string, unknown>;
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
  if (result.device?.productType) {
    const productTypes: Record<string, string> = {
      emmc: "eMMC",
      ufs: "UFS",
      sata: "SATA",
      nvme: "NVMe",
      emcp: "eMCP",
      umcp: "uMCP",
      e2nand: "E2NAND"
    };
    return productTypes[result.device.productType] ?? result.device.productType.toUpperCase();
  }
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
  const detailFields: Record<string, unknown> = {};
  for (const field of fields(result)) {
    if (["vendor", "chip_kind", "product_type", "part_number"].includes(field.key)) continue;
    detailFields[field.label] = fieldText(field);
  }
  return {
    partNumber,
    vendor: result.device?.vendor.id,
    markingCode: result.device?.markingCode,
    type: partType(result),
    densityMbit: typeof density?.value === "number" ? density.value : undefined,
    density: density?.display,
    processField: fieldText(firstField(result, "process_node")) as string | undefined,
    cellField: fieldText(firstField(result, "cell_level")) as string | undefined,
    voltage: fieldText(firstField(result, "voltage", "dram_voltage")) as string | undefined,
    package: fieldText(firstField(result, "package")) as string | undefined,
    detailFields
  };
}

function extra(info: TestPartInfo): Record<string, unknown> {
  return info.detailFields;
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
    vendor: string;
    markingCode?: string;
    type: string;
    densityMbit?: number;
    density?: string;
    processField?: string;
    cellField?: string;
    topology?: Record<string, unknown>;
    voltage?: string;
    interface?: Record<string, unknown>;
    package?: string;
    extra?: Record<string, unknown>;
    absentExtra?: string[];
  }
): void {
  const info = detect(partNumber);
  assert.equal(info.vendor, expected.vendor, partNumber);
  if (expected.markingCode !== undefined) {
    assert.equal(info.markingCode, expected.markingCode, partNumber);
  }
  assert.equal(info.type, expected.type, partNumber);

  if (expected.densityMbit !== undefined) {
    assert.equal(info.densityMbit, expected.densityMbit, partNumber);
  }
  if (expected.density !== undefined) {
    assertKnownOrOmitted(info.density, expected.density, partNumber);
  }
  if (expected.processField !== undefined) {
    assertKnownOrOmitted(info.processField, expected.processField, partNumber);
  }
  if (expected.cellField !== undefined) {
    assertKnownOrOmitted(info.cellField, expected.cellField, partNumber);
  }
  if (expected.topology !== undefined) {
    assert.ok(info.topology == null || typeof info.topology === "object", partNumber);
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
    const detailFields = extra(info);
    for (const [key, value] of Object.entries(expected.extra)) {
      assert.equal(detailFields[key], value, `${partNumber} detailFields.${key}`);
    }
  }
  if (expected.absentExtra) {
    const detailFields = extra(info);
    for (const key of expected.absentExtra) {
      assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
    }
  }
}

function assertSearchPnIncludes(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

function assertNotFound(partNumber: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "not_found", `${partNumber} should not be decoded by a generic catch-all rule`);
}

function assertSearchPnFirst(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer managed NAND PN suggestions`);
}

const skhynixH25RawInternalExtra = [
  "System",
  "Group",
  "Series Code",
  "Cell Code",
  "Layout Code",
  "Density Code",
  "Stack Code",
  "Generation Code",
  "Config Code",
  "Product Class",
  "NAND Technology"
];

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
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 2097152,
  processField: "BiCS3 64L",
  extra: {
    "Product Family": "iNAND IX EM132",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Extended Temperature",
    "Product Generation": "BiCS3 64L 3D NAND"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINBDG4-32G-ZA3", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 262144,
  processField: "2D NAND",
  extra: {
    "Product Family": "iNAND 7250 / EM122-class",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINFDK4-128G", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  processField: "3D NAND",
  extra: {
    "Product Family": "iNAND MC EU521",
    "Storage Interface": "UFS 3.1"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINDDH6-128G-ZA2", {
  vendor: "sndk",
  type: "UFS",
  densityMbit: 1048576,
  processField: "3D NAND",
  extra: {
    "Product Family": "iNAND AT EU312",
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive"
  },
  absentExtra: ["Product Version", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDIN7DU2-8G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 65536,
  processField: "19nm",
  extra: {
    "Product Family": "iNAND Ultra",
    "Storage Interface": "eMMC 4.41",
    "NAND Technology": "X2 MLC NAND"
  }
});

assertPart("SDIN5C4-64G", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 524288,
  processField: "24nm",
  extra: {
    "Product Family": "iNAND legacy eMMC",
    "Storage Interface": "eMMC 4.41"
  }
});

assertPart("SDIS4BH-008G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 65536,
  extra: {
    "Product Family": "iSSD SATA / MTR-5"
  }
});

assertPart("SDIS5BK-032G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 262144,
  extra: {
    "Product Family": "iSSD i100",
    "Storage Interface": "SATA 6Gb/s"
  }
});

assertPart("SDIS6BM-016G", {
  vendor: "sndk",
  type: "SATA",
  densityMbit: 131072,
  extra: {
    "Product Family": "iSSD i110"
  }
});

assertPart("SM662GXC-BFS", {
  vendor: "siliconmotion",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "100-ball BGA",
  extra: {
    "Product Family": "Ferri-eMMC",
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ +85°C",
    "Package Code": "100-b"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM662PBC-BFS", {
  vendor: "siliconmotion",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-eMMC",
    "Storage Density": "64GB eMMC",
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Operation Temperature": "-40°C ~ +105°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM671PEF-BFS", {
  vendor: "siliconmotion",
  type: "UFS",
  densityMbit: 4194304,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-UFS",
    "Storage Density": "512GB UFS",
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "HS-Gear4 x2",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Industrial",
    "Operation Temperature": "-40°C ~ +85°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FNNL63A51K3WG-AF", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 32768,
  processField: "L63A",
  cellField: "MLC",
  package: "48-pin TSOP I Center Package Leads (CPL) PB free",
  extra: {
    "Product Family": "SpecTek NAND Flash",
    "Density grade": "94-100%",
    "Package functionality partial type": "Single Die Package, CE only"
  }
});

assertNotFound("SDINZZZ9-128G-ABC");
assertNotFound("SDISZZZ-016G");
assertNotFound("SM671PAC-BFS");

assertPart("THGBMNG5D1LBAIT", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 32768,
  processField: "15 nm/1z",
  package: "BGA153",
  extra: {
    "Storage Interface": "eMMC 5.0",
    "NAND Technology": "FG NAND"
  },
  absentExtra: ["Product Version", "Product Generation"]
});

assertPart("THGAMVT0T43BAB8", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 1048576,
  processField: "BiCS4",
  package: "BGA",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive AEC-Q100 Grade 2"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGJFRT3E88BATW", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 8388608,
  processField: "BiCS8",
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 4.1",
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGJFJT1T45BAB8", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  processField: "BiCS4",
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 4.0",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGAFBT1T83BAA5", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  processField: "BiCS8",
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive AEC-Q100 Grade 3",
    "Speed Grade": "1160 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Product Generation"]
});

assertPart("THGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  processField: "24 nm A-type",
  cellField: "MLC",
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
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  processField: "24 nm A-type",
  cellField: "MLC",
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
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  processField: "19 nm/1x",
  cellField: "MLC",
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
  vendor: "micron",
  type: "On-die ECC NAND",
  densityMbit: 16777216,
  cellField: "QLC",
  topology: {
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
  vendor: "micron",
  type: "On-die ECC NAND",
  densityMbit: 8388608,
  cellField: "TLC",
  topology: {
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
  vendor: "micron",
  markingCode: "NC103",
  type: "On-die ECC NAND",
  densityMbit: 16777216,
  cellField: "QLC",
  topology: {
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

assertPart("MT29C4G96MAZAPCJA-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-ball TFBGA 13x10.5x1.2",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "4Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AZAPC",
    "Package Code": "JA",
    "Speed Grade": "200MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C2G24MAKLAJG-6 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  package: "168-ball PoP VFBGA 12x12x0.9",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "2Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AKLA",
    "Package Code": "JG",
    "Speed Grade": "166MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C1G12MAADVAKC-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  package: "107-ball TFBGA 13x10.5x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "512Mb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AADVA",
    "Package Code": "KC",
    "Speed Grade": "200MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C1G12MAADAEAKC-5 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  package: "107-ball TFBGA 13x10.5x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AADAEA",
    "Package Code": "KC",
    "Speed Grade": "200MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C2G48MAKLCJI-6 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  package: "168-ball PoP TFBGA 12x12x1.1",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "2Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "1Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AKLC",
    "Package Code": "JI",
    "Speed Grade": "166MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C4G48MAZBBAKS-48 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-ball VFBGA 13x10.5x1.0",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Config Code": "AZBBA",
    "Package Code": "KS",
    "Speed Grade": "208MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C4G48MAYBBAHK-48 IT", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "137-VFBGA 13x10.5",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "AYBBA",
    "Package Code": "HK",
    "Speed Grade": "208MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29C8G48MAPLDJA-75ITES", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 8192,
  package: "137-ball TFBGA 13x10.5x1.2",
  extra: {
    "Product Family": "Micron NAND + LPDRAM MCP",
    "Product Mode": "MCP NAND + LPDRAM",
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x32",
    "Config Code": "APLD",
    "Package Code": "JA",
    "Speed Grade": "133MHz",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29RZ4C4DZZMGMF-18W.80C", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  package: "168-VFBGA 12x12",
  extra: {
    "Product Family": "Micron NAND + LPDDR2 MCP",
    "Product Mode": "MCP NAND + LPDDR2",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDDR2",
    "DRAM Width": "x32",
    "Config Code": "ZZ",
    "Package Code": "MG",
    "DRAM Speed": "LPDDR2-533",
    "Speed Grade": "533MHz"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29RZ1CVCZZHGTN-18 W.85H", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  package: "121-VFBGA 8x7.5",
  extra: {
    "Product Family": "Micron NAND + LPDDR2 MCP",
    "Product Mode": "MCP NAND + LPDDR2",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "512Mb",
    "DRAM Type": "LPDDR2",
    "DRAM Width": "x16",
    "Config Code": "ZZ",
    "Package Code": "HG",
    "DRAM Speed": "LPDDR2-533",
    "Speed Grade": "533MHz",
    "Operation Temperature": "-25°C ~ 85°C"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("H26M78208CMRX", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("H26M78208CMRN", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Version": "eMMC 5.1",
    "Product Class": "Commercial / Mobile"
  }
});

assertPart("H26M91208HPRX", {
  vendor: "skhynix",
  type: "eMMC",
  density: "Unknown",
  package: "153FBGA",
  extra: {
    "Managed Family": "e-NAND",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("HN8T25DEHKX077N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  package: "153FBGA",
  extra: {
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("HN8T35DZHKX079", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 8388608,
  package: "153FBGA",
  extra: {
    "Product Version": "UFS 3.1",
    "Product Generation": "176-layer 4D NAND (V7)"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("HN8G962EHKX037N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  package: "153FBGA",
  extra: {
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["System", "Product Family"]
});

assertPart("HN8T274EJKX130", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  package: "153FBGA",
  extra: {
    "Product Family": "SK hynix ZUFS 4.1",
    "Storage Interface": "UFS 4.1",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Group", "Product Version"]
});

assertPart("HN8T374ZJKX141", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 8388608,
  package: "153FBGA",
  extra: {
    "Product Family": "SK hynix ZUFS 4.1",
    "Storage Interface": "UFS 4.1",
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Group", "Product Version"]
});

assertPart("H28SAO301MMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H28S8Q302CMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA",
  extra: {
    "Product Version": "UFS 2.1"
  }
});

assertPart("H25T2TB88E-X321-N", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  processField: "128L 4D NAND (V6 / H25FTB0)",
  cellField: "TLC",
  extra: {
    "Product Generation": "128-layer 4D NAND (V6 / H25FTB0)",
    "Component Density": "4Tbit package"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25T1TD48C-X630", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 2097152,
  processField: "238L 4D NAND (V8)",
  cellField: "TLC",
  extra: {
    "Product Generation": "238-layer 4D NAND (V8 / H25FTD0)",
    "Die Density": "512Gb"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25T2TC88C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  processField: "176L 4D NAND (V7 / H25FTC0)",
  cellField: "TLC",
  extra: {
    "Product Generation": "176-layer 4D NAND (V7 / H25FTC0)",
    "Component Density": "4Tbit package"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25T2TD88C-X682", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  processField: "238L 4D NAND (V8 / H25FTD0)",
  cellField: "TLC",
  extra: {
    "Product Generation": "238-layer 4D NAND (V8 / H25FTD0)",
    "Component Density": "4Tbit package"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25T0QA18CX542", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  processField: "176L 4D NAND QLC (V7Q)",
  cellField: "QLC",
  extra: {
    "Product Generation": "176-layer 4D NAND QLC (V7Q)",
    "Component Density": "1Tbit package"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25T4QM88G", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 2097152,
  processField: "321-layer 4D NAND QLC (V9Q)",
  cellField: "QLC",
  extra: {
    "Product Generation": "321-layer 4D NAND QLC (V9Q)",
    "Component Density": "2Tb die"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25QEM8A1B", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 262144,
  processField: "3D NAND V4 MLC",
  cellField: "MLC",
  extra: {
    "Product Generation": "3D NAND V4 MLC"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25QFT8D4A", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 2097152,
  processField: "3D NAND V4 TLC",
  cellField: "TLC",
  extra: {
    "Product Generation": "3D NAND V4 TLC",
    Series: "3D V4/V5 family"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25JGQ8A1M8R", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  processField: "3D NAND V5 QLC",
  cellField: "QLC",
  extra: {
    "Product Generation": "3D NAND V5 QLC"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H25G9TC18CX488", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  processField: "176L 4D NAND (V7)",
  cellField: "TLC",
  extra: {
    "Product Generation": "176L 4D NAND (V7)"
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Reference Status", "Inference Source"]
});

assertPart("H2DTDG8UD1MYR", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 131072,
  processField: "26nm",
  cellField: "MLC",
  widthField: "x8",
  package: "VLGA",
  extra: {
    "Product Version": "E2NAND2.0",
    "Block size": "2MB (8KB page)",
    "ECC enabled": "Yes"
  }
});

assertPart("H2JTDG8UD1BMS", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 131072,
  processField: "1xnm class",
  cellField: "MLC",
  widthField: "x8",
  package: "VLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Block size": "4MB",
    "ECC enabled": "Yes"
  }
});

assertPart("H9TQ17ABJTMCUR-KUM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 131072,
  package: "221Ball FBGA",
  extra: {
    "Product Mode": "CI-MCP NAND DDR3",
    "Storage Density": "16GB e-NAND",
    "DRAM Density": "16Gb LPDDR3"
  }
});

assertPart("H9TP32A4GDBCPR-KGM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 32768,
  package: "162Ball FBGA",
  extra: {
    "Product Mode": "CI-MCP NAND DDR2",
    "Storage Density": "4GB e-NAND"
  }
});

assertPart("H9HP52ACPMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "eMCP NAND DDR4",
    "Storage Density": "64GB eMMC"
  },
  absentExtra: ["System"]
});

assertPart("H9AG9G5ANBX100", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 eMCP",
    "Storage Interface": "eMMC 5.0"
  },
  absentExtra: ["System"]
});

assertPart("H9QT0GECN6X145", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 uMCP",
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System"]
});

assertPart("H9HQ15ACPMADAR-KEM", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  package: "254Ball FBGA",
  extra: {
    "Storage Density": "128GB UFS",
    "DRAM Density": "32Gb LPDDR4X"
  },
  absentExtra: ["System"]
});

assertPart("MTFC4GACAJCN-1M WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 32768,
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
  vendor: "micron",
  type: "eMMC",
  densityMbit: 65536,
  package: "153-ball WFBGA 11.5x13x0.8",
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
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  extra: {
    "NAND Component": "BC",
    "Controller Code": "AV",
    "Package Code": "AL",
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["Group"]
});

assertPart("MTFC128GBCAQTC-AIT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 1048576,
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
  vendor: "micron",
  type: "UFS",
  densityMbit: 8388608,
  extra: {
    "NAND Component": "AY",
    "Controller Code": "AX",
    "Package Code": "HR",
    "Product Version": "UFS 4.0"
  },
  absentExtra: ["Group"]
});

assertPart("MTFC256GZZZZZZ-WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  package: "Unknown",
  extra: {
    "NAND Component": "ZZ",
    "Controller Code": "ZZ",
    "Package Code": "ZZ"
  }
});

assertPart("YMEC6A1TC1A2C1", {
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 262144,
  processField: "X2-9060 / TAS",
  cellField: "TLC",
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
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 1048576,
  processField: "X1-9050 / JGS",
  cellField: "TLC",
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
  vendor: "ymtc",
  type: "UFS",
  densityMbit: 1048576,
  processField: "X2-9060 / TAS",
  cellField: "TLC",
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
  vendor: "ymtc",
  type: "NAND",
  densityMbit: 1048576,
  processField: "X3-9070 / WDS",
  cellField: "TLC",
  package: "BGA-132 12x18",
  extra: {
    "Product Generation": "Gen 4 Xtacking 3.0",
    "Die Density": "256Gb",
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  }
});

assertPart("KLMAG1JETD-B041", {
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 131072,
  processField: "14nm",
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
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 65536,
  processField: "14nm",
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
  vendor: "samsung",
  type: "eMMC",
  densityMbit: 262144,
  processField: "14nm",
  extra: {
    "Component Density": "32GB package",
    "Die Density": "128Gb",
    "Product Version": "eMMC 5.1",
    "Die Stack": "DDP (2-die)"
  },
  absentExtra: ["Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("KMGD6001BM-B421", {
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

assertPart("KMGE6001BM-B421", {
  vendor: "samsung",
  type: "eMCP",
  densityMbit: 131072,
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
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  processField: "V5 92L",
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
  vendor: "samsung",
  type: "UFS",
  densityMbit: 4194304,
  processField: "V8 236L",
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
  vendor: "samsung",
  type: "UFS",
  densityMbit: 2097152,
  processField: "V8 236L",
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
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 524288,
  package: "11.5x13.0x0.8",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Config Code": "TY29",
    "Storage Density": "64GB eMMC",
    "Product Class": "Commercial"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("EMMC128-IY29", {
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 1048576,
  package: "11.5x13.0x0.8",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Industrial Temperature"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("UFS128-CY14", {
  vendor: "kingston",
  type: "UFS",
  densityMbit: 1048576,
  package: "11x13x0.85",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "G4 4P",
    "Storage Density": "128GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("64EM32-M4GTY9B", {
  vendor: "kingston",
  type: "eMCP",
  densityMbit: 524288,
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
  vendor: "longsys",
  type: "eMMC",
  densityMbit: 2097152,
  package: "FBGA153 11.5x13x1.0",
  extra: {
    "Product Family": "Commercial eMMC",
    "Storage Interface": "eMMC 5.1",
    "Storage Density": "256GB eMMC"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN128G-C2H14", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA153 11.5x13x1.0",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Product Class": "Commercial"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEPRF6432-58A1930", {
  vendor: "longsys",
  type: "eMCP",
  densityMbit: 524288,
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
  vendor: "longsys",
  type: "uMCP",
  densityMbit: 1048576,
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
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 1048576,
  package: "FBGA153 11.50x13.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC"
  },
  absentExtra: ["System", "Product Family", "Product Version", "Managed Family", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCMMQ511G08G", {
  vendor: "biwin",
  type: "eMMC",
  densityMbit: 65536,
  package: "FBGA153 9.00x11.00",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "Storage Density": "8GB eMMC"
  },
  absentExtra: ["Interface info", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWU2A0526B128G", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA153 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Storage Density": "128GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDME128G-C8H09", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA153 11.5x13x1.2",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "Gear4 2L",
    "Product Class": "Automotive"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("FEUDNN512G-C2G07", {
  vendor: "longsys",
  type: "UFS",
  densityMbit: 4194304,
  package: "FBGA153 11.5x13x1.0",
  cellField: "TLC",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Storage Density": "512GB UFS"
  },
  absentExtra: ["Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWCA2KZC-64G", {
  vendor: "biwin",
  type: "eMCP",
  densityMbit: 524288,
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
  vendor: "biwin",
  type: "uMCP",
  densityMbit: 2097152,
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
assertSearchPnIncludes("SDIN7DU2", "Sandisk SDIN7DU2-64G");
assertSearchPnIncludes("SDIS5BK", "Sandisk SDIS5BK-032G");
assertSearchPnIncludes("SDIS4BH", "Sandisk SDIS4BH-064G");
assertSearchPnIncludes("SM662PBC", "Silicon Motion SM662PBC-BFS");
assertSearchPnIncludes("SM671PEF", "Silicon Motion SM671PEF-BFS");
assertSearchPnIncludes("THGJFRT1E45", "Kioxia THGJFRT1E45BATV");
assertSearchPnIncludes("YMUSAB5", "YMTC YMUSAB5TH3A1C1");
assertSearchPnFirst("EMMC", "Kingston EMMC04G-WT32");
