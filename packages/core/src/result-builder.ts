import { UNKNOWN } from "./constants";
import { createFdnextFieldValue, fdnextFieldRegistry, type FdnextFieldKey } from "./field-registry";
import { getFdnextFieldProfile } from "./field-profiles";
import {
  FDNEXT_CAPABILITIES_SCHEMA_VERSION,
  FDNEXT_RESULT_SCHEMA_VERSION,
  type Action,
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
  type SearchResultItem,
  type VendorIdentity
} from "./result";
import type { FlashIdInfo, FlashIdRecord, FlashInfo, LangPacks } from "./types";

export interface ResultBuilderContext {
  langPacks: LangPacks;
  fallbackLang: string;
  translateString(key: string, lang?: string | null): string;
}

export interface PartSearchSuggestion {
  vendor: string;
  partNumber: string;
  markingCode?: string;
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
    .trim()
    .replaceAll(/\s+/g, " ");
}

function slug(value: unknown): string {
  return normalizeText(value).replaceAll(" ", "_");
}

function isKnown(value: unknown): boolean {
  if (value == null || value === -1 || value === UNKNOWN) {
    return false;
  }
  if (typeof value === "string") {
    const text = normalizeText(value);
    return text.length > 0 && text !== normalizeText(UNKNOWN);
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return true;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return undefined;
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

function inferProductType(info: FlashInfo): FdnextProductType | undefined {
  const type = normalizeText(info.type);
  const extra = asRecord(info.extraInfo);
  const dramType = normalizeText(extra.dram_type);
  if (["emmc", "ufs", "emcp", "umcp", "e2nand", "inand"].includes(type)) {
    return type;
  }
  if (dramType) {
    return dramType.replaceAll(" sdram", "").replaceAll(" sgram", "").replaceAll(" ", "") as FdnextProductType;
  }
  if (/^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(type)) {
    return type.replaceAll(" ", "") as FdnextProductType;
  }
  return undefined;
}

function inferChipKind(info: FlashInfo, constraints: OperationConstraints = {}): FdnextChipKind {
  if (constraints.chipKind) {
    return constraints.chipKind;
  }

  const type = normalizeText(info.type);
  const productType = inferProductType(info);
  if (type === "on die ecc nand" || type === "片上 ecc nand") {
    return "on_die_ecc_nand";
  }
  if (productType && ["emmc", "ufs", "emcp", "umcp", "e2nand", "inand"].includes(String(productType))) {
    return "managed_nand";
  }
  if (productType && /^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(String(productType))) {
    return "dram";
  }
  if (type === "dram") {
    return "dram";
  }
  if (info.vendor === UNKNOWN && !isKnown(info.density) && !isKnown(info.cellLevel)) {
    return "unknown";
  }
  return "raw_nand";
}

function deviceIdentityFromPart(
  info: FlashInfo,
  constraints: OperationConstraints,
  ctx: ResultBuilderContext,
  lang?: string | null
): DeviceIdentity {
  const chipKind = inferChipKind(info, constraints);
  const productType = constraints.productType ?? inferProductType(info);
  return {
    domain: "memory",
    chipKind,
    ...(productType ? { productType } : {}),
    partNumber: info.partNumber,
    ...(typeof info.extraInfo === "object" && !Array.isArray(info.extraInfo) && typeof info.extraInfo.marking_code === "string"
      ? { markingCode: info.extraInfo.marking_code }
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

function fieldMapFromPart(info: FlashInfo, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("chip_kind", device.chipKind, ctx, lang));
  if (device.productType) {
    addField(fields, createField("product_type", device.productType, ctx, lang));
  }
  addField(fields, createField("part_number", info.partNumber, ctx, lang));
  if (device.chipKind === "dram" && isKnown(info.type)) {
    addField(fields, createField("dram_type", String(info.type), ctx, lang));
  }

  const density = asNumber(info.density);
  if (density) {
    addField(fields, createField(device.chipKind === "dram" ? "dram_density" : "density", density, ctx, lang));
  }
  if (typeof info.cellLevel === "number") {
    const cellLevels: Record<number, string> = { 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" };
    addField(fields, createField("cell_level", cellLevels[info.cellLevel] ?? String(info.cellLevel), ctx, lang));
  } else if (isKnown(info.cellLevel)) {
    addField(fields, createField("cell_level", String(info.cellLevel), ctx, lang));
  }
  const deviceWidth = asNumber(info.deviceWidth);
  if (deviceWidth) {
    addField(fields, createField(device.chipKind === "dram" ? "dram_width" : "device_width", deviceWidth, ctx, lang));
  }
  if (isKnown(info.processNode)) addField(fields, createField("process_node", String(info.processNode), ctx, lang));
  if (isKnown(info.voltage)) addField(fields, createField(device.chipKind === "dram" ? "dram_voltage" : "voltage", String(info.voltage), ctx, lang));
  if (isKnown(info.package)) addField(fields, createField("package", String(info.package), ctx, lang));
  if (isKnown(info.generation)) addField(fields, createField("generation_info", String(info.generation), ctx, lang));

  const classification = asRecord(info.classification);
  if (asNumber(classification.die)) {
    addField(fields, createField("die_count", Number(classification.die), ctx, lang));
  }

  const extra = asRecord(info.extraInfo);
  for (const [key, value] of Object.entries(extra)) {
    if (!Object.hasOwn(fdnextFieldRegistry, key) || !isKnown(value)) {
      continue;
    }
    const fieldKey = key as FdnextFieldKey;
    if (fieldKey === "group" && device.chipKind === "raw_nand" && normalizeText(value) === "raw nand") {
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
    if (isKnown(controller)) {
      addField(fields, createField("controller", controller, ctx, lang));
      break;
    }
  }

  return fields;
}

function buildBlocks(profileId: FdnextChipKind | "nand.flash_id", fields: Map<FdnextFieldKey, FieldValue>): ResultBlock[] {
  const profile = getFdnextFieldProfile(profileId);
  const blocks: ResultBlock[] = [];
  const emitted = new Set<FdnextFieldKey>();

  for (const block of profile.blocks) {
    const blockFields = block.fields
      .map((key) => fields.get(key))
      .filter((field): field is FieldValue => Boolean(field));
    if (blockFields.length === 0) {
      continue;
    }
    blockFields.forEach((field) => emitted.add(field.key as FdnextFieldKey));
    blocks.push({
      id: block.id,
      label: block.label,
      importance: block.importance,
      fields: blockFields
    });
  }

  const remaining = [...fields.values()].filter((field) => !emitted.has(field.key as FdnextFieldKey));
  if (remaining.length > 0) {
    blocks.push({
      id: "identity",
      label: "Additional Fields",
      importance: "detail",
      fields: remaining
    });
  }
  return blocks;
}

function isKnownPart(info: FlashInfo): boolean {
  return info.vendor !== UNKNOWN || isKnown(info.type) || isKnown(info.density) || isKnown(info.cellLevel);
}

function baseInput(query: string, normalized: string, constraints: OperationConstraints, lang?: string | null): NormalizedOperationInput {
  return {
    query,
    normalized,
    ...(lang ? { lang } : {}),
    constraints
  };
}

function partActions(info: FlashInfo): Action[] {
  if (!Array.isArray(info.flashId) || info.flashId.length === 0) {
    return [];
  }
  return [
    {
      name: "identifier.search",
      label: "Search NAND Flash IDs",
      operation: "identifier.search",
      input: {
        query: info.partNumber,
        constraints: {
          idScheme: "nand.flash_id"
        }
      }
    }
  ];
}

function partRelations(info: FlashInfo, device: DeviceIdentity): Relation[] {
  const relations: Relation[] = [];
  for (const id of info.flashId ?? []) {
    relations.push({
      kind: "identifier_for",
      target: {
        identifier: id,
        idScheme: "nand.flash_id",
        device
      }
    });
  }
  return relations;
}

export function buildPartDecodeResult(
  info: FlashInfo,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): PartDecodeResult {
  const constraints = input.constraints ?? {};
  const device = deviceIdentityFromPart(info, constraints, ctx, input.lang);
  const fields = fieldMapFromPart(info, device, ctx, input.lang);
  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "part.decode",
    status: isKnownPart(info) ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    ...(isKnownPart(info) ? { device } : {}),
    blocks: isKnownPart(info) ? buildBlocks(device.chipKind, fields) : [],
    relations: isKnownPart(info) ? partRelations(info, device) : [],
    actions: isKnownPart(info) ? partActions(info) : [],
    warnings: []
  };
}

function deviceIdentityFromIdentifier(info: FlashIdInfo, ctx: ResultBuilderContext, lang?: string | null): DeviceIdentity {
  return {
    domain: "memory",
    chipKind: "raw_nand",
    identifier: info.id,
    idScheme: "nand.flash_id",
    vendor: vendorIdentity(info.vendor, ctx, lang)
  };
}

function fieldMapFromIdentifier(info: FlashIdInfo, device: DeviceIdentity, ctx: ResultBuilderContext, lang?: string | null): Map<FdnextFieldKey, FieldValue> {
  const fields = new Map<FdnextFieldKey, FieldValue>();
  addField(fields, createField("vendor", device.vendor.name, ctx, lang));
  addField(fields, createField("identifier", info.id, ctx, lang));
  addField(fields, createField("id_scheme", "nand.flash_id", ctx, lang, { display: "NAND Flash ID" }));
  if (asNumber(info.density)) addField(fields, createField("density", Number(info.density), ctx, lang));
  if (asNumber(info.die)) addField(fields, createField("die_count", Number(info.die), ctx, lang));
  if (asNumber(info.plane)) addField(fields, createField("plane_count", Number(info.plane), ctx, lang));
  if (asNumber(info.pageSize)) addField(fields, createField("page_size", Number(info.pageSize) * 1024, ctx, lang));
  if (asNumber(info.blockSize)) addField(fields, createField("block_size", Number(info.blockSize) * 1024, ctx, lang));
  if (isKnown(info.processNode)) addField(fields, createField("process_node", String(info.processNode), ctx, lang));
  if (typeof info.cellLevel === "number") {
    const cellLevels: Record<number, string> = { 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" };
    addField(fields, createField("cell_level", cellLevels[info.cellLevel] ?? String(info.cellLevel), ctx, lang));
  } else if (isKnown(info.cellLevel)) {
    addField(fields, createField("cell_level", String(info.cellLevel), ctx, lang));
  }
  if (isKnown(info.voltage)) addField(fields, createField("voltage", String(info.voltage), ctx, lang));
  for (const controller of info.controllers ?? []) {
    if (isKnown(controller)) {
      addField(fields, createField("controller", controller, ctx, lang));
      break;
    }
  }
  return fields;
}

function identifierRelations(info: FlashIdInfo, device: DeviceIdentity): Relation[] {
  return (info.partNumbers ?? []).map((partNumber) => ({
    kind: "identifier_for",
    source: {
      identifier: info.id,
      idScheme: "nand.flash_id",
      device
    },
    target: {
      partNumber
    }
  }));
}

export function buildIdentifierDecodeResult(
  info: FlashIdInfo,
  input: { query: string; normalized: string; constraints?: OperationConstraints; lang?: string | null },
  ctx: ResultBuilderContext
): IdentifierDecodeResult {
  const constraints = { idScheme: "nand.flash_id", ...(input.constraints ?? {}) } as OperationConstraints;
  const device = deviceIdentityFromIdentifier(info, ctx, input.lang);
  const known = info.vendor !== UNKNOWN || isKnown(info.density) || isKnown(info.cellLevel);
  const fields = fieldMapFromIdentifier(info, device, ctx, input.lang);
  return {
    schemaVersion: FDNEXT_RESULT_SCHEMA_VERSION,
    operation: "identifier.decode",
    status: known ? "ok" : "not_found",
    input: baseInput(input.query, input.normalized, constraints, input.lang),
    ...(known ? { device } : {}),
    blocks: known ? buildBlocks("nand.flash_id", fields) : [],
    relations: known ? identifierRelations(info, device) : [],
    actions: [],
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
    const chipKind = suggestion.markingCode ? "dram" : constraints.chipKind ?? "unknown";
    const device: DeviceIdentity = {
      domain: "memory",
      chipKind,
      ...(constraints.productType ? { productType: constraints.productType } : {}),
      partNumber: suggestion.partNumber,
      ...(suggestion.markingCode ? { markingCode: suggestion.markingCode } : {}),
      vendor: vendorIdentity(suggestion.vendor, ctx, input.lang)
    };
    return {
      label: suggestion.markingCode ? `${suggestion.markingCode} ${suggestion.partNumber}` : suggestion.partNumber,
      device,
      badges: [device.vendor.name, ...(suggestion.markingCode ? ["FBGA"] : [])],
      actions: [
        {
          name: "part.decode",
          label: "Decode Part",
          operation: "part.decode",
          input: {
            query: suggestion.partNumber,
            constraints: {
              vendor: suggestion.vendor,
              ...(chipKind !== "unknown" ? { chipKind } : {})
            }
          }
        }
      ]
    };
  });

  const relations: Relation[] = suggestions
    .filter((suggestion) => suggestion.markingCode)
    .map((suggestion) => ({
      kind: "marking_for",
      source: {
        markingCode: suggestion.markingCode
      },
      target: {
        partNumber: suggestion.partNumber
      }
    }));

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
    addField(fields, createField("identifier", id, ctx, input.lang));
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
        }
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
