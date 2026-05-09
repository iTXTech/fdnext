import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine, type PartDecodeResult } from "../../core/src/index";
import { embeddedResources } from "../../resources/index";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "../src/index";

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

function walkRules(value: unknown, path: string, findings: string[], inExtraInfo = false): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkRules(item, `${path}[${index}]`, findings, inExtraInfo));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    const extKey = key.startsWith("ext:") ? key.slice("ext:".length) : "";
    const nextInExtraInfo = inExtraInfo || key === "extraInfo";
    if (
      legacyMetadataKeys.has(key) ||
      (nextInExtraInfo && structuredLegacyMetadataKeys.has(key)) ||
      legacyMetadataKeys.has(extKey) ||
      structuredLegacyMetadataKeys.has(extKey)
    ) {
      findings.push(`${path}.${key}`);
    }
    walkRules(item, `${path}.${key}`, findings, nextInExtraInfo);
  }
}

function assertDslRulesUseCanonicalKeys(): void {
  const findings: string[] = [];
  walkRules(defaultDslRules, "defaultDslRules", findings);
  walkRules(defaultFlashIdRules, "defaultFlashIdRules", findings);
  assert.deepEqual(findings, [], "DSL rules should not emit legacy camelCase metadata keys");
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
  resources: embeddedResources,
  decoders: compileRulesToDecoders(defaultDslRules),
  flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
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
  const product = result.blocks.flatMap((block) => block.fields).find((field) => field.key === "product_type");
  return String(product?.display ?? product?.value ?? result.device?.chipKind ?? "");
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

assertDslRulesUseCanonicalKeys();
assertRuntimeDoesNotKeepMetadataAliases();
assertLangKeysUseSnakeCase();
assertReadmeIsOnlyIndex();
assertManagedNandOutputIsCanonical();
