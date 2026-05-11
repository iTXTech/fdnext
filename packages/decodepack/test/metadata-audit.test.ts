import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine, fdnextFieldRegistry, type PartDecodeResult } from "../../core/src/index";
import { embeddedResourceBundle } from "../../resources/index";
import {
  checkDecodePack,
  compileDecodePack,
  defaultDecodePack,
  defaultIdentifierDecodeSpecs,
  defaultPartDecodeSpecs,
  explainIdentifierDecode,
  explainPartDecode
} from "../src/index";

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

function assertPartDecodeSpecsUseCanonicalKeys(): void {
  const findings: string[] = [];
  walkRules(defaultPartDecodeSpecs, "defaultPartDecodeSpecs", findings);
  walkRules(defaultIdentifierDecodeSpecs, "defaultIdentifierDecodeSpecs", findings);
  assert.deepEqual(findings, [], "iTXTech fdnext DecodePack rules should not output legacy camelCase metadata keys");
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

function assertNativeDraftUsesCanonicalFields(): void {
  const findings: string[] = [];
  walkEmitFields(defaultPartDecodeSpecs, "defaultPartDecodeSpecs", findings);
  assert.deepEqual(findings, [], "native draft fields should use canonical field registry keys");
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

function assertRuntimeDecodePackFieldsAreRegistered(): void {
  const decoders = compileDecodePack(defaultDecodePack).partDecoders;
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

  assert.deepEqual([...missing.entries()].sort(), [], "runtime iTXTech fdnext DecodePack extra fields should be registered public fields");
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
  assert.deepEqual([...collectIdentifierExtKeys(defaultIdentifierDecodeSpecs)], [], "identifier iTXTech fdnext DecodePack should output canonical fields without ext namespace");
}

function collectDecoderOutputKeys(value: unknown, path: string, findings: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDecoderOutputKeys(item, `${path}[${index}]`, findings));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  const record = value as { id?: unknown; set?: unknown; tokenDecoder?: { assign?: unknown } };
  const check = (output: unknown, outputPath: string): void => {
    if (!output || typeof output !== "object" || Array.isArray(output)) {
      return;
    }
    const allowedRoots = new Set(["device", "fields", "identifiers", "controllers", "components", "meta", "warnings"]);
    const forbiddenExact = new Set([
      "type",
      "density",
      "rawDensity",
      "rawVendor",
      "processNode",
      "cellLevel",
      "deviceWidth",
      "classification",
      "flashId",
      "controller",
      "remark",
      "url",
      "urls",
      "__fdnext"
    ]);
    for (const key of Object.keys(output)) {
      const root = key.split(".")[0] ?? key;
      if (forbiddenExact.has(key) || key.includes("__fdnext") || !allowedRoots.has(root)) {
        findings.push(`${outputPath}.${key}`);
      }
    }
  };
  check(record.set, `${path}.${String(record.id ?? "rule")}.set`);
  check(record.tokenDecoder?.assign, `${path}.${String(record.id ?? "rule")}.tokenDecoder.assign`);
}

function assertDecoderOutputsUseNativeDraft(): void {
  const findings: string[] = [];
  collectDecoderOutputKeys(defaultPartDecodeSpecs, "defaultPartDecodeSpecs", findings);
  assert.deepEqual(findings, [], "part decoder outputs should use native draft device/fields/identifiers/controllers/components/meta paths only");
}

const internalPackFieldKeys = [
  "system",
  "group",
  "series_code",
  "cell_code",
  "layout_code",
  "density_code",
  "stack_code",
  "generation_code",
  "voltage_io_code"
];

function containsInternalPackFieldKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsInternalPackFieldKey);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  for (const [key, item] of Object.entries(value)) {
    if (internalPackFieldKeys.includes(key) || containsInternalPackFieldKey(item)) {
      return true;
    }
  }
  return false;
}

