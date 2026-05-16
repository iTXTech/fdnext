import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server as NodeServer } from "node:http";
import { fileURLToPath } from "node:url";
import {
  createEngine,
  FDNEXT_VERSION,
  fdnextBlockIds,
  fdnextChipKinds,
  fdnextControllerGroupIds,
  fdnextDomains,
  fdnextFieldKeys,
  fdnextIdSchemes,
  fdnextProductTypes
} from "../../core/src/index";
import { createContractEngine, runContractChecks } from "../src/index";
import * as resourceModule from "../../resources/index";
import { createHttpServer } from "../../server/src/index";
import { createCfWorkersAdapter } from "../../cf-workers/src/index";
import { startAliyunFc } from "../../aliyun-fc/src/index";
import { FDNEXT_CORS_ORIGINS_ENV } from "../../runtime/src/index";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function parseJsonObject(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as unknown;
  assert.ok(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as Record<string, unknown>;
}

const rootPackageMetadata = parseJsonObject(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
assert.equal(typeof rootPackageMetadata.version, "string", "root package metadata must expose a version");
const fdnextPackageVersion = rootPackageMetadata.version as string;

function runCli(args: string[]): Record<string, unknown> {
  const result = spawnSync(process.execPath, ["--import", "tsx", "./packages/cli/src/index.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.trim(), result.stderr);
  return parseJsonObject(result.stdout);
}

function assertCapabilitiesBuildTime(capabilities: unknown): void {
  const server = capabilities && typeof capabilities === "object" ? (capabilities as { server?: unknown }).server : undefined;
  const build = server && typeof server === "object" ? (server as { build?: unknown }).build : undefined;
  const buildTime = build && typeof build === "object" ? (build as { buildTime?: unknown }).buildTime : undefined;
  assert.equal(typeof buildTime, "string");
  assert.ok(!Number.isNaN(Date.parse(buildTime)));
  assert.notEqual(buildTime, "1970-01-01T00:00:00.000Z");
}

function normalizeCapabilitiesForComparison(capabilities: unknown): unknown {
  const normalized = JSON.parse(JSON.stringify(capabilities)) as { server?: { build?: { buildTime?: string } } };
  if (normalized.server?.build) {
    normalized.server.build.buildTime = "<runtime-build-time>";
  }
  return normalized;
}

async function waitForListening(server: NodeServer): Promise<void> {
  if (server.listening) {
    return;
  }
  await once(server, "listening");
}

async function closeNodeServer(server: NodeServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function collectResultFields(value: unknown, fields: Array<{ key?: unknown }> = []): Array<{ key?: unknown }> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectResultFields(item, fields));
    return fields;
  }
  if (!value || typeof value !== "object") {
    return fields;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.key === "string" && Object.hasOwn(record, "value")) {
    fields.push(record);
  }
  Object.values(record).forEach((item) => collectResultFields(item, fields));
  return fields;
}

function collectBlockIds(result: { blocks?: unknown }): string[] {
  return Array.isArray(result.blocks)
    ? result.blocks.map((block) => typeof block === "object" && block ? String((block as { id?: unknown }).id) : "")
    : [];
}

function controllerFieldValues(value: unknown): string[] {
  const field = collectResultFields(value).find((item) => item.key === "controller") as { value?: unknown } | undefined;
  return Array.isArray(field?.value) ? field.value.map(String) : [];
}

function searchItemControllerValues(item: unknown): string[] {
  return controllerFieldValues({ item });
}

const summary = runContractChecks();

assert.equal(summary.checked, 5);
assert.deepEqual(summary.operations, ["part.decode", "part.search", "identifier.decode", "identifier.search", "capabilities"]);

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();
assert.equal(FDNEXT_VERSION, fdnextPackageVersion);
assert.equal(sdkCapabilities.server.version, fdnextPackageVersion);
assert.equal(sdkCapabilities.server.build.commitHash, "dev");
assertCapabilitiesBuildTime(sdkCapabilities);
assert.equal(sdkCapabilities.fdb.version, engine.getVersion());
assert.equal(sdkCapabilities.inventory.controllers.count, sdkCapabilities.inventory.controllers.items.length);
assert.equal(sdkCapabilities.inventory.controllers.defaultGroups, "all");
assert.deepEqual(
  sdkCapabilities.inventory.controllers.groups.map((group) => group.id),
  [...fdnextControllerGroupIds]
);
for (const group of sdkCapabilities.inventory.controllers.groups) {
  assert.equal(group.count, group.items?.length ?? 0, `${group.id} controller group count should match items`);
}
const controllerItems = new Set(sdkCapabilities.inventory.controllers.items);
const allControllerGroup = sdkCapabilities.inventory.controllers.groups.find((group) => group.id === "all");
assert.ok(allControllerGroup, "all controller group should be reported");
assert.equal(allControllerGroup.title, "全部主控");
assert.equal(allControllerGroup.count, controllerItems.size);
assert.deepEqual(allControllerGroup.items, sdkCapabilities.inventory.controllers.items);
const selectedControllerGroup = sdkCapabilities.inventory.controllers.groups.find((group) => group.id === "selected");
assert.ok(selectedControllerGroup, "selected controller group should be reported");
assert.equal(selectedControllerGroup.title, "精选主控");
assert.ok(selectedControllerGroup.items?.includes("CBM2199EE"));
assert.ok(selectedControllerGroup.items?.includes("SM2269XT"));
for (const group of sdkCapabilities.inventory.controllers.groups.filter((item) => item.id !== "all")) {
  for (const controller of group.items ?? []) {
    assert.ok(controllerItems.has(controller), `${group.id} should only include known controllers`);
  }
}
const engCapabilities = engine.getCapabilities({ lang: "eng" });
const engAllControllerGroup = engCapabilities.inventory.controllers.groups.find((group) => group.id === "all");
const engSelectedControllerGroup = engCapabilities.inventory.controllers.groups.find((group) => group.id === "selected");
assert.equal(engAllControllerGroup?.title, "All controllers");
assert.equal(engSelectedControllerGroup?.title, "Selected controllers");
assert.deepEqual(engAllControllerGroup?.items, sdkCapabilities.inventory.controllers.items);
assert.ok(sdkCapabilities.inventory.flashIds.count > 0);
assert.ok(sdkCapabilities.inventory.partNumbers.total >= sdkCapabilities.inventory.partNumbers.fdb);
assert.ok(sdkCapabilities.inventory.micronFbga.total >= sdkCapabilities.inventory.micronFbga.dramLookup);
assert.ok(sdkCapabilities.decoders.partNumber.some((decoder) => decoder.id === "vendor.micron.dram.component.v1"));
assert.ok(sdkCapabilities.decoders.identifier.some((decoder) => decoder.idScheme === "nand.flash_id"));
const micronFbgaCapability = sdkCapabilities.capabilities.find((capability) => capability.name === "marking.lookup.micron.fbga");
assert.deepEqual(
  micronFbgaCapability?.chipKinds,
  ["raw_nand", "dram"],
  "Micron FBGA lookup capability should report DRAM and raw NAND support"
);
const mutatedCapabilities = engine.getCapabilities();
mutatedCapabilities.inventory.controllers.items.splice(0);
mutatedCapabilities.inventory.controllers.groups[0]?.items?.splice(0);
assert.equal(engine.getCapabilities().inventory.controllers.items.length, sdkCapabilities.inventory.controllers.count);
assert.equal(
  engine.getCapabilities().inventory.controllers.groups[0]?.items?.length,
  sdkCapabilities.inventory.controllers.groups[0]?.items?.length
);

function assertNoDuplicatePartSearchItems(query: string): void {
  const result = engine.searchParts({ query, lang: "eng", limit: 50 });
  const seen = new Set<string>();
  for (const item of result.items) {
    const key = `${item.device.vendor.id}\0${item.device.partNumber ?? item.label}\0${item.device.chipKind}`;
    assert.equal(
      seen.has(key),
      false,
      `${query} should not return duplicate FBGA/raw PN items for ${item.device.partNumber ?? item.label}`
    );
    seen.add(key);
  }
}

function assertPartClassification(query: string, chipKind: string, productType?: string): void {
  const result = engine.decodePart({ query, lang: "eng" });
  assert.equal(result.status, "ok", query);
  assert.equal(result.device?.chipKind, chipKind, query);
  if (productType) {
    assert.equal(result.device?.productType, productType, query);
  }
}

assert.ok(resourceModule.embeddedResourceBundle.partIndex.rawNand);
assert.ok(resourceModule.embeddedResourceBundle.identifierIndex.nandFlash);
assert.ok(resourceModule.embeddedResourceBundle.markingIndex.packageMarkings);
assert.ok(resourceModule.embeddedResourceBundle.translationIndex.eng);
assert.equal("embeddedResources" in resourceModule, false);
assert.equal("fdbRaw" in resourceModule, false);

const lang = resourceModule.embeddedResourceBundle.translationIndex;
assert.deepEqual(Object.keys(lang.chs).sort(), Object.keys(lang.eng).sort(), "language packs must have 100% matching keys");
const requiredTranslationKeys = new Set([
  ...fdnextFieldKeys,
  ...fdnextChipKinds,
  ...fdnextProductTypes,
  ...fdnextIdSchemes,
  ...fdnextDomains,
  "true",
  "false",
  "Unknown",
  ...fdnextBlockIds.map((id) => `block.${id}`),
  "action.part.decode",
  "action.identifier.decode.nand_flash_id",
  "warning.empty_query",
  "warning.invalid_nand_flash_id",
  "warning.invalid_nand_flash_id.search",
  "warning.unsupported_id_scheme",
  "warning.constraint_mismatch.vendor",
  "warning.constraint_mismatch.chip_kind",
  "warning.constraint_mismatch.product_type",
  "warning.constraint_mismatch.strict",
  "warning.ambiguous_part",
  "subtitle.kind.raw_nand",
  "subtitle.kind.managed_nand",
  "subtitle.kind.dram",
  "subtitle.kind.memory",
  "subtitle.die_count",
  "subtitle.plane_count"
]);
assert.deepEqual(
  [...requiredTranslationKeys].filter((key) => !(key in lang.eng) || !(key in lang.chs)).sort(),
  [],
  "translation packs must cover every current public result key"
);
const obsoleteTranslationKeys = [
  "design_rev",
  "features",
  "intel_unsupported_3d_xpoint",
  "micron_f_e",
  "micron_f_m",
  "micron_f_r",
  "micron_f_s",
  "micron_f_t",
  "micron_f_x",
  "micron_f_z",
  "micron_otr_aat",
  "micron_otr_ait",
  "micron_otr_c",
  "micron_otr_it",
  "micron_otr_wt",
  "micron_p_es",
  "micron_p_ms",
  "micron_p_qs",
  "samsung_cbb_c",
  "spare_area_size_per_512b",
  "spectek_if_e",
  "spectek_if_f",
  "spectek_if_g",
  "spectek_if_m",
  "spectek_if_n",
  "special_options"
];
assert.deepEqual(
  obsoleteTranslationKeys.filter((key) => key in lang.eng || key in lang.chs),
  [],
  "obsolete translation keys must stay removed"
);

assertPartClassification("MT29F4G08ABAEA", "raw_nand");
assertPartClassification("AFND1208S1", "raw_nand");
assertPartClassification("HY33DS1G800CT1", "raw_nand");
assertPartClassification("MT29FBG08ABACA", "raw_nand");
assertPartClassification("MTFC8GAKAJCN-4M", "managed_nand", "emmc");
assertPartClassification("KLUEG8UHDC-B0E1", "managed_nand", "ufs");
assertPartClassification("BWCA2KZC-64G", "managed_nand", "emcp");
assertPartClassification("H9QT0GECN6X145", "managed_nand", "umcp");
assertPartClassification("MT62F1G64D4EK-023 WT:B", "dram", "lpddr5x");
const mtfcSearch = engine.searchParts({ query: "MTFC", lang: "eng", limit: 20 });
assert.ok(mtfcSearch.items.some((item) => item.device.productType === "emmc"), "MTFC search should include eMMC candidates");
assert.ok(
  engine.searchParts({ query: "MTFC", lang: "eng", limit: 20, constraints: { productType: "ufs" } }).items
    .some((item) => item.device.productType === "ufs"),
  "MTFC search with UFS constraint should include UFS candidates"
);
for (const query of ["MT29F", "NW8", "CT40", "C9B", "MT29F128G08AECABH6-6:A", "CT40A1G8SA-62M:E"]) {
  assertNoDuplicatePartSearchItems(query);
}
const mt29fbSearch = engine.searchParts({ query: "MT29FB", lang: "eng", limit: 10 });
assert.ok(mt29fbSearch.items.length > 0, "MT29FB search should return raw NAND candidates");
assert.ok(mt29fbSearch.items.every((item) => item.device.chipKind === "raw_nand"), "MT29FB search candidates should use raw NAND chip kind");
const mt29fbMarkingSearch = engine.searchParts({ query: "NC103", lang: "eng", limit: 10 });
assert.deepEqual(
  mt29fbMarkingSearch.items.map((item) => item.device.chipKind),
  ["raw_nand"],
  "Micron MT29FB FBGA marking search should surface raw_nand"
);

const inferredIdentifier = engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" });
assert.equal(inferredIdentifier.status, "ok");
assert.equal(inferredIdentifier.input.constraints.idScheme, "nand.flash_id");
assert.equal(inferredIdentifier.device?.idScheme, "nand.flash_id");
assert.ok(inferredIdentifier.subtitle?.includes("Micron"));
assert.ok(!collectBlockIds(inferredIdentifier).includes("identity"));
assert.ok(!collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "vendor" || field.key === "identifier" || field.key === "id_scheme"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "geometry"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "timing"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "controllers"));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "blocks_per_lun")));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "timing_mode_async")));
assert.ok(collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "revision"));
assert.ok(collectResultFields(inferredIdentifier.blocks).some((field) => field.key === "enterprise"));
assert.ok(inferredIdentifier.relations.some((relation) => relation.kind === "identifier_for" && relation.source?.idScheme === "nand.flash_id"));
assert.ok(inferredIdentifier.relations.some((relation) => relation.action?.operation === "part.decode" && relation.action.input.query));
assert.ok(!inferredIdentifier.relations.some((relation) => /\s/.test(String(relation.target.partNumber ?? ""))));
assert.ok(!inferredIdentifier.relations.some((relation) => /\s/.test(String(relation.action?.input.query ?? ""))));
const micronIdentifierRelation = inferredIdentifier.relations.find((relation) => relation.target.partNumber === "MT29F64G08CBABA");
assert.ok(micronIdentifierRelation);
assert.equal(micronIdentifierRelation.action?.input.query, "MT29F64G08CBABA");
assert.equal(micronIdentifierRelation.action?.input.constraints?.vendor, "micron");
assert.equal(micronIdentifierRelation.action?.input.constraints?.chipKind, "raw_nand");

