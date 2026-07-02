import {
  createEngine,
  type ControllerGroupSelection,
  type ExternalLink,
  type FdnextCapabilities,
  type FdnextEngine,
  type FdnextFieldValueData,
  type FieldValue,
  type IdentifierDecodeResult,
  type IdentifierSearchResult,
  type PartDecodeResult,
  type PartSearchResult,
  type SearchResultItem
} from "@itxtech/fdnext-core";

export const FD_SERVER_NAME = "fdnext-fd-server";

type LegacyLang = "chs" | "eng";
type LegacyUnknown = string;
type LegacyScalar = string | number | boolean | null | LegacyScalar[] | Record<string, unknown>;

interface LegacyFlashInfo {
  partNumber: string;
  vendor: string;
  type: string;
  density: string;
  deviceWidth: string;
  processNode: string;
  cellLevel: string;
  classification: {
    ce: LegacyScalar;
    ch: LegacyScalar;
    rb: LegacyScalar;
    die: LegacyScalar;
  };
  voltage: string;
  generation: string;
  interface: LegacyScalar;
  package: string;
  extraInfo: Record<string, LegacyScalar>;
  flashId: string[];
  controller: string[];
  remark: string;
  url: Record<string, string>;
  urls: unknown[];
  rawDensity?: number;
  rawVendor: string;
}

interface LegacyFlashIdInfo {
  id: string;
  vendor: string;
  density: LegacyScalar;
  die: LegacyScalar;
  plane: LegacyScalar;
  pageSize: LegacyScalar;
  blockSize: LegacyScalar;
  processNode: string;
  cellLevel: LegacyScalar;
  voltage: string;
  ext: Record<string, LegacyScalar>;
  controllers: string[];
  partNumbers: string[];
  url: Record<string, string>;
  urls: unknown[];
  rawVendor: string;
}

export type FdServerEnv = Record<string, string | undefined>;

export interface FdServerHandlerOptions {
  engine?: FdnextEngine;
  env?: FdServerEnv;
  defaultLang?: string | null;
  controllerGroup?: string | ControllerGroupSelection | null;
  extraUrls?: Record<string, string>;
  warn?: (message: string) => void;
}

export interface FdServerConfig {
  defaultLang: LegacyLang;
  controllerGroup: ControllerGroupSelection;
  extraUrls: Record<string, string>;
}

export interface FdServerHandler {
  engine: FdnextEngine;
  config: FdServerConfig;
  handleUrl: (url: URL) => FdServerHttpResponse;
  handleRequest: (request: Request) => Response;
}

export interface FdServerHttpResponse {
  body: unknown;
  code: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};

const legacyVendorNames: Record<LegacyLang, Record<string, string>> = {
  eng: {
    intel: "Intel",
    micron: "Micron",
    samsung: "Samsung",
    westerndigital: "WesternDigital",
    skhynix: "SKhynix",
    spectek: "SpecTek",
    kioxia: "Kioxia",
    ymtc: "YMTC",
    phison: "Phison",
    st: "ST",
    powerchip: "PowerChip"
  },
  chs: {
    intel: "英特尔",
    micron: "美光",
    samsung: "三星",
    westerndigital: "西数",
    skhynix: "SK海力士",
    spectek: "美光降级",
    kioxia: "铠侠",
    phison: "群联",
    ymtc: "长江存储"
  }
};

const localLabels: Record<LegacyLang, Record<string, string>> = {
  eng: {
    resolvedPartNumber: "Resolved Part Number",
    storageDensity: "Storage Density",
    status: "Status",
    warnings: "Warnings"
  },
  chs: {
    resolvedPartNumber: "解析料号",
    storageDensity: "存储容量",
    status: "状态",
    warnings: "警告"
  }
};

const consumedPartFieldKeys = new Set([
  "vendor",
  "chip_kind",
  "product_type",
  "dram_type",
  "part_number",
  "marking_code",
  "density",
  "dram_density",
  "cell_level",
  "process_node",
  "die_codename",
  "device_width",
  "dram_width",
  "component_width",
  "voltage",
  "dram_voltage",
  "generation_info",
  "product_generation",
  "dram_generation",
  "interface_type",
  "storage_interface",
  "package",
  "controller",
  "ce_count",
  "cs_count",
  "channel_count",
  "rb_count",
  "die_count",
  "dram_die_count"
]);