function assignsExtraObjectToPublicFields(rule: PartDecodeSpec): boolean {
  const fields = rule.tokenDecoder?.assign.fields;
  return Boolean(fields && typeof fields === "object" && !Array.isArray(fields) && "$var" in fields && fields.$var === "extra");
}

function omitsInternalPackFieldKeys(rule: PartDecodeSpec): boolean {
  return Boolean(
    rule.tokenDecoder?.steps.some(
      (step) =>
        step.op === "omit" &&
        step.from === "extra" &&
        internalPackFieldKeys.every((key) => step.keys.includes(key))
    )
  );
}

function assertExtraBasedPackOutputsOmitInternalKeys(): void {
  const findings = defaultPartDecodeSpecs
    .filter((rule) => assignsExtraObjectToPublicFields(rule))
    .filter((rule) => containsInternalPackFieldKey(rule.tokenDecoder))
    .filter((rule) => !omitsInternalPackFieldKeys(rule))
    .map((rule) => rule.id);

  assert.deepEqual(findings, [], "extra-based part decoder outputs should omit internal system/group/token code fields");
}

function assertRepresentativeDecodePackMetadata(): void {
  const byId = new Map(defaultPartDecodeSpecs.map((rule) => [rule.id, rule] as const));
  for (const [id, expected] of [
    ["vendor.micron.dram.component.v1", { chipKind: "dram", fieldProfile: "dram" }],
    ["vendor.kingston.emmc.v1", { chipKind: "managed_nand", productType: "emmc", fieldProfile: "managed_nand" }],
    ["vendor.biwin.emcp.v1", { chipKind: "managed_nand", productType: "emcp", fieldProfile: "managed_nand" }]
  ] as const) {
    const rule = byId.get(id);
    assert.ok(rule, `${id} should be present`);
    const assign = rule.tokenDecoder?.assign ?? {};
    assert.equal(assign["device.domain"], "memory", `${id} should assign device.domain`);
    assert.equal(assign["device.chipKind"], expected.chipKind, `${id} should assign device.chipKind`);
    if ("productType" in expected) {
      assert.equal(assign["device.productType"], expected.productType, `${id} should assign device.productType`);
    }
    assert.equal(assign["meta.fieldProfile"], expected.fieldProfile, `${id} should assign meta.fieldProfile`);
    assert.ok(Array.isArray(assign["meta.capabilities"]) && assign["meta.capabilities"].includes("part.decode"), `${id} should assign decode capability`);
    assert.ok(Object.keys(assign).some((key) => key.startsWith("fields.")), `${id} should assign canonical fields`);
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

function readLangPack(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(repoPath(file), "utf8")) as Record<string, unknown>;
}

function assertLangPacksAreConsistent(): void {
  const langDir = "packages/resources/resources/lang";
  assert.deepEqual(
    readdirSync(repoPath(langDir)).sort(),
    ["chs.json", "eng.json"],
    "resource bundle should only ship the supported language packs"
  );

  const eng = readLangPack(`${langDir}/eng.json`);
  const chs = readLangPack(`${langDir}/chs.json`);
  assert.deepEqual(Object.keys(chs).sort(), Object.keys(eng).sort(), "language packs should expose the same keys");

  for (const [file, lang] of Object.entries({ "eng.json": eng, "chs.json": chs })) {
    const nonStringValues = Object.entries(lang)
      .filter(([, value]) => typeof value !== "string")
      .map(([key]) => key);
    assert.deepEqual(nonStringValues, [], `${file} should only contain string translations`);

    const missingFieldLabels = Object.keys(fdnextFieldRegistry).filter((key) => !Object.hasOwn(lang, key));
    assert.deepEqual(missingFieldLabels, [], `${file} should label every public field key`);
  }
}

function assertLangKeysUseSnakeCase(): void {
  const allowed = new Set(["eMMC"]);
  for (const file of ["packages/resources/resources/lang/eng.json", "packages/resources/resources/lang/chs.json"]) {
    const lang = readLangPack(file);
    const camelKeys = Object.keys(lang).filter((key) => /[a-z][A-Z]/.test(key) && !allowed.has(key));
    assert.deepEqual(camelKeys, [], `${file} should not contain camelCase keys`);
    assert.equal(Object.hasOwn(lang, "component_generation"), false, `${file} should use generation_info`);
  }
}

function assertReadmeIsOnlyIndex(): void {
  const readme = readFileSync(repoPath("docs/pn_code/README.md"), "utf8");
  const forbidden = [
    [/https?:\/\//, "external URLs"],
    [/packages\/decodepack/, "source paths"],
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
  decoders: compileDecodePack(defaultDecodePack).partDecoders,
  identifierDecoders: compileDecodePack(defaultDecodePack).identifierDecoders
});

function managedNandSamples(): string[] {
  const testSource = readFileSync(repoPath("packages/decodepack/test/managed-nand.test.ts"), "utf8");
  return [...testSource.matchAll(/assertPart\("([^"]+)"/g)]
    .map((match) => match[1])
    .filter((sample): sample is string => Boolean(sample));
}

function partDecodeSamples(): string[] {
  const samples = new Set<string>();
  for (const file of ["packages/decodepack/test/managed-nand.test.ts", "packages/decodepack/test/dram.test.ts"]) {
    const testSource = readFileSync(repoPath(file), "utf8");
    for (const match of testSource.matchAll(/assertPart\("([^"]+)"/g)) {
      if (match[1]) samples.add(match[1]);
    }
  }
  return [...samples];
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

function assertPublicResultsDoNotExposeInternalPackFields(): void {
  const findings: string[] = [];
  const forbidden = new Set([...internalPackFieldKeys, "reference", "source", "status", "inference_source"]);

  for (const partNumber of partDecodeSamples()) {
    const info = engine.decodePart({ query: partNumber, lang: "eng" });
    for (const block of info.blocks) {
      for (const field of block.fields) {
        if (forbidden.has(field.key)) {
          findings.push(`${partNumber}: ${field.key}`);
        }
      }
    }
  }

  assert.deepEqual(findings, [], "public part decode fields should not expose internal system/group/token code or reference metadata");
}

function assertDecodePackCompositeComponents(): void {
  const info = engine.decodePart({ query: "BWCA2KZC-64G", lang: "eng" });
  const components = info.relations.filter((relation) => relation.kind === "component");
  const storageComponent = components.find((relation) => relation.target.role === "storage");
  const dramComponent = components.find((relation) => relation.target.role === "dram");
  assert.equal(info.device?.chipKind, "managed_nand");
  assert.equal(info.device?.productType, "emcp");
  assert.equal(storageComponent?.target.device?.chipKind, "managed_nand");
  assert.equal(storageComponent?.target.device?.productType, "emmc");
  assert.ok(storageComponent?.fields?.some((field) => field.key === "storage_density" && field.value === "64GB eMMC"));
  assert.ok(storageComponent?.fields?.some((field) => field.key === "storage_interface" && field.value === "eMMC 5.1"));
  assert.equal(dramComponent?.target.device?.chipKind, "dram");
  assert.equal(dramComponent?.target.device?.productType, "lpddr4x");
  assert.ok(dramComponent?.fields?.some((field) => field.key === "dram_density" && field.value === "32Gb"));
  assert.ok(dramComponent?.fields?.some((field) => field.key === "dram_type" && field.value === "LPDDR4X"));
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "storage_density" && field.value === "64GB eMMC")));
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "dram_density" && field.value === "32Gb")));
  assert.equal(JSON.stringify(info).includes("__fdnext"), false, "legacy FD draft marker should not leak into public results");
}