const skhynixIdentifier = engine.decodeIdentifier({ query: "AD0000000000", lang: "eng" });
assert.equal(skhynixIdentifier.status, "ok");
for (const key of ["redundant_area_size", "simultaneously_programmed_pages", "interface_type", "ecc_level", "edo", "interleave", "cache"] as const) {
  assert.ok(collectResultFields(skhynixIdentifier.blocks).some((field) => field.key === key), `NAND Flash ID decode should expose ${key}`);
}

const inferredIdentifierSearch = engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2 });
assert.equal(inferredIdentifierSearch.status, "ok");
assert.equal(inferredIdentifierSearch.input.constraints.idScheme, "nand.flash_id");
assert.ok(inferredIdentifierSearch.items.every((item) => item.device.idScheme === "nand.flash_id"));
assert.ok(inferredIdentifierSearch.items.every((item) =>
  (item.relations ?? []).every((relation) =>
    !/\s/.test(String(relation.target.partNumber ?? "")) &&
    !/\s/.test(String(relation.action?.input.query ?? ""))
  )
));
const micronIdentifierSearch = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10 });
assert.ok(micronIdentifierSearch.items.every((item) => item.device.vendor.id !== "unknown"), "identifier search should expose inferred vendors");
const richIdentifierHit = micronIdentifierSearch.items.find((item) => item.label === "2C84643CA500");
assert.ok(richIdentifierHit);
const richIdentifierController = richIdentifierHit.fields?.find((field) => field.key === "controller");
assert.ok(Array.isArray(richIdentifierController?.value), "identifier search should expose controller lists");
assert.ok((richIdentifierController.value as unknown[]).includes("JMF608"));
assert.ok((richIdentifierController.value as unknown[]).includes("SM3270AC"));
const sataIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:sata" }).items
  .find((item) => item.label === "2C84643CA500");
