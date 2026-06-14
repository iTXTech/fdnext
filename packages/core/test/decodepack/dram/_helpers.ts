import assert from "node:assert/strict";
import type { FdnextResourceBundle, FieldValue, PartDecodeResult } from "../../../src/index";
import { createEngine } from "../../../src/index";
import dramPnJson from "../../../resources/dram-pn.json" with { type: "json" };
import mdbJson from "../../../resources/mdb.json" with { type: "json" };
import micronFbgaCodesJson from "../../../../../references/micron-fbga-codes.json" with { type: "json" };
import { embeddedResourceBundle } from "../../../src/resources";
import { compileDecodePack, defaultDecodePack } from "../../../src/decodepack";

export { dramPnJson, mdbJson, micronFbgaCodesJson };

export const compiledPack = compileDecodePack(defaultDecodePack);

const decodeOnlyResourceBundle = {
  partIndex: { rawNand: {}, managedNand: [], dram: [] },
  identifierIndex: { nandFlash: {} },
  markingIndex: { packageMarkings: {} },
  vendorIndex: {},
  controllerIndex: embeddedResourceBundle.controllerIndex,
  translationIndex: embeddedResourceBundle.translationIndex
} satisfies FdnextResourceBundle;

const decodeEngine = createEngine({
  resources: decodeOnlyResourceBundle,
  decoders: compiledPack.partDecoders
});

let fullEngineCache: ReturnType<typeof createEngine> | undefined;

function fullEngine(): ReturnType<typeof createEngine> {
  fullEngineCache ??= createEngine({
    resources: embeddedResourceBundle,
    decoders: compiledPack.partDecoders,
    profileTables: compiledPack.profileTables
  });
  return fullEngineCache;
}

export const engine: ReturnType<typeof createEngine> = {
  getVersion: () => decodeEngine.getVersion(),
  getCapabilities: (input) => fullEngine().getCapabilities(input),
  decodePart: (input) => decodeEngine.decodePart(input),
  searchParts: (input) => fullEngine().searchParts(input),
  decodeIdentifier: (input) => fullEngine().decodeIdentifier(input),
  searchIdentifiers: (input) => fullEngine().searchIdentifiers(input)
};

export const redundantStandaloneExtra = [
  "Product Family",
  "Product Version",
  "DRAM Density",
  "DRAM Width",
  "Reference Status",
  "Inference Source",
  "source",
  "status"
];

export const hiddenPublicCodeExtraKeys = new Set([
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
  "Product Code",
  "Marking Code"
]);

export const standaloneDramExtraKeys = new Set([
  "Config Code",
  "Package Code",
  "DRAM Speed",
  "CAS Latency",
  "DRAM Generation",
  "DRAM Die Density",
  "DRAM Die Count",
  "CS Count",
  "Bank Count",
  "Channel Count",
  "Interface Type",
  "Revision",
  "Operation Temperature",
  "Packing Type",
  "Solder Type",
  "Production Status",
  "Die Revision",
  "ECC enabled",
  "Process Node",
  "Marking Code",
  "Speed Grade",
  "Special Option"
]);

