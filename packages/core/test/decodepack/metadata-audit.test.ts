import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine } from "../../src/index";
import { fdnextFieldRegistry } from "../../src/field-registry";
import { embeddedResourceBundle } from "../../src/resources";
import {
  checkDecodePack,
  compileDecodePack,
  defaultDecodePack,
  defaultIdentifierDecodeSpecs,
  defaultPartDecodeSpecs,
  type DecodePack,
  explainIdentifierDecode,
  explainPartDecode,
  type PartDecodeSpec,
  readPartDecodeSpecTables
} from "../../src/decodepack";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

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

function readNandDieProfileTable(): Record<string, Record<string, unknown>> {
  return JSON.parse(readFileSync(repoPath("packages/core/src/decodepack/rules/tables/nand-die-profile.json"), "utf8")) as Record<
    string,
    Record<string, unknown>
  >;
}

function assertLangPacksAreConsistent(): void {
  const langDir = "packages/core/resources/lang";
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

function assertMicronSolidigmDieProfileNaming(): void {
  const profiles = readNandDieProfileTable();
  for (const [key, layerCount] of Object.entries({ N38A: 144, N38B: 144, N38C: 144, N38E: 144, N4PA: 192 })) {
    assert.equal(profiles[key]?.die_codename, key, `${key} should remain a visible die codename`);
    assert.equal(profiles[key]?.generation_info, "FG", `${key} should be classified as IMFT/Solidigm FG`);
    assert.equal(profiles[key]?.layer_count, layerCount, `${key} should keep its profile layer count`);
  }

  for (const key of ["B47R", "B47T", "B57R", "B57T", "B58R", "B68S", "B78R", "N48R", "N58R", "N69R"]) {
    assert.equal(profiles[key]?.die_codename, key, `${key} should remain a visible RG die codename`);
    assert.equal(profiles[key]?.generation_info, "RG", `${key} should be classified as Micron RG`);
  }
}

function assertIntel2dAliasDensityDigitsMatch(): void {
  const intelRule = defaultPartDecodeSpecs.find((rule) => rule.id === "vendor.intel.token.v1");
  assert.ok(intelRule?.tokenDecoder, "Intel token rule should be present");
  const tables = intelRule.tokenDecoder.tables as Record<string, unknown>;
  const overrides = tables.processNodeOverrideByDieDensity as Record<string, string>;
  const densityDigits: Record<string, string> = {
    "16Gb": "2",
    "32Gb": "3",
    "64Gb": "4",
    "128Gb": "5"
  };
  const findings: string[] = [];

  for (const [key, alias] of Object.entries(overrides)) {
    const dieDensity = key.split(":")[2] ?? "";
    const expectedDigit = densityDigits[dieDensity];
    const match = /^[LMB][6789]([2-5])[A-Z]$/.exec(alias);
    if (match && expectedDigit && match[1] !== expectedDigit) {
      findings.push(`${key} -> ${alias}, expected density digit ${expectedDigit}`);
    }
  }

  assert.deepEqual(findings, [], "Intel IMFT 2D process alias third digit should match die density");
}

function assertSkhynixH25RulesAreConsolidated(): void {
  const ids = defaultPartDecodeSpecs
    .map((rule) => rule.id)
    .filter((id) => id.startsWith("vendor.skhynix.") && (id.includes("h25") || id.includes("3d") || id.includes("4d")));
  assert.deepEqual(
    ids,
    ["vendor.skhynix.h25.gt-package.v2", "vendor.skhynix.h25.raw.v2"],
    "SK hynix H25 rules should stay consolidated in the H25 pack"
  );

  const h25Rules = defaultPartDecodeSpecs.filter((rule) => ids.includes(rule.id));
  const h25RuleText = JSON.stringify(h25Rules);
  for (const token of ["3D NAND", "4D NAND", "generation_info", "series_info"]) {
    assert.equal(h25RuleText.includes(token), false, `SK hynix H25 rules should not duplicate die-profile ${token}`);
  }
}

function assertLangKeysUseSnakeCase(): void {
  const allowed = new Set(["eMMC"]);
  for (const file of ["packages/core/resources/lang/eng.json", "packages/core/resources/lang/chs.json"]) {
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

function assertDecodePackCompositeComponents(): void {
  const info = engine.decodePart({ query: "BWCA2KZC-64G", lang: "eng" });
  const publicComponents = info.relations.filter((relation) => relation.kind === "component");
  const draftComponents = explainPartDecode(defaultDecodePack, "BWCA2KZC-64G").draft?.components ?? [];
  const storageComponent = draftComponents.find((component) => component.role === "storage");
  const dramComponent = draftComponents.find((component) => component.role === "dram");
  assert.equal(info.device?.chipKind, "managed_nand");
  assert.equal(info.device?.productType, "emcp");
  assert.deepEqual(publicComponents, [], "hidden component drafts should not be public relations");
  assert.equal(storageComponent?.hidden, true);
  assert.equal(storageComponent?.device?.chipKind, "managed_nand");
  assert.equal(storageComponent?.device?.productType, "emmc");
  assert.equal(storageComponent?.fields?.storage_density, "64GB eMMC");
  assert.equal(storageComponent?.fields?.storage_interface, "eMMC 5.1");
  assert.equal(dramComponent?.hidden, true);
  assert.equal(dramComponent?.device?.chipKind, "dram");
  assert.equal(dramComponent?.device?.productType, "lpddr4x");
  assert.equal(dramComponent?.fields?.dram_density, "32Gb");
  assert.equal(dramComponent?.fields?.dram_type, "LPDDR4X");
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "storage_density" && field.value === "64GB eMMC")));
  assert.equal(info.blocks.some((block) => block.fields.some((field) => field.key === "density")), false);
  assert.ok(info.blocks.some((block) => block.fields.some((field) => field.key === "dram_density" && field.value === "32Gb")));
  assert.equal(JSON.stringify(info).includes("__fdnext"), false, "legacy FD draft marker should not leak into public results");
}

