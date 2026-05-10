import { UNKNOWN } from "./constants";
import {
  asRecord,
  inferChipKindFromInfo,
  inferProductTypeFromInfo,
  isKnownInfoValue,
  normalizeInfoText
} from "./device-inference";
import { createFdnextFieldValue, fdnextFieldRegistry, type FdnextFieldKey } from "./field-registry";
import { getFdnextFieldProfile } from "./field-profiles";
import {
  FDNEXT_CAPABILITIES_SCHEMA_VERSION,
  FDNEXT_RESULT_SCHEMA_VERSION,
  type Action,
  type Candidate,
  type Capability,
  type DeviceIdentity,
  type FieldValue,
  type FdnextCapabilities,
  type FdnextChipKind,
  type FdnextFieldValueData,
  type FdnextOperation,
  type FdnextProductType,
  type IdentifierDecodeResult,
  type IdentifierSearchResult,
  type NormalizedOperationInput,
  type OperationConstraints,
  type PartDecodeResult,
  type PartSearchResult,
  type Relation,
  type ResultBlock,
  type ResultWarning,
  type SearchResultItem,
  type VendorIdentity
} from "./result";
import type { InternalIdentifierInfo, FlashIdRecord, InternalPartInfo, LangPacks } from "./types";
import { normalizeFlashId } from "./utils/normalize";

export interface ResultBuilderContext {
  langPacks: LangPacks;
  fallbackLang: string;
  translateString(key: string, lang?: string | null): string;
}

export interface PartSearchSuggestion {
  vendor: string;
  partNumber: string;
  chipKind?: FdnextChipKind;
  productType?: FdnextProductType;
  markingCode?: string;
  rawDensity?: number;
  badges?: string[];
  warnings?: ResultWarning[];
}

function slug(value: unknown): string {
  return normalizeInfoText(value).replaceAll(" ", "_");
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return undefined;
}

function fdnextMetadata(info: InternalPartInfo): Record<string, unknown> {
  return asRecord((info as Record<string, unknown>).__fdnext);
}

function translateLabel(ctx: ResultBuilderContext, key: string, lang?: string | null): string {
  const translated = ctx.translateString(key, lang);
  return translated && translated !== key ? translated : fdnextFieldRegistry[key as FdnextFieldKey]?.defaultLabel ?? key;
}

function translateDisplay(ctx: ResultBuilderContext, value: unknown, lang?: string | null): string | undefined {
  if (typeof value === "boolean") {
    return ctx.translateString(String(value), lang);
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const translated = ctx.translateString(value, lang);
  return translated !== value ? translated : undefined;
}

function translateText(ctx: ResultBuilderContext, key: string, fallback: string, lang?: string | null): string {
  const translated = ctx.translateString(key, lang);
  return translated && translated !== key ? translated : fallback;
}

function translateTemplate(
  ctx: ResultBuilderContext,
  key: string,
  fallback: string,
  params: Record<string, string>,
  lang?: string | null
): string {
  const template = translateText(ctx, key, fallback, lang);
  return template.replaceAll(/\{([a-zA-Z0-9_]+)\}/g, (_, param: string) => params[param] ?? "");
}

function productTypeDisplay(value: unknown, ctx: ResultBuilderContext, lang?: string | null): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const translated = ctx.translateString(value, lang);
  if (translated && translated !== value) {
    return translated;
  }
  const normalized = value.replaceAll(/[^a-zA-Z0-9]+/g, "");
  return normalized ? normalized.toUpperCase() : undefined;
}

function createField(
  key: FdnextFieldKey,
  value: FdnextFieldValueData,
  ctx: ResultBuilderContext,
  lang?: string | null,
  options: Partial<Omit<FieldValue, "key" | "value">> = {}
): FieldValue {
  return createFdnextFieldValue(key, value, {
    label: translateLabel(ctx, key, lang),
    display: options.display ?? translateDisplay(ctx, value, lang),
    ...options
  });
}

function createEmittedField(value: unknown, ctx: ResultBuilderContext, lang?: string | null): FieldValue | undefined {
  const record = asRecord(value);
  const key = typeof record.key === "string" ? record.key : "";
  if (!Object.hasOwn(fdnextFieldRegistry, key) || !isKnownInfoValue(record.value)) {
    return undefined;
  }
  return createField(key as FdnextFieldKey, record.value as FdnextFieldValueData, ctx, lang, {
    ...(typeof record.unit === "string" ? { unit: record.unit } : {}),
    ...(typeof record.display === "string" ? { display: record.display } : {}),
    ...(record.importance === "primary" || record.importance === "secondary" || record.importance === "detail"
      ? { importance: record.importance }
      : {})
  });
}

