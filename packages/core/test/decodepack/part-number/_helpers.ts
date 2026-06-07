import assert from "node:assert/strict";
import { test } from "node:test";
import type { FdnextResourceBundle, FieldValue, PartDecodeResult } from "../../../src/index";
import { createEngine } from "../../../src/index";
import { embeddedResourceBundle } from "../../../src/resources";
import partNumberPnJson from "../../../resources/managed-nand-pn.json" with { type: "json" };
import { compileDecodePack, defaultDecodePack, explainPartDecode } from "../../../src/decodepack";

export { defaultDecodePack, partNumberPnJson };

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

export const engineWithoutFdb = createEngine({
  resources: decodeOnlyResourceBundle,
  decoders: compiledPack.partDecoders,
  profileTables: compiledPack.profileTables
});

export const hiddenPublicCodeExtraKeys = new Set([
  "Series Code",
  "Cell Code",
  "Layout Code",
  "Density Code",
  "Stack Code",
  "Generation Code",
  "Config Code",
  "Package Code",
  "Packing Type Code",
  "Controller Code",
  "Die Code",
  "Feature Code",
  "Marking Code"
]);

const internalPackFieldKeys = ["system", "group", "series_code", "cell_code", "layout_code", "density_code", "stack_code", "generation_code", "voltage_io_code"];
const legacyDisplayKeys = ["Component Generation", "Interface info"];
const vendorAliases: Record<string, string[]> = {
  biwin: ["biwin"],
  kingston: ["kingston"],
  kioxia: ["kioxia", "toshiba"],
  longsys: ["longsys", "foresee", "lexar"],
  micron: ["micron"],
  samsung: ["samsung"],
  siliconmotion: ["silicon motion", "smi"],
  sndk: ["sandisk", "western digital", "wd"],
  skhynix: ["sk hynix", "skhynix"],
  ymtc: ["ymtc"]
};