assert.deepEqual(searchItemControllerValues(sataIdentifierHit), ["SM2244LT", "SM2246EN", "SM2246XT", "YS9083XT"]);
const unionIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: ["if:sata", "if:usb20"] }).items
  .find((item) => item.label === "2C84643CA500");
const unionIdentifierControllers = searchItemControllerValues(unionIdentifierHit);
assert.ok(!unionIdentifierControllers.includes("JMF608"));
assert.ok(unionIdentifierControllers.includes("SM2246EN"));
assert.ok(unionIdentifierControllers.includes("SM3270AC"));
const nvmeIdentifierHit = engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:nvme" }).items
  .find((item) => item.label === "2C84643CA500");
assert.deepEqual(searchItemControllerValues(nvmeIdentifierHit), []);
assert.equal(engine.searchIdentifiers({ query: "2C8464", lang: "eng", limit: 10, controllerGroup: "if:nvme" }).status, "ok");
const partSearchControllerHit = engine.searchParts({ query: "MT29F512G08CMCAB", lang: "eng", limit: 5, controllerGroup: "if:usb20" }).items
  .find((item) => item.device.partNumber === "MT29F512G08CMCAB");
assert.ok(searchItemControllerValues(partSearchControllerHit).includes("SM3270AC"));

assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "dram", strict: true } }).status,
  "ok"
);
const rejected = engine.decodePart({
  query: "MT62F1G64D4EK-023 WT:B",
  lang: "eng",
  constraints: { chipKind: "managed_nand", strict: true }
});
assert.equal(rejected.status, "not_found");
assert.ok(rejected.warnings.some((warning) => warning.code === "constraint_mismatch"));
const rejectedChs = engine.decodePart({
  query: "MT62F1G64D4EK-023 WT:B",
  lang: "chs",
  constraints: { chipKind: "managed_nand", strict: true }
});
assert.ok(rejectedChs.warnings.some((warning) => warning.message.includes("strict 约束")));
assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "managed_nand" } }).device?.chipKind,
  "managed_nand"
);