function vendorIdentity(vendor: unknown, ctx: ResultBuilderContext, lang?: string | null): VendorIdentity {
  const id = typeof vendor === "string" && vendor.trim() ? vendor.trim() : "unknown";
  const translated = ctx.translateString(id, lang);
  return {
    id,
    name: translated && translated !== id ? translated : id
  };
}

function deviceIdentityFromPart(
  info: InternalPartInfo,
  constraints: OperationConstraints,
  ctx: ResultBuilderContext,
  lang?: string | null
): DeviceIdentity {
  const metadata = fdnextMetadata(info);
  const metadataDomain = metadata.domain === "memory" || metadata.domain === "power" || metadata.domain === "controller" || metadata.domain === "unknown"
    ? metadata.domain
    : "memory";
  const metadataChipKind = typeof metadata.chipKind === "string" ? metadata.chipKind as FdnextChipKind : undefined;
  const metadataProductType = typeof metadata.productType === "string" ? metadata.productType as FdnextProductType : undefined;
  const chipKind = constraints.chipKind ?? metadataChipKind ?? inferChipKindFromInfo(info, constraints);
  const productType = constraints.productType ?? metadataProductType ?? inferProductTypeFromInfo(info);
  return {
    domain: metadataDomain,
    chipKind,
    ...(productType ? { productType } : {}),
    partNumber: info.partNumber,
    ...(typeof info.fields === "object" && !Array.isArray(info.fields) && typeof info.fields.marking_code === "string"
      ? { markingCode: info.fields.marking_code }
      : {}),
    vendor: vendorIdentity(info.vendor, ctx, lang)
  };
}

function addField(fields: Map<FdnextFieldKey, FieldValue>, field: FieldValue | undefined): void {
  if (!field || fields.has(field.key as FdnextFieldKey)) {
    return;
  }
  fields.set(field.key as FdnextFieldKey, field);
}

function fieldMapFromPart(info: InternalPartInfo, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("chip_kind", device.chipKind, ctx, lang));
  if (device.productType) {
    addField(fields, createField("product_type", device.productType, ctx, lang));
  }
  addField(fields, createField("part_number", info.partNumber, ctx, lang));
  if (device.chipKind === "dram" && isKnownInfoValue(info.type)) {
    addField(fields, createField("dram_type", String(info.type), ctx, lang));
  }

  const density = asNumber(info.density);
  if (density) {
    addField(fields, createField(device.chipKind === "dram" ? "dram_density" : "density", density, ctx, lang));
  }
  if (typeof info.cellLevel === "number") {
    const cellLevels: Record<number, string> = { 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" };
    addField(fields, createField("cell_level", cellLevels[info.cellLevel] ?? String(info.cellLevel), ctx, lang));
  } else if (isKnownInfoValue(info.cellLevel)) {
    addField(fields, createField("cell_level", String(info.cellLevel), ctx, lang));
  }
  const deviceWidth = asNumber(info.deviceWidth);
  if (deviceWidth) {
    addField(fields, createField(device.chipKind === "dram" ? "dram_width" : "device_width", deviceWidth, ctx, lang));
  }
  if (isKnownInfoValue(info.processNode)) addField(fields, createField("process_node", String(info.processNode), ctx, lang));
  if (isKnownInfoValue(info.voltage)) addField(fields, createField(device.chipKind === "dram" ? "dram_voltage" : "voltage", String(info.voltage), ctx, lang));
  if (isKnownInfoValue(info.package)) addField(fields, createField("package", String(info.package), ctx, lang));
  if (isKnownInfoValue(info.generation)) addField(fields, createField("generation_info", String(info.generation), ctx, lang));

  const classification = asRecord(info.classification);
  if (device.chipKind === "raw_nand" || device.chipKind === "on_die_ecc_nand") {
    const topologyFields: Array<[string, FdnextFieldKey]> = [
      ["die", "die_count"],
      ["ce", "ce_count"],
      ["rb", "rb_count"],
      ["ch", "channel_count"]
    ];
    for (const [sourceKey, fieldKey] of topologyFields) {
      const value = positiveNumber(classification[sourceKey]);
      if (value) {
        addField(fields, createField(fieldKey, value, ctx, lang));
      }
    }
  }

  const extra = asRecord(info.fields);
  for (const [key, value] of Object.entries(extra)) {
    if (!Object.hasOwn(fdnextFieldRegistry, key) || !isKnownInfoValue(value)) {
      continue;
    }
    const fieldKey = key as FdnextFieldKey;
    if (fieldKey === "group" && device.chipKind === "raw_nand" && normalizeInfoText(value) === "raw nand") {
      continue;
    }
    let fieldValue: FdnextFieldValueData = value as FdnextFieldValueData;
    if (fieldKey === "component_width" || fieldKey === "dram_width") {
      const parsed = typeof value === "string" ? Number.parseInt(value.replace(/^x/i, ""), 10) : Number(value);
      if (Number.isFinite(parsed)) {
        fieldValue = parsed;
      }
    }
    fields.set(fieldKey, createField(fieldKey, fieldValue, ctx, lang));
  }

  for (const controller of info.controller ?? []) {
    if (isKnownInfoValue(controller)) {
      addField(fields, createField("controller", controller, ctx, lang));
      break;
    }
  }

  const emittedFields = fdnextMetadata(info).fields;
  if (Array.isArray(emittedFields)) {
    for (const item of emittedFields) {
      const field = createEmittedField(item, ctx, lang);
      if (field) {
        fields.set(field.key as FdnextFieldKey, field);
      }
    }
  }

  return fields;
}

