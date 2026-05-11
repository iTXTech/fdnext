import { UNKNOWN } from "./constants";
import {
  draftDensity,
  draftField,
  draftIdentifier,
  draftPartNumber,
  draftVendor
} from "./draft";
import {
  inferChipKindFromDraft,
  inferProductTypeFromDraft,
  isKnownInfoValue,
  normalizeInfoText
} from "./device-inference";
import { createFdnextFieldValue, fdnextFieldRegistry, type FdnextFieldKey } from "./field-registry";
import { getFdnextFieldProfile } from "./field-profiles";
import { inferVendorFromPartNumber, normalizeVendor } from "./fdb-lookup";
import {
  FDNEXT_CAPABILITIES_SCHEMA_VERSION,
  FDNEXT_RESULT_SCHEMA_VERSION,
  type Action,
  type CapabilityDecoderInventory,
  type CapabilityFdbInfo,
  type CapabilityInventory,
  type CapabilityServerInfo,
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
import type { DecodeDraftFields, IdentifierDecodeDraft, LangPacks, PartDecodeDraft } from "./types";
import { normalizeFlashId, normalizePartNumber } from "./utils/normalize";

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
  density?: number;
  badges?: string[];
  warnings?: ResultWarning[];
}

function knownStringList(values: unknown[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values ?? []) {
    if (!isKnownInfoValue(value)) {
      continue;
    }
    const text = String(value);
    if (seen.has(text)) {
      continue;
    }
    seen.add(text);
    out.push(text);
  }
  return out;
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

function vendorIdentity(vendor: unknown, ctx: ResultBuilderContext, lang?: string | null): VendorIdentity {
  const id = typeof vendor === "string" && vendor.trim() ? vendor.trim() : "unknown";
  const translated = ctx.translateString(id, lang);
  return {
    id,
    name: translated && translated !== id ? translated : id
  };
}

function deviceIdentityFromPart(
  info: PartDecodeDraft,
  constraints: OperationConstraints,
  ctx: ResultBuilderContext,
  lang?: string | null
): DeviceIdentity {
  const chipKind = constraints.chipKind ?? inferChipKindFromDraft(info, constraints);
  const productType = constraints.productType ?? inferProductTypeFromDraft(info);
  const domain = info.device.domain ?? "memory";
  const markingCode = info.device.markingCode ?? (typeof draftField(info, "marking_code") === "string" ? draftField(info, "marking_code") as string : undefined);
  return {
    domain,
    chipKind,
    ...(productType ? { productType } : {}),
    partNumber: draftPartNumber(info),
    ...(markingCode ? { markingCode } : {}),
    vendor: vendorIdentity(draftVendor(info), ctx, lang)
  };
}

function addField(fields: Map<FdnextFieldKey, FieldValue>, field: FieldValue | undefined): void {
  if (!field || fields.has(field.key as FdnextFieldKey)) {
    return;
  }
  fields.set(field.key as FdnextFieldKey, field);
}

function normalizeFieldValue(fieldKey: FdnextFieldKey, value: unknown): FdnextFieldValueData | undefined {
  if (!isKnownInfoValue(value)) {
    return undefined;
  }
  if (typeof value === "number" && value <= 0) {
    return undefined;
  }
  if (fieldKey === "cell_level" && typeof value === "number") {
    const cellLevels: Record<number, string> = { 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" };
    return cellLevels[value] ?? String(value);
  }
  if (fieldKey === "component_width" || fieldKey === "dram_width" || fieldKey === "device_width") {
    const parsed = typeof value === "string" ? Number.parseInt(value.replace(/^x/i, ""), 10) : Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return value as FdnextFieldValueData;
}

function addDraftFields(fields: Map<FdnextFieldKey, FieldValue>, draftFields: DecodeDraftFields | undefined, ctx: ResultBuilderContext, lang?: string | null): void {
  for (const [key, value] of Object.entries(draftFields ?? {})) {
    if (!Object.hasOwn(fdnextFieldRegistry, key)) {
      continue;
    }
    const fieldKey = key as FdnextFieldKey;
    const fieldValue = normalizeFieldValue(fieldKey, value);
    if (fieldValue === undefined) {
      continue;
    }
    if (fieldKey === "group" && normalizeInfoText(value) === "raw nand") {
      continue;
    }
    fields.set(fieldKey, createField(fieldKey, fieldValue, ctx, lang));
  }
}

function fieldMapFromPart(info: PartDecodeDraft, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("chip_kind", device.chipKind, ctx, lang));
  if (device.productType) {
    addField(fields, createField("product_type", device.productType, ctx, lang));
  }
  addField(fields, createField("part_number", draftPartNumber(info), ctx, lang));
  addDraftFields(fields, info.fields, ctx, lang);

  const controllers = knownStringList(info.controllers);
  if (controllers.length > 0) {
    addField(fields, createField("controller", controllers, ctx, lang));
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

function isKnownPart(info: PartDecodeDraft): boolean {
  return draftVendor(info) !== UNKNOWN ||
    isKnownInfoValue(info.device.chipKind) ||
    isKnownInfoValue(info.device.productType) ||
    isKnownInfoValue(draftDensity(info)) ||
    isKnownInfoValue(draftField(info, "cell_level")) ||
    isKnownInfoValue(draftField(info, "dram_type"));
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

function parsePartReference(value: string, ctx: ResultBuilderContext, lang?: string | null): { partNumber: string; device?: DeviceIdentity } {
  const text = value.trim();
  const prefixed = /^(\S+)\s+(.+)$/.exec(text);
  const partNumber = normalizePartNumber(prefixed?.[2] ?? text);
  const vendor = partNumber
    ? inferVendorFromPartNumber(partNumber) ?? (prefixed?.[1] ? normalizeVendor(prefixed[1]) : "")
    : "";
  return {
    partNumber: partNumber || text,
    ...(vendor ? {
      device: {
        domain: "memory",
        chipKind: "raw_nand",
        partNumber: partNumber || text,
        vendor: vendorIdentity(vendor, ctx, lang)
      }
    } : {})
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

function relationFieldsFromDraft(draftFields: DecodeDraftFields | undefined, ctx: ResultBuilderContext, lang?: string | null): FieldValue[] | undefined {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addDraftFields(fields, draftFields, ctx, lang);
  return fields.size > 0 ? [...fields.values()] : undefined;
}

function partRelations(info: PartDecodeDraft, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Relation[] {
  const relations: Relation[] = [];
  for (const id of normalizedFlashIds(info.identifiers?.flashIds)) {
    relations.push({
      kind: "identifier_for",
      target: {
        identifier: id,
        idScheme: "nand.flash_id"
      },
      action: identifierDecodeAction(id, ctx, lang)
    });
  }
  for (const component of info.components ?? []) {
    const componentDevice = component.device ?? {};
    const chipKind = componentDevice.chipKind ?? device.chipKind;
    const productType = componentDevice.productType;
    const fields = relationFieldsFromDraft(component.fields, ctx, lang);
    relations.push({
      kind: "component",
      target: {
        role: component.role,
        device: {
          domain: componentDevice.domain ?? device.domain,
          chipKind,
          ...(productType ? { productType } : {}),
          ...(componentDevice.partNumber ? { partNumber: componentDevice.partNumber } : {}),
          ...(componentDevice.markingCode ? { markingCode: componentDevice.markingCode } : {}),
          vendor: vendorIdentity(componentDevice.vendor ?? device.vendor.id, ctx, lang)
        }
      },
      ...(fields ? { fields } : {})
    });
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
    ...(suggestion.density ? { fields: [createField(suggestion.chipKind === "dram" ? "dram_density" : "density", suggestion.density, ctx, lang)] } : {}),
    ...(suggestion.warnings?.length ? { warnings: suggestion.warnings } : {})
  };
}

export function buildPartDecodeResult(
  info: PartDecodeDraft,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): PartDecodeResult {
  const constraints = input.constraints ?? {};
  const device = deviceIdentityFromPart(info, constraints, ctx, input.lang);
  const fields = fieldMapFromPart(info, device, ctx, input.lang);
  const detailFieldMap = detailFields(fields);
  const profileId = info.meta?.fieldProfile ?? device.chipKind;
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

function deviceIdentityFromIdentifier(info: IdentifierDecodeDraft, ctx: ResultBuilderContext, lang?: string | null): DeviceIdentity {
  return {
    domain: info.device.domain ?? "memory",
    chipKind: info.device.chipKind ?? "raw_nand",
    identifier: draftIdentifier(info),
    idScheme: info.device.idScheme,
    vendor: vendorIdentity(draftVendor(info), ctx, lang)
  };
}

function fieldMapFromIdentifier(info: IdentifierDecodeDraft, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("identifier", draftIdentifier(info), ctx, lang));
  addField(fields, createField("id_scheme", info.device.idScheme, ctx, lang, { display: info.device.idScheme === "nand.flash_id" ? "NAND Flash ID" : undefined }));
  addDraftFields(fields, info.fields, ctx, lang);
  const controllers = knownStringList(info.controllers);
  if (controllers.length > 0) {
    addField(fields, createField("controller", controllers, ctx, lang));
  }
  return fields;
}

function identifierRelations(info: IdentifierDecodeDraft, ctx: ResultBuilderContext, lang?: string | null): Relation[] {
  return (info.identifiers?.partNumbers ?? []).map((partReference) => {
    const target = parsePartReference(partReference, ctx, lang);
    return {
      kind: "identifier_for",
      source: {
        identifier: draftIdentifier(info),
        idScheme: info.device.idScheme
      },
      target: {
        partNumber: target.partNumber
      },
      action: partDecodeAction(target.partNumber, ctx, lang, target.device)
    };
  });
}

export function buildIdentifierDecodeResult(
  info: IdentifierDecodeDraft,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): IdentifierDecodeResult {
  const constraints = { idScheme: "nand.flash_id", ...(input.constraints ?? {}) } as OperationConstraints;
  const device = deviceIdentityFromIdentifier(info, ctx, input.lang);
  const known = draftVendor(info) !== UNKNOWN || isKnownInfoValue(draftDensity(info)) || isKnownInfoValue(draftField(info, "cell_level"));
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
    if (suggestion.density) {
      fields.push(createField(chipKind === "dram" ? "dram_density" : "density", suggestion.density, ctx, input.lang));
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
  hits: IdentifierDecodeDraft[],
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): IdentifierSearchResult {
  const constraints = { idScheme: "nand.flash_id", ...(input.constraints ?? {}) } as OperationConstraints;
  const items: SearchResultItem[] = hits.map((info) => {
    const device = deviceIdentityFromIdentifier(info, ctx, input.lang);
    const fields = detailFields(fieldMapFromIdentifier(info, device, ctx, input.lang));
    return {
      label: draftIdentifier(info),
      device,
      fields: [...fields.values()],
      relations: identifierRelations(info, ctx, input.lang)
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

export interface BuildCapabilitiesOptions {
  server: CapabilityServerInfo;
  fdb: CapabilityFdbInfo;
  inventory: CapabilityInventory;
  decoders: CapabilityDecoderInventory;
}

export function buildCapabilities(options: BuildCapabilitiesOptions): FdnextCapabilities {
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
      chipKinds: ["raw_nand", "on_die_ecc_nand", "dram"]
    }
  ];
  return {
    schemaVersion: FDNEXT_CAPABILITIES_SCHEMA_VERSION,
    server: options.server,
    fdb: options.fdb,
    inventory: options.inventory,
    decoders: options.decoders,
    capabilities
  };
}

export function operationFromResult(result: FdnextCapabilities | { operation: FdnextOperation }): FdnextOperation | "capabilities" {
  return "operation" in result ? result.operation : "capabilities";
}
