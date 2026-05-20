import assert from "node:assert/strict";
import type { FieldValue, PartDecodeResult } from "../../src/index";
import { createEngine } from "../../src/index";
import { embeddedResourceBundle } from "../../src/resources";
import managedNandPnJson from "../../resources/managed-nand-pn.json" with { type: "json" };
import { compileDecodePack, defaultDecodePack } from "../../src/decodepack";

const compiledPack = compileDecodePack(defaultDecodePack);

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders
});
const engineWithoutFdb = createEngine({
  decoders: compiledPack.partDecoders,
  profileTables: compiledPack.profileTables
});

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

interface TestPartInfo {
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

function blockIdForField(result: PartDecodeResult, key: string): string | undefined {
  return result.blocks.find((block) => block.fields.some((field) => field.key === key))?.id;
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
      e2nand: "E2NAND",
      e3nand: "E3NAND"
    };
    return productTypes[result.device.productType] ?? result.device.productType.toUpperCase();
  }
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
    dieProfileField: fieldText(firstField(result, "die_codename")) as string | undefined,
    cellField: fieldText(firstField(result, "cell_level")) as string | undefined,
    widthField: fieldText(firstField(result, "device_width")) as string | undefined,
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

function assertMicronManagedFbgaMarking(code: string, expectedPartNumber: string, expectedProductType: string): void {
  const decoded = engine.decodePart({ query: code, lang: "eng" });
  assert.equal(decoded.status, "ok", `${code} should decode through Micron FBGA lookup`);
  assert.equal(decoded.device?.vendor.id, "micron", `${code} vendor`);
  assert.equal(decoded.device?.partNumber, expectedPartNumber, `${code} resolved PN`);
  assert.equal(decoded.device?.markingCode, code, `${code} marking`);
  assert.equal(decoded.device?.chipKind, "managed_nand", `${code} chip kind`);
  assert.equal(decoded.device?.productType, expectedProductType, `${code} product type`);

  const search = engine.searchParts({ query: code, lang: "eng", limit: 10 });
  const item = search.items.find((candidate) => candidate.device.markingCode === code && candidate.device.partNumber === expectedPartNumber);
  assert.ok(item, `${code} should return a managed Micron FBGA search candidate`);
  assert.equal(item.device.chipKind, "managed_nand", `${code} search chip kind`);
  assert.equal(item.device.productType, expectedProductType, `${code} search product type`);
  assert.ok(item.badges?.includes("Micron FBGA"), `${code} should expose a Micron FBGA badge`);
}

function assertKioxiaRawSuffixTopology(sample: {
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

function assertSubtitle(partNumber: string, expected: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.subtitle, expected, `${partNumber} subtitle`);
}

function assertDieProfileFromFdbProcess(partNumber: string, expected: string, expectedLayerCount?: number, expectedProcessAlias?: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode from FDB`);
  assert.equal(fieldText(firstField(result, "die_codename")), expected, `${partNumber} die profile from FDB process`);
  if (expectedLayerCount !== undefined) {
    assert.equal(firstField(result, "layer_count")?.value, expectedLayerCount, `${partNumber} layer count from die profile`);
  }
  if (expectedProcessAlias !== undefined) {
    assert.equal(fieldText(firstField(result, "process_alias")), expectedProcessAlias, `${partNumber} process alias from die profile`);
  }
}

function assertMicronDecodePackDieProfile(partNumber: string, expected: string, expectedLayerCount?: number): void {
  const result = engineWithoutFdb.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode without FDB fallback`);
  assert.equal(fieldText(firstField(result, "die_codename")), expected, `${partNumber} die profile from Micron DecodePack`);
  if (expectedLayerCount !== undefined) {
    assert.equal(firstField(result, "layer_count")?.value, expectedLayerCount, `${partNumber} layer count from die profile`);
  }
}

function assertFdbDoesNotOverrideDecodePackFields(): void {
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

function assertFieldBlock(partNumber: string, key: string, expectedBlockId: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode`);
  assert.equal(blockIdForField(result, key), expectedBlockId, `${partNumber} ${key} should be in ${expectedBlockId}`);
}

function assertFdbProcessFallback(partNumber: string, expected: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "ok", `${partNumber} should decode from FDB`);
  assert.equal(fieldText(firstField(result, "generation_info")), expected, `${partNumber} FDB process fallback`);
  assert.ok(result.warnings.some((warning) => warning.code === "fdb_process_fallback"), `${partNumber} should record FDB process fallback warning`);
}

function assertSearchPnIncludes(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.ok(result.includes(expected), `${query} should suggest ${expected}; got ${result.join(", ")}`);
}

function assertDecodedPartNumber(query: string, expected: string): void {
  const result = engine.decodePart({ query, lang: "eng" });
  assert.equal(result.status, "ok", `${query} should decode`);
  assert.equal(result.device?.partNumber, expected, `${query} should resolve to canonical PN`);
}

function assertNotFound(partNumber: string): void {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(result.status, "not_found", `${partNumber} should not be decoded by a generic catch-all rule`);
}

function assertRuleDoesNotMatch(ruleId: string, partNumber: string): void {
  const matched = compiledPack.partDecoders.filter((decoder) => decoder.id === ruleId && decoder.check(partNumber)).map((decoder) => decoder.id);
  assert.deepEqual(matched, [], `${partNumber} should not match ${ruleId}`);
}

function assertRuleDraftDieProfile(ruleId: string, partNumber: string, expected: string): void {
  const decoder = compiledPack.partDecoders.find((candidate) => candidate.id === ruleId && candidate.check(partNumber));
  assert.ok(decoder, `${partNumber} should match ${ruleId}`);
  const draft = decoder.decode(partNumber);
  assert.equal(draft?.fields?.die_codename, expected, `${partNumber} ${ruleId} draft die profile`);
}

const kioxiaManagedRuleIds = new Set(["vendor.kioxia.managed.thg.v1"]);

function assertKioxiaManagedRuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => kioxiaManagedRuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected Kioxia managed NAND rule`);
}

const skhynixHn8RuleIds = new Set([
  "vendor.skhynix.ufs.hn8.automotive-ufs31.v1",
  "vendor.skhynix.ufs.hn8.mobile-ufs31.v1",
  "vendor.skhynix.ufs.hn8.ufs22-v6.v1",
  "vendor.skhynix.ufs.hn8.ufs22-v7.v1",
  "vendor.skhynix.ufs.hn8.zufs41.v1"
]);

function assertSkhynixHn8RuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => skhynixHn8RuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected SK hynix HN8 datasheet rule`);
}

const skhynixEmcpRuleIds = new Set([
  "vendor.skhynix.emcp.h9hp-lpddr4x.v1",
  "vendor.skhynix.emcp.h9t_h9h.v1",
  "vendor.skhynix.emcp.h9a.v1"
]);

function assertSkhynixEmcpRuleMatches(partNumber: string, expected: string[]): void {
  const actual = compiledPack.partDecoders
    .filter((decoder) => skhynixEmcpRuleIds.has(decoder.id) && decoder.check(partNumber))
    .map((decoder) => decoder.id)
    .sort();
  assert.deepEqual(actual, [...expected].sort(), `${partNumber} should match only the expected SK hynix eMCP datasheet rule`);
}

function assertSearchPnFirst(query: string, expected: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 1 }).items.map((item) => `${item.device.vendor.name} ${item.label}`);
  assert.deepEqual(result, [expected], `${query} should prefer managed NAND PN suggestions`);
}

const skhynixH25RawInternalExtra = [
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
  "Product Class",
  "NAND Technology",
  "Component Density",
  "Die Stack"
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

const knownSkhynixUfsPn = managedNandPn.flatMap((entry) => {
  const record = entry as Record<string, unknown>;
  const vendor = String(record.vendor);
  const pn = String(record.pn);
  return vendor === "skhynix" && /^(?:H28[SU]|HN8)/.test(pn) ? [pn] : [];
});
assert.ok(knownSkhynixUfsPn.length > 0, "known SK hynix UFS PN resource should include H28S/H28U/HN8 entries");
for (const pn of knownSkhynixUfsPn) {
  const info = detect(pn);
  assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
  assert.equal(info.type, "UFS", `${pn} should decode as SK hynix UFS`);
  assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a UFS density`);
  if (pn.startsWith("HN8")) {
    const hn8Matches = compiledPack.partDecoders.filter((decoder) => skhynixHn8RuleIds.has(decoder.id) && decoder.check(pn));
    assert.equal(hn8Matches.length, 1, `${pn} should match exactly one SK hynix HN8 datasheet rule`);
  }
}