const consumedIdentifierFieldKeys = new Set([
  "vendor",
  "identifier",
  "id_scheme",
  "density",
  "cell_level",
  "process_node",
  "die_codename",
  "die_count",
  "plane_count",
  "page_size",
  "block_size",
  "voltage",
  "controller"
]);

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseLang(value: string | null | undefined, fallback: LegacyLang = "chs"): LegacyLang {
  const lang = value?.trim();
  return lang === "chs" || lang === "eng" ? lang : fallback;
}

function requestLang(url: URL, fallback: LegacyLang): LegacyLang {
  return parseLang(url.searchParams.get("lang"), fallback);
}

function parseControllerGroup(value: string | ControllerGroupSelection | null | undefined): ControllerGroupSelection {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === "all") {
    return "all";
  }
  const raw = typeof value === "string" ? value : "selected";
  const pieces = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (pieces.includes("all")) {
    return "all";
  }
  if (pieces.length === 0) {
    return "selected";
  }
  return pieces.length === 1 ? pieces[0] as ControllerGroupSelection : pieces as ControllerGroupSelection;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeUrlMap(input: Record<string, string>, warn?: (message: string) => void): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawLabel, rawUrl] of Object.entries(input)) {
    const label = rawLabel.trim();
    const url = rawUrl.trim();
    if (!label || !isHttpUrl(url)) {
      warn?.(`Ignoring invalid FD_SERVER_EXTRA_URLS entry: ${rawLabel}`);
      continue;
    }
    out[label] = url;
  }
  return out;
}

function parseExtraUrls(env: FdServerEnv, warn?: (message: string) => void): Record<string, string> {
  const raw = cleanEnvValue(env.FD_SERVER_EXTRA_URLS);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      warn?.("Ignoring FD_SERVER_EXTRA_URLS because it is not a JSON object.");
      return {};
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        values[key] = value;
      }
    }
    return sanitizeUrlMap(values, warn);
  } catch {
    warn?.("Ignoring FD_SERVER_EXTRA_URLS because it is not valid JSON.");
    return {};
  }
}

export function createFdServerConfig(options: FdServerHandlerOptions): FdServerConfig {
  const env = options.env ?? {};
  const warn = options.warn;
  return {
    defaultLang: parseLang(options.defaultLang ?? cleanEnvValue(env.FD_SERVER_DEFAULT_LANG), "chs"),
    controllerGroup: parseControllerGroup(options.controllerGroup ?? cleanEnvValue(env.FD_SERVER_CONTROLLER_GROUP) ?? "selected"),
    extraUrls: options.extraUrls ? sanitizeUrlMap(options.extraUrls, warn) : parseExtraUrls(env, warn)
  };
}

function cleanPath(pathname: string): string {
  const withoutTrailing = pathname.replaceAll(/\/+$/g, "");
  return withoutTrailing || "/";
}

function hasQueryParam(url: URL, key: string): boolean {
  return url.searchParams.has(key);
}

function queryParam(url: URL, key: string): string {
  return url.searchParams.get(key) ?? "";
}

function positiveLimit(url: URL): number | undefined {
  const raw = url.searchParams.get("limit")?.trim();
  if (!raw) {
    return undefined;
  }
  const limit = Number.parseInt(raw, 10);
  return Number.isFinite(limit) && limit > 0 ? limit : undefined;
}

function unknown(lang: LegacyLang): LegacyUnknown {
  return lang === "eng" ? "Unknown" : "未知";
}

function yesNo(value: boolean, lang: LegacyLang): string {
  return lang === "eng" ? (value ? "Yes" : "No") : (value ? "是" : "否");
}

function label(name: keyof typeof localLabels.eng, lang: LegacyLang): string {
  return localLabels[lang][name] ?? localLabels.eng[name] ?? name;
}

function rawVendor(vendorId: string | undefined): string {
  const normalized = (vendorId || "Unknown").toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  if (normalized === "western" || normalized === "westerndigital" || normalized === "sandisk") {
    return "westerndigital";
  }
  if (normalized === "skhynix" || normalized === "hynix") {
    return "skhynix";
  }
  if (normalized === "yangtze" || normalized === "yangtzememory" || normalized === "yangtzememorytechnologies") {
    return "ymtc";
  }
  return normalized || "Unknown";
}