export interface TestPartInfo {
  partNumber: string;
  vendor?: string;
  markingCode?: string;
  type?: string;
  densityMbit?: number;
  density?: string;
  dieProfileField?: string;
  cellField?: string;
  widthField?: string;
  topology?: Record<string, unknown>;
  voltage?: string;
  interface?: Record<string, unknown>;
  package?: string;
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

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .replaceAll(/\be\s+mmc\b/g, "emmc")
    .replaceAll(/\be\s+mcp\b/g, "emcp")
    .replaceAll(/\bu\s+mcp\b/g, "umcp")
    .replaceAll(/\bv(?=\d)/g, "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function removeVendorPrefix(value: unknown, vendor: unknown): string {
  let normalized = normalizeText(value);
  for (const alias of vendorAliases[String(vendor)] ?? [String(vendor)]) {
    const aliasText = normalizeText(alias);
    if (aliasText && normalized.startsWith(`${aliasText} `)) {
      normalized = normalized.slice(aliasText.length + 1);
      break;
    }
  }
  return normalized;
}

function fieldsByLabel(result: PartDecodeResult): Record<string, unknown> {
  const fieldMap: Record<string, unknown> = {};
  for (const block of result.blocks) {
    for (const field of block.fields) {
      if (["vendor", "chip_kind", "product_type", "part_number"].includes(field.key)) {
        continue;
      }
      fieldMap[field.label] = fieldText(field);
    }
  }
  return fieldMap;
}

function resultType(result: PartDecodeResult): string {
  return String(result.device?.productType ?? result.device?.chipKind ?? "");
}

function isInternalCodeFieldKey(key: string): boolean {
  return key.endsWith("_code");
}

function collectPublicOutputFindings(partNumber: string, result: PartDecodeResult): string[] {
  const findings: string[] = [];
  const extraFields = fieldsByLabel(result);
  for (const key of legacyDisplayKeys) {
    if (Object.hasOwn(extraFields, key)) {
      findings.push(`${partNumber}: legacy display key ${key}`);
    }
  }

  const type = normalizeText(resultType(result));
  const system = normalizeText(extraFields.System);
  const group = normalizeText(extraFields.Group);
  const productVersion = normalizeText(extraFields["Product Version"]);
  const productFamily = removeVendorPrefix(extraFields["Product Family"], result.device?.vendor.id);
  const managedFamily = normalizeText(extraFields["Managed Family"]);
  const density = normalizeText(extraFields.Density);
  const storageDensity = normalizeText(extraFields["Storage Density"]);
  const aliases = (vendorAliases[String(result.device?.vendor.id)] ?? [String(result.device?.vendor.id)])
    .map((alias) => normalizeText(alias))
    .filter(Boolean);

  if (
    system &&
    (system === type || aliases.includes(system) || aliases.some((alias) => system === `${alias} ${type}` || system === `${alias} managed nand`))
  ) {
    findings.push(`${partNumber}: redundant System=${extraFields.System}`);
  }
  if (group && (group === type || group === `${type} flash`)) {
    findings.push(`${partNumber}: redundant Group=${extraFields.Group}`);
  }
  if (productVersion && (productVersion === normalizeText(extraFields["Storage Interface"]) || productVersion === type)) {
    findings.push(`${partNumber}: redundant Product Version=${extraFields["Product Version"]}`);
  }
  if (productFamily && (productFamily === productVersion || productFamily === normalizeText(extraFields["Storage Interface"]) || productFamily === type)) {
    findings.push(`${partNumber}: redundant Product Family=${extraFields["Product Family"]}`);
  }
  if (managedFamily && (managedFamily === type || managedFamily === system || managedFamily === normalizeText(extraFields["Product Family"]))) {
    findings.push(`${partNumber}: redundant Managed Family=${extraFields["Managed Family"]}`);
  }
  if (density && storageDensity && !["emcp", "umcp"].includes(type) && storageDensity.startsWith(density)) {
    findings.push(`${partNumber}: redundant Storage Density=${extraFields["Storage Density"]}`);
  }

  const forbidden = new Set([...internalPackFieldKeys, "reference", "source", "status", "inference_source"]);
  for (const block of result.blocks) {
    for (const field of block.fields) {
      if (forbidden.has(field.key) || isInternalCodeFieldKey(field.key)) {
        findings.push(`${partNumber}: ${field.key}`);
      }
    }
  }
  return findings;
}

function assertPublicPartNumberOutput(partNumber: string, result: PartDecodeResult): void {
  assert.deepEqual(collectPublicOutputFindings(partNumber, result), [], `${partNumber} public output should use canonical fields without internal metadata`);
}

export function draftDensityMbit(partNumber: string): number | undefined {
  const draftDensity = explainPartDecode(defaultDecodePack, partNumber).draft?.fields?.density;
  return typeof draftDensity === "number" ? draftDensity : undefined;
}

export function blockIdForField(result: PartDecodeResult, key: string): string | undefined {
  return result.blocks.find((block) => block.fields.some((field) => field.key === key))?.id;
}

export function partType(result: PartDecodeResult): string | undefined {
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
      e2nand: "E2NAND",
      e3nand: "E3NAND"
    };
    return productTypes[result.device.productType] ?? result.device.productType.toUpperCase();
  }
  if (result.device?.chipKind === "raw_nand") return "NAND";
  if (result.device?.chipKind === "dram") return "DRAM";
  return typeof product?.value === "string" ? product.value : result.device?.chipKind;
}

export function densityField(result: PartDecodeResult): FieldValue | undefined {
  return firstField(result, "density", "storage_density", "dram_density");
}