function assertDefaultDecodePackMaintainsItself(): void {
  const result = checkDecodePack(defaultDecodePack);
  assert.deepEqual(result.findings, [], "default iTXTech fdnext DecodePack should pass maintenance checks");
  assert.equal(result.ok, true);
}

function assertDecodePackExplainTools(): void {
  const partExplain = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G");
  assert.equal(partExplain.status, "matched");
  assert.ok(partExplain.specId, "part explain should include matched spec id");
  assert.ok(partExplain.steps.length > 0, "part explain should include a step trace");
  const components = (partExplain.draft as { components?: Array<{ role?: string; fields?: Record<string, unknown> }> } | null)?.components ?? [];
  const storage = components.find((component) => component.role === "storage");
  const dram = components.find((component) => component.role === "dram");
  assert.equal(storage?.fields?.storage_density, "64GB eMMC");
  assert.equal(storage?.fields?.storage_interface, "eMMC 5.1");
  assert.equal(dram?.fields?.dram_density, "32Gb");
  assert.equal(dram?.fields?.dram_type, "LPDDR4X");

  const rawNand = engine.decodePart({ query: "AFND1208S1", lang: "eng" });
  assert.equal(rawNand.device?.chipKind, "raw_nand", "FDB-only raw NAND should preserve public chipKind");

  const idExplain = explainIdentifierDecode(defaultDecodePack, "2C64444BA900");
  assert.equal(idExplain.status, "matched");
  assert.ok(idExplain.specId, "identifier explain should include matched spec id");
  assert.ok(idExplain.bitfields.length > 0, "identifier explain should include bitfield trace");
  assert.ok(Object.keys(idExplain.draft?.fields ?? {}).length > 0, "identifier explain should expose canonical fields");
}