function displayVendor(vendorId: string | undefined, fallbackName: string | undefined, lang: LegacyLang): string {
  const raw = rawVendor(vendorId);
  if (raw === "unknown") {
    return unknown(lang);
  }
  return legacyVendorNames[lang][raw] ?? legacyVendorNames.eng[raw] ?? fallbackName ?? raw;
}

function allFields(result: { blocks?: { fields: FieldValue[] }[]; fields?: FieldValue[] }): FieldValue[] {
  if (result.blocks) {
    return result.blocks.flatMap((block) => block.fields);
  }
  return result.fields ?? [];
}

function fieldMap(fields: FieldValue[]): Map<string, FieldValue> {
  const map = new Map<string, FieldValue>();
  for (const field of fields) {
    if (!map.has(field.key)) {
      map.set(field.key, field);
    }
  }
  return map;
}

function firstField(fields: Map<string, FieldValue>, keys: string[]): FieldValue | undefined {
  for (const key of keys) {
    const field = fields.get(key);
    if (field) {
      return field;
    }
  }
  return undefined;
}

function displayScalar(value: FdnextFieldValueData, lang: LegacyLang): LegacyScalar {
  if (value === null) {
    return unknown(lang);
  }
  if (typeof value === "boolean") {
    return yesNo(value, lang);
  }
  if (Array.isArray(value)) {
    return value.map((item) => displayScalar(item, lang));
  }
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, displayScalar(item, lang)]));
  }
  return value;
}

function fieldDisplay(field: FieldValue | undefined, lang: LegacyLang): LegacyScalar | undefined {
  if (!field) {
    return undefined;
  }
  return field.display ?? displayScalar(field.value, lang);
}

function fieldDisplayString(field: FieldValue | undefined, lang: LegacyLang): string | undefined {
  const value = fieldDisplay(field, lang);
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
}

function fieldStringList(field: FieldValue | undefined, lang: LegacyLang): string[] {
  if (!field) {
    return [];
  }
  const value = field.display ?? field.value;
  if (Array.isArray(value)) {
    return value.map((item) => String(displayScalar(item, lang))).filter(Boolean);
  }
  if (value == null) {
    return [];
  }
  return [String(displayScalar(value, lang))].filter(Boolean);
}

function humanReadableDensityMbit(value: number): string {
  const units = ["Mb", "Gb", "Tb"] as const;
  let density = value;
  let index = 0;
  while (density >= 1024 && units[index + 1]) {
    density /= 1024;
    index += 1;
  }
  return `${density}${units[index]}`;
}

function densityStringToMbit(value: string): number | undefined {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*([MGT])b$/i);
  if (!match?.[1] || !match[2]) {
    return undefined;
  }
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) {
    return undefined;
  }
  const unit = match[2].toUpperCase();
  if (unit === "M") return amount;
  if (unit === "G") return amount * 1024;
  return amount * 1024 * 1024;
}

function fieldDensityMbit(field: FieldValue | undefined): number | undefined {
  if (!field) {
    return undefined;
  }
  if (typeof field.value === "number" && field.unit === "Mbit") {
    return field.value;
  }
  if (typeof field.value === "string") {
    return densityStringToMbit(field.value);
  }
  return undefined;
}

function legacyPartDensity(fields: Map<string, FieldValue>, lang: LegacyLang): { display: string; raw?: number } {
  const densityField = firstField(fields, ["density", "dram_density", "component_density", "die_density"]);
  const raw = fieldDensityMbit(densityField);
  if (raw && raw > 0) {
    return { display: humanReadableDensityMbit(raw), raw };
  }
  return { display: unknown(lang) };
}

function legacyType(result: PartDecodeResult, lang: LegacyLang): string {
  const productType = result.device?.productType?.toLowerCase();
  if (productType) {
    const productNames: Record<string, string> = {
      emmc: "eMMC",
      ufs: "UFS",
      emcp: "eMCP",
      umcp: "uMCP",
      e2nand: "E2NAND",
      e3nand: "E3NAND",
      lpddr4: "LPDDR4",
      lpddr4x: "LPDDR4X",
      lpddr5: "LPDDR5",
      lpddr5x: "LPDDR5X",
      ddr3: "DDR3",
      ddr4: "DDR4",
      ddr5: "DDR5",
      sata: "SATA SSD",
      nvme: "NVMe SSD"
    };
    return productNames[productType] ?? productType.toUpperCase();
  }
  switch (result.device?.chipKind) {
    case "raw_nand":
      return "NAND";
    case "managed_nand":
      return "NAND with Controller";
    case "3d_xpoint":
      return "3D XPoint";
    case "dram":
      return "DRAM";
    case "nor":
      return "NOR";
    case "controller":
      return "Controller";
    case "pmic":
      return "PMIC";
    default:
      return unknown(lang);
  }
}