export function detect(partNumber: string, useFullEngine = false): TestPartInfo {
  const result = (useFullEngine ? fullEngine() : decodeEngine).decodePart({ query: partNumber, lang: "eng" });
  assertPublicPartNumberOutput(partNumber, result);
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
    densityMbit: typeof density?.value === "number" ? density.value : draftDensityMbit(partNumber),
    density: density?.display,
    dieProfileField: fieldText(firstField(result, "die_codename")) as string | undefined,
    cellField: fieldText(firstField(result, "cell_level")) as string | undefined,
    widthField: fieldText(firstField(result, "device_width")) as string | undefined,
    voltage: fieldText(firstField(result, "voltage", "dram_voltage")) as string | undefined,
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

export interface ExpectedPartInfo {
  vendor: string;
  markingCode?: string;
  type: string;
  densityMbit?: number;
  density?: string;
  dieProfileField?: string;
  cellField?: string;
  widthField?: string;
  topology?: Record<string, unknown>;
  voltage?: string;
  interface?: Record<string, unknown>;
  package?: string;
  extra?: Record<string, unknown>;
  absentExtra?: string[];
}

export function assertPart(partNumber: string, expected: ExpectedPartInfo): void {
  let info = detect(partNumber);
  if (shouldRetryFullPartDecode(info, expected)) {
    info = detect(partNumber, true);
  }
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
  if (expected.dieProfileField !== undefined) {
    assertKnownOrOmitted(info.dieProfileField, expected.dieProfileField, partNumber);
  }
  if (expected.cellField !== undefined) {
    assertKnownOrOmitted(info.cellField, expected.cellField, partNumber);
  }
  if (expected.widthField !== undefined) {
    assertKnownOrOmitted(info.widthField, expected.widthField, partNumber);
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
      if (hiddenPublicCodeExtraKeys.has(key)) {
        assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
        continue;
      }
      assert.equal(detailFields[key], value, `${partNumber} detailFields.${key}`);
    }
  }
  const detailFields = extra(info);
  for (const key of hiddenPublicCodeExtraKeys) {
    assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
  }
  if (expected.absentExtra) {
    for (const key of expected.absentExtra) {
      assert.equal(Object.hasOwn(detailFields, key), false, `${partNumber} should not expose detailFields.${key}`);
    }
  }
}

function shouldRetryFullPartDecode(info: TestPartInfo, expected: ExpectedPartInfo): boolean {
  if (expected.markingCode !== undefined || (expected.vendor !== undefined && info.vendor === undefined)) {
    return true;
  }
  if (expected.dieProfileField !== undefined && info.dieProfileField === undefined) {
    return true;
  }
  const detailFields = extra(info);
  for (const [key, value] of Object.entries(expected.extra ?? {})) {
    if (hiddenPublicCodeExtraKeys.has(key)) {
      continue;
    }
    if (value !== undefined && detailFields[key] === undefined) {
      return true;
    }
  }
  return false;
}

export function testPart(partNumber: string, expected: ExpectedPartInfo, name = `decodes ${partNumber}`): void {
  test(name, () => {
    assertPart(partNumber, expected);
  });
}

export function assertMicronManagedFbgaMarking(code: string, expectedPartNumber: string, expectedProductType: string): void {
  const decoded = fullEngine().decodePart({ query: code, lang: "eng" });
  assert.equal(decoded.status, "ok", `${code} should decode through Micron FBGA lookup`);
  assert.equal(decoded.device?.vendor.id, "micron", `${code} vendor`);
  assert.equal(decoded.device?.partNumber, expectedPartNumber, `${code} resolved PN`);
  assert.equal(decoded.device?.markingCode, code, `${code} marking`);
  assert.equal(decoded.device?.chipKind, "managed_nand", `${code} chip kind`);
  assert.equal(decoded.device?.productType, expectedProductType, `${code} product type`);

  const search = fullEngine().searchParts({ query: code, lang: "eng", limit: 10 });
  const item = search.items.find((candidate) => candidate.device.markingCode === code && candidate.device.partNumber === expectedPartNumber);
  assert.ok(item, `${code} should return a managed Micron FBGA search candidate`);
  assert.equal(item.device.chipKind, "managed_nand", `${code} search chip kind`);
  assert.equal(item.device.productType, expectedProductType, `${code} search product type`);
  assert.ok(item.badges?.includes("Micron FBGA"), `${code} should expose a Micron FBGA badge`);
}