const packageDimensionPattern = /^\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)+(?:\/\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)*)?$/;
const packageTypePattern = /^[A-Za-z0-9][A-Za-z0-9+./ -]*(?:-\d[A-Za-z0-9./-]*)?(?: \/ [A-Za-z0-9][A-Za-z0-9+./ -]*(?:-\d[A-Za-z0-9./-]*)?)*$/;

function isPublicPackageValuePath(path: string[]): boolean {
  if (
    path.some((part) =>
      /package_code|packageCode|package_configuration|packageConfiguration|packageEnv|reference|source|notes|special_option/i.test(part)
    )
  ) {
    return false;
  }

  const leaf = path[path.length - 1] ?? "";
  if (leaf === "package" || leaf === "fields.package") {
    return true;
  }

  const tableIndex = path.findIndex((part) => part === "tables" || part === "sharedTables");
  if (tableIndex < 0) {
    return false;
  }
  const tableName = path[tableIndex + 1] ?? "";
  if (/^(?:basePackage|packageToken)$/i.test(tableName)) {
    return false;
  }
  return /package/i.test(tableName);
}

function validatePublicPackageValue(value: string, path: string, findings: string[]): void {
  const addFinding = (reason: string): void => findings.push(`${path}=${value} (${reason})`);

  if (!value || value === "Unknown") {
    addFinding("unknown-or-empty");
    return;
  }
  if (/\b(?:mm|ball|pin|pad)\b/i.test(value)) {
    addFinding("unit-word");
  }
  if (/[()]/.test(value)) {
    addFinding("parenthesized-detail");
  }
  const parts = value.split(",").map((part) => part.trim());
  if (parts.some((part) => part.length === 0)) {
    addFinding("empty-segment");
    return;
  }
  const [head, ...tail] = parts;
  if (head && (/\b\d+\s+[A-Z]*BGA\b/i.test(head) || /\b\d+(?:[A-Z]*BGA|LGA|TSOP|WSON)\b/i.test(head))) {
    addFinding("pin-before-type");
  }
  if (head && /\b(?:[A-Z]*BGA|LGA|TSOP|WSON)\d+(?![-/])\b/i.test(head)) {
    addFinding("missing-pin-separator");
  }
  if (!head || (!packageTypePattern.test(head) && !packageDimensionPattern.test(head))) {
    addFinding("head-shape");
  }
  for (const part of tail) {
    if (/^\d+(?:\.\d+)?x/.test(part) && !packageDimensionPattern.test(part)) {
      addFinding("dimension-shape");
    }
  }
}

function collectPublicPackageValues(value: unknown, path: string[], findings: string[]): void {
  if (typeof value === "string") {
    if (isPublicPackageValuePath(path)) {
      validatePublicPackageValue(value, path.join("."), findings);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPublicPackageValues(item, [...path, `[${index}]`], findings));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    collectPublicPackageValues(item, [...path, key], findings);
  }
}

function assertDecodePackPackageValuesUseCanonicalShape(): void {
  const findings: string[] = [];
  collectPublicPackageValues(defaultPartDecodeSpecs, ["defaultPartDecodeSpecs"], findings);
  assert.deepEqual(
    findings,
    [],
    "public DecodePack package values should use TYPE[-PIN][, DIM][, SPECIAL] without guessed pins, Unknown, or unit words"
  );
}