const marking = engine.searchParts({ query: "C9BJZ", lang: "eng", limit: 5 });
const markingItem = marking.items.find((item) => item.device.markingCode === "C9BJZ" && item.device.partNumber === "CT40A1G8SA-62M:E");
assert.ok(markingItem, "Micron FBGA marking search should return a structured part candidate");
assert.equal(markingItem.device.chipKind, "dram");
assert.equal(markingItem.device.markingCode, "C9BJZ");
assert.ok(!markingItem.fields?.some((field) => field.key === "marking_code"));
const markingRelation = marking.relations?.find((relation) => relation.kind === "marking_for" && relation.source?.markingCode === "C9BJZ");
assert.ok(markingRelation);
assert.ok(markingRelation.action);
assert.equal(markingRelation.action.operation, "part.decode");
assert.equal(markingRelation.action.input.constraints?.chipKind, "dram");

const markingDecode = engine.decodePart({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecode.status, "ok");
assert.equal(markingDecode.device?.partNumber, "CT40A1G8SA-62M:E");
assert.equal(markingDecode.device?.markingCode, "C9BJZ");
assert.ok(!collectResultFields(markingDecode.blocks).some((field) => field.key === "marking_code"));
assert.ok(!markingDecode.relations.some((relation) => relation.kind === "marking_for"), "FBGA decode results should not repeat device marking identity as a relation");

for (const [markingCode, firstPartNumber] of [
  ["PF232", "FBMM60A21K1BAAH4"],
  ["PFA02", "FBMM58A1GL1BAAH4"],
  ["PFF01", "FBML74ANAKDMAAK3"]
] as const) {
  const spectekMarkingDecode = engine.decodePart({ query: markingCode, lang: "eng" });
  assert.equal(spectekMarkingDecode.status, "ok");
  assert.equal(spectekMarkingDecode.device?.partNumber, firstPartNumber);
  assert.equal(spectekMarkingDecode.device?.markingCode, markingCode);
  assert.ok(spectekMarkingDecode.blocks.length > 0);
  assert.ok((spectekMarkingDecode.candidates?.length ?? 0) >= 2);
  assert.ok(!collectResultFields(spectekMarkingDecode.blocks).some((field) => field.key === "marking_code"));
  assert.ok(!spectekMarkingDecode.warnings.some((warning) => warning.code === "ambiguous_part"));
}

const markingDecodeAsIdentifier = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecodeAsIdentifier.status, "invalid_input");
assert.ok(markingDecodeAsIdentifier.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingDecodeAsNandFlashId = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng", idScheme: "nand.flash_id" });
assert.equal(markingDecodeAsNandFlashId.status, "invalid_input");
assert.ok(markingDecodeAsNandFlashId.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifier = engine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
assert.equal(markingSearchAsIdentifier.status, "invalid_input");
assert.ok(markingSearchAsIdentifier.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifierChs = engine.searchIdentifiers({ query: "C9BJZ", lang: "chs" });
assert.ok(markingSearchAsIdentifierChs.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));

const dramDecode = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" });
assert.equal(dramDecode.subtitle, "LPDDR5X · Micron · 64Gb · x64");
assert.ok(collectResultFields(dramDecode.blocks).some((field) => (
  field.key === "dram_density" &&
  (field as { unit?: unknown }).unit === "Mbit" &&
  (field as { display?: unknown }).display === "64Gb"
)));
assert.ok(!collectBlockIds(dramDecode).includes("identity"));
assert.ok(!collectResultFields(dramDecode.blocks).some((field) => field.key === "vendor" || field.key === "part_number" || field.key === "chip_kind" || field.key === "product_type"));
assert.ok(!dramDecode.relations.some((relation) => relation.kind === "identifier_for"));
assert.equal("actions" in dramDecode, false);
const dramDecodeChs = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "chs" });
assert.ok(dramDecodeChs.blocks.some((block) => block.id === "geometry" && block.label === "几何信息"));
assert.ok(dramDecodeChs.blocks.some((block) => block.id === "package" && block.label === "封装"));
assert.ok(collectResultFields(dramDecodeChs.blocks).some((field) => field.key === "operation_temperature" && (field as { display?: string }).display === "无线温度范围 (-25°C ~ 85°C)"));
assert.ok(!collectResultFields(dramDecodeChs).some((field) => field.key === "special_options"));
const nandDecode = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
assert.ok(nandDecode.subtitle?.startsWith("NAND Flash · Micron · 8GB MLC"));
assert.ok(collectResultFields(nandDecode.blocks).some((field) => (
  field.key === "density" &&
  (field as { unit?: unknown }).unit === "Mbit" &&
  (field as { display?: unknown }).display === "8GB"
)));
const micron2dNandDecode = engine.decodePart({ query: "MT29F4G08ABAEA", lang: "eng" });
assert.equal(micron2dNandDecode.subtitle, "NAND Flash · Micron · 512MB SLC · M70M");
assert.ok(collectResultFields(micron2dNandDecode.blocks).some((field) => field.key === "die_codename" && field.value === "25nm"));
assert.ok(collectResultFields(micron2dNandDecode.blocks).some((field) => field.key === "process_alias" && field.value === "M70M"));
const intelPlainNandDecode = engine.decodePart({ query: "29F512G08EBHAF", lang: "eng" });
assert.equal(intelPlainNandDecode.device?.vendor.id, "intel");
for (const key of ["ce_count", "rb_count", "channel_count"] as const) {
  assert.ok(collectResultFields(nandDecode.blocks).some((field) => field.key === key && field.value === 1), `NAND decode should expose ${key}`);
}
const micronFbgaNandDecode = engine.decodePart({ query: "NW711", lang: "eng" });
const micronFbgaController = collectResultFields(micronFbgaNandDecode.blocks).find((field) => field.key === "controller");
assert.ok(Array.isArray((micronFbgaController as { value?: unknown }).value), "NAND decode should expose all supported controllers as a list");
assert.ok(((micronFbgaController as { value: unknown[] }).value).includes("SM3270AC"));
const nandIdentifierRelations = nandDecode.relations.filter((relation) => relation.kind === "identifier_for" && relation.target.idScheme === "nand.flash_id");
assert.ok(nandIdentifierRelations.length > 1);
assert.ok(nandIdentifierRelations.every((relation) => (
  relation.action?.operation === "identifier.decode" &&
  relation.action.input.constraints?.idScheme === "nand.flash_id" &&
  relation.action.input.query === relation.target.identifier &&
  /^[0-9A-F]+$/.test(relation.action.input.query)
)));