function legacyPartNumber(result: PartDecodeResult, rawQuery: string): string {
  const cleaned = rawQuery.replaceAll(/[ ,&.|]+/g, "").toUpperCase();
  if (result.device?.markingCode && result.device.partNumber) {
    return cleaned || result.device.markingCode;
  }
  return result.device?.partNumber ?? cleaned;
}

function classification(fields: Map<string, FieldValue>, lang: LegacyLang): LegacyFlashInfo["classification"] {
  const fallback = unknown(lang);
  return {
    ce: fieldDisplay(firstField(fields, ["ce_count", "cs_count"]), lang) ?? fallback,
    ch: fieldDisplay(firstField(fields, ["channel_count"]), lang) ?? fallback,
    rb: fieldDisplay(firstField(fields, ["rb_count"]), lang) ?? fallback,
    die: fieldDisplay(firstField(fields, ["die_count", "dram_die_count"]), lang) ?? fallback
  };
}

function identifiersFromPart(result: PartDecodeResult): string[] {
  const ids = new Set<string>();
  for (const relation of result.relations) {
    const id = relation.target.identifier;
    if (relation.kind === "identifier_for" && id) {
      ids.add(id);
    }
  }
  return [...ids];
}

function legacyUrlMap(links: ExternalLink[] | undefined, extraUrls: Record<string, string>): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const link of links ?? []) {
    if (link.label && isHttpUrl(link.url)) {
      urls[link.label] = link.url;
    }
  }
  return { ...urls, ...extraUrls };
}

function addExtraInfo(
  out: Record<string, LegacyScalar>,
  key: string,
  value: LegacyScalar | undefined,
  lang: LegacyLang
): void {
  if (!key || value == null || value === "") {
    return;
  }
  if (typeof value === "string" && value === unknown(lang)) {
    return;
  }
  out[key] = value;
}

function partExtraInfo(result: PartDecodeResult, fields: FieldValue[], map: Map<string, FieldValue>, lang: LegacyLang): Record<string, LegacyScalar> {
  const extra: Record<string, LegacyScalar> = {};
  if (result.device?.markingCode && result.device.partNumber) {
    addExtraInfo(extra, label("resolvedPartNumber", lang), result.device.partNumber, lang);
  }
  const densityField = map.get("density");
  if (result.device?.chipKind !== "raw_nand" && densityField?.display) {
    addExtraInfo(extra, label("storageDensity", lang), densityField.display, lang);
  }
  for (const field of fields) {
    if (consumedPartFieldKeys.has(field.key)) {
      continue;
    }
    addExtraInfo(extra, field.label, fieldDisplay(field, lang), lang);
  }
  if (result.status !== "ok" && result.status !== "not_found") {
    addExtraInfo(extra, label("status", lang), result.status, lang);
  }
  if (result.warnings.length > 0) {
    addExtraInfo(extra, label("warnings", lang), result.warnings.map((warning) => warning.message).join("; "), lang);
  }
  return extra;
}

