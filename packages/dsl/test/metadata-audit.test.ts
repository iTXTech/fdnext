import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine, fdnextFieldRegistry, type PartDecodeResult } from "../../core/src/index";
import { embeddedResourceBundle } from "../../resources/index";
import { compileIdentifierRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultIdentifierRules } from "../src/index";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function repoPath(path: string): string {
  return join(repoRoot, path);
}

const legacyMetadataKeys = new Set([
  "badBlock",
  "blocksPerLun",
  "component_generation",
  "densityGrade",
  "dieCode",
  "eccEnabled",
  "eccLevel",
  "halogenFree",
  "halfPageAndSize",
  "interfaceInfo",
  "leadFree",
  "micronPartNumber",
  "multiChip",
  "opTemp",
  "packageFunctionalityPartialType",
  "pagesPerBlock",
  "redundantAreaSize",
  "simultaneouslyProgrammedPages",
  "spareAreaSizePer512B",
  "timingModeAsync",
  "unsupportedReason"
]);
const structuredLegacyMetadataKeys = new Set(["blockSize", "pageSize"]);

function walkRules(value: unknown, path: string, findings: string[], inCanonicalFields = false): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkRules(item, `${path}[${index}]`, findings, inCanonicalFields));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    const extKey = key.startsWith("ext:") ? key.slice("ext:".length) : "";
    const nextInCanonicalFields = inCanonicalFields || key === "fields";
    if (
      legacyMetadataKeys.has(key) ||
      (nextInCanonicalFields && structuredLegacyMetadataKeys.has(key)) ||
      legacyMetadataKeys.has(extKey) ||
      structuredLegacyMetadataKeys.has(extKey)
    ) {
      findings.push(`${path}.${key}`);
    }
    walkRules(item, `${path}.${key}`, findings, nextInCanonicalFields);
  }
}

function assertDslRulesUseCanonicalKeys(): void {
  const findings: string[] = [];
  walkRules(defaultDslRules, "defaultDslRules", findings);
  walkRules(defaultIdentifierRules, "defaultIdentifierRules", findings);
  assert.deepEqual(findings, [], "DSL rules should not emit legacy camelCase metadata keys");
}

function walkEmitFields(value: unknown, path: string, findings: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkEmitFields(item, `${path}[${index}]`, findings));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.key === "string" && !Object.hasOwn(fdnextFieldRegistry, record.key)) {
    findings.push(`${path}.key=${record.key}`);
  }
  for (const [key, item] of Object.entries(record)) {
    walkEmitFields(item, `${path}.${key}`, findings);
  }
}

function assertDslV2EmitUsesCanonicalFields(): void {
  const findings: string[] = [];
  walkEmitFields(defaultDslRules, "defaultDslRules", findings);
  assert.deepEqual(findings, [], "DSL v2 emit fields should use canonical field registry keys");
}

function collectPotentialSamples(value: unknown, samples: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    if (/^[A-Z0-9][A-Z0-9:+._-]{4,}$/i.test(value)) {
      samples.add(value);
    }
    return samples;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPotentialSamples(item, samples));
    return samples;
  }
  if (!value || typeof value !== "object") {
    return samples;
  }
  for (const [key, item] of Object.entries(value)) {
    if (/^[A-Z0-9][A-Z0-9:+._-]{4,}$/i.test(key)) {
      samples.add(key);
    }
    collectPotentialSamples(item, samples);
  }
  return samples;
}

function assertRuntimeDslExtraFieldsAreRegistered(): void {
  const decoders = compileRulesToDecoders(defaultDslRules);
  const samples = collectPotentialSamples(embeddedResourceBundle.partIndex);
  const missing = new Map<string, number>();

  for (const sample of samples) {
    for (const decoder of decoders) {
      if (!decoder.check(sample)) {
        continue;
      }
      const info = decoder.decode(sample);
      const fields = info?.fields;
      if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
        continue;
      }
      for (const key of Object.keys(fields)) {
        if (!Object.hasOwn(fdnextFieldRegistry, key)) {
          missing.set(key, (missing.get(key) ?? 0) + 1);
        }
      }
    }
  }

  assert.deepEqual([...missing.entries()].sort(), [], "runtime DSL extra fields should be registered public fields");
}

function collectIdentifierExtKeys(value: unknown, findings: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectIdentifierExtKeys(item, findings));
    return findings;
  }
  if (!value || typeof value !== "object") {
    return findings;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith("ext:")) {
      findings.add(key.slice("ext:".length));
    }
    collectIdentifierExtKeys(item, findings);
  }
  return findings;
}