const ambiguousEngine = createEngine({
  resources: {
    partIndex: {
      rawNand: {},
      managedNand: [{ vendor: "micron", pn: "TESTPART" }],
      dram: [{ vendor: "micron", pn: "TESTPART" }]
    },
    identifierIndex: {
      nandFlash: {}
    },
    markingIndex: {
      packageMarkings: {}
    },
    vendorIndex: {},
    translationIndex: {}
  },
  decoders: [{
    id: "test-dram",
    priority: 100,
    check: (partNumber) => partNumber === "TESTPART",
    decode: (partNumber) => ({
      device: {
        domain: "memory",
        chipKind: "dram",
        vendor: "micron",
        partNumber
      },
      fields: {
        dram_type: "DRAM",
        dram_density: 1024
      }
    })
  }]
});
const ambiguous = ambiguousEngine.decodePart({ query: "TESTPART", lang: "eng" });
assert.equal(ambiguous.status, "ambiguous");
assert.ok((ambiguous.candidates?.length ?? 0) >= 2);
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "dram"));
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "managed_nand"));

const hookEvents: string[] = [];
const hookEngine = createEngine({
  resources: {
    partIndex: { rawNand: {}, managedNand: [], dram: [] },
    identifierIndex: { nandFlash: {} },
    markingIndex: { packageMarkings: {} },
    vendorIndex: {},
    translationIndex: {}
  },
  processors: [{
    beforeOperation: (context) => {
      hookEvents.push(`before:${context.operation}`);
    },
    afterOperation: (context, result) => {
      hookEvents.push(`after:${context.operation}`);
      return result;
    }
  }]
});
hookEngine.decodePart({ query: "", lang: "eng" });
hookEngine.searchParts({ query: "TEST", lang: "eng" });
hookEngine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
hookEngine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
hookEngine.getCapabilities();
assert.deepEqual(hookEvents, [
  "before:part.decode",
  "after:part.decode",
  "before:part.search",
  "after:part.search",
  "before:identifier.decode",
  "after:identifier.decode",
  "before:identifier.search",
  "after:identifier.search",
  "before:capabilities",
  "after:capabilities"
]);
const removedHookNames = ["search" + "Pn", "decode" + "Id", "summary" + "Id"];
assert.ok(!hookEvents.some((event) => removedHookNames.some((name) => event.includes(name))));