function toLegacyFlashInfo(result: PartDecodeResult, rawQuery: string, lang: LegacyLang, extraUrls: Record<string, string>): LegacyFlashInfo {
  const fields = allFields(result);
  const map = fieldMap(fields);
  const density = legacyPartDensity(map, lang);
  const vendorId = result.device?.vendor.id;
  const raw = rawVendor(vendorId);
  const fallback = unknown(lang);
  const info: LegacyFlashInfo = {
    partNumber: legacyPartNumber(result, rawQuery),
    vendor: displayVendor(vendorId, result.device?.vendor.name, lang),
    type: legacyType(result, lang),
    density: density.display,
    deviceWidth: fieldDisplayString(firstField(map, ["device_width", "dram_width", "component_width"]), lang) ?? fallback,
    processNode: fieldDisplayString(firstField(map, ["process_node", "die_codename"]), lang) ?? fallback,
    cellLevel: fieldDisplayString(map.get("cell_level"), lang) ?? fallback,
    classification: classification(map, lang),
    voltage: fieldDisplayString(firstField(map, ["voltage", "dram_voltage"]), lang) ?? fallback,
    generation: fieldDisplayString(firstField(map, ["generation_info", "product_generation", "dram_generation"]), lang) ?? fallback,
    interface: fieldDisplay(firstField(map, ["interface_type", "storage_interface"]), lang) ?? null,
    package: fieldDisplayString(map.get("package"), lang) ?? fallback,
    extraInfo: partExtraInfo(result, fields, map, lang),
    flashId: identifiersFromPart(result),
    controller: fieldStringList(map.get("controller"), lang),
    remark: result.warnings.length > 0 ? result.warnings.map((warning) => warning.message).join("; ") : fallback,
    url: legacyUrlMap(result.links, extraUrls),
    urls: [],
    rawVendor: raw === "unknown" ? "Unknown" : raw
  };
  if (density.raw !== undefined) {
    info.rawDensity = density.raw;
  }
  return info;
}

function legacyFlashIdFromQuery(rawQuery: string): string {
  const compact = rawQuery.toUpperCase().replaceAll(/[\s,._:-]+/g, "");
  if (!compact) {
    return "";
  }
  return `${compact}${"0".repeat(Math.max(0, 12 - compact.length))}`.slice(0, 12);
}

function identifierPartNumbers(result: IdentifierDecodeResult | SearchResultItem, lang: LegacyLang): string[] {
  const relations = "relations" in result ? result.relations ?? [] : [];
  const values = new Set<string>();
  for (const relation of relations) {
    if (relation.kind !== "identifier_for" || !relation.target.partNumber) {
      continue;
    }
    const vendorId = relation.target.device?.vendor.id
      ?? relation.action?.input.constraints?.vendor
      ?? ("device" in result ? result.device?.vendor.id : undefined);
    const vendorName = relation.target.device?.vendor.name
      ?? ("device" in result ? result.device?.vendor.name : undefined);
    values.add(`${displayVendor(typeof vendorId === "string" ? vendorId : undefined, vendorName, lang)} ${relation.target.partNumber}`);
  }
  return [...values];
}

function pageSizeForDecode(field: FieldValue | undefined, lang: LegacyLang): LegacyScalar {
  if (!field) {
    return unknown(lang);
  }
  if (typeof field.value === "number" && field.unit === "byte") {
    const kb = field.value / 1024;
    return Number.isInteger(kb) ? kb : field.value;
  }
  return fieldDisplay(field, lang) ?? unknown(lang);
}

function pageSizeForSearch(field: FieldValue | undefined, lang: LegacyLang): LegacyScalar {
  if (!field) {
    return unknown(lang);
  }
  if (typeof field.value === "number" && field.unit === "byte") {
    if (field.value >= 1024 && Number.isInteger(field.value / 1024)) {
      return `${field.value / 1024}K`;
    }
    return `${field.value}B`;
  }
  return fieldDisplay(field, lang) ?? unknown(lang);
}

function identifierExtraInfo(fields: FieldValue[], result: IdentifierDecodeResult, lang: LegacyLang): Record<string, LegacyScalar> {
  const ext: Record<string, LegacyScalar> = {};
  for (const field of fields) {
    if (consumedIdentifierFieldKeys.has(field.key)) {
      continue;
    }
    addExtraInfo(ext, field.label, fieldDisplay(field, lang), lang);
  }
  if (result.status !== "ok" && result.status !== "not_found") {
    addExtraInfo(ext, label("status", lang), result.status, lang);
  }
  if (result.warnings.length > 0) {
    addExtraInfo(ext, label("warnings", lang), result.warnings.map((warning) => warning.message).join("; "), lang);
  }
  return ext;
}

