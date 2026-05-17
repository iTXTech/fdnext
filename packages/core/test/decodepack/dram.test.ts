import assert from "node:assert/strict";
import type { FieldValue, PartDecodeResult } from "../../src/index";
import { createEngine } from "../../src/index";
import dramPnJson from "../../resources/dram-pn.json" with { type: "json" };
import mdbJson from "../../resources/mdb.json" with { type: "json" };
import micronFbgaCodesJson from "../../../../references/micron-fbga-codes.json" with { type: "json" };
import { embeddedResourceBundle } from "../../src/index";
import { compileDecodePack, defaultDecodePack } from "../../src/index";

const compiledPack = compileDecodePack(defaultDecodePack);

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders
});

const redundantStandaloneExtra = [
  "Product Family",
  "Product Version",
  "DRAM Density",
  "DRAM Width",
  "Reference Status",
  "Inference Source",
  "source",
  "status"
];

const hiddenPublicCodeExtraKeys = new Set([
  "Series Code",
  "Cell Code",
  "Layout Code",
  "Density Code",
  "Stack Code",
  "Generation Code",
  "Config Code",
  "Package Code",
  "Controller Code",
  "Die Code",
  "Feature Code",
  "Marking Code"
]);

const standaloneDramExtraKeys = new Set([
  "Config Code",
  "DRAM Die Stack",
  "Package Code",
  "DRAM Speed",
  "CAS Latency",
  "DRAM Generation",
  "DRAM Die Density",
  "Die Count",
  "CE Count",
  "Bank Count",
  "Channel Count",
  "Interface Type",
  "Revision",
  "Operation Temperature",
  "Solder Type",
  "Production Status",
  "Die Revision",
  "ECC enabled",
  "Process Node",
  "Marking Code",
  "Speed Grade",
  "Special Option"
]);

const standardDramTypes = new Set([
  "Asynchronous DRAM",
  "SDR",
  "LPSDR",
  "DDR",
  "DDR2",
  "DDR3",
  "DDR4",
  "DDR5",
  "LPDDR",
  "LPDDR2",
  "LPDDR3",
  "LPDDR4",
  "LPDDR4X",
  "LPDDR5",
  "LPDDR5X",
  "GDDR",
  "GDDR2",
  "GDDR3",
  "GDDR4",
  "GDDR5",
  "GDDR5X",
  "GDDR6",
  "GDDR6X",
  "GDDR7",
  "HBM2E",
  "HMC",
  "RLDRAM",
  "RLDRAM 3"
]);