const cliPartDecode = runCli(["part", "decode", "MT62F1G64D4EK-023", "eng"]);
assert.equal(cliPartDecode.operation, "part.decode");
assert.equal((cliPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const cliIdentifierDecode = runCli(["id", "decode", "2C64444BA900", "eng", "nand.flash_id"]);
assert.equal(cliIdentifierDecode.operation, "identifier.decode");
assert.equal((cliIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const cliGroupedIdentifierSearch = runCli(["id", "search", "2C8464", "eng", "10", "nand.flash_id", "--controller-group", "if:sata", "--controller-group", "if:nvme"]);
assert.equal(cliGroupedIdentifierSearch.operation, "identifier.search");
assert.deepEqual(
  ((cliGroupedIdentifierSearch.input as { controllerGroup?: unknown } | undefined)?.controllerGroup),
  ["if:sata", "if:nvme"]
);
const cliCapabilities = runCli(["capabilities"]);
assert.equal(cliCapabilities.schemaVersion, "fdnext.capabilities.v2");
assertCapabilitiesBuildTime(cliCapabilities);
assert.deepEqual(normalizeCapabilitiesForComparison(cliCapabilities), normalizeCapabilitiesForComparison(sdkCapabilities));
const cliEngCapabilities = runCli(["capabilities", "eng"]);
assert.equal((cliEngCapabilities.inventory as typeof sdkCapabilities.inventory).controllers.groups[0]?.title, "All controllers");

const http = createHttpServer({ host: "127.0.0.1", port: 8080 });
async function injectJson(method: "GET" | "POST", url: string): Promise<Record<string, unknown>> {
  const response = await http.server.inject({ method, url });
  assert.equal(response.statusCode, 200, response.payload);
  return parseJsonObject(response.payload);
}
const httpIndex = await injectJson("GET", "/");
assert.equal(httpIndex.status, "ok");
assert.equal(httpIndex.name, "fdnext-server");
assert.equal(httpIndex.version, fdnextPackageVersion);
const httpPartDecode = await injectJson("GET", "/parts/decode?query=MT62F1G64D4EK-023&lang=eng");
assert.equal(httpPartDecode.operation, "part.decode");
assert.equal((httpPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const httpPartSearch = await injectJson("GET", "/parts/search?query=MTFC&lang=eng&limit=3&productType=ufs");
assert.equal(httpPartSearch.operation, "part.search");
assert.ok(Array.isArray(httpPartSearch.items));
const httpIdentifierDecode = await injectJson("GET", "/identifiers/decode?query=2C64444BA900&lang=eng");
assert.equal(httpIdentifierDecode.operation, "identifier.decode");
assert.equal((httpIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const httpIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C64&lang=eng&limit=3");
assert.equal(httpIdentifierSearch.operation, "identifier.search");
assert.ok(Array.isArray(httpIdentifierSearch.items));
const httpGroupedIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C8464&lang=eng&limit=10&controllerGroup=if:sata,if:nvme");
assert.equal(httpGroupedIdentifierSearch.operation, "identifier.search");
const httpRepeatedGroupedIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C8464&lang=eng&limit=10&controllerGroup=if:sata&controllerGroup=if:nvme");
assert.deepEqual(httpRepeatedGroupedIdentifierSearch, httpGroupedIdentifierSearch);
const httpCapabilities = await injectJson("GET", "/capabilities");
assert.equal(httpCapabilities.schemaVersion, "fdnext.capabilities.v2");
assertCapabilitiesBuildTime(httpCapabilities);
assert.deepEqual(normalizeCapabilitiesForComparison(httpCapabilities), normalizeCapabilitiesForComparison(sdkCapabilities));
const httpEngCapabilities = await injectJson("GET", "/capabilities?lang=eng");
assert.equal((httpEngCapabilities.inventory as typeof sdkCapabilities.inventory).controllers.groups[0]?.title, "All controllers");
const removedPostEndpoint = await injectJson("POST", "/parts/decode");
assert.equal(removedPostEndpoint.status, "not_found");
for (const removedEndpoint of [
  "/health",
  "/info",
  "/decode?pn=MT29F64G08CBABA",
  "/summary?pn=MT29F64G08CBABA",
  "/searchPn?pn=MT29",
  "/decodeId?id=2C64444BA900",
  "/summaryId?id=2C64444BA900",
  "/searchId?id=2C64"
]) {
  const removed = await injectJson("GET", removedEndpoint);
  assert.equal(removed.status, "not_found", `${removedEndpoint} should not be exposed`);
}
await http.server.stop();

const cfWorker = createCfWorkersAdapter();
const cfCorsResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=MT29", {
    headers: { origin: "https://app.example" }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "https://app.example,https://admin.example" }
);
assert.equal(cfCorsResponse.headers.get("access-control-allow-origin"), "https://app.example");
assert.equal(cfCorsResponse.headers.get("vary"), "Origin");
const cfDeniedCorsResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=MT29", {
    headers: { origin: "https://blocked.example" }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "https://app.example,https://admin.example" }
);
assert.equal(cfDeniedCorsResponse.headers.get("access-control-allow-origin"), null);
const cfPreflightResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search", {
    method: "OPTIONS",
    headers: {
      origin: "https://any.example",
      "access-control-request-method": "GET",
      "access-control-request-headers": "x-fdnext-client"
    }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "*" }
);
assert.equal(cfPreflightResponse.status, 204);
assert.equal(cfPreflightResponse.headers.get("access-control-allow-origin"), "*");
assert.equal(cfPreflightResponse.headers.get("access-control-allow-methods"), "GET, HEAD, OPTIONS");
assert.equal(cfPreflightResponse.headers.get("access-control-allow-headers"), "x-fdnext-client");
assert.equal(await cfPreflightResponse.text(), "");

const previousCorsOrigins = process.env[FDNEXT_CORS_ORIGINS_ENV];
process.env[FDNEXT_CORS_ORIGINS_ENV] = "https://fc.example https://admin.example";
const aliyunCorsServer = startAliyunFc({ host: "127.0.0.1", port: 0 });
try {
  await waitForListening(aliyunCorsServer);
  const address = aliyunCorsServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const aliyunCorsResponse = await fetch(`${baseUrl}/`, {
    headers: { origin: "https://admin.example" }
  });
  assert.equal(aliyunCorsResponse.headers.get("access-control-allow-origin"), "https://admin.example");
  assert.equal(aliyunCorsResponse.headers.get("vary"), "Origin");
  const aliyunPreflightResponse = await fetch(`${baseUrl}/parts/search`, {
    method: "OPTIONS",
    headers: {
      origin: "https://fc.example",
      "access-control-request-method": "GET",
      "access-control-request-headers": "x-fdnext-client"
    }
  });
  assert.equal(aliyunPreflightResponse.status, 204);
  assert.equal(aliyunPreflightResponse.headers.get("access-control-allow-origin"), "https://fc.example");
  assert.equal(aliyunPreflightResponse.headers.get("access-control-allow-headers"), "x-fdnext-client");
  assert.equal(await aliyunPreflightResponse.text(), "");
} finally {
  await closeNodeServer(aliyunCorsServer);
  if (previousCorsOrigins === undefined) {
    delete process.env[FDNEXT_CORS_ORIGINS_ENV];
  } else {
    process.env[FDNEXT_CORS_ORIGINS_ENV] = previousCorsOrigins;
  }
}

process.stdout.write(`Contract confirmed: ${summary.checked} fixtures\n`);