function toLegacyFlashIdInfo(result: IdentifierDecodeResult, rawQuery: string, lang: LegacyLang, extraUrls: Record<string, string>): LegacyFlashIdInfo {
  const fields = allFields(result);
  const map = fieldMap(fields);
  const fallback = unknown(lang);
  const vendorId = result.device?.vendor.id;
  const raw = rawVendor(vendorId);
  return {
    id: result.device?.identifier ?? legacyFlashIdFromQuery(rawQuery),
    vendor: displayVendor(vendorId, result.device?.vendor.name, lang),
    density: fieldDensityMbit(map.get("density")) ?? fieldDisplay(map.get("density"), lang) ?? fallback,
    die: fieldDisplay(map.get("die_count"), lang) ?? fallback,
    plane: fieldDisplay(map.get("plane_count"), lang) ?? fallback,
    pageSize: pageSizeForDecode(map.get("page_size"), lang),
    blockSize: fieldDisplay(map.get("block_size"), lang) ?? fallback,
    processNode: fieldDisplayString(firstField(map, ["process_node", "die_codename"]), lang) ?? fallback,
    cellLevel: fieldDisplay(map.get("cell_level"), lang) ?? fallback,
    voltage: fieldDisplayString(map.get("voltage"), lang) ?? fallback,
    ext: identifierExtraInfo(fields, result, lang),
    controllers: fieldStringList(map.get("controller"), lang),
    partNumbers: identifierPartNumbers(result, lang),
    url: legacyUrlMap(result.links, extraUrls),
    urls: [],
    rawVendor: raw === "unknown" ? "Unknown" : raw
  };
}

function legacySearchPart(item: SearchResultItem, lang: LegacyLang): string {
  const vendor = displayVendor(item.device.vendor.id, item.device.vendor.name, lang);
  const partNumber = item.device.partNumber ?? item.label;
  if (item.device.markingCode && partNumber) {
    return `${vendor} ${item.device.markingCode} ${partNumber}`;
  }
  return `${vendor} ${partNumber}`;
}

function toLegacySearchIdItem(
  item: SearchResultItem,
  decoded: IdentifierDecodeResult,
  lang: LegacyLang
): {
  partNumbers: string[];
  pageSize: LegacyScalar;
  pagesPerBlock: LegacyScalar;
  blocks: LegacyScalar;
  controllers: string[];
} {
  const itemMap = fieldMap([...(item.fields ?? []), ...allFields(decoded)]);
  const fallback = unknown(lang);
  return {
    partNumbers: identifierPartNumbers(decoded, lang),
    pageSize: pageSizeForSearch(itemMap.get("page_size"), lang),
    pagesPerBlock: fieldDisplay(itemMap.get("pages_per_block"), lang) ?? fallback,
    blocks: fieldDisplay(itemMap.get("blocks_per_lun"), lang) ?? fallback,
    controllers: fieldStringList(fieldMap(allFields(decoded)).get("controller"), lang)
  };
}

function capabilityMetric(capabilities: FdnextCapabilities, id: string): number {
  return capabilities.inventory.metrics.find((metric) => metric.id === id)?.count ?? 0;
}

function legacyInfo(engine: FdnextEngine): Record<string, unknown> {
  const capabilities = engine.getCapabilities({ lang: "eng" });
  return {
    result: true,
    ver: Number.parseInt(capabilities.fdb.version, 10) || capabilities.fdb.version,
    info: {
      fdb: {
        name: capabilities.fdb.name,
        version: Number.parseInt(capabilities.fdb.version, 10) || capabilities.fdb.version,
        time: capabilities.fdb.time,
        website: capabilities.fdb.website,
        controllers: capabilities.inventory.controllers.items
      },
      flash_cnt: capabilityMetric(capabilities, "part_numbers"),
      id_cnt: capabilityMetric(capabilities, "flash_ids"),
      mdb_cnt: capabilityMetric(capabilities, "micron_fbga")
    }
  };
}

function formatExtra(extra: Record<string, LegacyScalar>): string {
  return Object.entries(extra).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join(", ");
}

function partSummary(data: LegacyFlashInfo): string {
  return [
    `Part Number: ${data.partNumber}, Vendor: ${data.vendor}, Type: ${data.type}, Density: ${data.density}`,
    `Device Width: ${data.deviceWidth}, Cell Level: ${data.cellLevel}, Process Node: ${data.processNode}, Generation: ${data.generation}`,
    `CE: ${data.classification.ce}, Ch: ${data.classification.ch}, Die: ${data.classification.die}, R/B: ${data.classification.rb}`,
    `Voltage: ${data.voltage}`,
    `Package: ${data.package}`,
    `Controller: ${data.controller.join(", ")}`,
    `Remark: ${data.remark}`,
    `Additional Info: ${formatExtra(data.extraInfo)}`,
    `Flash ID: ${data.flashId.join(", ")}`,
    "Powered by fdnext-fd-server"
  ].join("\n");
}