interface TestPartInfo {
  partNumber: string;
  vendor?: string;
  markingCode?: string;
  type?: string;
  densityMbit?: number;
  density?: string;
  widthField?: string;
  voltage?: string;
  package?: string;
  topology?: Record<string, unknown>;
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

function detect(partNumber: string): TestPartInfo {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  const density = firstField(result, "dram_density", "density", "storage_density");
  const width = firstField(result, "dram_width", "device_width");
  const detailFields: Record<string, unknown> = {};
  for (const field of fields(result)) {
    if ([
      "vendor",
      "chip_kind",
      "product_type",
      "part_number",
      "dram_type",
      "dram_density",
      "density",
      "dram_width",
      "device_width",
      "dram_voltage",
      "voltage",
      "package",
      "die_count",
      "plane",
      "plane_count"
    ].includes(field.key)) {
      continue;
    }
    detailFields[field.label] = fieldText(field);
  }
  return {
    partNumber,
    vendor: result.device?.vendor.id,
    markingCode: result.device?.markingCode,
    type: fieldText(firstField(result, "dram_type", "product_type")) as string | undefined,
    densityMbit: typeof density?.value === "number" ? density.value : undefined,
    density: density?.display,
    widthField: typeof width?.value === "number" ? `x${width.value}` : fieldText(width) as string | undefined,
    voltage: fieldText(firstField(result, "dram_voltage", "voltage")) as string | undefined,
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

function assertSearchPnIncludes(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

function assertSearchPnFirst(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer known DRAM PN suggestions`);
}

function searchFbgaParts(query: string): string[] {
  return engine.searchParts({ query, lang: "eng", limit: 20 }).items
    .filter((item) => item.device.markingCode === query)
    .map((item) => item.device.partNumber)
    .filter((partNumber): partNumber is string => Boolean(partNumber));
}

function assertSearchMarkingRelation(query: string, expectedPartNumber: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 20 });
  const item = result.items.find((candidate) => candidate.device.markingCode === query && candidate.device.partNumber === expectedPartNumber);
  assert.ok(item, `${query} should return a structured marking candidate for ${expectedPartNumber}`);
  assert.equal(item.device.chipKind, "dram", `${query} should classify marking search as DRAM`);
  assert.ok(item.badges?.includes("Micron FBGA"), `${query} should expose a marking badge`);
  assert.equal(item.device.markingCode, query, `${query} should expose markingCode in device identity`);
  assert.ok(!item.fields?.some((field) => field.key === "marking_code"), `${query} should not duplicate markingCode as a field`);
  const relation = result.relations?.find((candidate) =>
    candidate.kind === "marking_for" &&
    candidate.source?.markingCode === query &&
    candidate.target.partNumber === expectedPartNumber
  );
  assert.ok(relation, `${query} should expose a marking_for relation`);
  const action = relation.action;
  assert.ok(action, `${query} relation should expose a decode action`);
  assert.equal(action.operation, "part.decode", `${query} relation should expose a decode action`);
  assert.equal(action.input.query, expectedPartNumber, `${query} relation action should decode the related part`);
  assert.equal(action.input.constraints?.chipKind, "dram", `${query} relation action should keep DRAM constraints`);
}

function assertSpectekSearchMarkingRelation(query: string, expectedPartNumber: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 20 });
  const item = result.items.find((candidate) => candidate.device.markingCode === query && candidate.device.partNumber === expectedPartNumber);
  assert.ok(item, `${query} should return a structured SpecTek marking candidate for ${expectedPartNumber}`);
  assert.equal(item.device.vendor.id, "spectek", `${query} should classify marking search as SpecTek`);
  assert.equal(item.device.chipKind, "dram", `${query} should classify marking search as DRAM`);
  assert.ok(item.badges?.includes("SpecTek FBGA"), `${query} should expose a SpecTek marking badge`);
  const relation = result.relations?.find((candidate) =>
    candidate.kind === "marking_for" &&
    candidate.source?.markingCode === query &&
    candidate.target.partNumber === expectedPartNumber
  );
  assert.ok(relation, `${query} should expose a SpecTek marking_for relation`);
  assert.equal(relation.action?.input.constraints?.vendor, "spectek", `${query} relation action should keep vendor constraints`);
  assert.equal(relation.action?.input.constraints?.chipKind, "dram", `${query} relation action should keep DRAM constraints`);
}

function publicDramType(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().replace(/\s+(?:SDRAM|SGRAM)$/i, "") : undefined;
}

function assertDram(
  partNumber: string,
  expected: {
    vendor?: string;
    densityMbit: number;
    density: string;
    widthField: string;
    voltage: string;
    package: string;
    topology?: Partial<Record<"ce" | "ch" | "die" | "rb", unknown>>;
    extra: Record<string, unknown>;
    absentExtra?: string[];
  }
): void {
  const info = detect(partNumber);
  const expectedType = publicDramType(expected.extra["DRAM Type"]);
  assert.equal(info.vendor, expected.vendor ?? "micron", partNumber);
  assert.equal(info.type, expectedType, partNumber);
  assert.ok(standardDramTypes.has(String(info.type)), `${partNumber} should expose a short DRAM type`);
  assert.equal(/(?:SDRAM|SGRAM)$/i.test(String(info.type)), false, `${partNumber} type should not expose SDRAM/SGRAM suffix`);
  assert.equal(info.densityMbit, expected.densityMbit, partNumber);
  assert.equal(info.density, expected.density, partNumber);
  assertKnownOrOmitted(info.widthField, expected.widthField, partNumber);
  assertKnownOrOmitted(info.voltage, expected.voltage, partNumber);
  assertKnownOrOmitted(info.package, expected.package, partNumber);
  if (expected.topology) {
    assert.ok(info.topology == null || typeof info.topology === "object", `${partNumber} should not expose NAND-shaped defaults`);
  }

  const detailFields = extra(info);
  for (const key of hiddenPublicCodeExtraKeys) {
    if (key === "Marking Code") {
      continue;
    }
    assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
  }
  for (const key of Object.keys(detailFields)) {
    assert.ok(standaloneDramExtraKeys.has(key), `${partNumber} should use standardized DRAM extra key ${key}`);
  }
  assert.equal(Object.hasOwn(detailFields, "DRAM Type"), false, `${partNumber} should expose DRAM generation in type, not detailFields.DRAM Type`);

  for (const [key, value] of Object.entries(expected.extra)) {
    if (key === "DRAM Type") {
      continue;
    }
    if (key === "Marking Code") {
      assert.equal(info.markingCode, value, `${partNumber} device.markingCode`);
      continue;
    }
    if (hiddenPublicCodeExtraKeys.has(key)) {
      assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
      continue;
    }
    assert.equal(detailFields[key], value, `${partNumber} detailFields.${key}`);
  }
  for (const key of [...redundantStandaloneExtra, ...(expected.absentExtra ?? [])]) {
    assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
  }
}

function assertStackedDram(
  partNumber: string,
  expected: {
    type: string;
    densityMbit: number;
    density: string;
    voltage?: string;
    package?: string;
    fields?: Record<string, unknown>;
    extra: Record<string, unknown>;
    absentExtra?: string[];
  }
): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  const info = detect(partNumber);
  assert.equal(result.device?.chipKind, "dram", `${partNumber} should decode as DRAM`);
  assert.equal(info.vendor, "micron", partNumber);
  assert.equal(info.type, expected.type, partNumber);
  assert.ok(standardDramTypes.has(String(info.type)), `${partNumber} should expose a short DRAM type`);
  assert.equal(info.densityMbit, expected.densityMbit, partNumber);
  assert.equal(info.density, expected.density, partNumber);
  if (expected.voltage !== undefined) {
    assert.equal(info.voltage, expected.voltage, partNumber);
  }
  if (expected.package !== undefined) {
    assert.equal(info.package, expected.package, partNumber);
  }

  for (const [key, value] of Object.entries(expected.fields ?? {})) {
    assert.equal(fieldText(firstField(result, key)), value, `${partNumber} fields.${key}`);
  }

  const detailFields = extra(info);
  for (const key of hiddenPublicCodeExtraKeys) {
    if (key === "Marking Code") {
      continue;
    }
    assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
  }
  for (const key of Object.keys(detailFields)) {
    assert.ok(standaloneDramExtraKeys.has(key), `${partNumber} should use standardized DRAM extra key ${key}`);
  }
  assert.equal(Object.hasOwn(detailFields, "DRAM Type"), false, `${partNumber} should expose DRAM generation in type, not detailFields.DRAM Type`);

  for (const [key, value] of Object.entries(expected.extra)) {
    if (key === "ECC enabled") {
      assert.equal(firstField(result, "ecc_enabled")?.value, value, `${partNumber} fields.ecc_enabled`);
      continue;
    }
    assert.equal(detailFields[key], value, `${partNumber} detailFields.${key}`);
  }
  for (const key of [...redundantStandaloneExtra, ...(expected.absentExtra ?? [])]) {
    assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
  }
}

function assertDecodedField(partNumber: string, key: string, expected: unknown): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(fieldText(firstField(result, key)), expected, `${partNumber} fields.${key}`);
}

function assertDecodedPartNumber(query: string, expected: string): void {
  const result = engine.decodePart({ query, lang: "eng" });
  assert.equal(result.device?.partNumber, expected, `${query} should resolve to canonical part number`);
}

function assertDecodedFieldAbsent(partNumber: string, key: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(firstField(result, key), undefined, `${partNumber} should not expose fields.${key}`);
}

function assertUnknown(partNumber: string): void {
  const info = detect(partNumber);
  assert.equal(info.vendor, undefined, `${partNumber} should not be decoded as a known vendor`);
  assert.equal(info.type, undefined, `${partNumber} should not be decoded as a known type`);
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

function isMicronDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber);
}

function micronDramFbgaEntries(raw: unknown): Array<{ code: string; pn: string }> {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const micron = record.micron && typeof record.micron === "object" && !Array.isArray(record.micron)
    ? record.micron as Record<string, unknown>
    : {};
  return Object.entries(micron)
    .map(([code, pn]) => ({ code: String(code).toUpperCase(), pn: String(pn).toUpperCase() }))
    .filter(({ code, pn }) => /^[0-9A-Z]{5}$/.test(code) && isMicronDramPartNumber(pn));
}

assert.ok(Array.isArray(dramPnJson), "DRAM PN resource should be a top-level minimal array");
assert.ok(Array.isArray(micronFbgaCodesJson), "Micron FBGA code resource should be a top-level array");
const dramPn = resourceEntries(dramPnJson);
const micronDramFbga = micronDramFbgaEntries(mdbJson);
const micronDramFbgaCodes = micronFbgaCodesJson as unknown[];
assert.ok(micronDramFbga.length > 0, "mdb.json should include Micron DRAM FBGA mappings");
const dramPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);
const micronNandFbgaHeaders = ["NC", "NW", "NY", "NX", "NQ", "NV"];
const seenDramPn = new Set<string>();
for (const entry of dramPn) {
  assert.equal(typeof entry, "object", "DRAM PN entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "DRAM PN entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.pn, "string", "DRAM PN entry should include pn");
  assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
  assert.deepEqual(Object.keys(record).sort(), ["pn", "vendor"], `${String(record.pn)} should only include vendor and pn`);
  const dedupeKey = `${String(record.vendor)}\0${String(record.pn)}`;
  assert.ok(!seenDramPn.has(dedupeKey), `${String(record.pn)} should only appear once for ${String(record.vendor)}`);
  seenDramPn.add(dedupeKey);

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((key) => dramPnForbiddenKeys.has(key)),
    [],
    `DRAM PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

const seenMicronDramFbga = new Set<string>();
const seenMicronDramFbgaCodes = new Set<string>();
for (const code of micronDramFbgaCodes) {
  assert.equal(typeof code, "string", "Micron FBGA code entry should be a string");
  assert.match(String(code), /^[0-9A-Z]{5}$/, `${String(code)} should be a five-character FBGA code`);
  assert.equal(
    micronNandFbgaHeaders.some((header) => String(code).startsWith(header)),
    false,
    `${String(code)} should not duplicate Micron NAND MDB crawl segments`
  );
  assert.ok(!seenMicronDramFbgaCodes.has(String(code)), `${String(code)} should only appear once`);
  seenMicronDramFbgaCodes.add(String(code));
}

for (const entry of micronDramFbga) {
  assert.equal(typeof entry, "object", "Micron DRAM FBGA entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "Micron DRAM FBGA entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.code, "string", "Micron DRAM FBGA entry should include code");
  assert.match(String(record.code), /^[0-9A-Z]{5}$/, `${String(record.code)} should be a five-character FBGA code`);
  assert.equal(typeof record.pn, "string", `${String(record.code)} should include pn`);
  assert.deepEqual(Object.keys(record).sort(), ["code", "pn"], `${String(record.code)} should only include code and pn`);
  assert.match(
    String(record.pn),
    /^(?:MT|CT|ED|EE)/,
    `${String(record.code)} should map only to Micron MT/Crucial CT or Micron legacy Elpida DRAM PN`
  );

  const key = `${String(record.code)}\0${String(record.pn)}`;
  assert.ok(!seenMicronDramFbga.has(key), `${String(record.code)} ${String(record.pn)} should only appear once`);
  seenMicronDramFbga.add(key);

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((keyName) => dramPnForbiddenKeys.has(keyName)),
    [],
    `Micron DRAM FBGA entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

assertDram("PRA128M8V88AG8GQF", {
  vendor: "spectek",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA 78/117B, 8x10.5MM",
  extra: {
    "DRAM Type": "DDR3"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PE010", {
  vendor: "spectek",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA 78/117B, 8x10.5MM",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PE010"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SU512M8V80A11ARH", {
  vendor: "spectek",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR3"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PE002", {
  vendor: "spectek",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PE002"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertSpectekSearchMarkingRelation("PE010", "PRA128M8V88AG8GQF");
assertDram("PB001", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PB001"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRM2G8Y52KBFRZ-56B", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V",
  package: "VFBGA 78/117B, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-5600"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PU001", {
  vendor: "spectek",
  densityMbit: 12288,
  density: "12Gb",
  widthField: "x16",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR",
    "Marking Code": "PU001"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertSpectekSearchMarkingRelation("PB001", "SM512M322C0FD4LH6");
assertSpectekSearchMarkingRelation("PU001", "SM768M16Y2BMD1FDS");
assertDram("SN512M32Z42MD1DNQ-053BT", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1866MHz (LPDDR4-3733)",
    "Speed Grade": "BT Fully Tested at 70 degrees"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Z11MD4DDT-062BTA", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1600MHz (LPDDR4-3200)",
    "Speed Grade": "BT Fully Tested at 70 degrees",
    "Special Option": "1 rank, 1 CS, ODT=Vss, 2 RESET, 2 ZQ"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Z11MD4DDS-062BTA", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "WFBGA 200/264-ball, 10x14.5x0.8 .325mm",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1600MHz (LPDDR4-3200)",
    "Speed Grade": "BT Fully Tested at 70 degrees",
    "Special Option": "1 rank, 1 CS, ODT=Vss, 2 RESET, 2 ZQ"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Y11MD4BDS-023FTB", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V",
  package: "TFBGA 315/315-ball, 12.4x15.0x1.1",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "4266MHz (LPDDR5-8533)",
    "Speed Grade": "FT Fully Tested at 90 degrees",
    "Special Option": "Solder Down"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRN1G8V91AG8SN-107", {
  vendor: "spectek",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA 78/117B, 9x13.2x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "933MHz (DDR-1866)"
  },
  absentExtra: ["Config Code", "Package Code"]
});

assertDram("MT40A1G8SA-075-E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A2G4TRF-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (9.5x11.5)",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "2G4",
    "DRAM Speed": "DDR4-2133 CL15",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A2G8NRE-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (8x12)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "NRE",
    "Config Code": "2G8",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A4G8NEA-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "NEA",
    "Config Code": "4G8",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

assertDram("MT40A1G16WBU-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA (8x14)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "WBU",
    "Config Code": "1G16",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A2G16TBB-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA (7.5x13)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "TBB",
    "Config Code": "2G16",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

const crucialDdr4Expected = {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "Crucial DDR4-62M",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
};

assertDram("CT40A1G8SA-62M:E", crucialDdr4Expected);
assertDram("CT40A1G8SA-062M:E", crucialDdr4Expected);
assertDram("C9BJZ", {
  ...crucialDdr4Expected,
  extra: {
    ...crucialDdr4Expected.extra,
    "Marking Code": "C9BJZ"
  }
});
assert.deepEqual(searchFbgaParts("C9BJZ"), ["CT40A1G8SA-62M:E"]);
assert.deepEqual(searchFbgaParts("FX454"), []);
assertDram("EDB2432B4MA-1DAAT-F-D", {
  vendor: "elpida",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B4MA",
    "Config Code": "2432",
    "DRAM Speed": "LPDDR2-1066"
  }
});
assertDram("EE40A512M16HA-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4",
    "Config Code": "512M16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H"
  }
});
assertDram("EE51K256M32HF-60:B", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "Operation Temperature": "Commercial"
  }
});
assert.deepEqual(searchFbgaParts("B9DHG"), ["MT47H32M16BT-3E"]);
assertUnknown("AMD41J128M16HA-107G:D");
assertDram("79JMM", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.55V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR2",
    "Config Code": "64M16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H",
    "Marking Code": "79JMM"
  }
});

const ddr5Expected = {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4800B",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
};

assertDram("MT60B2G8HB-48B-IT-A", ddr5Expected);
assertDram("MT60B2G8HB-48B IT:A", ddr5Expected);

assertDram("MT60B2G8HB-32B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-3200B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B2G8HB-44B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B3G8RW-64B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78-ball VFBGA (8x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RW",
    "Config Code": "3G8",
    "DRAM Speed": "DDR5-6400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B1536M16RV-56B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "102/153-ball VFBGA",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RV",
    "Config Code": "1536M16",
    "DRAM Speed": "DDR5-5600B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B4G8AT-64B:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78/117-ball VFBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "AT",
    "Config Code": "4G8",
    "DRAM Speed": "DDR5-6400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT53E1G32D2FW-046-AIT-A", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 1.1V or 0.6V VDDQ",
  package: "200-ball TFBGA (10x14.5)",
  topology: { ce: "Unknown", die: 2 },
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "FW",
    "Config Code": "1G32",
    "DRAM Speed": "2133MHz (LPDDR4-4266)",
    "Operation Temperature": "Automotive Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT53E1G32DDFW-046-AIT:A", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 1.1V or 0.6V VDDQ",
  package: "200-ball TFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "FW",
    "Config Code": "1G32",
    "DRAM Speed": "2133MHz (LPDDR4-4266)",
    "Operation Temperature": "Automotive Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A",
    "Special Option": "LPDDR4 mixed die stack (1x Z42M + 2x Z42N)"
  }
});
assertDecodedField("MT53E1G32DDFW-046-AIT:A", "die_count", 3);

assertDram("MT62F1G32D4DS-031-WT-B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "200-ball WFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT62F1G32D3DS-031-WT:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "200-ball WFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});
assertDecodedField("MT62F1G32D3DS-031-WT:B", "die_count", 3);

assertDram("MT62F1G64D4EK-023 WT:B", {
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "441-ball TFBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "EK",
    "Config Code": "1G64",
    "DRAM Speed": "4266MHz (LPDDR5X-8533)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

const micronLpddr5Automotive441bSamples = [
  {
    partNumber: "MT62F512M64D4EK-031 AIT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Industrial (-40°C ~ 95°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 AAT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 AUT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Ultra (-40°C ~ 125°C)"
  },
  {
    partNumber: "MT62F512M64D4EK-031 FAAT:B",
    densityMbit: 32768,
    density: "32Gb",
    configCode: "512M64",
    dieCount: 4,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)",
    specialOption: "Functional safety features"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AIT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Industrial (-40°C ~ 95°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AAT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 AUT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Ultra (-40°C ~ 125°C)"
  },
  {
    partNumber: "MT62F1G64D8EK-031 FAAT:B",
    densityMbit: 65536,
    density: "64Gb",
    configCode: "1G64",
    dieCount: 8,
    operationTemperature: "Automotive Grade (-40°C ~ 105°C)",
    specialOption: "Functional safety features"
  }
] as const;

for (const sample of micronLpddr5Automotive441bSamples) {
  const specialOption = "specialOption" in sample ? sample.specialOption : undefined;
  assertDram(sample.partNumber, {
    densityMbit: sample.densityMbit,
    density: sample.density,
    widthField: "x64",
    voltage: "1.05V VDD / 0.5V VDDQ",
    package: "441-ball TFBGA",
    extra: {
      "DRAM Type": "LPDDR5",
      "Package Code": "EK",
      "Config Code": sample.configCode,
      "DRAM Speed": "3200MHz (LPDDR5-6400)",
      "Operation Temperature": sample.operationTemperature,
      "Die Revision": "Rev B",
      ...(specialOption ? { "Special Option": specialOption } : {})
    },
    absentExtra: specialOption ? [] : ["Special Option"]
  });
  assertDecodedField(sample.partNumber, "die_count", sample.dieCount);
}

assertDram("MT62F512M64D4EK-031FAATB", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x64",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "441-ball TFBGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "EK",
    "Config Code": "512M64",
    "DRAM Speed": "3200MHz (LPDDR5-6400)",
    "Operation Temperature": "Automotive Grade (-40°C ~ 105°C)",
    "Die Revision": "Rev B",
    "Special Option": "Functional safety features"
  }
});
assertDecodedField("MT62F512M64D4EK-031FAATB", "die_count", 4);

assertDram("MT62F1G32D4DS", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "200-ball WFBGA (10x14.5)",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "Operation Temperature": "Commercial"
  },
  absentExtra: ["DRAM Speed", "Die Revision"]
});

assertDram("MT41K512M8DA-107:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x10.5)",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41K512M8DA-125E:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x10.5)",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1600 CL10",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41K1G4DA-107:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x10.5)",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "1G4",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41J1G4THD-15E:D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.5V VDD",
  package: "78-ball FBGA (9x11.5)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "THD",
    "Config Code": "1G4",
    "DRAM Speed": "DDR3-1333 CL9",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev D"
  }
});

assertDram("MT41J1G8TRF-107:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball FBGA (9.5x11.5)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "1G8",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT41K512M8THV-125:M", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x11.5)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "THV",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev M"
  }
});

assertDram("MT41K2G4RKB-107:P", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (8x10.5)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "RKB",
    "Config Code": "2G4",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  }
});

assertDram("MT41K512M16TNA-125:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA (10x14)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TNA",
    "Config Code": "512M16",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT41K4G4KJR-125:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (9.5x13)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "KJR",
    "Config Code": "4G4",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT41K1G16DGA-125:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA (9.5x14)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "DGA",
    "Config Code": "1G16",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});
assertDecodedField("MT41J128M16JT-093", "dram_speed", "DDR3-2133 CL14");

assertDram("MT41K2G4TRF", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "78-ball FBGA (9.5x11.5)",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "2G4",
    "Operation Temperature": "Commercial"
  },
  absentExtra: ["DRAM Speed", "Die Revision"]
});

assertDram("MT47H128M16RT-25E:C", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA (9x12.5)",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "RT",
    "Config Code": "128M16",
    "DRAM Speed": "DDR2-800",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT47H128M16RT-3:C", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA (9x12.5)",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "RT",
    "Config Code": "128M16",
    "DRAM Speed": "DDR2-666 CL5",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT46V32M16P-5B-IT-J", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "P",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev J"
  }
});

assertDram("MT46V32M16P-6T:J", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "P",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-332 CL2.5",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev J"
  }
});

assertDram("MT46H32M32LFB5-5 IT:B", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "90-ball VFBGA (8x13)",
  extra: {
    "DRAM Type": "LPDDR",
    "Package Code": "B5",
    "Config Code": "32M32",
    "DRAM Speed": "200MHz",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT48LC16M8A2P-6A:L", {
  densityMbit: 128,
  density: "128Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "P",
    "Config Code": "16M8",
    "DRAM Speed": "166MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev L"
  }
});

assertDram("MT48LC16M8A2P-7E:L", {
  densityMbit: 128,
  density: "128Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "P",
    "Config Code": "16M8",
    "DRAM Speed": "SDR-133 CL2",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev L"
  }
});

assertDram("MT48H16M32LFB5-75:A", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "90-ball VFBGA (8x13)",
  extra: {
    "DRAM Type": "LPSDR",
    "Package Code": "B5",
    "Config Code": "16M32",
    "DRAM Speed": "133MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT48H16M32LGB5-75:A", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "90-ball VFBGA (8x13)",
  extra: {
    "DRAM Type": "LPSDR",
    "Package Code": "B5",
    "Config Code": "16M32",
    "DRAM Speed": "133MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "Special Option": "Reduced page-size addressing"
  }
});

assertDram("MT42L128M32D1LF-25 WT:A", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "168-ball WFBGA (12x12)",
  extra: {
    "DRAM Type": "LPDDR2",
    "Package Code": "LF",
    "Config Code": "128M32",
    "DRAM Speed": "400MHz",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT52L512M32D2PF-107 WT:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "178-ball FBGA (11.5x11)",
  extra: {
    "DRAM Type": "LPDDR3",
    "Package Code": "PF",
    "Config Code": "512M32",
    "DRAM Speed": "933MHz (DDR-1866)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT52K512M32PF-107-WT:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "178-ball FBGA (11.5x11)",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "PF",
    "Config Code": "512M32",
    "DRAM Speed": "933MHz (DDR-1866)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT51J256M32HF-80:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.5V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5-8Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT51J256M32HF-50:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.5V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5-5Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT58K256M32JA-100:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "190-ball FBGA (10x14)",
  extra: {
    "DRAM Type": "GDDR5X",
    "Package Code": "JA",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5X-10Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT58K256M32JA-120:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "190-ball FBGA (10x14)",
  extra: {
    "DRAM Type": "GDDR5X",
    "Package Code": "JA",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5X-12Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61A256M32JE-10:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-10Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K256M32JE-14:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  topology: { ce: "Unknown", die: 1 },
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-14Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K256M32JE-15:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-15Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K512M32KPA-24-U", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6X",
    "Package Code": "KPA",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR6X-24Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev U"
  }
});

assertDram("MT61K512M32KPA-22:U", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR6X",
    "Package Code": "KPA",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR6X-22Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev U"
  }
});

assertDram("MT68A512M32DF-32:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "266-ball FBGA (12x14x1.1)",
  extra: {
    "DRAM Type": "GDDR7",
    "Package Code": "DF",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR7-32Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertStackedDram("MT54A16G8080A00AC-28:A-B006", {
  type: "HBM2E",
  densityMbit: 131072,
  density: "128Gb",
  voltage: "1.2V",
  fields: {
    channel_count: 8,
    die_count: 8
  },
  extra: {
    "Channel Count": 8,
    "DRAM Speed": "2.8 Gb/s",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "ECC enabled": true
  }
});

assertStackedDram("MT54A8G8040A00BF-32:A", {
  type: "HBM2E",
  densityMbit: 65536,
  density: "64Gb",
  voltage: "1.2V",
  fields: {
    channel_count: 8,
    die_count: 4
  },
  extra: {
    "Channel Count": 8,
    "DRAM Speed": "3.2 Gb/s",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "ECC enabled": true
  }
});

assertStackedDram("MT43A4G40100NFA-S15:A", {
  type: "HMC",
  densityMbit: 16384,
  density: "16Gb",
  voltage: "VDDM 1.2V / VCCP 2.5V",
  package: "BGA, 4-link, 896-ball (31x31), 2GB",
  fields: {
    die_count: 4
  },
  extra: {
    "DRAM Die Density": "4Gb",
    "Revision": "Logic design revision 1",
    "DRAM Speed": "15 Gb/s SerDes",
    "Interface Type": "HMC Gen2 PHY",
    "Operation Temperature": "DRAM 0C to 105C / Logic 0C to 110C",
    "Die Revision": "Rev A"
  }
});

assertStackedDram("MT43A4G40200NFA-S15:A", {
  type: "HMC",
  densityMbit: 16384,
  density: "16Gb",
  voltage: "VDDM 1.2V / VCCP 2.5V",
  package: "BGA, 4-link, 896-ball (31x31), 2GB",
  fields: {
    die_count: 4
  },
  extra: {
    "DRAM Die Density": "4Gb",
    "Revision": "Logic design revision 2",
    "DRAM Speed": "15 Gb/s SerDes",
    "Interface Type": "HMC Gen2 PHY",
    "Operation Temperature": "DRAM 0C to 105C / Logic 0C to 110C",
    "Die Revision": "Rev A"
  }
});

assertDram("H5TQ4G63AFR-TEC", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G63",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5TC4G83CFR-PBA", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "CFR"
  }
});

assertDram("H5TC4G83CFR-TEA", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Solder Type": "Lead Free and Halogen Free (RoHS compliant)",
    "Die Revision": "CFR"
  }
});

assertDram("H5TQ2G63BFK-H9K", {
  vendor: "skhynix",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "2G63",
    "DRAM Speed": "DDR3-1333 9-9-9",
    "Operation Temperature": "Automotive",
    "Die Revision": "BFK"
  }
});

assertDram("H5TC8G83AMR-PBA", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "M",
    "Config Code": "8G83",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "AMR"
  }
});

assertDram("H5TC8G63AMR-PBA", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "M",
    "Config Code": "8G63",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "AMR"
  }
});

assertDram("H5AN8G8NAFR-UHC", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "F",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-2400T 17-17-17",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5AN8G8NCJR-XNC", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "J",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CJR"
  }
});

assertDram("H5ANAG8NCMR-XNC", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "M",
    "Config Code": "AG8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CMR"
  }
});

assertDram("H5ANAG6NCMR-UHC", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "M",
    "Config Code": "AG6N",
    "DRAM Speed": "DDR4-2400T 17-17-17",
    "Operation Temperature": "Commercial",
    "Die Revision": "CMR"
  }
});

assertDram("H5CG48AGBD-X018", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "DRAM Generation": "2nd generation",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG48AGBD-X018", "die_count", 1);

assertDram("H5CGD8MHBD-X021", {
  vendor: "skhynix",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "24Gb",
    "DRAM Speed": "DDR5-6400 52-52-52",
    "DRAM Generation": "1st generation",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "M-die"
  }
});
assertDecodedField("H5CGD8MHBD-X021", "die_count", 1);

assertDram("H5CG44AEBD", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "DRAM Generation": "2nd generation",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "A-die"
  },
  absentExtra: ["DRAM Die Density", "Special Option"]
});

assertDram("H5CG44AGBJX018N", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "DRAM Generation": "2nd generation",
    "Operation Temperature": "Industrial (-40 to 95C)",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG44AGBJX018N", "die_count", 1);

assertDram("H5CG48AGEDX013", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 52-45-45 (for 3DS)",
    "DRAM Generation": "2nd generation",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Special Option": "TSV",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG48AGEDX013", "die_count", 4);

assertDram("H5CG56MMBDX052", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "106-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "32Gb",
    "DRAM Speed": "DDR5-8000 64-64-64",
    "DRAM Generation": "1st generation",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "M-die"
  }
});
assertDecodedField("H5CG56MMBDX052", "die_count", 1);

assertDram("H5AN8G8NAFR", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "F",
    "Config Code": "8G8N",
    "Die Revision": "AFR"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("H5GQ2H24AFR-R0C", {
  vendor: "skhynix",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball BGA",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "F",
    "Config Code": "2H24",
    "DRAM Speed": "GDDR5-6Gbps/pin",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H9HCNNN8KUMLHR-NME", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "200-ball FBGA",
  topology: { ce: 1, die: 2 },
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "UMLHR",
    "Config Code": "8K",
    "Channel Count": 2,
    "CE Count": 1,
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9HCNNNCPUMLXR-NEE", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "UMLXR",
    "Config Code": "CP",
    "Channel Count": 2,
    "CE Count": 2,
    "DRAM Speed": "LPDDR4-4266",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9HCNNNCPMMLXR-NEE", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "MMLXR",
    "Config Code": "CP",
    "Channel Count": 2,
    "CE Count": 2,
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("HY57V561620FTP-H", {
  vendor: "skhynix",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "FTP",
    "Config Code": "561620",
    "DRAM Speed": "SDR-H"
  }
});

assertDram("HY5DU121622DTP-D43", {
  vendor: "skhynix",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.6V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "DTP",
    "Config Code": "121622",
    "DRAM Speed": "DDR-400B (3-3-3)"
  }
});

assertDram("HY5PS121621CFP-Y5", {
  vendor: "skhynix",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "CFP",
    "Config Code": "121621",
    "DRAM Speed": "DDR2-Y5"
  }
});

assertDram("H9JCNNNCP3MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "MLYR",
    "Config Code": "CP3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNBK3MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "MLYR",
    "Config Code": "BK3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNFA5MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Stack": "8 dies, 2 CS",
    "Package Code": "MLYR",
    "Config Code": "FA5",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H58G56CK8BX146", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "CK8BX146",
    "Config Code": "56",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDram("H58G66CK8BX147", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "CK8BX147",
    "Config Code": "66",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDram("H58G78CK8BX185", {
  vendor: "skhynix",
  densityMbit: 131072,
  density: "128Gb",
  widthField: "Unknown",
  voltage: "0.5V to 1.8V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "CK8BX185",
    "Config Code": "78",
    "Channel Count": 2,
    "CE Count": 2,
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40°C ~ 90°C"
  }
});

assertDecodedFieldAbsent("H58G78CK8BX185", "die_count");

assertDram("H56C8H24MJR-S2C", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V / 1.35V / 1.35V",
  package: "180-ball FBGA",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "FBGA-180",
    "Config Code": "C8H24",
    "DRAM Speed": "GDDR6-S2",
    "Operation Temperature": "Commercial",
    "Die Revision": "MJR"
  }
});

assertDram("H56G42AS8DX014", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VPP; 1.35V / 1.25V / 1.20V VDD/VDDQ",
  package: "180-ball BGA",
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Speed": "GDDR6-20Gbps/pin max (10.0GHz WCK)",
    "Interface Type": "POD_135 / POD_125",
    "Solder Type": "Lead-Free and Halogen-Free (RoHS compliant)",
    "Die Revision": "A"
  }
});

assertDram("H56G42AS2DX014", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VPP; 1.35V / 1.25V / 1.20V VDD/VDDQ",
  package: "180-ball BGA",
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Speed": "GDDR6-14Gbps/pin max (7.0GHz WCK)",
    "Interface Type": "POD_135 / POD_125",
    "Solder Type": "Lead-Free and Halogen-Free (RoHS compliant)",
    "Die Revision": "A"
  }
});

assertDram("K4A8G085WB-BCRC", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5WB",
    "Config Code": "8G08",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "B-die"
  }
});

assertDram("K4A8G085WB", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5WB",
    "Config Code": "8G08",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("K4A4G085WE-BITD", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5WE",
    "Config Code": "4G08",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Die Revision": "E-die"
  }
});

assertDram("K4A4G045WD-BCPB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5WD",
    "Config Code": "4G04",
    "DRAM Speed": "DDR4-2133 15-15-15",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "D-die"
  }
});

assertDram("K4A4G165WE-BIPB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5WE",
    "Config Code": "4G16",
    "DRAM Speed": "DDR4-2133 15-15-15",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "E-die"
  }
});

assertDram("K4AAG085WB-MCRC", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "AG08",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Special Option": "DDP",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4AAG085WB-MCRC", "die_count", 2);
assertDecodedFieldAbsent("K4AAG085WB-MCRC", "ce_count");
assertDecodedField("K4A8G085WB-2CRC", "die_count", 2);
assertDecodedField("K4A8G085WB-2CRC", "special_option", "2H TSV");
assertDecodedField("K4A8G085WB-3CRC", "die_count", 2);
assertDecodedField("K4A8G085WB-3CRC", "special_option", "2H 3DS");
assertDecodedField("K4A8G085WB-4CRC", "die_count", 4);
assertDecodedField("K4A8G085WB-4CRC", "special_option", "4H TSV");
assertDecodedField("K4A8G085WB-5CRC", "die_count", 4);
assertDecodedField("K4A8G085WB-5CRC", "special_option", "4H 3DS");

assertDram("K4AAG165WB-MCRC", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "AG16",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4AAG165WB-MCRC", "die_count", 2);
assertDecodedFieldAbsent("K4AAG165WB-MCRC", "ce_count");

assertDram("K4ABG085WA-MCWE", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WA",
    "Config Code": "BG08",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "A-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4ABG085WA-MCWE", "die_count", 2);
assertDecodedFieldAbsent("K4ABG085WA-MCWE", "ce_count");

assertDram("K4ABG165WB-MCWE", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "BG16",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4ABG165WB-MCWE", "die_count", 2);
assertDecodedFieldAbsent("K4ABG165WB-MCWE", "ce_count");

assertDecodedField("K4A8G085WB-BCRB", "dram_speed", "DDR4-2133 17-15-15");
assertDecodedField("K4A8G085WB-BCRB", "operation_temperature", "Commercial (0C~85C)");
assertDecodedField("K4A8G085WC-BCAE", "dram_speed", "DDR4-3200 26-22-22");

assertDram("K4S511632D-UC75", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "U",
    "Config Code": "5116",
    "DRAM Speed": "SDR-133",
    "Operation Temperature": "Commercial",
    "Die Revision": "D-die"
  }
});

assertDram("K4H510838F-HCCC", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x8",
  voltage: "2.5V VDD",
  package: "60-ball FBGA",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "H",
    "Config Code": "5108",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Commercial",
    "Die Revision": "F-die"
  }
});

assertDram("K4T56163QI-ZCE6", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Z",
    "Config Code": "5616",
    "DRAM Speed": "DDR2-667",
    "Operation Temperature": "Commercial",
    "Die Revision": "I-die"
  }
});

assertDram("K4B1G0846D-HCF7", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "H",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-800 6-6-6",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  }
});

assertDram("K4B1G0846I-BCNB", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "I-die"
  }
});

assertDram("K4B1G0846I-MCMA", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "M",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "I-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4B1G0846I-MCMA", "die_count", 2);
assertDecodedFieldAbsent("K4B1G0846I-MCMA", "ce_count");

assertDram("K4B2G1646F-BCNB", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "F-die"
  }
});

assertDram("K4B2G1646F-BYMA", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "F-die"
  }
});

assertDram("K4B4G0846D-ECMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "E",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4B4G0846D-ECMA", "die_count", 4);
assertDecodedFieldAbsent("K4B4G0846D-ECMA", "ce_count");

assertDram("K4B4G0446E-BYK0", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "4G04",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G0846E-BMMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Industrial (-40C~95C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G0846E-BCNB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G1646Q-HYF8", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "H",
    "Config Code": "4G16",
    "DRAM Speed": "DDR3L-1066 7-7-7",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "Q-die"
  }
});

assertDram("K4B4G1646D-BYMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B",
    "Config Code": "4G16",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  }
});

assertDram("K4BAG0846B-HCK0", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "H",
    "Config Code": "AG08",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "B-die"
  }
});

assertDram("K4B2G1646B-HKK0", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "H",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), reduced standby",
    "Special Option": "Reduced Standby",
    "Die Revision": "B-die"
  }
});

assertDram("K4RAH086VB-BCQK", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "6VB",
    "Config Code": "AH08",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RAH046VB-BCQK", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "6VB",
    "Config Code": "AH04",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RAH165VB-BCWM", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5VB",
    "Config Code": "AH16",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RHE086VB-BCWM", {
  vendor: "samsung",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "6VB",
    "Config Code": "HE08",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RHE165VB-BCWM", {
  vendor: "samsung",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "106-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "5VB",
    "Config Code": "HE16",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RBH046VM-BCWM", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "6VM",
    "Config Code": "BH04",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDecodedField("K4RHE086VB-BIWM", "operation_temperature", "Industrial (-40C~95C)");
assertDecodedField("K4RHE086VB-BIWM", "dram_speed", "DDR5-5600 46-45-45");

assertDram("K3PE7E700M-XGC1", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "E700M",
    "Config Code": "3PE7",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3QF1F10DM-AGCE", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V / 1.2V / 1.2V",
  package: "253-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "F10DM",
    "Config Code": "3QF1",
    "DRAM Speed": "LPDDR3-1600",
    "Operation Temperature": "-25C~70C"
  }
});

assertDram("K4F6E304HB-MGCJ", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 1.1V",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "E304HB",
    "Config Code": "4F6",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3LKBKB0BM-MGCP", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "315-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "KB0BM",
    "Config Code": "3LKB",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3KL3L30CM-JGCT", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "441-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "L30CM",
    "Config Code": "3KL3",
    "DRAM Speed": "LPDDR5X-7500",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3KL3L30CM-BGCU", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x16",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "496-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "L30CM",
    "Config Code": "3KL3",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-25C~85C"
  }
});

assertDecodedField("K3KL3L30CM-EUCV", "package", "561-ball FBGA");
assertDecodedField("K3KL3L30CM-EUCV", "dram_width", "x64");
assertDecodedField("K3KL3L30CM-EUCV", "dram_speed", "LPDDR5X-9600");
assertDecodedField("K3KL3L30CM-EUCV", "operation_temperature", "-40C~125C");

assertDram("K4U6E3S4AA-MGCL", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "M",
    "Config Code": "4U6E3S",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "2nd Generation",
    "Channel Count": 2,
    "Interface Type": "LVSTLE_06",
    "Operation Temperature": "-25C~85C"
  }
});
assertDecodedField("K4U6E3S4AA-MGCL", "die_count", 1);

assertDram("K4UBE3D4AA-MGCL", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "2 dies",
    "Package Code": "M",
    "Config Code": "4UBE3D",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "2nd Generation",
    "Channel Count": 2,
    "Interface Type": "LVSTLE_06",
    "Operation Temperature": "-25C~85C"
  }
});
assertDecodedField("K4UBE3D4AA-MGCL", "die_count", 2);

assertDram("K4X51163PC", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Config Code": "51163"
  },
  absentExtra: ["Package Code", "DRAM Speed", "Operation Temperature"]
});

assertDram("K4X51163PC-FGC3", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "60-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "F",
    "Config Code": "51163",
    "DRAM Speed": "Mobile DDR-133 CL3",
    "Operation Temperature": "Extended, low power, i-TCSR, PASR, DS"
  }
});

assertDecodedField("K4X51263PC", "special_option", "JEDEC stacked layout");
assertDecodedFieldAbsent("K4X51263PC", "die_count");
assertDecodedField("K4X51303PC", "ce_count", 2);
assertDecodedField("K4X51303PC", "special_option", "2 CKE");
assertDecodedFieldAbsent("K4X51303PC", "die_count");

assertDram("K4U52324Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Q",
    "Config Code": "52324"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4J52324Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Q",
    "Config Code": "52324"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4J55323Q", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Q",
    "Config Code": "55323"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4N51163Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Q",
    "Config Code": "51163"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4N56163Q", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "Q",
    "Config Code": "56163"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4D551638", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD/VDDQ",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Config Code": "551638"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D263238", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x32",
  voltage: "2.5V VDD/VDDQ",
  package: "144-ball FBGA",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Config Code": "263238"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D261638", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD/VDDQ",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Config Code": "261638"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D263238E-GC33", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x32",
  voltage: "2.5V VDD/VDDQ",
  package: "144-ball FBGA",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "E",
    "Config Code": "263238",
    "DRAM Speed": "GDDR-GC33"
  }
});

assertDram("K4N56163QF-GC37", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "QF",
    "Config Code": "56163",
    "DRAM Speed": "GDDR2-533Mbps/pin"
  }
});

assertDram("K4J52324QC-BC14", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "QC",
    "Config Code": "52324",
    "DRAM Speed": "GDDR3-1.4Gbps/pin"
  }
});

assertDram("K4U52324QE-BC08", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "136-ball FBGA",
  extra: {
    "DRAM Type": "GDDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "QE",
    "Config Code": "52324",
    "DRAM Speed": "GDDR4-BC08"
  }
});

assertDram("K4W1G1646E-HC12", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.5V VDD/VDDQ",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "E",
    "Config Code": "1G1646",
    "DRAM Speed": "gDDR3-1600Mbps/pin"
  }
});

assertDram("K4W2G1646Q-BC1A", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD/VDDQ",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "Q",
    "Config Code": "2G1646",
    "DRAM Speed": "gDDR3-2133Mbps/pin"
  }
});

assertDram("K4W4G1646D-BY12", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD/VDDQ",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "D",
    "Config Code": "4G1646",
    "DRAM Speed": "gDDR3-1600Mbps/pin"
  }
});

assertDram("K4G80325FB-HC25", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball FBGA",
  extra: {
    "DRAM Type": "GDDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "FB",
    "Config Code": "80325",
    "DRAM Speed": "GDDR5-8Gbps"
  }
});

assertDram("K4Z80325BC-HC14", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "180-ball FBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BC",
    "Config Code": "80325",
    "DRAM Speed": "GDDR6-14Gbps"
  }
});

assertDram("K4VAF325ZC-SC32", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "266-ball FBGA",
  extra: {
    "DRAM Type": "GDDR7",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "ZC",
    "Config Code": "AF325",
    "DRAM Speed": "GDDR7-32Gbps"
  }
});
assertDecodedField("K4VAF325ZC-SC36", "dram_speed", "GDDR7-36Gbps");

assertDram("NT5DS32M16CS-5T", {
  vendor: "nanya",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "CS",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400 3-3-3"
  }
});

assertDram("NT5TU32M16FG-ACI", {
  vendor: "nanya",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "FG",
    "Config Code": "32M16",
    "DRAM Speed": "DDR2-800 5-5-5",
    "Operation Temperature": "Industrial (-40C~95C)"
  }
});

assertDram("NT5CB128M16JR-DI", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600 11-11-11"
  }
});

assertDram("NT5CC128M16JR-DI", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600 11-11-11"
  }
});

assertDram("NT5CB512M8CN-AC", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "CN",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-800 5-5-5",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5CC256M16CP-FL", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "CP",
    "Config Code": "256M16",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5AD1024M8C3-HR", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "C3",
    "Config Code": "1024M8",
    "DRAM Speed": "DDR4-2666"
  }
});

assertDram("NT5AD1024M8C3", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "C3",
    "Config Code": "1024M8"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("NT5FF1024M16A4-Q5", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "106-ball BGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "A4",
    "Config Code": "1024M16",
    "DRAM Speed": "DDR5-5600",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5FF2048M8EK-WEU", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "EK",
    "Config Code": "2048M8",
    "DRAM Speed": "DDR5-8000",
    "Operation Temperature": "Industrial (-40C~105C)"
  }
});

assertDram("NT5FF2048M8DK-UB", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "DK",
    "Config Code": "2048M8",
    "DRAM Speed": "DDR5-7200",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT6TL128M32BA-G0", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "134-ball BGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BA",
    "Config Code": "128M32",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "Commercial (-25C~85C)"
  }
});

assertDram("NT6CL256M32AM-H0", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "178-ball BGA",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "AM",
    "Config Code": "256M32",
    "DRAM Speed": "LPDDR3-2133",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6AP256F64BN-J1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "376-ball PoP",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "BN",
    "Config Code": "256F64",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6AP512T32AV-J1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball BGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "AV",
    "Config Code": "512T32",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K2", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball BGA",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5-7500",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "315-ball BGA",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("EDS1216AATA-75", {
  vendor: "elpida",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP-II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "AATA",
    "Config Code": "1216",
    "DRAM Speed": "133MHz"
  }
});

assertDram("EDD2516AKTA-5B", {
  vendor: "elpida",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP-II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "AKTA",
    "Config Code": "2516",
    "DRAM Speed": "DDR-400"
  }
});

assertDram("EDE1116ACBG-8E", {
  vendor: "elpida",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball FBGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "ACBG",
    "Config Code": "1116",
    "DRAM Speed": "DDR2-800"
  }
});

assertDram("EDJ4208BASE-GN", {
  vendor: "elpida",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BASE",
    "Config Code": "4208",
    "DRAM Speed": "DDR3-1600K (11-11-11)"
  }
});

assertDram("EDF8164A3MA-GD-F", {
  vendor: "elpida",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "A3MA",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR3-1066"
  }
});

assertDram("EDB8164B3PF-8D", {
  vendor: "elpida",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "216-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "B3PF",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR2-1066"
  }
});

assertDram("EDW2032BBBG-60", {
  vendor: "elpida",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "170-ball FBGA",
  extra: {
    "DRAM Type": "GDDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BBBG",
    "Config Code": "2032",
    "DRAM Speed": "GDDR5-6Gbps"
  }
});

assertDram("CXDQ3BFAM-CJ", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "FAM",
    "Config Code": "3B",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("CXDQ3BFAM", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "FAM",
    "Config Code": "3B"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("CXDQ3A8AM-CQ-A", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "8AM",
    "Config Code": "3A",
    "DRAM Speed": "DDR4-2666",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "A-die"
  }
});

assertDram("CXDQ3A8AM-IJ-A", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "8AM",
    "Config Code": "3A",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Die Revision": "A-die"
  }
});

assertDram("CXDQ3BFAM-WG", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "FAM",
    "Config Code": "3B",
    "DRAM Speed": "DDR4-2666",
    "Operation Temperature": "Wide temperature (-40C~95C)",
    "Die Revision": "M-die",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDQ4A8AM-CJ-M", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "8AM",
    "Config Code": "4A",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "M-die",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDR4E8BM-CS-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BM",
    "Config Code": "4E8",
    "DRAM Speed": "DDR5-5600",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "Rev A",
    "Process Node": "CXMT G4 / 16nm-class"
  }
});

assertDram("CXDR4E8BM-CR-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball FBGA",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "BM",
    "Config Code": "4E8",
    "DRAM Speed": "DDR5-4800",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "Rev A",
    "Process Node": "CXMT G4 / 16nm-class"
  }
});

assertDram("CDTQ", {
  vendor: "cxmt",
  densityMbit: 98304,
  density: "96Gb",
  widthField: "Unknown",
  voltage: "Unknown",
  package: "BGA PoP MCP",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Density": "12Gb",
    "Package Code": "CDTQ",
    "DRAM Generation": "CXMT G3",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCAM-MK", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "CAM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-3733",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB4CBAM-MK-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "BAM",
    "Config Code": "4C",
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCBM-MA-A", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "CBM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCBM-MK-A", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Stack": "4 dies, 2 CS",
    "Package Code": "CBM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("IS43QR8K02S2A", {
  vendor: "issi",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "Config Code": "2G8 S2",
    "Die Revision": "A"
  }
});

assertDram("IS43TR16512S2DL", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "Config Code": "512M16 S2",
    "Die Revision": "D"
  }
});

assertDram("IS43TR81280CL-107MBLI-TR", {
  vendor: "issi",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.35V or 1.5V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "Config Code": "128M8",
    "Die Revision": "C",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Package Code": "B (BGA)",
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +85C)"
  }
});

assertDram("IS41LV8100B-7BBLI-TR", {
  vendor: "issi",
  densityMbit: 8,
  density: "8Mb",
  widthField: "x8",
  voltage: "3.3V",
  package: "BGA",
  extra: {
    "DRAM Type": "Asynchronous DRAM",
    "Config Code": "1M8",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)",
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +85C)"
  }
});

assertDram("IS42S16100B-7BB", {
  vendor: "issi",
  densityMbit: 16,
  density: "16Mb",
  widthField: "x16",
  voltage: "3.3V SDR",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "Config Code": "1M16",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS45S16100B-7BB", {
  vendor: "issi",
  densityMbit: 16,
  density: "16Mb",
  widthField: "x16",
  voltage: "3.3V SDR",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "Config Code": "1M16",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS46DR16128A-25BB", {
  vendor: "issi",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "DDR2",
  package: "BGA",
  extra: {
    "DRAM Type": "DDR2",
    "Config Code": "128M16",
    "Die Revision": "A",
    "DRAM Speed": "400MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS46LD16128A-25BB", {
  vendor: "issi",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "LPDDR2",
  package: "BGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "Config Code": "128M16",
    "Die Revision": "A",
    "DRAM Speed": "400MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS43LQ32256BL", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball BGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Config Code": "2x16 256M",
    "DRAM Speed": "LPDDR4X-3733/3200"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W668GG6TB-06", {
  vendor: "winbond",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball VFBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "TB",
    "Config Code": "8GG6TB",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W631GU6NB09J", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball VFBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "NB",
    "Config Code": "1GU6NB",
    "DRAM Speed": "DDR3-2133",
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66DP2RQQAHJ", {
  vendor: "winbond",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball WFBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "QQA",
    "Config Code": "DP2RQQA",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M16U4G16256A(2Z)", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "2Z",
    "Config Code": "256M16",
    "DRAM Speed": "DDR4 1333/1600MHz"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T4G8512A(2S)", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V or 1.5V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "2S",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3 800/933/1066MHz"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M56Z8G32256A(2H)", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball BGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "2H",
    "Config Code": "256M32",
    "DRAM Speed": "LPDDR4X 2133MHz"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM63B085TS", {
  vendor: "etron",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "TS",
    "Config Code": "64M8",
    "DRAM Speed": "SDR 200/166/143MHz",
    "Operation Temperature": "Automotive (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6HE16EWBH", {
  vendor: "etron",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "WBH",
    "Config Code": "E16E",
    "DRAM Speed": "DDR3 1866/1600/1333MHz",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6OF08NWALE", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "WALE",
    "Config Code": "F08N",
    "DRAM Speed": "DDR4-3200",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6PF32MBAJB", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "BAJB",
    "Config Code": "F32M",
    "DRAM Speed": "LPDDR4/4X 4266/3733/3200MHz",
    "Operation Temperature": "Commercial (0C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertSearchPnFirst("K4VAF325", "Samsung K4VAF325ZC-SC32");
assertSearchPnIncludes("K4UBE3D4AA", "Samsung K4UBE3D4AA-MGCL");
assertSearchPnIncludes("K4J55323Q", "Samsung K4J55323Q");
assertSearchPnIncludes("K4N51163Q", "Samsung K4N51163Q");
assertSearchPnIncludes("K4D261638", "Samsung K4D261638");
assertSearchPnIncludes("K4W2G1646", "Samsung K4W2G1646Q-BC1A");
assertSearchPnIncludes("K4W4G1646E", "Samsung K4W4G1646E-BC1A");
assertSearchPnIncludes("K4AAG165WB", "Samsung K4AAG165WB-MCTD");
assertSearchPnIncludes("K4A4G045WD", "Samsung K4A4G045WD-BCPB");
assertSearchPnIncludes("K4A4G165WE", "Samsung K4A4G165WE-BIPB");
assertSearchPnIncludes("K4B4G0846D", "Samsung K4B4G0846D-BCNB");
assertSearchPnIncludes("K4B4G0846E", "Samsung K4B4G0846E-BCNB");
assertSearchPnIncludes("K4B4G1646Q", "Samsung K4B4G1646Q-HYK0");
assertSearchPnIncludes("K4RAH046VB", "Samsung K4RAH046VB-BCQK");
assertSearchPnIncludes("K4RAH165VB", "Samsung K4RAH165VB-BCWM");
assertSearchPnIncludes("K4A8G045WD", "Samsung K4A8G045WD-BCWE");
assertSearchPnIncludes("H5ANAG8NCJR", "SKhynix H5ANAG8NCJR-XNC");
assertSearchPnIncludes("NT5FF2048M8DK", "Nanya NT5FF2048M8DK-UB");
assertSearchPnIncludes("NT6AP256F64", "Nanya NT6AP256F64BN-J1");
assertSearchPnIncludes("NT6BR1024", "Nanya NT6BR1024M16A3-K2");
assertSearchPnIncludes("EDW2032", "Elpida EDW2032BBBG-60");
assertSearchPnIncludes("CXDQ3A8", "CXMT CXDQ3A8AM-CQ-A");
assertSearchPnIncludes("CXDQ4A8", "CXMT CXDQ4A8AM-CJ-M");
assertSearchPnIncludes("CXDR4E8", "CXMT CXDR4E8BM-CS-A");
assertSearchPnIncludes("CXDB5C", "CXMT CXDB5CCAM-MK");
assertSearchPnIncludes("CXDB5CCBM", "CXMT CXDB5CCBM-MA-A");
assertSearchPnIncludes("CXDB6CCBM", "CXMT CXDB6CCBM-MA-A");
assertSearchPnIncludes("IS43QR8K02", "ISSI IS43QR8K02S2A");
assertSearchPnIncludes("W66DP2RQQA", "Winbond W66DP2RQQAHJ");
assertSearchPnIncludes("M16U4G16256", "ESMT M16U4G16256A(2Z)");
assertSearchPnIncludes("M56Z8G32256", "ESMT M56Z8G32256A(2H)");
assertSearchPnIncludes("EM6OF08", "Etron EM6OF08NWALE");
assertSearchPnIncludes("EM6PF32", "Etron EM6PF32MBAJB");
assertSearchPnIncludes("H5CG48", "SKhynix H5CG48AGBD-X018");
assertSearchPnIncludes("H5CG44AGBDX018", "SKhynix H5CG44AGBDX018N");
assertSearchPnIncludes("H5CG44AEBD", "SKhynix H5CG44AEBD");
assertSearchPnIncludes("H5CG54MGBD", "SKhynix H5CG54MGBDX051");
assertSearchPnIncludes("H5CG56MMBD", "SKhynix H5CG56MMBDX052");
assertSearchPnIncludes("H56G42AS8", "SKhynix H56G42AS8DX014");
assertSearchPnIncludes("H56G42AS2", "SKhynix H56G42AS2DX014");
assertSearchPnIncludes("CT40A1G8SA", "Micron CT40A1G8SA-62M:E");
assertSearchPnIncludes("MT62F512M64D4EK-031", "Micron MT62F512M64D4EK-031AIT:B");
assertSearchPnIncludes("MT62F512M64D4EK-031FAATB", "Micron MT62F512M64D4EK-031FAAT:B");
assertSearchPnIncludes("MT62F1G64D8EK-031F", "Micron MT62F1G64D8EK-031FAAT:B");
assertSearchPnIncludes("MT53E128M32D2FW-046ITA", "Micron MT53E128M32D2FW-046IT:A");
assertSearchPnIncludes("MT61K256M32JE-12A", "Micron MT61K256M32JE-12:A");
assertSearchPnIncludes("MT68A512M32DF-28A", "Micron MT68A512M32DF-28:A");
assertSearchPnIncludes("MT62F512M32D2DS-031AATB", "Micron MT62F512M32D2DS-031AAT:B");
assertDecodedPartNumber("MT53E128M32D2FW-046ITA", "MT53E128M32D2FW-046IT:A");
assertDecodedPartNumber("MT61K256M32JE-12A", "MT61K256M32JE-12:A");
assertDecodedPartNumber("MT68A512M32DF-28A", "MT68A512M32DF-28:A");
assertDecodedPartNumber("MT62F512M32D2DS-031AATB", "MT62F512M32D2DS-031AAT:B");
assertSearchPnIncludes("C9BJZ", "Micron CT40A1G8SA-62M:E");
assertSearchPnIncludes("B9DHG", "Micron MT47H32M16BT-3E");
assertSearchPnIncludes("MT43A4G40100", "Micron MT43A4G40100NFA-S15:A");
assertSearchPnIncludes("MT54A16G8080", "Micron MT54A16G8080A00AC-28:A-B006");
assertSearchMarkingRelation("C9BJZ", "CT40A1G8SA-62M:E");
assertSearchMarkingRelation("B9DHG", "MT47H32M16BT-3E");
assertSearchMarkingRelation("D9RLQ", "MT43A4G40100NFA-S15:A");
assertSearchMarkingRelation("D9ZFZ", "MT54A16G8080A00AC-28:A-B006");