function collectInvalidLpddrGenerationLabels(value: unknown, path: string[], findings: string[]): void {
  if (typeof value === "string") {
    if (/LPDDR-[2-5](?![0-9])/.test(value)) {
      findings.push(`${path.join(".")}=${value}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectInvalidLpddrGenerationLabels(item, [...path, `[${index}]`], findings));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    collectInvalidLpddrGenerationLabels(item, [...path, key], findings);
  }
}

function assertDecodePackLpddrGenerationLabelsUseJedecShape(): void {
  const findings: string[] = [];
  collectInvalidLpddrGenerationLabels(defaultPartDecodeSpecs, ["defaultPartDecodeSpecs"], findings);
  assert.deepEqual(findings, [], "LPDDR generation labels should use LPDDR3/LPDDR4/LPDDR5 without an internal dash");
}

function collectIdentityObjectTables(value: unknown, path: string, findings: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectIdentityObjectTables(item, `${path}[${index}]`, findings));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if ((key === "tables" || key === "sharedTables") && item && typeof item === "object" && !Array.isArray(item)) {
      for (const [tableName, table] of Object.entries(item)) {
        if (!table || typeof table !== "object" || Array.isArray(table)) {
          continue;
        }
        const entries = Object.entries(table);
        if (entries.length >= 2 && entries.every(([entryKey, entryValue]) => entryValue === entryKey)) {
          findings.push(`${path}.${key}.${tableName}`);
        }
      }
    }
    collectIdentityObjectTables(item, `${path}.${key}`, findings);
  }
}

function assertDecodePackIdentityTablesUseArraySyntax(): void {
  const findings: string[] = [];
  collectIdentityObjectTables(defaultDecodePack, "defaultDecodePack", findings);
  assert.deepEqual(findings, [], "identity DecodePack tables should use array syntax instead of duplicate key/value objects");
}

function assertDefaultDecodePackMaintainsItself(): void {
  const result = checkDecodePack(defaultDecodePack);
  assert.deepEqual(result.findings, [], "default iTXTech fdnext DecodePack should pass maintenance checks");
  assert.equal(result.ok, true);
}

function assertDecodePackCheckRejectsUndefinedTokenVariables(): void {
  const result = checkDecodePack({
    partSpecs: [
      {
        id: "test.undefined-variable",
        match: {
          kind: "prefix",
          value: "X"
        },
        tokenDecoder: {
          steps: [],
          assign: {
            "device.partNumber": {
              $var: "partNumber"
            },
            "fields.die_count": {
              $path: ["classificaion", "die"]
            }
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack);

  assert.equal(result.ok, false);
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.code === "undefined_variable" &&
        finding.specId === "test.undefined-variable" &&
        finding.path === "partSpecs[0].tokenDecoder.assign.fields.die_count.$path"
    ),
    `expected undefined token variable finding, got ${JSON.stringify(result.findings)}`
  );
}

function assertDecodePackCheckRejectsPublicCodeFields(): void {
  const result = checkDecodePack({
    partSpecs: [
      {
        id: "test.public-code-field",
        match: {
          kind: "prefix",
          value: "X"
        },
        set: {
          "device.partNumber": {
            $var: "partNumber"
          },
          "fields.config_code": "ABC",
          fields: {
            package_code: "XYZ"
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack);

  assert.equal(result.ok, false);
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.code === "internal_field" &&
        finding.specId === "test.public-code-field" &&
        finding.path === "partSpecs[0].set.fields.config_code"
    ),
    `expected direct public code field finding, got ${JSON.stringify(result.findings)}`
  );
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.code === "internal_field" &&
        finding.specId === "test.public-code-field" &&
        finding.path === "partSpecs[0].set.fields.package_code"
    ),
    `expected object public code field finding, got ${JSON.stringify(result.findings)}`
  );
}

function assertDecodePackCheckRejectsFullStringPartMatch(): void {
  const result = checkDecodePack({
    partSpecs: [
      {
        id: "test.full-string-match",
        match: {
          kind: "regex",
          value: "^ABC123$"
        },
        set: {
          "device.partNumber": {
            $var: "partNumber"
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack);

  assert.equal(result.ok, false);
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.code === "full_string_match" &&
        finding.specId === "test.full-string-match" &&
        finding.path === "partSpecs[0].match.value"
    ),
    `expected full string part match finding, got ${JSON.stringify(result.findings)}`
  );
}

function assertArrayDecodeTablesSupportIdentityAndSharedValues(): void {
  const pack = {
    partSpecs: [
      {
        id: "test.array-table",
        match: {
          kind: "prefix",
          value: "X"
        },
        tokenDecoder: {
          stripPrefixes: ["X"],
          tables: {
            token: ["AB", "CD"],
            packageObj: [
              {
                keys: ["AB", "CD"],
                value: {
                  package: "BGA, Shared"
                }
              }
            ]
          },
          steps: [
            {
              op: "takeLongest",
              table: "token",
              to: "code",
              default: ""
            },
            {
              op: "map",
              from: "code",
              table: "packageObj",
              to: "packageObj",
              default: {}
            }
          ],
          assign: {
            "device.partNumber": {
              $var: "partNumber"
            },
            "fields.package": {
              $path: "packageObj.package"
            }
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack;

  assert.deepEqual(checkDecodePack(pack).findings, []);

  for (const partNumber of ["XAB", "XCD"]) {
    const result = explainPartDecode(pack, partNumber);
    assert.equal(result.status, "matched");
    assert.equal(result.draft?.fields?.package, "BGA, Shared");
  }
  const trace = explainPartDecode(pack, "XCD").steps.find((step) => step.target === "code");
  assert.equal(trace?.value, "CD", "identity array tables should output the matched key");

  const tables = readPartDecodeSpecTables(pack, {
    specId: /^test\.array-table$/,
    tableName: /^(token|packageObj)$/
  });
  assert.deepEqual(
    tables.map(({ specId, tableName }) => `${specId}:${tableName}`),
    ["test.array-table:token", "test.array-table:packageObj"]
  );
  assert.deepEqual(Object.keys(tables[0]?.table ?? {}), ["AB", "CD"]);
  assert.deepEqual(tables[1]?.table.AB, { package: "BGA, Shared" });
  assert.deepEqual(tables[1]?.table.CD, { package: "BGA, Shared" });
}

function assertDecodePackCheckRejectsDuplicateArrayTableKeys(): void {
  const result = checkDecodePack({
    partSpecs: [
      {
        id: "test.duplicate-array-table-key",
        match: {
          kind: "prefix",
          value: "X"
        },
        tokenDecoder: {
          tables: {
            token: [
              "AB",
              {
                keys: ["AB"],
                value: "duplicate"
              }
            ]
          },
          steps: [
            {
              op: "takeLongest",
              table: "token",
              to: "code"
            }
          ],
          assign: {
            "device.partNumber": {
              $var: "partNumber"
            }
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack);

  assert.equal(result.ok, false);
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.code === "duplicate_table_key" &&
        finding.specId === "test.duplicate-array-table-key" &&
        finding.path === "partSpecs[0].tokenDecoder.tables.token[1].keys[0]"
    ),
    `expected duplicate array table key finding, got ${JSON.stringify(result.findings)}`
  );
}

function assertDecodePackCheckAllowsFixedLengthPartMatch(): void {
  const result = checkDecodePack({
    partSpecs: [
      {
        id: "test.fixed-length-match",
        match: {
          kind: "regex",
          value: "^ABC[0-9]{3}$"
        },
        set: {
          "device.partNumber": {
            $var: "partNumber"
          }
        }
      }
    ],
    identifierSpecs: []
  } satisfies DecodePack);

  assert.deepEqual(result.findings, [], `fixed-length structural PN match should be allowed, got ${JSON.stringify(result.findings)}`);
  assert.equal(result.ok, true);
}

function assertPartMatchersAllowUnknownTail(): void {
  for (const { partNumber, unknownTail } of [
    { partNumber: "K4UCE3Q4AB-MGCL", unknownTail: "ZZ" },
    { partNumber: "MT29F8G08ABACAH4", unknownTail: "ZZ" },
    { partNumber: "MTFC32GBCAQTC-AAT", unknownTail: "ZZ" },
    { partNumber: "SDINBDG4-64G", unknownTail: "-ZZ" }
  ]) {
    const exact = explainPartDecode(defaultDecodePack, partNumber);
    assert.equal(exact.status, "matched", `${partNumber} should have a baseline DecodePack match`);

    const query = `${partNumber}${unknownTail}`;
    const withUnknownTail = explainPartDecode(defaultDecodePack, query);
    assert.equal(withUnknownTail.status, "matched", `${query} should keep matching by known PN head`);
    assert.equal(withUnknownTail.specId, exact.specId, `${query} should keep the same DecodePack rule as ${partNumber}`);
  }
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
assertMicronSolidigmDieProfileNaming();
assertIntel2dAliasDensityDigitsMatch();
assertSkhynixH25RulesAreConsolidated();
assertLangKeysUseSnakeCase();
assertReadmeIsOnlyIndex();
assertDecodePackCompositeComponents();
assertDecodePackPackageValuesUseCanonicalShape();
assertDecodePackLpddrGenerationLabelsUseJedecShape();
assertDecodePackIdentityTablesUseArraySyntax();
assertDefaultDecodePackMaintainsItself();
assertDecodePackCheckRejectsUndefinedTokenVariables();
assertDecodePackCheckRejectsPublicCodeFields();
assertDecodePackCheckRejectsFullStringPartMatch();
assertArrayDecodeTablesSupportIdentityAndSharedValues();
assertDecodePackCheckRejectsDuplicateArrayTableKeys();
assertDecodePackCheckAllowsFixedLengthPartMatch();
assertPartMatchersAllowUnknownTail();
assertDecodePackExplainTools();
assertRemovedNamesStayRemoved();