function assertIdentifierExtFieldsTargetPublicKeys(): void {
  const projections: Record<string, string> = {
    interface: "interface_type"
  };
  const missing = [...collectIdentifierExtKeys(defaultIdentifierRules)]
    .map((key) => [key, projections[key] ?? key] as const)
    .filter(([, fieldKey]) => !Object.hasOwn(fdnextFieldRegistry, fieldKey));

  assert.deepEqual(missing, [], "identifier ext fields should target registered public fields");
}

function assertRepresentativeDslV2Metadata(): void {
  const byId = new Map(defaultDslRules.map((rule) => [rule.id, rule] as const));
  for (const [id, expected] of [
    ["vendor.micron.dram.component.v1", { chipKind: "dram", fieldProfile: "dram" }],
    ["vendor.kingston.emmc.v1", { chipKind: "managed_nand", productType: "emmc", fieldProfile: "managed_nand" }],
    ["vendor.biwin.emcp.v1", { chipKind: "managed_nand", productType: "emcp", fieldProfile: "managed_nand" }]
  ] as const) {
    const rule = byId.get(id);
    assert.ok(rule, `${id} should be present`);
    assert.equal(rule.domain, "memory", `${id} should declare domain`);
    assert.equal(rule.chipKind, expected.chipKind, `${id} should declare chipKind`);
    if ("productType" in expected) {
      assert.equal(rule.productType, expected.productType, `${id} should declare productType`);
    }
    assert.equal(rule.fieldProfile, expected.fieldProfile, `${id} should declare fieldProfile`);
    assert.ok(rule.capabilities?.includes("part.decode"), `${id} should declare decode capability`);
    assert.ok((rule.emit?.fields?.length ?? 0) > 0, `${id} should emit fields`);
  }
}

function assertRuntimeDoesNotKeepMetadataAliases(): void {
  assert.equal(existsSync(repoPath("packages/core/src/metadata.ts")), false, "runtime should not keep a metadata alias registry");

  const forbidden = [
    "METADATA_KEY_ALIASES",
    "TRANSLATION_KEY_ALIASES",
    "normalizeMetadataKey",
    "normalizeTranslationKey",
    "pagesPerBlock",
    "simultaneouslyProgrammedPages"
  ];
  const findings: string[] = [];
  for (const file of [
    "packages/core/src/engine.ts",
    "packages/core/src/translate.ts",
    "packages/core/src/index.ts",
    "packages/core/src/flashid/postprocess.ts"
  ]) {
    const source = readFileSync(repoPath(file), "utf8");
    for (const token of forbidden) {
      if (source.includes(token)) {
        findings.push(`${file}: ${token}`);
      }
    }
  }
  assert.deepEqual(findings, [], "runtime should not translate legacy metadata keys through aliases");
}

function assertLangKeysUseSnakeCase(): void {
  const allowed = new Set(["eMMC"]);
  for (const file of ["packages/resources/resources/lang/eng.json", "packages/resources/resources/lang/chs.json"]) {
    const lang = JSON.parse(readFileSync(repoPath(file), "utf8")) as Record<string, unknown>;
    const camelKeys = Object.keys(lang).filter((key) => /[a-z][A-Z]/.test(key) && !allowed.has(key));
    assert.deepEqual(camelKeys, [], `${file} should not contain camelCase keys`);
    assert.equal(Object.hasOwn(lang, "component_generation"), false, `${file} should use generation_info`);
  }
}

function assertReadmeIsOnlyIndex(): void {
  const readme = readFileSync(repoPath("docs/pn_code/README.md"), "utf8");
  const forbidden = [
    [/https?:\/\//, "external URLs"],
    [/packages\/dsl/, "source paths"],
    [/vendor\./, "rule ids"],
    [/^## .*?(SanDisk|KIOXIA|Micron|Samsung|SK hynix|Kingston|Longsys|BIWIN)/m, "vendor sections"],
    [/(外部资料|规则状态|测试样例|已采集编码|来源：)/, "vendor detail sections"],
    [/`[A-Z0-9][A-Z0-9-]{5,}`/, "PN-like inline codes"]
  ] as const;

  for (const [pattern, label] of forbidden) {
    assert.equal(pattern.test(readme), false, `README should not contain ${label}`);
  }
}

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compileRulesToDecoders(defaultDslRules),
  identifierDecoders: compileIdentifierRulesToDecoders(defaultIdentifierRules)
});