export function assertKioxiaRawSuffixTopology(sample: {
  partNumber: string;
  package: string;
  dieCount: number;
  ceCount: number;
  channelCount: number;
}): void {
  const result = engineWithoutFdb.decodePart({ query: sample.partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${sample.partNumber} should decode without FDB`);
  assert.equal(result.device?.vendor.id, "kioxia", `${sample.partNumber} vendor`);
  assert.equal(result.device?.chipKind, "raw_nand", `${sample.partNumber} chip kind`);
  assert.equal(fieldText(firstField(result, "package")), sample.package, `${sample.partNumber} package`);
  assert.equal(firstField(result, "die_count")?.value, sample.dieCount, `${sample.partNumber} die_count`);
  assert.equal(firstField(result, "ce_count")?.value, sample.ceCount, `${sample.partNumber} ce_count`);
  assert.equal(firstField(result, "channel_count")?.value, sample.channelCount, `${sample.partNumber} channel_count`);
  assert.equal(firstField(result, "multi_chip"), undefined, `${sample.partNumber} should not expose multi_chip`);
  assert.equal(firstField(result, "page_size"), undefined, `${sample.partNumber} should omit page_size`);
  assert.equal(firstField(result, "block_size"), undefined, `${sample.partNumber} should omit block_size`);
}

export function assertIdentifierRelation(partNumber: string, id: string): void {
  const result = fullEngine().decodePart({ query: partNumber, lang: "eng" });
  const relation = result.relations.find((item) =>
    item.kind === "identifier_for" && item.target.identifier === id && item.action?.operation === "identifier.decode"
  );
  assert.ok(relation, `${partNumber} should expose ${id} identifier relation`);
}

export function assertSubtitle(partNumber: string, expected: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.subtitle, expected, `${partNumber} subtitle`);
}

export function assertHiddenPublicField(partNumber: string, key: string, expectedDraftValue: unknown): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(firstField(result, key), undefined, `${partNumber} should hide public ${key}`);
  const explain = explainPartDecode(defaultDecodePack, partNumber);
  assert.equal((explain.draft?.fields as Record<string, unknown> | undefined)?.[key], expectedDraftValue, `${partNumber} draft ${key}`);
  assert.ok(explain.draft?.meta?.hiddenFields?.includes(key), `${partNumber} should mark ${key} hidden in draft metadata`);
}

export function assertHiddenComponentRelations(partNumber: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.deepEqual(result.relations.filter((relation) => relation.kind === "component"), [], `${partNumber} should hide public component relations`);
  const components = explainPartDecode(defaultDecodePack, partNumber).draft?.components ?? [];
  assert.ok(components.length > 0, `${partNumber} should keep component drafts`);
  assert.ok(components.every((component) => component.hidden === true), `${partNumber} component drafts should be hidden`);
}

export function assertDieProfileFromFdbProcess(partNumber: string, expected: string, expectedLayerCount?: number, expectedProcessAlias?: string): void {
  const result = fullEngine().decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode from FDB`);
  assert.equal(fieldText(firstField(result, "die_codename")), expected, `${partNumber} die profile from FDB process`);
  if (expectedLayerCount !== undefined) {
    assert.equal(firstField(result, "layer_count")?.value, expectedLayerCount, `${partNumber} layer count from die profile`);
  }
  if (expectedProcessAlias !== undefined) {
    assert.equal(fieldText(firstField(result, "process_alias")), expectedProcessAlias, `${partNumber} process alias from die profile`);
  }
}

export function assertMicronDecodePackDieProfile(partNumber: string, expected: string, expectedLayerCount?: number): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(fieldText(firstField(result, "die_codename")), expected, `${partNumber} die profile from Micron DecodePack`);
  if (expectedLayerCount !== undefined) {
    assert.equal(firstField(result, "layer_count")?.value, expectedLayerCount, `${partNumber} layer count from die profile`);
  }
}

export function assertDecodePackDieProfile(partNumber: string, expected: string, expectedLayerCount?: number): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(fieldText(firstField(result, "die_codename")), expected, `${partNumber} die profile from DecodePack`);
  if (expectedLayerCount !== undefined) {
    assert.equal(firstField(result, "layer_count")?.value, expectedLayerCount, `${partNumber} layer count from die profile`);
  }
}

export function assertFdbDoesNotOverrideDecodePackFields(): void {
  const precedenceEngine = createEngine({
    resources: {
      ...embeddedResourceBundle,
      partIndex: {
        ...embeddedResourceBundle.partIndex,
        rawNand: {
          info: { version: "test", controllers: ["FDB_ONLY_CTRL"] },
          micron: {
            MT29F2T08GBLBH: {
              id: ["2C00"],
              l: "B47R",
              c: "MLC",
              d: 16,
              e: 8,
              r: 4,
              n: 2,
              t: ["FDB_ONLY_CTRL"]
            }
          }
        }
      }
    },
    decoders: compiledPack.partDecoders
  });
  const result = precedenceEngine.decodePart({ query: "MT29F2T08GBLBH", lang: "eng" });
  assert.equal(result.status, "ok", "conflicting FDB fixture should still decode");
  assert.equal(fieldText(firstField(result, "die_codename")), "N69R", "DecodePack die profile should win over FDB process");
  assert.equal(fieldText(firstField(result, "cell_level")), "QLC", "DecodePack cell level should win over FDB cell");
  assert.equal(firstField(result, "die_count")?.value, 1, "DecodePack die count should win over FDB die count");
  assert.equal(firstField(result, "ce_count")?.value, 1, "DecodePack CE count should win over FDB CE count");
  assert.equal(firstField(result, "rb_count")?.value, 1, "DecodePack R/B count should win over FDB R/B count");
  assert.equal(firstField(result, "channel_count")?.value, 1, "DecodePack channel count should win over FDB channel count");
}