const deviceIdentityFieldKeys = new Set<FdnextFieldKey>([
  "vendor",
  "chip_kind",
  "product_type",
  "part_number",
  "identifier",
  "id_scheme",
  "marking_code"
]);

function detailFields(fields: Map<FdnextFieldKey, FieldValue>): Map<FdnextFieldKey, FieldValue> {
  const out = new Map<FdnextFieldKey, FieldValue>();
  for (const [key, field] of fields) {
    if (!deviceIdentityFieldKeys.has(key)) {
      out.set(key, field);
    }
  }
  return out;
}

function buildBlocks(
  profileId: FdnextChipKind | "nand.flash_id",
  fields: Map<FdnextFieldKey, FieldValue>,
  ctx: ResultBuilderContext,
  lang?: string | null
): ResultBlock[] {
  const profile = getFdnextFieldProfile(profileId);
  const blocks: ResultBlock[] = [];
  const emitted = new Set<FdnextFieldKey>();

  for (const block of profile.blocks) {
    const blockFields = block.fields
      .map((key) => fields.get(key))
      .filter((field): field is FieldValue => Boolean(field && !emitted.has(field.key as FdnextFieldKey)));
    if (blockFields.length === 0) {
      continue;
    }
    blockFields.forEach((field) => emitted.add(field.key as FdnextFieldKey));
    blocks.push({
      id: block.id,
      label: translateText(ctx, `block.${block.id}`, block.label, lang),
      importance: block.importance,
      fields: blockFields
    });
  }

  const remaining = [...fields.values()].filter((field) => !emitted.has(field.key as FdnextFieldKey));
  if (remaining.length > 0) {
    blocks.push({
      id: "additional",
      label: translateText(ctx, "block.additional", "Additional Fields", lang),
      importance: "detail",
      fields: remaining
    });
  }
  return blocks;
}