export const standardDramTypes = new Set([
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

export interface TestPartInfo {
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

export function fields(result: PartDecodeResult): FieldValue[] {
  return result.blocks.flatMap((block) => block.fields);
}

export function firstField(result: PartDecodeResult, ...keys: string[]): FieldValue | undefined {
  const all = fields(result);
  for (const key of keys) {
    const field = all.find((item) => item.key === key);
    if (field) return field;
  }
  return undefined;
}

export function fieldText(field: FieldValue | undefined): unknown {
  return field ? field.display ?? field.value : undefined;
}

export function blockIdForField(result: PartDecodeResult, key: string): string | undefined {
  return result.blocks.find((block) => block.fields.some((field) => field.key === key))?.id;
}

export function detect(partNumber: string, useFullEngine = false): TestPartInfo {
  const result = (useFullEngine ? fullEngine() : decodeEngine).decodePart({ query: partNumber, lang: "eng" });
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

export function extra(info: TestPartInfo): Record<string, unknown> {
  return info.detailFields;
}

export function assertKnownOrOmitted(actual: unknown, expected: unknown, message: string): void {
  if (expected === "Unknown" && actual === undefined) {
    return;
  }
  assert.equal(actual, expected, message);
}

export function assertSearchPnIncludes(query: string, expected: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

export function assertSearchPnFirst(query: string, expected: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer known DRAM PN suggestions`);
}

export function searchFbgaParts(query: string): string[] {
  return fullEngine().searchParts({ query, lang: "eng", limit: 20 }).items
    .filter((item) => item.device.markingCode === query)
    .map((item) => item.device.partNumber)
    .filter((partNumber): partNumber is string => Boolean(partNumber));
}

export function assertSearchMarkingRelation(query: string, expectedPartNumber: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 20 });
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

export function assertSpectekSearchMarkingRelation(query: string, expectedPartNumber: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 20 });
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

export function publicDramType(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().replace(/\s+(?:SDRAM|SGRAM)$/i, "") : undefined;
}

export function assertDram(
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
  let info = detect(partNumber);
  if (shouldRetryFullDramDecode(info, expected)) {
    info = detect(partNumber, true);
  }
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

function shouldRetryFullDramDecode(
  info: TestPartInfo,
  expected: {
    vendor?: string;
    extra: Record<string, unknown>;
  }
): boolean {
  if ((expected.vendor ?? "micron") !== undefined && info.vendor === undefined) {
    return true;
  }
  if (expected.extra["Marking Code"] !== undefined && info.markingCode === undefined) {
    return true;
  }
  const detailFields = extra(info);
  for (const [key, value] of Object.entries(expected.extra)) {
    if (key === "DRAM Type" || key === "Marking Code" || hiddenPublicCodeExtraKeys.has(key)) {
      continue;
    }
    if (value !== undefined && detailFields[key] === undefined) {
      return true;
    }
  }
  return false;
}

export function assertStackedDram(
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

export function assertDecodedField(partNumber: string, key: string, expected: unknown): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(fieldText(firstField(result, key)), expected, `${partNumber} fields.${key}`);
}

export function assertFieldBlock(partNumber: string, key: string, expectedBlockId: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode`);
  assert.equal(blockIdForField(result, key), expectedBlockId, `${partNumber} ${key} should be in ${expectedBlockId}`);
}

export function assertDecodedPartNumber(query: string, expected: string): void {
  const result = fullEngine().decodePart({ query, lang: "eng" });
  assert.equal(result.device?.partNumber, expected, `${query} should resolve to canonical part number`);
}

export function assertDecodedFieldAbsent(partNumber: string, key: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(firstField(result, key), undefined, `${partNumber} should not expose fields.${key}`);
}

export function assertUnknown(partNumber: string): void {
  const info = detect(partNumber);
  assert.equal(info.vendor, undefined, `${partNumber} should not be decoded as a known vendor`);
  assert.equal(info.type, undefined, `${partNumber} should not be decoded as a known type`);
}

export function resourceEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const entries = (raw as Record<string, unknown>).entries;
  return Array.isArray(entries) ? entries : [];
}

export function isMicronDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W|Y)/.test(partNumber);
}

export function micronDramFbgaEntries(raw: unknown): Array<{ code: string; pn: string }> {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const micron = record.micron && typeof record.micron === "object" && !Array.isArray(record.micron)
    ? record.micron as Record<string, unknown>
    : {};
  return Object.entries(micron)
    .map(([code, pn]) => ({ code: String(code).toUpperCase(), pn: String(pn).toUpperCase() }))
    .filter(({ code, pn }) => /^[0-9A-Z]{5}$/.test(code) && isMicronDramPartNumber(pn));
}

export function canonicalWinbondDramPn(partNumber: string): string {
  const ddrMatch = /^(W94(?:12|25)G6KH)([56][A-Z]?)$/.exec(partNumber);
  if (ddrMatch) {
    return `${ddrMatch[1]}-${ddrMatch[2]}`;
  }
  const ddr2Match = /^(W97(?:12G6KB|25G[68]KB|1GG[68]NB|2GG6KB|2GG8KS))((?:18|25|3)[A-Z]?)$/.exec(partNumber);
  if (ddr2Match) {
    return `${ddr2Match[1]}-${ddr2Match[2]}`;
  }
  const ddr3Match = /^(W63[1248]G[GU][68][A-Z]{2})((?:09|11|12|15)[A-Z]?)$/.exec(partNumber);
  if (ddr3Match) {
    return `${ddr3Match[1]}-${ddr3Match[2]}`;
  }
  const ddr4Match = /^(W66[48]GG[68][A-Z]{2})((?:06|07|08)[A-Z]?)$/.exec(partNumber);
  if (ddr4Match) {
    return `${ddr4Match[1]}-${ddr4Match[2]}`;
  }
  return partNumber;
}