function walkTextFiles(path: string, files: string[] = []): string[] {
  const ignored = new Set([".git", "dist", "node_modules", "pnpm-lock.yaml"]);
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (ignored.has(entry)) {
        continue;
      }
      walkTextFiles(join(path, entry), files);
    }
    return files;
  }
  if (stat.isFile() && /\.(?:c?js|m?ts|json|md|toml|yaml|yml|txt|html|css|Dockerfile)$/.test(path)) {
    files.push(path);
  }
  return files;
}

function assertRemovedNamesStayRemoved(): void {
  const removedConcept = String.fromCharCode(100, 115, 108);
  const removedTypeStem = `${removedConcept[0]?.toUpperCase()}${removedConcept.slice(1)}`;
  const forbidden = [
    `@itxtech/fdnext-${removedConcept}`,
    `packages/${removedConcept}`,
    `fdnext-${removedConcept}`,
    `default${removedTypeStem}Rules`,
    "compile" + "RulesToDecoders",
    `Identifier${removedTypeStem}Rule`,
    `${removedTypeStem}Rule`
  ];
  const findings: string[] = [];
  for (const file of walkTextFiles(repoRoot)) {
    const relative = file.slice(repoRoot.length).replace(/^\/+/, "");
    const source = readFileSync(file, "utf8");
    for (const token of forbidden) {
      if (source.includes(token)) {
        findings.push(`${relative}: ${token}`);
      }
    }
  }
  assert.deepEqual(findings, [], "removed DecodePack predecessor names should not remain in repository text");
}

assertPartDecodeSpecsUseCanonicalKeys();
assertNativeDraftUsesCanonicalFields();
assertRuntimeDecodePackFieldsAreRegistered();
assertIdentifierExtFieldsTargetPublicKeys();
assertDecoderOutputsUseNativeDraft();
assertExtraBasedPackOutputsOmitInternalKeys();
assertRepresentativeDecodePackMetadata();
assertRuntimeDoesNotKeepMetadataAliases();
assertLangPacksAreConsistent();
assertLangKeysUseSnakeCase();
assertReadmeIsOnlyIndex();
assertManagedNandOutputIsCanonical();
assertPublicResultsDoNotExposeInternalPackFields();
assertDecodePackCompositeComponents();
assertDefaultDecodePackMaintainsItself();
assertDecodePackExplainTools();
assertRemovedNamesStayRemoved();