function displayField(fields: Map<FdnextFieldKey, FieldValue>, key: FdnextFieldKey): string | undefined {
  const field = fields.get(key);
  if (!field) {
    return undefined;
  }
  if (field.display) {
    return field.display;
  }
  if (typeof field.value === "string" || typeof field.value === "number" || typeof field.value === "boolean") {
    return String(field.value);
  }
  return undefined;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function byteDisplayField(fields: Map<FdnextFieldKey, FieldValue>, key: FdnextFieldKey): string | undefined {
  const field = fields.get(key);
  if (!field || field.unit !== "Mbit" || typeof field.value !== "number" || !Number.isFinite(field.value) || field.value <= 0) {
    return displayField(fields, key);
  }

  const units = ["MB", "GB", "TB"] as const;
  let numeric = field.value / 8;
  let index = 0;
  while (numeric >= 1024 && units[index + 1]) {
    numeric /= 1024;
    index += 1;
  }
  return `${numeric}${units[index]}`;
}

function joinCompact(...values: Array<string | undefined>): string | undefined {
  const parts = values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function subtitleKind(device: DeviceIdentity, fields: Map<FdnextFieldKey, FieldValue>, ctx: ResultBuilderContext, lang?: string | null): string {
  if (device.chipKind === "raw_nand") {
    return translateText(ctx, "subtitle.kind.raw_nand", "NAND Flash", lang);
  }
  if (device.chipKind === "on_die_ecc_nand") {
    return translateText(ctx, "subtitle.kind.on_die_ecc_nand", "On-die ECC NAND", lang);
  }
  if (device.chipKind === "managed_nand") {
    return productTypeDisplay(device.productType, ctx, lang) ?? translateText(ctx, "subtitle.kind.managed_nand", "Managed NAND", lang);
  }
  if (device.chipKind === "dram") {
    return displayField(fields, "dram_type") ?? productTypeDisplay(device.productType, ctx, lang) ?? translateText(ctx, "subtitle.kind.dram", "DRAM", lang);
  }
  return translateText(ctx, "subtitle.kind.memory", "Memory chip", lang);
}

function buildPartSubtitle(
  device: DeviceIdentity,
  fields: Map<FdnextFieldKey, FieldValue>,
  ctx: ResultBuilderContext,
  lang?: string | null
): string {
  const density = device.chipKind === "dram"
    ? displayField(fields, "dram_density")
    : byteDisplayField(fields, "storage_density") ?? byteDisplayField(fields, "density");
  const cellLevel = displayField(fields, "cell_level");
  const dramDensity = device.chipKind === "managed_nand" ? displayField(fields, "dram_density") : undefined;
  const dramType = device.chipKind === "managed_nand" ? displayField(fields, "dram_type") : undefined;
  const width = device.chipKind === "dram"
    ? displayField(fields, "dram_width") ?? displayField(fields, "device_width")
    : undefined;
  const processNode = device.chipKind === "raw_nand" || device.chipKind === "on_die_ecc_nand"
    ? displayField(fields, "process_node")
    : undefined;
  return [
    subtitleKind(device, fields, ctx, lang),
    device.vendor.name,
    joinCompact(density, cellLevel),
    joinCompact(dramDensity, dramType),
    width,
    processNode
  ].filter((value): value is string => Boolean(value)).join(" · ");
}

function buildIdentifierSubtitle(
  device: DeviceIdentity,
  fields: Map<FdnextFieldKey, FieldValue>,
  ctx: ResultBuilderContext,
  lang?: string | null
): string {
  const density = byteDisplayField(fields, "density");
  const cellLevel = displayField(fields, "cell_level");
  const dieCount = displayField(fields, "die_count");
  const planeCount = displayField(fields, "plane_count");
  const processNode = displayField(fields, "process_node");
  const dieText = dieCount
    ? translateTemplate(ctx, "subtitle.die_count", "{count} die", { count: dieCount }, lang)
    : undefined;
  const planeText = planeCount
    ? translateTemplate(ctx, "subtitle.plane_count", "{count} planes", { count: planeCount }, lang)
    : undefined;
  return [
    device.vendor.name,
    joinCompact(density, cellLevel),
    dieText,
    planeText,
    processNode
  ].filter((value): value is string => Boolean(value)).join(" · ");
}

function isKnownPart(info: InternalPartInfo): boolean {
  return info.vendor !== UNKNOWN || isKnownInfoValue(info.type) || isKnownInfoValue(info.density) || isKnownInfoValue(info.cellLevel);
}

function baseInput(query: string, normalized: string, constraints: OperationConstraints, lang?: string | null): NormalizedOperationInput {
  return {
    query,
    normalized,
    ...(lang ? { lang } : {}),
    constraints
  };
}

function identifierDecodeAction(identifier: string, ctx: ResultBuilderContext, lang?: string | null): Action {
  return {
    name: "identifier.decode",
    label: translateText(ctx, "action.identifier.decode.nand_flash_id", "Decode NAND Flash ID", lang),
    operation: "identifier.decode",
    input: {
      query: identifier,
      constraints: {
        idScheme: "nand.flash_id"
      }
    }
  };
}

function partDecodeConstraints(device?: DeviceIdentity): OperationConstraints | undefined {
  if (!device) {
    return undefined;
  }
  return {
    ...(device.vendor.id !== "unknown" ? { vendor: device.vendor.id } : {}),
    ...(device.chipKind !== "unknown" ? { chipKind: device.chipKind } : {}),
    ...(device.productType ? { productType: device.productType } : {})
  };
}

function partDecodeAction(partNumber: string, ctx: ResultBuilderContext, lang?: string | null, device?: DeviceIdentity): Action {
  const constraints = partDecodeConstraints(device);
  return {
    name: "part.decode",
    label: translateText(ctx, "action.part.decode", "Decode Part", lang),
    operation: "part.decode",
    input: {
      query: partNumber,
      ...(constraints && Object.keys(constraints).length > 0 ? { constraints } : {})
    }
  };
}

function normalizedFlashIds(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const id = normalizeFlashId(String(value));
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function partRelations(info: InternalPartInfo, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Relation[] {
  const relations: Relation[] = [];
  for (const id of normalizedFlashIds(info.flashId)) {
    relations.push({
      kind: "identifier_for",
      target: {
        identifier: id,
        idScheme: "nand.flash_id"
      },
      action: identifierDecodeAction(id, ctx, lang)
    });
  }
  const components = fdnextMetadata(info).components;
  if (Array.isArray(components)) {
    for (const item of components) {
      const component = asRecord(item);
      const chipKind = typeof component.chipKind === "string" ? component.chipKind as FdnextChipKind : device.chipKind;
      const productType = typeof component.productType === "string" ? component.productType as FdnextProductType : undefined;
      relations.push({
        kind: "component",
        target: {
          ...(typeof component.role === "string" ? { role: component.role } : {}),
          device: {
            domain: component.domain === "memory" || component.domain === "power" || component.domain === "controller" || component.domain === "unknown"
              ? component.domain
              : device.domain,
            chipKind,
            ...(productType ? { productType } : {}),
            vendor: device.vendor
          }
        }
      });
    }
  }
  return relations;
}

function deviceIdentityFromSuggestion(suggestion: PartSearchSuggestion, ctx: ResultBuilderContext, lang?: string | null): DeviceIdentity {
  return {
    domain: "memory",
    chipKind: suggestion.chipKind ?? (suggestion.markingCode ? "dram" : "unknown"),
    ...(suggestion.productType ? { productType: suggestion.productType } : {}),
    partNumber: suggestion.partNumber,
    ...(suggestion.markingCode ? { markingCode: suggestion.markingCode } : {}),
    vendor: vendorIdentity(suggestion.vendor, ctx, lang)
  };
}

export function buildPartCandidate(suggestion: PartSearchSuggestion, ctx: ResultBuilderContext, lang?: string | null): Candidate {
  return {
    device: deviceIdentityFromSuggestion(suggestion, ctx, lang),
    ...(suggestion.rawDensity ? { fields: [createField(suggestion.chipKind === "dram" ? "dram_density" : "density", suggestion.rawDensity, ctx, lang)] } : {}),
    ...(suggestion.warnings?.length ? { warnings: suggestion.warnings } : {})
  };
}

export function buildPartDecodeResult(
  info: InternalPartInfo,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): PartDecodeResult {
  const constraints = input.constraints ?? {};
  const device = deviceIdentityFromPart(info, constraints, ctx, input.lang);
  const fields = fieldMapFromPart(info, device, ctx, input.lang);
  const detailFieldMap = detailFields(fields);
  const metadata = fdnextMetadata(info);
  const profileId = typeof metadata.fieldProfile === "string" ? metadata.fieldProfile as FdnextChipKind : device.chipKind;
  const known = isKnownPart(info);
  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "part.decode",
    status: known ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    ...(known ? { subtitle: buildPartSubtitle(device, fields, ctx, input.lang), device } : {}),
    blocks: known ? buildBlocks(profileId, detailFieldMap, ctx, input.lang) : [],
    relations: known ? partRelations(info, device, ctx, input.lang) : [],
    warnings: []
  };
}

function deviceIdentityFromIdentifier(info: InternalIdentifierInfo, ctx: ResultBuilderContext, lang?: string | null): DeviceIdentity {
  return {
    domain: "memory",
    chipKind: "raw_nand",
    identifier: info.id,
    idScheme: "nand.flash_id",
    vendor: vendorIdentity(info.vendor, ctx, lang)
  };
}

function fieldMapFromIdentifier(info: InternalIdentifierInfo, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("identifier", info.id, ctx, lang));
  addField(fields, createField("id_scheme", "nand.flash_id", ctx, lang, { display: "NAND Flash ID" }));
  if (asNumber(info.density)) addField(fields, createField("density", Number(info.density), ctx, lang));
  if (asNumber(info.die)) addField(fields, createField("die_count", Number(info.die), ctx, lang));
  if (asNumber(info.plane)) addField(fields, createField("plane_count", Number(info.plane), ctx, lang));
  if (asNumber(info.pageSize)) addField(fields, createField("page_size", Number(info.pageSize) * 1024, ctx, lang));
  if (asNumber(info.blockSize)) addField(fields, createField("block_size", Number(info.blockSize) * 1024, ctx, lang));
  if (isKnownInfoValue(info.processNode)) addField(fields, createField("process_node", String(info.processNode), ctx, lang));
  if (typeof info.cellLevel === "number") {
    const cellLevels: Record<number, string> = { 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" };
    addField(fields, createField("cell_level", cellLevels[info.cellLevel] ?? String(info.cellLevel), ctx, lang));
  } else if (isKnownInfoValue(info.cellLevel)) {
    addField(fields, createField("cell_level", String(info.cellLevel), ctx, lang));
  }
  if (isKnownInfoValue(info.voltage)) addField(fields, createField("voltage", String(info.voltage), ctx, lang));
  const ext = asRecord(info.ext);
  for (const [sourceKey, fieldKey] of Object.entries({
    blocks_per_lun: "blocks_per_lun",
    pages_per_block: "pages_per_block",
    simultaneously_programmed_pages: "simultaneously_programmed_pages",
    redundant_area_size: "redundant_area_size",
    timing_mode_async: "timing_mode_async",
    edo: "edo",
    interleave: "interleave",
    cache: "cache",
    ecc_level: "ecc_level",
    revision: "revision",
    enterprise: "enterprise",
    interface: "interface_type"
  })) {
    const value = ext[sourceKey];
    if (isKnownInfoValue(value)) {
      addField(fields, createField(fieldKey as FdnextFieldKey, value as FdnextFieldValueData, ctx, lang));
    }
  }
  for (const controller of info.controllers ?? []) {
    if (isKnownInfoValue(controller)) {
      addField(fields, createField("controller", controller, ctx, lang));
      break;
    }
  }
  return fields;
}

function identifierRelations(info: InternalIdentifierInfo, ctx: ResultBuilderContext, lang?: string | null): Relation[] {
  return (info.partNumbers ?? []).map((partNumber) => ({
    kind: "identifier_for",
    source: {
      identifier: info.id,
      idScheme: "nand.flash_id"
    },
    target: {
      partNumber
    },
    action: partDecodeAction(partNumber, ctx, lang)
  }));
}

export function buildIdentifierDecodeResult(
  info: InternalIdentifierInfo,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): IdentifierDecodeResult {
  const constraints = { idScheme: "nand.flash_id", ...(input.constraints ?? {}) } as OperationConstraints;
  const device = deviceIdentityFromIdentifier(info, ctx, input.lang);
  const known = info.vendor !== UNKNOWN || isKnownInfoValue(info.density) || isKnownInfoValue(info.cellLevel);
  const fields = fieldMapFromIdentifier(info, device, ctx, input.lang);
  const detailFieldMap = detailFields(fields);
  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "identifier.decode",
    status: known ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    ...(known ? { subtitle: buildIdentifierSubtitle(device, fields, ctx, input.lang), device } : {}),
    blocks: known ? buildBlocks("nand.flash_id", detailFieldMap, ctx, input.lang) : [],
    relations: known ? identifierRelations(info, ctx, input.lang) : [],
    warnings: []
  };
}

export function buildPartSearchResult(
  suggestions: PartSearchSuggestion[],
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): PartSearchResult {
  const constraints = input.constraints ?? {};
  const items: SearchResultItem[] = suggestions.map((suggestion) => {
    const chipKind = suggestion.chipKind ?? constraints.chipKind ?? (suggestion.markingCode ? "dram" : "unknown");
    const productType = suggestion.productType ?? constraints.productType;
    const device: DeviceIdentity = deviceIdentityFromSuggestion({ ...suggestion, chipKind, ...(productType ? { productType } : {}) }, ctx, input.lang);
    const fields: FieldValue[] = [];
    if (suggestion.rawDensity) {
      fields.push(createField(chipKind === "dram" ? "dram_density" : "density", suggestion.rawDensity, ctx, input.lang));
    }
    const badges = suggestion.badges ?? [
      ...(suggestion.markingCode ? [`${device.vendor.name} FBGA`] : [device.vendor.name]),
      ...(productType ? [String(productType).toUpperCase()] : chipKind !== "unknown" ? [chipKind] : [])
    ];
    return {
      label: suggestion.partNumber,
      device,
      badges,
      ...(fields.length > 0 ? { fields } : {})
    };
  });

  const relations: Relation[] = suggestions
    .filter((suggestion) => suggestion.markingCode)
    .map((suggestion) => {
      const targetDevice: DeviceIdentity = {
        domain: "memory",
        chipKind: suggestion.chipKind ?? "dram",
        ...(suggestion.productType ? { productType: suggestion.productType } : {}),
        partNumber: suggestion.partNumber,
        vendor: vendorIdentity(suggestion.vendor, ctx, input.lang)
      };
      return {
        kind: "marking_for",
        source: {
          markingCode: suggestion.markingCode
        },
        target: {
          partNumber: suggestion.partNumber,
          device: targetDevice
        },
        action: partDecodeAction(suggestion.partNumber, ctx, input.lang, targetDevice)
      };
    });

  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "part.search",
    status: items.length > 0 ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    items,
    ...(relations.length > 0 ? { relations } : {}),
    warnings: []
  };
}

export function buildIdentifierSearchResult(
  hits: Record<string, FlashIdRecord>,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): IdentifierSearchResult {
  const constraints = { idScheme: "nand.flash_id", ...(input.constraints ?? {}) } as OperationConstraints;
  const items: SearchResultItem[] = Object.entries(hits).map(([id, record]) => {
    const device: DeviceIdentity = {
      domain: "memory",
      chipKind: "raw_nand",
      identifier: id,
      idScheme: "nand.flash_id",
      vendor: vendorIdentity("unknown", ctx, input.lang)
    };
    const fields = new Map<FdnextFieldKey, FieldValue>();
    if (asNumber(record.s)) addField(fields, createField("page_size", Number(record.s) * 1024, ctx, input.lang));
    return {
      label: id,
      device,
      fields: [...fields.values()],
      relations: (record.n ?? []).map((partNumber) => ({
        kind: "identifier_for",
        source: {
          identifier: id,
          idScheme: "nand.flash_id"
        },
        target: {
          partNumber
        },
        action: partDecodeAction(partNumber, ctx, input.lang)
      }))
    };
  });

  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "identifier.search",
    status: items.length > 0 ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    items,
    warnings: []
  };
}