function managedNandSamples(): string[] {
  const testSource = readFileSync(repoPath("packages/dsl/test/managed-nand.test.ts"), "utf8");
  return [...testSource.matchAll(/assertPart\("([^"]+)"/g)]
    .map((match) => match[1])
    .filter((sample): sample is string => Boolean(sample));
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

const vendorAliases: Record<string, string[]> = {
  biwin: ["biwin"],
  kingston: ["kingston"],
  kioxia: ["kioxia", "toshiba"],
  longsys: ["longsys", "foresee", "lexar"],
  micron: ["micron"],
  samsung: ["samsung"],
  sndk: ["sandisk", "western digital", "wd"],
  skhynix: ["sk hynix", "skhynix"],
  ymtc: ["ymtc"]
};

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
  const fields: Record<string, unknown> = {};
  for (const block of result.blocks) {
    for (const field of block.fields) {
      if (["vendor", "chip_kind", "product_type", "part_number"].includes(field.key)) {
        continue;
      }
      fields[field.label] = field.display ?? field.value;
    }
  }
  return fields;
}

function resultType(result: PartDecodeResult): string {
  return String(result.device?.productType ?? result.device?.chipKind ?? "");
}

function assertManagedNandOutputIsCanonical(): void {
  const findings: string[] = [];
  const legacyDisplayKeys = ["Component Generation", "Interface info"];

  for (const partNumber of managedNandSamples()) {
    const info = engine.decodePart({ query: partNumber, lang: "eng" });
    const extra = fieldsByLabel(info);

    for (const key of legacyDisplayKeys) {
      if (Object.hasOwn(extra, key)) {
        findings.push(`${partNumber}: legacy display key ${key}`);
      }
    }

    const type = normalizeText(resultType(info));
    const system = normalizeText(extra.System);
    const group = normalizeText(extra.Group);
    const productVersion = normalizeText(extra["Product Version"]);
    const productFamily = removeVendorPrefix(extra["Product Family"], info.device?.vendor.id);
    const managedFamily = normalizeText(extra["Managed Family"]);
    const aliases = (vendorAliases[String(info.device?.vendor.id)] ?? [String(info.device?.vendor.id)])
      .map((alias) => normalizeText(alias))
      .filter(Boolean);

    if (
      system &&
      (system === type || aliases.includes(system) || aliases.some((alias) => system === `${alias} ${type}` || system === `${alias} managed nand`))
    ) {
      findings.push(`${partNumber}: redundant System=${extra.System}`);
    }
    if (group && (group === type || group === `${type} flash`)) {
      findings.push(`${partNumber}: redundant Group=${extra.Group}`);
    }
    if (productVersion && (productVersion === normalizeText(extra["Storage Interface"]) || productVersion === type)) {
      findings.push(`${partNumber}: redundant Product Version=${extra["Product Version"]}`);
    }
    if (productFamily && (productFamily === productVersion || productFamily === normalizeText(extra["Storage Interface"]) || productFamily === type)) {
      findings.push(`${partNumber}: redundant Product Family=${extra["Product Family"]}`);
    }
    if (managedFamily && (managedFamily === type || managedFamily === system || managedFamily === normalizeText(extra["Product Family"]))) {
      findings.push(`${partNumber}: redundant Managed Family=${extra["Managed Family"]}`);
    }
  }

  assert.deepEqual(findings, [], "managed NAND public output should use canonical, non-duplicate metadata");
}

function assertDslV2CompositeComponents(): void {
  const info = engine.decodePart({ query: "BWCA2KZC-64G", lang: "eng" });
  const components = info.relations.filter((relation) => relation.kind === "component");
  assert.equal(info.device?.chipKind, "managed_nand");
  assert.equal(info.device?.productType, "emcp");
  assert.ok(components.some((relation) =>
    relation.target.role === "storage" &&
    relation.target.device?.chipKind === "managed_nand" &&
    relation.target.device.productType === "emmc"
  ));
  assert.ok(components.some((relation) =>
    relation.target.role === "dram" &&
    relation.target.device?.chipKind === "dram" &&
    relation.target.device.productType === "lpddr4x"
  ));
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "storage_density" && field.value === "64GB eMMC")));
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "dram_density" && field.value === "32Gb")));
  assert.equal(JSON.stringify(info).includes("__fdnext"), false, "DSL internal metadata should not leak into public results");
}

assertDslRulesUseCanonicalKeys();
assertDslV2EmitUsesCanonicalFields();
assertRuntimeDslExtraFieldsAreRegistered();
assertIdentifierExtFieldsTargetPublicKeys();
assertRepresentativeDslV2Metadata();
assertRuntimeDoesNotKeepMetadataAliases();
assertLangKeysUseSnakeCase();
assertReadmeIsOnlyIndex();
assertManagedNandOutputIsCanonical();
assertDslV2CompositeComponents();