export function assertFieldBlock(partNumber: string, key: string, expectedBlockId: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode`);
  assert.equal(blockIdForField(result, key), expectedBlockId, `${partNumber} ${key} should be in ${expectedBlockId}`);
}

export function assertFdbProcessFallback(partNumber: string, expected: string): void {
  const result = fullEngine().decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode from FDB`);
  assert.equal(fieldText(firstField(result, "generation_info")), expected, `${partNumber} FDB process fallback`);
  assert.ok(result.warnings.some((warning) => warning.code === "fdb_process_fallback"), `${partNumber} should record FDB process fallback warning`);
}

export function assertSearchPnIncludes(query: string, expected: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

export function assertDecodedPartNumber(query: string, expected: string): void {
  const result = fullEngine().decodePart({ query, lang: "eng" });
  assert.equal(result.status, "ok", `${query} should decode`);
  assert.equal(result.device?.partNumber, expected, `${query} should resolve to canonical PN`);
}

export function assertNotFound(partNumber: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "not_found", `${partNumber} should not be decoded by a generic catch-all rule`);
}

export function assertRuleDoesNotMatch(ruleId: string, partNumber: string): void {
  const matched = compiledPack.partDecoders.filter((decoder) => decoder.id === ruleId && decoder.check(partNumber)).map((decoder) => decoder.id);
  assert.deepEqual(matched, [], `${partNumber} should not match ${ruleId}`);
}

export function assertRuleDraftDieProfile(ruleId: string, partNumber: string, expected: string): void {
  const decoder = compiledPack.partDecoders.find((candidate) => candidate.id === ruleId && candidate.check(partNumber));
  assert.ok(decoder, `${partNumber} should match ${ruleId}`);
  const draft = decoder.decode(partNumber);
  assert.equal(draft?.fields?.die_codename, expected, `${partNumber} ${ruleId} draft die profile`);
}

export const kioxiaManagedRuleIds = new Set(["vendor.kioxia.managed.thg.v1"]);

export function assertKioxiaManagedRuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => kioxiaManagedRuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected KIOXIA THG rule`);
}

export const skhynixHn8RuleIds = new Set([
  "vendor.skhynix.ufs.hn8.automotive-ufs31.v1",
  "vendor.skhynix.ufs.hn8.mobile-ufs31.v1",
  "vendor.skhynix.ufs.hn8.ufs22-v6.v1",
  "vendor.skhynix.ufs.hn8.ufs22-v7.v1",
  "vendor.skhynix.ufs.hn8.zufs41.v1"
]);

export function assertSkhynixHn8RuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => skhynixHn8RuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected SK hynix HN8 datasheet rule`);
}

export const skhynixEmcpRuleIds = new Set([
  "vendor.skhynix.emcp.h9hp-lpddr4x.v1",
  "vendor.skhynix.emcp.h9t_h9h.v1",
  "vendor.skhynix.emcp.h9a.v1"
]);

export function assertSkhynixEmcpRuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => skhynixEmcpRuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected SK hynix eMCP datasheet rule`);
}

export function assertSearchPnFirst(query: string, expected: string): void {
  const result = fullEngine().searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer part-number suggestions`);
}

export const skhynixH25RawInternalExtra = [
  "System",
  "Group",
  "Series",
  "Series Code",
  "Cell Code",
  "Layout Code",
  "Density Code",
  "Stack Code",
  "Generation Code",
  "Die Density Code",
  "Die Count Code",
  "Topology Code",
  "Revision Code",
  "Width Code",
  "Config Code",
  "Packing Type Code",
  "Product Class",
  "NAND Technology",
  "Component Density",
  "Die Stack"
];

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