export function buildCapabilities(): FdnextCapabilities {
  const capabilities: Capability[] = [
    {
      name: "part.decode",
      operation: "part.decode",
      domains: ["memory"],
      chipKinds: ["raw_nand", "on_die_ecc_nand", "managed_nand", "dram"]
    },
    {
      name: "part.search",
      operation: "part.search",
      domains: ["memory"],
      chipKinds: ["raw_nand", "on_die_ecc_nand", "managed_nand", "dram"]
    },
    {
      name: "identifier.decode.nand.flash_id",
      operation: "identifier.decode",
      domains: ["memory"],
      chipKinds: ["raw_nand", "on_die_ecc_nand"],
      idSchemes: ["nand.flash_id"]
    },
    {
      name: "identifier.search.nand.flash_id",
      operation: "identifier.search",
      domains: ["memory"],
      chipKinds: ["raw_nand", "on_die_ecc_nand"],
      idSchemes: ["nand.flash_id"]
    },
    {
      name: "marking.lookup.micron.fbga",
      operation: "part.search",
      domains: ["memory"],
      chipKinds: ["dram"]
    }
  ];
  return {
    schemaVersion: FDNEXT_CAPABILITIES_SCHEMA_VERSION,
    capabilities
  };
}

export function operationFromResult(result: FdnextCapabilities | { operation: FdnextOperation }): FdnextOperation | "capabilities" {
  return "operation" in result ? result.operation : "capabilities";
}