const knownSkhynixLineupPn = managedNandPn.flatMap((entry) => {
  const record = entry as Record<string, unknown>;
  const vendor = String(record.vendor);
  const pn = String(record.pn);
  return vendor === "skhynix" && /^(?:H23Q|H26M|H2J)/.test(pn) ? [pn] : [];
});
assert.ok(knownSkhynixLineupPn.length > 0, "known SK hynix managed NAND PN resource should include H23Q/H26M/H2J entries");
for (const pn of knownSkhynixLineupPn) {
  const info = detect(pn);
  assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
  assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a managed NAND density`);
  if (pn.startsWith("H23Q")) {
    assert.equal(info.type, "E3NAND", `${pn} should decode as SK hynix E3NAND`);
  } else if (pn.startsWith("H26M")) {
    assert.equal(info.type, "eMMC", `${pn} should decode as SK hynix eMMC`);
  } else {
    assert.equal(info.type, "E2NAND", `${pn} should decode as SK hynix E2NAND`);
  }
}

assertPart("SDINBDA6-256G-XI1", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 2097152,
  dieProfileField: "BiCS3",
  extra: {
    "Product Family": "iNAND IX EM132",
    "Storage Interface": "eMMC 5.1",
    "Layer Count": 64,
    "Product Class": "Industrial Extended Temperature"
  },
  absentExtra: ["Product Version", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SDINBDG4-32G-ZA3", {
  vendor: "sndk",
  type: "eMMC",
  densityMbit: 262144,
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
  dieProfileField: "19nm",
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
  dieProfileField: "24nm",
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
    "Storage Interface": "eMMC 5.1",
    "Interface Type": "HS400",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ +85°C",
    "Package Code": "100-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM662PBC-BFS", {
  vendor: "siliconmotion",
  type: "eMMC",
  densityMbit: 524288,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-eMMC",
    "Storage Interface": "eMMC 5.1",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Operation Temperature": "-40°C ~ +105°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("SM671PEF-BFS", {
  vendor: "siliconmotion",
  type: "UFS",
  densityMbit: 4194304,
  cellField: "TLC",
  package: "153-ball BGA",
  extra: {
    "Product Family": "Ferri-UFS",
    "Storage Interface": "UFS 3.1",
    "Speed Grade": "HS-Gear4 x2",
    "NAND Technology": "3D TLC NAND",
    "Product Class": "Industrial",
    "Operation Temperature": "-40°C ~ +85°C",
    "Package Code": "153-b"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("FNNL63A51K3WG-AF", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "48-pin TSOP I Center Package Leads (CPL) PB free",
  extra: {
    "Process Alias": "L63A",
    "Product Family": "SpecTek NAND Flash",
    "Density grade": "94-100%",
    "Package functionality partial type": "Single Die Package, CE only"
  }
});
assertPart("FBMB17A4T1KDUAN", {
  vendor: "spectek",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "B17A",
  cellField: "TLC",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertFieldBlock("FBMB17A4T1KDUAN", "layer_count", "storage");
assertRuleDoesNotMatch("vendor.intel.token.v1", "PF035");
assertRuleDoesNotMatch("vendor.intel.token.v1", "PFE02");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCMG2", "L06B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTG3", "B0KB");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTH1", "B16A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ANCTH2", "B16A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2AMCTH1", "B17A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2AMCTH2", "B17A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F64B2ALCTJ1", "B27A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMF2", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMFS", "L85C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T08OCMFP", "L85C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08LCMF1", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08LCMF3", "L85A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F16G08AAMD2", "L62A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAMD1", "L63A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAMDB", "L63B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F16G08AAME1", "L72A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08AAME1", "L73A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08AAME1", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08ACME2", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F32G08ACNE1", "M73A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "JS29F64G08AATE1", "B74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F64B08OCME1", "L74A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMF1", "L84A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMFH", "L84C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F16B08MCMFS", "L84C");
assertRuleDraftDieProfile("vendor.intel.token.v1", "29F01T2ALCQH1", "N18A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQH2", "N18A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQJ1", "N28A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQJ2", "N28A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQK1", "N38A");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQK2", "N38B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQKA", "N38B");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2BLCQKM", "N38E");
assertRuleDraftDieProfile("vendor.intel.token.v1", "PF29F01T2ALCQL1", "N4PA");
assertPart("PF29F01T2ANCMG2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "L06B",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Layer Count": 32
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F01T2ANCTG3", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B0KB",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 32
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F01T2ANCTH2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B16A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F01T2AMCTH1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B17A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 64
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F64B2ALCTJ1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "B27A",
  cellField: "TLC",
  package: "BGA",
  extra: {
    "Layer Count": 96
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F01T08OCMF2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85A"
  }
});
assertPart("PF29F01T08OCMFS", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85C"
  }
});
assertPart("PF29F01T08OCMFP", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L85C"
  }
});
assertPart("JS29F16G08AAMD2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 16384,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "L62A"
  }
});
assertPart("JS29F32G08AAMD1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "L63A"
  }
});
assertPart("JS29F32G08AAMDB", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "34nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "L63B"
  }
});
assertPart("JS29F16G08AAME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 16384,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "L72A"
  }
});
assertPart("JS29F32G08AAME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "L73A"
  }
});
assertPart("JS29F64G08AATE1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 65536,
  dieProfileField: "25nm",
  cellField: "TLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "B74A"
  }
});
assertPart("JS29F32G08ACNE1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 32768,
  dieProfileField: "25nm",
  cellField: "SLC",
  package: "TSOP48",
  extra: {
    "Process Alias": "M73A"
  }
});
assertPart("PF29F64B08OCME1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "25nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L74A"
  }
});
assertPart("PF29F16B08MCMF1", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84A"
  }
});
assertPart("PF29F16B08MCMFH", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84C"
  }
});
assertPart("PF29F16B08MCMFS", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "20nm",
  cellField: "MLC",
  package: "BGA",
  extra: {
    "Process Alias": "L84C"
  }
});
assertPart("PF29F01T2ALCQK2", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N38B",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Layer Count": 144
  },
  absentExtra: ["Product Generation"]
});
assertPart("PF29F01T2BLCQKM", {
  vendor: "intel",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N38E",
  cellField: "QLC",
  package: "BGA",
  extra: {
    "Layer Count": 144
  },
  absentExtra: ["Product Generation"]
});
assertDecodedPartNumber("PFE02", "FBML63BNAKDBAAH1");
assertPart("PFE02", {
  vendor: "spectek",
  markingCode: "PFE02",
  type: "NAND",
  dieProfileField: "34nm",
  cellField: "MLC",
  extra: {
    "Process Alias": "L63B"
  }
});
assertPart("PF232", {
  vendor: "spectek",
  markingCode: "PF232",
  type: "NAND",
  dieProfileField: "34nm",
  cellField: "SLC",
  extra: {
    "Process Alias": "M60A"
  }
});
assertPart("PFA02", {
  vendor: "spectek",
  markingCode: "PFA02",
  type: "NAND",
  density: "128MB",
  dieProfileField: "50nm",
  cellField: "SLC",
  extra: {
    "Process Alias": "M58A"
  }
});
assertPart("PFF21", {
  vendor: "spectek",
  markingCode: "PFF21",
  type: "NAND",
  dieProfileField: "25nm",
  cellField: "MLC",
  extra: {
    "Process Alias": "L74A"
  }
});
assertPart("FBML84A61KDBABH1", {
  vendor: "spectek",
  type: "NAND",
  density: "16GB",
  dieProfileField: "20nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 2,
    "Process Alias": "L84A"
  }
});
assertSubtitle("FBML84A61KDBABH1", "NAND Flash · SpecTek · 16GB MLC · L84A");
assertPart("FBMM60A21G3BAAWP", {
  vendor: "spectek",
  type: "NAND",
  density: "512MB",
  dieProfileField: "34nm",
  cellField: "SLC",
  extra: {
    "Die Density": "4Gb",
    "Die Count": 1,
    "Process Alias": "M60A"
  }
});
assertPart("FBNL7BT65KDUAB", {
  vendor: "spectek",
  type: "NAND",
  density: "10.5GB",
  dieProfileField: "25nm",
  cellField: "MLC",
  extra: {
    "Die Density": "42Gb",
    "Die Count": 2,
    "Process Alias": "L7BT"
  }
});
assertPart("FNNL06B512G1KDFAB", {
  vendor: "spectek",
  type: "NAND",
  density: "64GB",
  dieProfileField: "L06B",
  cellField: "MLC",
  extra: {
    "Die Density": "256Gb",
    "Die Count": 2,
    "Layer Count": 32
  }
});
assertPart("FXXB47R512G1KLXAE", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "B47R",
  cellField: "TLC",
  extra: {
    "Die Density": "512Gb",
    "Die Count": 4,
    "Layer Count": 176
  }
});
assertPart("FBMB68S8T0KLUAHD5", {
  vendor: "spectek",
  type: "NAND",
  density: "1TB",
  dieProfileField: "B68S",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 8,
    "Layer Count": 276
  }
});
assertPart("FBMN69R2T0KLBAHD4", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "N69R",
  cellField: "QLC",
  extra: {
    "Die Density": "2Tb",
    "Die Count": 1,
    "Layer Count": 276
  }
});
assertPart("FBMB78R2T0KLEAHD4", {
  vendor: "spectek",
  type: "NAND",
  density: "256GB",
  dieProfileField: "B78R",
  cellField: "TLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 2
  },
  absentExtra: ["Layer Count"]
});
assertPart("FNNN48R1T1KLBAE", {
  vendor: "spectek",
  type: "NAND",
  density: "128GB",
  dieProfileField: "N48R",
  cellField: "QLC",
  extra: {
    "Die Density": "1Tb",
    "Die Count": 1,
    "Layer Count": 176
  }
});
assertPart("FNNL84CNAK3BAA", {
  vendor: "spectek",
  type: "NAND",
  density: "64GB",
  dieProfileField: "20nm",
  cellField: "MLC",
  extra: {
    "Die Density": "64Gb",
    "Die Count": 8,
    "Process Alias": "L84C"
  }
});
assertPart("PX001", {
  vendor: "spectek",
  markingCode: "PX001",
  type: "NAND",
  dieProfileField: "M2XA",
  cellField: "SLC",
  extra: {
    "Package functionality partial type": "CE1 Valid, CE2 not guaranteed"
  }
});
assertPart("SUGNM1126A6BPIET-046BT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA 149/224B, 8.0x9.5x1.0 (0.5)",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Product Family": "SpecTek NAND MCP",
    "Product Mode": "SLC NAND + LPDDR4",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "046BT Fully Tested"
  },
  absentExtra: ["NAND Component", "Package Code", "Product Generation"]
});
assertPart("FNUGNM1126A6BPIET-046BT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA 149/224B, 8.0x9.5x1.0 (0.5)",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "LPDDR4",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Product Family": "SpecTek NAND MCP",
    "Product Mode": "SLC NAND + LPDDR4",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "046BT Fully Tested"
  },
  absentExtra: ["NAND Component", "Package Code", "Product Generation"]
});
assertPart("SMCNM1126A6BPIET-062UT", {
  vendor: "spectek",
  type: "eMCP",
  cellField: "SLC",
  voltage: "NAND Vcc: 1.8V, LPDRAM VDD: 1.1V, VDDQ: 1.1V/0.6V",
  package: "VFBGA 149/224B, 8.0x9.5x1.0 (0.5)",
  extra: {
    "Storage Density": "8Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "8Gb",
    "DRAM Type": "Mobile LPDRAM",
    "DRAM Width": "x16",
    "Component Width": "x8",
    "Product Family": "SpecTek NAND MCP",
    "Product Mode": "SLC NAND + LPDRAM (MCP PoP)",
    "Special Option": "2 NAND, 2 LPDRAM",
    "Speed Grade": "062UT Untested"
  },
  absentExtra: ["NAND Component", "Package Code", "Product Generation"]
});
assertPart("SMKJ6Z4ZZ4D4TGFAK-PG", {
  vendor: "spectek",
  type: "eMCP",
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V, eMMC VCCM/VCCQM: 3.3V/1.8V or 3.3V",
  package: "TFBGA 153-ball, 11.5x13, 0.50mm pitch, 1.10mm thick",
  extra: {
    "Storage Density": "4GB eMMC",
    "Storage Interface": "eMMC",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Product Family": "SpecTek All-in-One",
    "Product Mode": "LPDDR + MLC eMMC",
    "Special Option": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "Controller": "Phison 8200 V4.41 EF",
    "Speed Grade": "PG Partial Good Mixed Bins"
  },
  absentExtra: ["Controller Code", "Package Code", "Product Generation"]
});
assertPart("SMKJ6Z4ZZ4D4TGFAK-053BT", {
  vendor: "spectek",
  type: "eMCP",
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V, eMMC VCCM/VCCQM: 3.3V/1.8V or 3.3V",
  package: "TFBGA 153-ball, 11.5x13, 0.50mm pitch, 1.10mm thick",
  extra: {
    "Storage Density": "4GB eMMC",
    "Storage Interface": "eMMC",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Product Family": "SpecTek All-in-One",
    "Product Mode": "LPDDR + MLC eMMC",
    "Special Option": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "Controller": "Phison 8200 V4.41 EF",
    "Speed Grade": "053BT Fully Tested at 70 degrees"
  },
  absentExtra: ["Controller Code", "Package Code", "Product Generation"]
});
assertPart("SUJ52A1GCFDI-BT", {
  vendor: "spectek",
  type: "eMMC",
  densityMbit: 8192,
  package: "TFBGA 169/392-ball, 12x16x1.2",
  extra: {
    "Component Density": "8Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Product Family": "SpecTek Flash + Controller",
    "Controller Revision": "Rev 6",
    "Speed Grade": "BT B Grade Fully Tested"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Generation"]
});
assertPart("SUJ52A128GASAKDI-FT", {
  vendor: "spectek",
  type: "UFS",
  densityMbit: 1048576,
  package: "TFBGA 169/392-ball, 12x16x1.2",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Component Density": "256Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Product Family": "SpecTek Flash + Controller",
    "Controller": "SMI SM2750",
    "Controller Revision": "Rev 35",
    "Special Option": "AB firmware, Standard mode",
    "Speed Grade": "FT Fully Tested at 90 degrees"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Generation"]
});

assertPart("TF10G1BAHA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1024,
  dieProfileField: "24nm",
  cellField: "SLC",
  package: "TSOP48",
  extra: {
    "Original Vendor": "Kioxia",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertPart("TU56G2LAJA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 65536,
  cellField: "MLC",
  extra: {
    "Original Vendor": "Kioxia",
    "Die Count": 2,
    "CE Count": 2
  }
});

assertPart("ST15G24APA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 32768,
  cellField: "TLC",
  package: "TSOP48",
  extra: {
    "Original Vendor": "Samsung",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertPart("HA5AG64AVA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV5",
  cellField: "TLC",
  package: "BGA132",
  extra: {
    "Original Vendor": "SKhynix",
    "Die Count": 2,
    "CE Count": 2
  }
});

assertPart("IA1AG67AWA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "N28A",
  cellField: "QLC",
  package: "BGA132",
  extra: {
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  }
});

assertPart("IA1AG6KAVA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B27A",
  cellField: "TLC",
  package: "BGA132",
  extra: {
    "Layer Count": 96,
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  },
  absentExtra: ["Product Generation"]
});

assertPart("IA1AG6KAIA", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "B27B",
  cellField: "TLC",
  package: "BGA132",
  extra: {
    "Layer Count": 96,
    "Original Vendor": "Micron",
    "Die Count": 1,
    "CE Count": 1
  },
  absentExtra: ["Product Generation"]
});

assertPart("DT57G2LALC", {
  vendor: "phison",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "TSOP48",
  extra: {
    "Original Vendor": "Sandisk",
    "Die Count": 2,
    "CE Count": 2
  }
});

assertDieProfileFromFdbProcess("29F02T08SCMFP", "20nm", undefined, "L85C");
assertDieProfileFromFdbProcess("FNNL29F256G08EBHAFES", "B16A");
assertDieProfileFromFdbProcess("FBMB17A4T1KDUAN", "B17A", 64);
assertDieProfileFromFdbProcess("SDTNMMAHSM-001G", "43nm");

assertNotFound("SDINZZZ9-128G-ABC");
assertNotFound("SDISZZZ-016G");
assertNotFound("SM671PAC-BFS");

assertPart("TH58NVG7D2FTA00", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "3.3V",
  package: "TSOP48",
  extra: {
    "Package Code": "TA",
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1
  }
});

assertKioxiaManagedRuleMatches("THGBMNG5D1LBAIT", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("THGAMVT0T43BAB8", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("THGVMNG5D1LBAIT", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("THGVX1G7D2GLA08", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("TCGVX1G7D2GLA08", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("THGBX2G7D2JLA01", ["vendor.kioxia.managed.thg.v1"]);
assertKioxiaManagedRuleMatches("THGVR1G7D2GLA09", ["vendor.kioxia.managed.thg.v1"]);

assertPart("TC58NVG7D2FTA00", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 131072,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "3.3V",
  package: "TSOP48",
  extra: {
    "Package Code": "TA",
    "Lead free": "Yes",
    "Halogen free": "Yes",
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1
  },
  absentExtra: ["Multi chip"]
});

assertPart("TC58TFG8T23TA0D", {
  vendor: "kioxia",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 3.3V/1.8V (UNOFFICIAL)",
  package: "TSOP48",
  extra: {
    "Process Alias": "8T23",
    "Layer Count": 64,
    "Die Count": 1,
    "CE Count": 1,
    "Channel Count": 1,
    Plane: 2
  },
  absentExtra: ["Product Generation"]
});

[
  { partNumber: "TH58NVG7D2FTA00", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58LJG8T24TA0D", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTAI0", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG3S0HTA1D", package: "TSOP48", dieCount: 1, ceCount: 1, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA20", package: "TSOP48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58TFT0T22TA2D", package: "TSOP48", dieCount: 2, ceCount: 2, channelCount: 1 },
  { partNumber: "TH58NVG7D2FTA80", package: "TSOP48", dieCount: 4, ceCount: 4, channelCount: 1 },
  { partNumber: "TC58NVG7T2HBA4C", package: "BGA132", dieCount: 1, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG8SA4BA4C", package: "BGA132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT0T25BA4D", package: "BGA132", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LJG9SA4BA8C", package: "BGA132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0W23BASC", package: "BGA132", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0SA4BA8H", package: "BGA132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT0DDLBASH", package: "BGA132", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TEG7D2HBA49", package: "BGA132 (12 x 18 x 1.4)", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBA89", package: "BGA132 (12 x 18 x 1.4)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG9D2JBAS9", package: "BGA132 (12 x 18 x 1.4)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58NVG8S2FBA8A", package: "BGA132 (12 x 18 x 1.85)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TAG9D2FBASA", package: "BGA132 (12 x 18 x 1.85)", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2T22BA8P", package: "BGA132", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA4K", package: "BGA152", dieCount: 2, ceCount: 2, channelCount: 2 },
  { partNumber: "TH58LKT1T25BA8K", package: "BGA152", dieCount: 4, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LKT3T25BA8J", package: "BGA152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT2W23BASJ", package: "BGA152", dieCount: 8, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58TFT1EFKBA8N", package: "BGA152", dieCount: 16, ceCount: 4, channelCount: 2 },
  { partNumber: "TH58LJT0T24BADE", package: "BGA272", dieCount: 4, ceCount: 4, channelCount: 4 },
  { partNumber: "TH58LJT1T24BAEF", package: "BGA272", dieCount: 8, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58TFT1JFLBAEG", package: "BGA272", dieCount: 16, ceCount: 8, channelCount: 4 },
  { partNumber: "TH58TFT0DFKLAVF", package: "LGA60-SAT", dieCount: 8, ceCount: 8, channelCount: 2 },
  { partNumber: "TH58TFT1DFKLAVH", package: "LGA60-SAT", dieCount: 16, ceCount: 8, channelCount: 2 }
].forEach(assertKioxiaRawSuffixTopology);

assertPart("THGBMNG5D1LBAIT", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 32768,
  dieProfileField: "15nm",
  cellField: "MLC",
  voltage: "Vcc: 3.3V, VccQ: 3.3V/1.8V",
  package: "BGA153",
  extra: {
    "Storage Interface": "eMMC 5.0",
    "NAND Technology": "FG NAND",
    "Controller Revision": "N",
    "Die Count": 1,
    "Package Code": "BAIT",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Product Version", "Product Generation", "Die Stack"]
});

assertPart("THGBM2G9DBFBAI2", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 524288,
  dieProfileField: "32nm",
  cellField: "MLC",
  voltage: "Vcc: 3.3V, VccQ: 3.3V/1.8V",
  package: "BGA (14 x 18 x 1.4)",
  extra: {
    "Controller Revision": "2",
    "Die Count": 16,
    "Package Code": "BAI2",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Die Stack"]
});

assertPart("THGAMVT0T43BAB8", {
  vendor: "kioxia",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "BGA (11.5 x 13 x 1.2)",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Controller Revision": "V",
    "Die Count": 4,
    "Package Code": "BAB8",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

assertPart("THGJFRT3E88BATW", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "BiCS8",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
  package: "BGA (9.0 x 13.0 x 0.85)",
  extra: {
    "Storage Interface": "UFS 4.1",
    "Product Class": "Consumer / Industrial",
    "Controller Revision": "R",
    "Die Count": 8,
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

const kioxiaConsumerUfsSamples = [
  {
    partNumber: "THGJFPT0E18BAIP",
    densityMbit: 1048576,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 1,
    dieProfileField: "BiCS8",
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFPT1E28BAIP",
    densityMbit: 2097152,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 2,
    dieProfileField: "BiCS8",
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFPT2E48BAIP",
    densityMbit: 4194304,
    storageInterface: "UFS 3.1",
    speedGrade: "2320 MB/s",
    controllerRevision: "P",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA (11.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT2E46BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 4,
    dieProfileField: "BiCS6",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFMT3E86BATZ",
    densityMbit: 8388608,
    storageInterface: "UFS 4.0",
    speedGrade: "4640 MB/s",
    controllerRevision: "M",
    dieCount: 8,
    dieProfileField: "BiCS6",
    package: "BGA (9.0 x 13.0 x 0.9)"
  },
  {
    partNumber: "THGJFRT1E45BATV",
    densityMbit: 2097152,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS5",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFRT2E48BATV",
    densityMbit: 4194304,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 4,
    dieProfileField: "BiCS8",
    package: "BGA (9.0 x 13.0 x 0.8)"
  },
  {
    partNumber: "THGJFRT3E88BATW",
    densityMbit: 8388608,
    storageInterface: "UFS 4.1",
    speedGrade: "4640 MB/s",
    controllerRevision: "R",
    dieCount: 8,
    dieProfileField: "BiCS8",
    package: "BGA (9.0 x 13.0 x 0.85)"
  }
];

for (const sample of kioxiaConsumerUfsSamples) {
  assertPart(sample.partNumber, {
    vendor: "kioxia",
    type: "UFS",
    densityMbit: sample.densityMbit,
    dieProfileField: sample.dieProfileField,
    voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
    package: sample.package,
    extra: {
      "Storage Interface": sample.storageInterface,
      "Product Class": "Consumer / Industrial",
      "Operation Temperature": "-25°C ~ 85°C",
      "Controller Revision": sample.controllerRevision,
      "Die Count": sample.dieCount,
      "Speed Grade": sample.speedGrade
    },
    absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
  });
}

assertPart("THGJFJT1T45BAB8", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS5",
  cellField: "TLC",
  voltage: "Vcc: 2.7V-3.6V, VccQ: 1.14V-1.26V/1.7V-1.95V",
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 4.0",
    "Product Class": "Automotive AEC-Q100 Grade 2",
    "Controller Revision": "J",
    "Die Count": 4,
    "Speed Grade": "4640 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

assertPart("THGAFBT1T83BAA5", {
  vendor: "kioxia",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "BiCS3",
  cellField: "TLC",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "BGA",
  extra: {
    "Storage Interface": "UFS 2.1",
    "Product Class": "Automotive AEC-Q100 Grade 3",
    "Controller Revision": "B",
    "Die Count": 8,
    "Speed Grade": "1160 MB/s"
  },
  absentExtra: ["Product Version", "NAND Technology", "Die Stack"]
});

assertPart("THGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA52 (14 x 18 x 1.04)",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA08",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

assertPart("TCGVX1G7D2GLA08", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA52 (14 x 18 x 1.04)",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA08",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

assertPart("THGBX2G7D2JLA01", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "19nm",
  cellField: "MLC",
  package: "LGA60",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "2",
    "Die Count": 2,
    "Package Code": "LA01",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

assertPart("THGVR1G7D2GLA09", {
  vendor: "kioxia",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "24nm",
  cellField: "MLC",
  package: "LGA52 (14 x 18 x 1.0)",
  extra: {
    "Managed Family": "SmartNAND",
    Controller: "Embedded ECC",
    "ECC enabled": "Yes",
    "Controller Revision": "1",
    "Die Count": 2,
    "Package Code": "LA09",
    "Lead free": "Yes",
    "Halogen free": "Yes"
  },
  absentExtra: ["System", "Product Family", "Storage Interface", "Page Size", "Block Size", "Plane", "CE Count", "Channel Count", "Die Stack"]
});

assertPart("MT29FB16T08GALAAM5-TES:B", {
  vendor: "micron",
  type: "NAND",
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
    "Interface Type": "Async"
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
    "source",
    "status",
    "Reference Status",
    "Inference Source",
    "Density Code",
    "Config Code",
    "Package Code"
  ]
});

assertPart("MT29F2G08ABDHC-ET:D", {
  vendor: "micron",
  type: "NAND",
  densityMbit: 2048,
  cellField: "SLC",
  topology: {
    ce: 1,
    ch: 1,
    rb: 1,
    die: 1
  },
  voltage: "Vcc: 3.3V (2.70–3.60V), VccQ: 1.8V (1.70–1.95V)",
  interface: {
    async: false,
    sync: true
  },
  absentExtra: ["Revision Code", "Suffix Code", "Package Code"]
});

assertRuleDraftDieProfile("vendor.micron.token.v1", "MT29F2T08GBLBH", "N69R");
assertMicronDecodePackDieProfile("MT29F2T08GBLBH", "N69R", 276);
assertFdbDoesNotOverrideDecodePackFields();

assertDecodedPartNumber("MT29F2G08ABDHC-ETD", "MT29F2G08ABDHC-ET:D");
assertDecodedPartNumber("MT29FB16T08GALAAM5-TESB", "MT29FB16T08GALAAM5-TES:B");
assertSearchPnIncludes("MT29F2G08ABDHC-ETD", "Micron MT29F2G08ABDHC-ET:D");
assertSearchPnIncludes("MT29FB16T08GALAAM5-TESB", "Micron MT29FB16T08GALAAM5-TES:B");

assertPart("MT29FB8T08EALAAM5-QK:E", {
  vendor: "micron",
  type: "NAND",
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
    "Interface Type": "Async"
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
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
  type: "NAND",
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
    "Interface Type": "Async"
  },
  absentExtra: [
    "System",
    "Product Family",
    "ECC enabled",
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
    "DRAM Speed": "LPDDR-400 CL3"
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
    "DRAM Speed": "LPDDR-333 CL3"
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
    "DRAM Speed": "LPDDR-400 CL3"
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
    "DRAM Speed": "LPDDR-400 CL3"
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
    "DRAM Speed": "LPDDR-333 CL3"
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
    "DRAM Speed": "LPDDR-416"
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
    "DRAM Speed": "LPDDR-416"
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
    "DRAM Speed": "LPDDR-266 CL3",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Production Status": "Engineering Sample"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type"]
});

assertPart("MT29RZ4C4DZZMGMF-18W.80C", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  widthField: "x16",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.8V/1.2V; eMMC VCCM: 1.8V",
  package: "168-ball VFBGA 12x12x0.85, PoP",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR2-S4 + SLC NAND",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDDR2-S4",
    "DRAM Width": "x32",
    "Package Configuration": "1 NAND Flash, 1 LPDRAM, 0 eMMC",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "80C"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type", "Config Code", "Package Code", "Speed Grade"]
});

assertPart("MT29RZ1CVCZZHGTN-18 W.85H", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 1024,
  widthField: "x16",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.8V/1.2V",
  package: "121-ball 7.5x8x0.8mm",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR2-S4 + SLC NAND",
    "Storage Density": "1Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "512Mb",
    "DRAM Type": "LPDDR2-S4",
    "DRAM Width": "x16",
    "Package Configuration": "1 NAND Flash, 1 LPDRAM, 0 eMMC",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "85H"
  },
  absentExtra: ["Cell Level", "Die Count", "Enterprise", "Interface Type", "Config Code", "Package Code", "Speed Grade"]
});

assertPart("MT29AZ5A3CHHWD-18AIT.84F", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 4096,
  widthField: "x8",
  voltage: "NAND VCC: 1.8V; LPDRAM VDD/VDDQ: 1.2V/1.2V",
  package: "162-ball 8.0x10.5x0.9mm",
  extra: {
    "Product Family": "Micron NAND MCP",
    "Product Mode": "SLC NAND + LPDDR2",
    "Storage Density": "4Gb NAND",
    "Storage Interface": "Parallel NAND",
    "DRAM Density": "2Gb",
    "DRAM Type": "LPDDR2",
    "DRAM Width": "x32",
    "Package Configuration": "1 NAND Flash, 2 LPDRAM",
    "DRAM Speed": "LPDDR2-1066 CL8",
    "Operation Temperature": "Automotive industrial (-40°C ~ 85°C)",
    "Die Revision": "84F"
  },
  absentExtra: ["Config Code", "Package Code", "Speed Grade", "Special Option"]
});

assertPart("MT29JZZZ2DWMAFJV-6IES.63m", {
  vendor: "micron",
  type: "eMCP",
  densityMbit: 2048,
  voltage: "LPDRAM VDD/VDDQ: 1.8V/1.8V; eMMC VCCM/VCCQM: 1.8V/1.8V",
  package: "168-ball VFBGA 12x12x1.0, PoP",
  extra: {
    "Product Family": "Micron All-in-One",
    "Product Mode": "LPDDR + SLC eMMC",
    "Storage Density": "256MB eMMC",
    "Storage Interface": "eMMC",
    "Product Version": "eMMC 4.2/4.3",
    "DRAM Density": "2Gb",
    "DRAM Type": "LPDRAM",
    "DRAM Width": "x32",
    "Package Configuration": "0 NAND Flash, 2 LPDRAM (CS0#/CS1#), 1 eMMC",
    "DRAM Speed": "LPDDR-333 CL3",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Production Status": "Engineering Sample",
    "Die Revision": "63M"
  },
  absentExtra: ["Config Code", "Package Code", "Speed Grade", "Special Option"]
});

const micronUmcpVoltage = {
  q: "LPDRAM VDD/VDDQ: 1.1V/0.6V; UFS VCC/VCCQ: 3.3V/1.8V",
  s: "LPDRAM VDD/VDDQ: 1.1V/0.6V; UFS VCC/VCCQ: 2.5V/1.2V",
  t: "LPDRAM VDD/VDDQ: 1.05V/0.5V; UFS VCC/VCCQ: 2.5V/1.2V"
};

for (const sample of [
  {
    partNumber: "MT29VZZZAD8HQKWL 053 W.G8C",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "32Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2750 100s v2.1",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-3733",
    dieRevision: "G8C",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZBDAFQKWL 046 W.G0J",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "48Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "G0J",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZBDAFQKBA 046 W.G0J",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "48Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "G0J",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZCDAFQKWL 046 W.G0L",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "G0L",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZCDAFQKBA 046 W.G0L",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "G0L",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZAD9FQFSM 046 W.G9K",
    densityMbit: 1048576,
    storageDensity: "128GB UFS",
    dramDensity: "32Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "2 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "G9K",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZ7D8FQFSL 046 W.11K",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "24Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "2 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "11K",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZAD8FQKSL 046 W.12H",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "32Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2752 110s v2.1/v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "12H",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZBD91SLSM 046 W.17X",
    densityMbit: 1048576,
    storageDensity: "128GB UFS",
    dramDensity: "48Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.s,
    controller: "SM2754 140s v2.2",
    packageConfiguration: "3 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "17X",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZCD91SKSM 046 W.17Y",
    densityMbit: 1048576,
    storageDensity: "128GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.s,
    controller: "SM2754 140s v2.2",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "17Y",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZCD91SFSM 046 W.18C",
    densityMbit: 1048576,
    storageDensity: "128GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.s,
    controller: "SM2754 140s v2.2",
    packageConfiguration: "2 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "18C",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZ7D81SFSL 046 W.22B",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "24Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.s,
    controller: "SM2754 140s v2.2",
    packageConfiguration: "2 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "22B",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZAD81SFSL 046 W.22C",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "32Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.s,
    controller: "SM2754 140s v2.2",
    packageConfiguration: "2 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-4266",
    dieRevision: "22C",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT30AZZZCD9ZTOQS 031 W.15Q",
    densityMbit: 1048576,
    storageDensity: "128GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "SM2754 120s v3.1",
    packageConfiguration: "6 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "48Gb (4 x Y2BM) + 16Gb (2 x Y21N)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "15Q",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZCDAZTPWL 031 W.16C",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "SM2754 120s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "64Gb (8 x Y31N)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "16C",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZCDBZTPEQ 031 W.16D",
    densityMbit: 4194304,
    storageDensity: "512GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "SM2754 120s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "64Gb (8 x Y31N)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "16D",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZDDA0TPQS 031 W.19Q",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "96Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "96Gb (8 x Y2BM)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "19Q",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZDDA0TPQS 026 W.19Q",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "96Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "96Gb (8 x Y2BM)",
    dramSpeed: "LPDDR5-8533",
    dieRevision: "19Q",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZDDA0TPQS 031 WL.19Q",
    densityMbit: 2097152,
    storageDensity: "256GB UFS",
    dramDensity: "96Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "96Gb (8 x Y2BM)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "19Q",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZDDB0TPWL 031 W.19R",
    densityMbit: 4194304,
    storageDensity: "512GB UFS",
    dramDensity: "96Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "96Gb (8 x Y2BM)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "19R",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZDDB0TPWL 031 WL.19R",
    densityMbit: 4194304,
    storageDensity: "512GB UFS",
    dramDensity: "96Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "8 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramConfiguration: "96Gb (8 x Y2BM)",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "19R",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT30AZZZCDB0TKWL 031 W.20X",
    densityMbit: 4194304,
    storageDensity: "512GB UFS",
    dramDensity: "64Gb",
    dramType: "LPDDR5",
    voltage: micronUmcpVoltage.t,
    controller: "9U6A 140s v3.1",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "297-ball uMCP",
    dramSpeed: "LPDDR5-6400",
    dieRevision: "20X",
    productMode: "UFS + Mobile LPDDR5"
  },
  {
    partNumber: "MT29VZZZ7D7HQKWL 062 W.G7A",
    densityMbit: 262144,
    storageDensity: "32GB UFS",
    dramDensity: "24Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2750 100s v2.1",
    packageConfiguration: "4 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-3200",
    dieRevision: "G7A",
    productMode: "UFS + Mobile LPDDR4X"
  },
  {
    partNumber: "MT29VZZZBD8HQOWL 053 W.G8D",
    densityMbit: 524288,
    storageDensity: "64GB UFS",
    dramDensity: "48Gb",
    dramType: "LPDDR4X",
    voltage: micronUmcpVoltage.q,
    controller: "SM2750 100s v2.1",
    packageConfiguration: "6 LPDRAM, 1 UFS",
    package: "254-ball uMCP",
    dramSpeed: "LPDDR4X-3733",
    dieRevision: "G8D",
    productMode: "UFS + Mobile LPDDR4X"
  }
] as const) {
  assertPart(sample.partNumber, {
    vendor: "micron",
    type: "uMCP",
    densityMbit: sample.densityMbit,
    voltage: sample.voltage,
    package: sample.package,
    extra: {
      "Product Mode": sample.productMode,
      "Storage Density": sample.storageDensity,
      "Storage Interface": "UFS",
      "Controller": sample.controller,
      "DRAM Density": sample.dramDensity,
      ...("dramConfiguration" in sample ? { "DRAM Configuration": sample.dramConfiguration } : {}),
      "DRAM Type": sample.dramType,
      "DRAM Width": "x32",
      "Package Configuration": sample.packageConfiguration,
      "DRAM Speed": sample.dramSpeed,
      "Operation Temperature": "Wireless (-25°C ~ 85°C)",
      "Die Revision": sample.dieRevision
    },
    absentExtra: ["Config Code", "Package Code", "Controller Code", "Product Family", "Speed Grade"]
  });
}

assertPart("H26M78208CMRX", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "1xnm NAND",
    "Die Density": "64Gb",
    "Die Count": 8,
    "Product Class": "Automotive Grade 2/3"
  }
});

assertPart("H26M78208CMRN", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 524288,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "1xnm NAND",
    "Die Density": "64Gb",
    "Die Count": 8,
    "Product Class": "Commercial / Mobile"
  }
});

assertPart("H26M31001HPR", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 32768,
  package: "153FBGA 11.5x13x0.8mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 4.5",
    "Product Generation": "1xnm NAND",
    "Die Density": "32Gb",
    "Die Count": 1
  }
});

assertPart("H26M88002AMR", {
  vendor: "skhynix",
  type: "eMMC",
  densityMbit: 1048576,
  package: "153FBGA 11.5x13x1.0mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Generation": "3D-V2 NAND",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

assertPart("H26M91208HPRX", {
  vendor: "skhynix",
  type: "eMMC",
  density: "Unknown",
  package: "153FBGA 11.5x13x0.8mm",
  extra: {
    "Managed Family": "e-NAND",
    "Storage Interface": "eMMC 5.1",
    "Product Class": "Automotive Grade 2/3"
  }
});

assertSkhynixHn8RuleMatches("HN8G95DJHQX148", ["vendor.skhynix.ufs.hn8.automotive-ufs31.v1"]);
assertPart("HN8G95DJHQX148", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  package: "153-ball JEDEC FBGA 11.5x13.0x1.2 TFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Automotive AAT",
    "Operation Temperature": "-40°C ~ 105°C"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T25DJHVX111", ["vendor.skhynix.ufs.hn8.automotive-ufs31.v1"]);
assertPart("HN8T25DJHVX111", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  package: "153-ball JEDEC FBGA 11.5x13.0x1.2 TFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Automotive AIT",
    "Operation Temperature": "-40°C ~ 95°C"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T25DEHKX077N", ["vendor.skhynix.ufs.hn8.mobile-ufs31.v1"]);
assertPart("HN8T25DEHKX077N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  voltage: "Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V",
  package: "153FBGA 11.0x13.0x0.8 WFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176,
    "Product Class": "Mobile"
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8T35DZHKX079", ["vendor.skhynix.ufs.hn8.mobile-ufs31.v1"]);
assertPart("HN8T35DZHKX079", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 8388608,
  dieProfileField: "HYV7",
  voltage: "Vcc: 2.4V-2.7V, VccQ: 1.14V-1.26V",
  package: "153FBGA 11.0x13.0x1.0 VFBGA",
  extra: {
    "Storage Interface": "UFS 3.1",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family", "Product Generation"]
});

assertSkhynixHn8RuleMatches("HN8G962EHKX037N", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8G962EHKX037N", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8T062EHKX039", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8T062EHKX039", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8T162EHKX041", ["vendor.skhynix.ufs.hn8.ufs22-v7.v1"]);
assertPart("HN8T162EHKX041", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 2097152,
  dieProfileField: "HYV7",
  voltage: "Vcc: 3.3V, VccQ: 1.8V",
  package: "153FBGA 11.5x13.0x0.8",
  extra: {
    "Storage Interface": "UFS 2.2",
    "Layer Count": 176
  },
  absentExtra: ["System", "Product Family"]
});

assertSkhynixHn8RuleMatches("HN8G961ZGKX031", ["vendor.skhynix.ufs.hn8.ufs22-v6.v1"]);
assertPart("HN8G961ZGKX031", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 524288,
  voltage: "Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V",
  package: "153FBGA 11.5x13.0x1.0",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System", "Product Family", "Process", "Layer Count"]
});

assertSkhynixHn8RuleMatches("HN8T261ZGKX014", ["vendor.skhynix.ufs.hn8.ufs22-v6.v1"]);
assertPart("HN8T261ZGKX014", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 4194304,
  voltage: "Vcc: 2.7V-3.6V, VccQ2: 1.7V-1.95V",
  package: "153FBGA 11.5x13.0x1.0",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["System", "Product Family", "Process", "Layer Count"]
});

assertSkhynixHn8RuleMatches("HN8T274EJKX130", ["vendor.skhynix.ufs.hn8.zufs41.v1"]);
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

assertSkhynixHn8RuleMatches("HN8T374ZJKX141", ["vendor.skhynix.ufs.hn8.zufs41.v1"]);
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

assertPart("H28U64222MMR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 262144,
  package: "11.5x13x1.0mm",
  extra: {
    "Storage Interface": "UFS 2.0",
    "Product Generation": "1xnm NAND",
    "Interface Type": "1-lane / 2-lane",
    "Die Density": "64Gb",
    "Die Count": 4
  },
  absentExtra: ["System", "Group", "Package Code", "Component Code"]
});

assertPart("H28U86222MCR", {
  vendor: "skhynix",
  type: "UFS",
  densityMbit: 1048576,
  package: "11.5x13x1.2mm",
  extra: {
    "Storage Interface": "UFS 2.0",
    "Product Generation": "1xnm NAND",
    "Interface Type": "1-lane / 2-lane",
    "Die Density": "64Gb",
    "Die Count": 16
  },
  absentExtra: ["System", "Group", "Package Code", "Component Code"]
});

assertPart("H25T2TB88E-X321-N", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV6",
  cellField: "TLC",
  voltage: "Unknown",
  extra: {
    "Process Alias": "H25FTB0",
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T1TD48C-X630", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 2097152,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 4
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T2TC88C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV7",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T2TD88C-X682", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T2TD88C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 4194304,
  dieProfileField: "HYV8",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 8
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

const skhynixH25Hyv9KnownPackages = [
  {
    partNumber: "H25T0TD18CX655",
    densityMbit: 1048576,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 1,
    package: "152-ball BGA 14x18x1.0mm"
  },
  {
    partNumber: "H25T1TD28CX656",
    densityMbit: 2097152,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "152-ball BGA 14x18x1.0mm"
  },
  {
    partNumber: "H25T2TD48CX657",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "152-ball BGA 14x18x1.0mm"
  },
  {
    partNumber: "H25T3TD88CX676",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "152-ball BGA 14x18x1.35mm"
  },
  {
    partNumber: "H25T3TD88CX658",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "152-ball BGA 14x18x1.35mm"
  },
  {
    partNumber: "H25T4TDG8CX658",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "152-ball BGA 14x18x1.35mm"
  },
  {
    partNumber: "H25T2TD48CX659",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "316-ball BGA 14x18x1.0mm"
  },
  {
    partNumber: "H25T3TD88CX660",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "316-ball BGA 14x18x1.35mm"
  },
  {
    partNumber: "H25T4TDG8CX660",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 4,
    package: "316-ball BGA 14x18x1.35mm"
  },
  {
    partNumber: "H25T2TD48CX862",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.0mm"
  },
  {
    partNumber: "H25T3TD88CX860",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.35mm"
  },
  {
    partNumber: "H25T0TD18CX826",
    densityMbit: 1048576,
    dieCount: 1,
    ceCount: 1,
    rbCount: 1,
    channelCount: 1,
    package: "154-ball BGA 11.5x13.5x1.0mm"
  },
  {
    partNumber: "H25T1TD28CX828",
    densityMbit: 2097152,
    dieCount: 2,
    ceCount: 2,
    rbCount: 2,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.0mm"
  },
  {
    partNumber: "H25T2TD48CX809",
    densityMbit: 4194304,
    dieCount: 4,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.0mm"
  },
  {
    partNumber: "H25T3TD88CX811",
    densityMbit: 8388608,
    dieCount: 8,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.35mm"
  },
  {
    partNumber: "H25T4TDG8CX813",
    densityMbit: 16777216,
    dieCount: 16,
    ceCount: 4,
    rbCount: 4,
    channelCount: 2,
    package: "154-ball BGA 11.5x13.5x1.5mm"
  }
];

for (const item of skhynixH25Hyv9KnownPackages) {
  assertPart(item.partNumber, {
    vendor: "skhynix",
    type: "NAND",
    densityMbit: item.densityMbit,
    dieProfileField: "HYV9",
    cellField: "TLC",
    package: item.package,
    extra: {
      "Layer Count": 321,
      "Die Density": "1Tb",
      "Die Count": item.dieCount,
      "CE Count": item.ceCount,
      "R/B Count": item.rbCount,
      "Channel Count": item.channelCount
    },
    absentExtra: [...skhynixH25RawInternalExtra, "Process Alias", "Product Generation", "Reference Status", "Inference Source"]
  });
}

assertPart("H25T0QA18CX542", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "HYV7Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 176
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T4QM88G", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "HYV9Q",
  cellField: "QLC",
  extra: {
    "Layer Count": 321,
    "Die Density": "2Tb",
    "Die Count": 8,
    "CE Count": 4
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T3TCG8C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 8388608,
  dieProfileField: "HYV7",
  cellField: "TLC",
  voltage: "Vcc: 2.5V, VccQ: 1.2V",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 16,
    "CE Count": 4,
    "R/B Count": 4,
    "Channel Count": 2
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertPart("H25T4TMG8C", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 16777216,
  dieProfileField: "HYV6",
  cellField: "TLC",
  extra: {
    "Process Alias": "H25GTM0",
    "Layer Count": 128,
    "Die Density": "1Tb",
    "Die Count": 16,
    "CE Count": 4
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDraftDieProfile("vendor.skhynix.h25.gt-package.v2", "H25G9TC18CX488", "HYV7");
assertRuleDoesNotMatch("vendor.skhynix.h25.raw.v2", "H25G9TC18CX488");
assertPart("H25G9TC18CX488", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV7",
  cellField: "TLC",
  voltage: "Vcc: 2.5V, VccQ: 1.2V",
  extra: {
    "Process Alias": "H25FTC0",
    "Layer Count": 176,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

assertRuleDraftDieProfile("vendor.skhynix.h25.gt-package.v2", "H25G9TD18CX576", "HYV8");
assertRuleDoesNotMatch("vendor.skhynix.h25.raw.v2", "H25G9TD18CX576");
assertPart("H25G9TD18CX576", {
  vendor: "skhynix",
  type: "NAND",
  densityMbit: 524288,
  dieProfileField: "HYV8",
  cellField: "TLC",
  voltage: "Vcc: 2.5V, VccQ: 1.2V",
  extra: {
    "Process Alias": "H25FTD0",
    "Layer Count": 238,
    "Die Density": "512Gb",
    "Die Count": 1,
    "CE Count": 1,
    "R/B Count": 1,
    "Channel Count": 1
  },
  absentExtra: [...skhynixH25RawInternalExtra, "Product Generation", "Reference Status", "Inference Source"]
});

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

assertPart("H2DTDG8UD1MYR", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 131072,
  dieProfileField: "26nm",
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
  dieProfileField: "16nm",
  cellField: "MLC",
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "EMI Shielded",
    "Die Density": "64Gb",
    "Die Count": 2
  }
});

assertPart("H2JT1T8QD1MMR", {
  vendor: "skhynix",
  type: "E2NAND",
  densityMbit: 1048576,
  dieProfileField: "16nm",
  cellField: "MLC",
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Version": "E2NAND3.0",
    "Block size": "4MB",
    "Special Option": "Non Shielded",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

assertPart("H23QDG8UD1ACS", {
  vendor: "skhynix",
  type: "E3NAND",
  densityMbit: 131072,
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Generation": "1ynm E3NAND",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "EMI Shielded",
    "Die Density": "64Gb",
    "Die Count": 2
  }
});

assertPart("H23Q1T8QK1MYR", {
  vendor: "skhynix",
  type: "E3NAND",
  densityMbit: 1048576,
  widthField: "x8",
  package: "WLGA",
  extra: {
    "Product Generation": "1ynm E3NAND",
    "Block size": "4MB",
    "ECC enabled": "Yes",
    "Special Option": "Non Shielded",
    "Die Density": "128Gb",
    "Die Count": 8
  }
});

for (const partNumber of [
  "H26M31001HPR",
  "H26M78208CMRX",
  "H28U64222MMR",
  "H2JTDG8UD1BMS",
  "H23Q1T8QK1MYR"
]) {
  const result = engine.decodePart({ query: partNumber, lang: "eng" });
  assert.equal(firstField(result, "die_stack"), undefined, `${partNumber} should not expose die_stack`);
  assert.ok(firstField(result, "die_count"), `${partNumber} should expose die_count`);
}

assertPart("H9TQ17ABJTMCUR-KUM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 131072,
  package: "221Ball FBGA",
  extra: {
    "Product Mode": "CI-MCP NAND DDR3",
    "Storage Density": "16GB",
    "DRAM Density": "16Gb",
    "DRAM Type": "LPDDR3"
  }
});

assertPart("H9TP32A4GDBCPR-KGM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 32768,
  package: "162Ball FBGA",
  extra: {
    "Product Mode": "CI-MCP NAND DDR2",
    "Storage Density": "4GB",
    "DRAM Density": "4Gb",
    "DRAM Type": "LPDDR2"
  }
});

assertSkhynixEmcpRuleMatches("H9HP52ACPMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP52ACPMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "254Ball FBGA 11.5x13",
  extra: {
    "Product Mode": "eMCP NAND DDR4",
    "Storage Density": "64GB",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Voltage": "1.8V/1.1V/0.6V",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System"]
});

assertSkhynixEmcpRuleMatches("H9HP27ADAMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP27ADAMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 262144,
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "254Ball FBGA 11.5x13",
  extra: {
    "Product Mode": "eMCP NAND DDR4",
    "Storage Density": "32GB",
    "Storage Interface": "eMMC 5.1",
    "DRAM Density": "24Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Voltage": "1.8V/1.1V/0.6V",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System"]
});

assertSkhynixEmcpRuleMatches("H9HP99ADAMADAR-KMM", ["vendor.skhynix.emcp.h9hp-lpddr4x.v1"]);
assertPart("H9HP99ADAMADAR-KMM", {
  vendor: "skhynix",
  type: "eMCP",
  voltage: "eMMC Vcc: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "254Ball FBGA 11.5x13",
  extra: {
    "Product Mode": "eMCP NAND DDR4",
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-3733"
  },
  absentExtra: ["System", "Density Code", "Config Code"]
});

assertSkhynixEmcpRuleMatches("H9AG9G5ANBX100", ["vendor.skhynix.emcp.h9a.v1"]);
assertPart("H9AG9G5ANBX100", {
  vendor: "skhynix",
  type: "eMCP",
  densityMbit: 524288,
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 eMCP",
    "Storage Density": "64GB",
    "Storage Interface": "eMMC 5.0",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x16",
    "DRAM Speed": "LPDDR4X-4266",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System"]
});

assertPart("H9QT0GECN6X145", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  voltage: "UFS: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 uMCP",
    "Storage Density": "128GB",
    "Storage Interface": "UFS 2.2",
    "Product Generation": "4th generation uMCP",
    "DRAM Density": "48Gb",
    "DRAM Type": "LPDDR4X",
    "DRAM Width": "x8",
    "DRAM Voltage": "VDD1: 1.8V, VDD2: 1.1V, VDDQ: 0.6V",
    "DRAM Speed": "LPDDR4X-4266",
    "Product Version": "UFS 2.2 / LPDDR4X",
    "Operation Temperature": "-25°C ~ 85°C",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System", "Config Code", "Reserved Code", "Serial Code"]
});

assertPart("H9QXXXXCN6X145", {
  vendor: "skhynix",
  type: "uMCP",
  voltage: "UFS: 3.3V, LPDDR4X: 1.8V/1.1V/0.6V",
  package: "254Ball FBGA",
  extra: {
    "Product Mode": "LPDDR4 uMCP",
    "Storage Interface": "UFS 2.2",
    "Product Generation": "4th generation uMCP",
    "DRAM Speed": "LPDDR4X-4266",
    "Special Option": "Lead & Halogen Free"
  },
  absentExtra: ["System", "Storage Density", "DRAM Width", "Config Code", "Reserved Code", "Serial Code"]
});

assertPart("H9HQ15ACPMADAR-KEM", {
  vendor: "skhynix",
  type: "uMCP",
  densityMbit: 1048576,
  package: "254Ball FBGA",
  extra: {
    "Storage Density": "128GB",
    "Storage Interface": "UFS",
    "DRAM Density": "32Gb",
    "DRAM Type": "LPDDR4X"
  },
  absentExtra: ["System"]
});

assertPart("MTFC4GACAJCN-1M WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 32768,
  package: "153-ball VFBGA 11.5x13x1.0 (SAC 302)",
  extra: {
    "Product Generation": "Fourth",
    "Product Version": "eMMC 5.0",
    "Special Option": "2MB MAX boot area / 100% MAX enhanced"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Component Generation", "Product Family", "Group"]
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
    "Product Version": "UFS 2.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertPart("MTFC64GASAOEA-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  dieProfileField: "B16C",
  package: "153-ball WFBGA 11.5x13x0.8 (LF35)",
  extra: {
    "Component Density": "256Gb",
    "Component Width": "x8",
    "Product Version": "UFS 2.1",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertPart("MTFC128GARATEK-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "B27B",
  package: "153-ball VFBGA 11.5x13x0.9",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertPart("MTFC512GAXATHJ-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 4194304,
  dieProfileField: "B47R",
  package: "153-ball VFBGA 11.0x13x1.0",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Operation Temperature": "Standard (-25°C ~ 85°C)"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Product Family", "Group"]
});

assertPart("MTFC64GBCAVAL-AIT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 524288,
  extra: {
    "Product Version": "UFS 3.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertPart("MTFC128GBCAQTC-AIT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 1048576,
  package: "153-ball LFBGA 11.5x13x1.3",
  extra: {
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Product Family": "Micron e.MMC 5.1 TLC Pearl",
    "Product Version": "eMMC 5.1"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("MTFC1TAYAXHR-WT", {
  vendor: "micron",
  type: "UFS",
  densityMbit: 8388608,
  extra: {
    "Product Version": "UFS 4.0"
  },
  absentExtra: ["NAND Component", "Controller Code", "Package Code", "Group"]
});

assertPart("MTFC256GZZZZZZ-WT", {
  vendor: "micron",
  type: "eMMC",
  densityMbit: 2097152,
  package: "Unknown",
  absentExtra: ["NAND Component", "Controller Code", "Package Code"]
});

assertMicronManagedFbgaMarking("JW101", "MT29C1G12MABAAHB-75IT", "emcp");
assertMicronManagedFbgaMarking("JZ018", "MT29VZZZ7D7DQKWL-062W97Y", "umcp");
assertMicronManagedFbgaMarking("JZ101", "MTFC64GAOALEA-WTES", "emmc");

assertPart("MTFDHBL064TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 524288,
  cellField: "TLC",
  package: "BGA291 type 1620, 16mm x 20mm x 1.2mm",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Product Version": "NVMe 1.3c",
    "Storage Interface": "PCIe Gen3 x4",
    "Sector Size": "512B",
    "Product Generation": "1st Generation",
    "NAND Technology": "Micron 3D TLC NAND Flash",
    "NAND Component": "512Gb TLC x8 3.3V (3D)",
    "Component Density": "512Gb",
    "Component Width": "x8",
    "Component Voltage": "3.3V",
    "Special Option": "Self-encrypting drive (SED)",
    "Operation Temperature": "Automotive support, Industrial (-40°C to +95°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertPart("MTFDHBM1T0TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 8388608,
  cellField: "TLC",
  package: "BGA291 type 1620, 16mm x 20mm x 1.6mm",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Sector Size": "512B",
    "Operation Temperature": "Automotive support, Industrial (-40°C to +95°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertPart("MTFDHBK1T0TDP-1AT12AIYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 8388608,
  cellField: "TLC",
  package: "M.2 Type 2230 M-key, 22mm x 30mm x 2.4mm",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Special Option": "Self-encrypting drive (SED)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertPart("MTFDHBL064TDQ-1AT12ATYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 524288,
  cellField: "TLC",
  package: "BGA291 type 1620, 16mm x 20mm x 1.2mm",
  extra: {
    "Product Family": "Micron 2100AT SSD",
    "Product Version": "NVMe 1.3c",
    "Storage Interface": "PCIe Gen3 x4",
    "Operation Temperature": "Automotive (-40°C to +105°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertPart("MTFDHBK128TDQ-1AT12ATYY", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "M.2 Type 2230 M-key, 22mm x 30mm x 2.0mm",
  extra: {
    "Product Family": "Micron 2100AT SSD",
    "Storage Interface": "PCIe Gen3 x4",
    "Operation Temperature": "Automotive (-40°C to +105°C)"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertPart("MTFDHBL128TDP-AAT12AIYYES", {
  vendor: "micron",
  type: "NVMe",
  densityMbit: 1048576,
  cellField: "TLC",
  package: "BGA291 type 1620, 16mm x 20mm x 1.2mm",
  extra: {
    "Product Family": "Micron 2100AI SSD",
    "Product Class": "Engineering samples",
    "Production Status": "Engineering samples"
  },
  absentExtra: ["Form Factor Code", "Product Family Code", "BOM Code", "NAND Component Code", "Sector Code", "Firmware Code", "Customer Designator"]
});

assertRuleDoesNotMatch("vendor.micron.ssd.2100ai-at.v1", "MTFDHBL064TDP-1AT12ITYY");

assertPart("YMEC6A1TC1A2C1", {
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 262144,
  dieProfileField: "TAS",
  cellField: "TLC",
  package: "BGA-153 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC000",
    "Product Family": "YMTC EC000 eMMC",
    "Storage Interface": "eMMC 5.1",
    "Process Alias": "X2-9060",
    "Layer Count": 128,
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMEC8A2TB3A2C3", {
  vendor: "ymtc",
  type: "eMMC",
  densityMbit: 1048576,
  dieProfileField: "JGS",
  cellField: "TLC",
  package: "BGA-153 11.5x13x1.0",
  extra: {
    Controller: "eMMC 5.1 Controller EC110",
    "Product Family": "YMTC EC110 eMMC",
    "Storage Interface": "eMMC 5.1",
    "Process Alias": "X1-9050",
    "Layer Count": 64,
    "Die Stack": "QDP (4-die)",
    "Product Class": "Commercial",
    "Operation Temperature": "-25°C ~ 85°C"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMUS8A1TC1A2C1", {
  vendor: "ymtc",
  type: "UFS",
  densityMbit: 1048576,
  dieProfileField: "TAS",
  cellField: "TLC",
  package: "BGA-153 11.5x13x1.0/1.2",
  extra: {
    Controller: "UFS 3.1 Controller",
    "Storage Interface": "UFS 3.1",
    "Process Alias": "X2-9060",
    "Layer Count": 128,
    "Die Stack": "SDP (1-die)",
    "Product Class": "Commercial"
  },
  absentExtra: ["System", "Group", "Storage Density", "Product Generation", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("YMC6G001TB51AA1C0", {
  vendor: "ymtc",
  type: "NAND",
  densityMbit: 1048576,
  dieProfileField: "WDS",
  cellField: "TLC",
  package: "BGA-132 12x18",
  extra: {
    "Process Alias": "X3-9070",
    "Layer Count": 232,
    "Die Density": "256Gb",
    "Die Count": 1,
    "Plane Count": 6,
    "Product Class": "Commercial"
  },
  absentExtra: ["Product Generation"]
});

assertPart("YMN0WQA2B1CC4C", {
  vendor: "ymtc",
  type: "NAND",
  densityMbit: 2789212.16,
  dieProfileField: "HUS",
  cellField: "QLC",
  package: "BGA-132 12x18",
  extra: {
    "Process Alias": "X2-6070",
    "Layer Count": 128,
    "Die Density": "1.33Tb",
    "Die Count": 2,
    "Plane Count": 6,
    "Product Class": "Client"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X3-9060", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WYS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X3-9060",
    "Layer Count": 128,
    "Die Density": "512Gb",
    "Plane Count": 4,
    "Speed Grade": "ONFI 5.0; Max Speed=2400MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X3-9070", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WDS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X3-9070",
    "Layer Count": 232,
    "Die Density": "1Tb",
    "Plane Count": 6,
    "Speed Grade": "ONFI 5.0; Max Speed=2400MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-9060", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "WTS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X4-9060",
    "Layer Count": 160,
    "Die Density": "512Gb",
    "Plane Count": 4,
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-9070", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "SQS",
  cellField: "TLC",
  extra: {
    "Process Alias": "X4-9070",
    "Layer Count": 267,
    "Die Density": "1Tb",
    "Plane Count": 6,
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("X4-6080", {
  vendor: "ymtc",
  type: "NAND",
  dieProfileField: "PTS",
  cellField: "QLC",
  extra: {
    "Process Alias": "X4-6080",
    "Layer Count": 267,
    "Die Density": "2Tb",
    "Speed Grade": "ONFI 5.1; Max Speed=3600MT/s"
  },
  absentExtra: ["Product Generation"]
});

assertPart("KLMAG1JETD-B041", {
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

assertPart("KLM8G1GETF-B041", {
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

assertPart("KLMBG2JETD-B041", {
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

assertPart("KLMDG1NCAB-B041", {
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

assertPart("K9AFGD8J0M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 262144,
  dieProfileField: "SSV4",
  cellField: "TLC",
  extra: {
    "Layer Count": 64,
    "Die Count": 1,
    "CE Count": 1
  }
});

assertPart("K9AHGD8J0M", {
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

assertPart("K9AHGD8J0A", {
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

assertPart("K9AHGD8J0B", {
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

assertPart("K9AHGD8J0E", {
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

assertPart("K9AHGD8J0D", {
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

assertPart("K9AHGD8J0F", {
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

assertPart("K9DVGY8J5E", {
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

assertPart("K9DYGY8J5B", {
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

assertPart("K9DYGY8J5D", {
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

assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9DYGY8J5B", "SSV8");
assertRuleDraftDieProfile("vendor.samsung.token.v1", "K9DYGY8J5D", "SSV9");

assertPart("K9OVGD8J2B", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "TLC",
  extra: {
    "Die Count": 8,
    "CE Count": 4
  }
});

assertPart("K9XVGB8J1M", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "QLC",
  extra: {
    "Die Count": 16,
    "CE Count": 2
  }
});

assertPart("K9XVGY8J5A", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "QLC",
  extra: {
    "Die Count": 16,
    "CE Count": 4
  }
});

assertPart("K9XVGD8J5C", {
  vendor: "samsung",
  type: "NAND",
  densityMbit: 8388608,
  cellField: "QLC",
  extra: {
    "Die Count": 16,
    "CE Count": 4
  }
});

assertPart("KLUCG4J1BB", {
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

assertPart("KLUDGAG1BD", {
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

assertPart("KLUEG8UHDB-C2E1", {
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

assertPart("KLUFG8RHHF-F0G1", {
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

assertPart("KLUEG4RHKF-F0H1", {
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

assertPart("KLUFG4NHKH-F0H1", {
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

assertPart("EMMC64G-TY29", {
  vendor: "kingston",
  type: "eMMC",
  densityMbit: 524288,
  package: "11.5x13.0x0.8",
  cellField: "TLC",
  extra: {
    "Storage Interface": "eMMC 5.1",
    "Config Code": "TY29",
    "Product Class": "Commercial"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
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
    "Speed Grade": "G4 4P"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
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
    "Storage Interface": "eMMC 5.1"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
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
    "Interface Type": "HS400"
  },
  absentExtra: ["Interface info", "Storage Density", "Reference Status", "Inference Source", "source", "status"]
});

assertPart("BWU2A0526B128G", {
  vendor: "biwin",
  type: "UFS",
  densityMbit: 1048576,
  package: "FBGA153 11.50x13.00",
  extra: {
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
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
    "Storage Interface": "UFS 2.2"
  },
  absentExtra: ["Storage Density", "Reference Status", "Inference Source", "source", "status"]
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
assertSearchPnIncludes("MTFDHBL064TDP", "Micron MTFDHBL064TDP-1AT12AIYY");
assertSearchPnIncludes("MTFDHBL064TDQ", "Micron MTFDHBL064TDQ-1AT12ATYY");
assertSearchPnIncludes("MTFDHBK1T0TDQ", "Micron MTFDHBK1T0TDQ-1AT12ATYY");
assertSearchPnIncludes("SUGNM1126", "SpecTek SUGNM1126A6BPIET-046BT");
assertSearchPnIncludes("SUJ52A1G", "SpecTek SUJ52A1GCFDI-BT");
assertSearchPnIncludes("SM662PBC", "Silicon Motion SM662PBC-BFS");
assertSearchPnIncludes("SM671PEF", "Silicon Motion SM671PEF-BFS");
assertSearchPnIncludes("THGJFRT1E45", "Kioxia THGJFRT1E45BATV");
assertSearchPnIncludes("YMUSAB5", "YMTC YMUSAB5TH3A1C1");
assertSearchPnFirst("EMMC", "Kingston EMMC04G-WT32");