function idSummary(data: LegacyFlashIdInfo): string {
  return [
    `FlashId: ${data.id}, Vendor: ${data.vendor}, Cell Level: ${data.cellLevel}, Density: ${data.density}`,
    `Process Node: ${data.processNode}, Die: ${data.die}, Plane: ${data.plane}, Voltage: ${data.voltage}`,
    `Page Size: ${data.pageSize}, Block Size: ${data.blockSize}`,
    `Controllers: ${data.controllers.join(", ")}`,
    `Additional Info: ${formatExtra(data.ext)}`,
    `Part Numbers: ${data.partNumbers.join(", ")}`,
    "Powered by fdnext-fd-server"
  ].join("\n");
}

export function fdServerJson(body: unknown, code = 200): FdServerHttpResponse {
  return { body, code };
}

export function handleFdServerUrl(engine: FdnextEngine, config: FdServerConfig, url: URL): FdServerHttpResponse {
  const path = cleanPath(url.pathname);
  const lang = requestLang(url, config.defaultLang);

  if (path === "/") {
    return fdServerJson({ result: true, time: Math.floor(Date.now() / 1000), server: FD_SERVER_NAME });
  }
  if (path === "/info") {
    return fdServerJson(legacyInfo(engine));
  }
  if (path === "/decode") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const result = engine.decodePart({ query: pn, lang, controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: toLegacyFlashInfo(result, pn, lang, config.extraUrls) });
  }
  if (path === "/decodeId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const result = engine.decodeIdentifier({ query: id, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: toLegacyFlashIdInfo(result, id, lang, config.extraUrls) });
  }
  if (path === "/searchPn") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const limit = positiveLimit(url);
    const result: PartSearchResult = engine.searchParts({ query: pn, lang, ...(limit ? { limit } : {}) });
    return fdServerJson({ result: true, data: result.items.map((item) => legacySearchPart(item, lang)) });
  }
  if (path === "/searchId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const limit = positiveLimit(url);
    const result: IdentifierSearchResult = engine.searchIdentifiers({ query: id, lang, idScheme: "nand.flash_id", ...(limit ? { limit } : {}) });
    const data: Record<string, ReturnType<typeof toLegacySearchIdItem>> = {};
    for (const item of result.items) {
      const identifier = item.device.identifier ?? item.label;
      const decoded = engine.decodeIdentifier({ query: identifier, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
      data[identifier] = toLegacySearchIdItem(item, decoded, lang);
    }
    return fdServerJson({ result: true, data });
  }
  if (path === "/summary") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const result = engine.decodePart({ query: pn, lang, controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: partSummary(toLegacyFlashInfo(result, pn, lang, config.extraUrls)) });
  }
  if (path === "/summaryId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const result = engine.decodeIdentifier({ query: id, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: idSummary(toLegacyFlashIdInfo(result, id, lang, config.extraUrls)) });
  }

  return fdServerJson({ result: false, message: "Not found" });
}

function toFetchResponse(response: FdServerHttpResponse): Response {
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json");
  return new Response(
    response.code === 204 || response.body === undefined ? null : JSON.stringify(response.body),
    { status: response.code, headers }
  );
}

export function handleFdServerFetchRequest(engine: FdnextEngine, config: FdServerConfig, request: Request): Response {
  if (request.method === "OPTIONS") {
    return toFetchResponse(fdServerJson(undefined, 204));
  }
  if (request.method !== "GET") {
    return toFetchResponse(fdServerJson({ result: false, message: "Not found" }));
  }
  return toFetchResponse(handleFdServerUrl(engine, config, new URL(request.url)));
}

export function createFdServerHandler(options: FdServerHandlerOptions = {}): FdServerHandler {
  const config = createFdServerConfig(options);
  const engine = options.engine ?? createEngine();
  return {
    engine,
    config,
    handleUrl: (url) => handleFdServerUrl(engine, config, url),
    handleRequest: (request) => handleFdServerFetchRequest(engine, config, request)
  };
}
