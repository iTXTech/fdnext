import type { ControllerMergeContext } from "./controllers/types";
import { normalizeFdbVendorName, normalizeSupportFlashId } from "./normalize";
import { normalizeSupportListControllerName, parseSupportListControllerList } from "./support-list";
import { mergeSupportListEntry } from "./support-list";

export const FDNEXT_FDBGEN_V1_COMPACT_VERSION = "fdnext.fdbgen.v1c";
export const FDNEXT_FDBGEN_V1_FULL_VERSION = "fdnext.fdbgen.v1f";

export type FdnextFdbgenV1Version = typeof FDNEXT_FDBGEN_V1_COMPACT_VERSION | typeof FDNEXT_FDBGEN_V1_FULL_VERSION;
export type FdnextFdbgenV1Kind = "compact" | "full";

export interface FdnextFdbgenV1Entry {
  partNumber?: string;
  flashId?: string;
  controllers: string[];
  vendor?: string;
  cellLevel?: string;
  capacity?: string;
  package?: string;
  width?: string;
  metadata?: Record<string, unknown>;
}

export interface FdnextFdbgenV1Controller {
  name?: string;
  aliases: string[];
  maker?: string;
  interfaceName?: string;
  firmware?: string;
  revision?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface FdnextFdbgenV1Document {
  version: FdnextFdbgenV1Version;
  kind: FdnextFdbgenV1Kind;
  entries: FdnextFdbgenV1Entry[];
  controllers: FdnextFdbgenV1Controller[];
  metadata?: Record<string, unknown>;
}

export type FdnextFdbgenV1EntryMapper = (
  entry: FdnextFdbgenV1Entry,
  context: ControllerMergeContext
) => FdnextFdbgenV1Entry | null | undefined;

export interface FdnextFdbgenV1MergeOptions {
  requireSupportedFlashIdPrefix?: boolean;
  mapEntry?: FdnextFdbgenV1EntryMapper;
}

export interface FdnextFdbgenV1MergeResult {
  controllers: string[];
  entries: number;
  imported: number;
}

export interface FdnextFdbgenV1BuildEntryInput {
  pn?: unknown;
  partNumber?: unknown;
  flashName?: unknown;
  FlashName?: unknown;
  id?: unknown;
  flashId?: unknown;
  FlashID?: unknown;
  t?: unknown;
  controllers?: unknown;
  SupportedControllers?: unknown;
  vd?: unknown;
  vendor?: unknown;
  Vendor?: unknown;
  c?: unknown;
  cell?: unknown;
  cap?: unknown;
  capacity?: unknown;
  pkg?: unknown;
  package?: unknown;
  w?: unknown;
  width?: unknown;
  m?: unknown;
  metadata?: unknown;
}

export interface FdnextFdbgenV1BuildControllerInput {
  n?: unknown;
  name?: unknown;
  controller?: unknown;
  Controller?: unknown;
  a?: unknown;
  aliases?: unknown;
  Aliases?: unknown;
  mf?: unknown;
  maker?: unknown;
  Manufacturer?: unknown;
  if?: unknown;
  interface?: unknown;
  Interface?: unknown;
  fw?: unknown;
  firmware?: unknown;
  Firmware?: unknown;
  rev?: unknown;
  revision?: unknown;
  Revision?: unknown;
  st?: unknown;
  status?: unknown;
  Status?: unknown;
  m?: unknown;
  metadata?: unknown;
}

export interface FdnextFdbgenV1BuildOptions {
  mode?: FdnextFdbgenV1Kind;
  format?: FdnextFdbgenV1Kind;
  full?: boolean;
  controllers?: readonly unknown[];
  m?: unknown;
  metadata?: unknown;
}

export interface FdnextFdbgenV1RawCompactEntry {
  pn?: string;
  id?: string;
  t?: string[];
}

export interface FdnextFdbgenV1RawFullEntry extends FdnextFdbgenV1RawCompactEntry {
  vd?: string;
  c?: string;
  cap?: string;
  pkg?: string;
  w?: string;
  m?: Record<string, unknown>;
}

export interface FdnextFdbgenV1RawController {
  n?: string;
  a?: string[];
  mf?: string;
  if?: string;
  fw?: string;
  rev?: string;
  st?: string;
  m?: Record<string, unknown>;
}

export interface FdnextFdbgenV1RawCompactDocument {
  v: typeof FDNEXT_FDBGEN_V1_COMPACT_VERSION;
  e: FdnextFdbgenV1RawCompactEntry[];
}

export interface FdnextFdbgenV1RawFullDocument {
  v: typeof FDNEXT_FDBGEN_V1_FULL_VERSION;
  cl: FdnextFdbgenV1RawController[];
  e: FdnextFdbgenV1RawFullEntry[];
  m?: Record<string, unknown>;
}

export type FdnextFdbgenV1RawDocument = FdnextFdbgenV1RawCompactDocument | FdnextFdbgenV1RawFullDocument;

const FDNEXT_FDBGEN_V1_VERSIONS = new Set<string>([FDNEXT_FDBGEN_V1_COMPACT_VERSION, FDNEXT_FDBGEN_V1_FULL_VERSION]);
const FDBGEN_V1_COMPAT_DASH = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g;
const FDBGEN_V1_VENDOR_BY_ID_PREFIX: Record<string, string> = {
  "2C": "micron",
  "45": "sndk",
  "89": "intel",
  "98": "kioxia",
  AD: "skhynix",
  EC: "samsung",
  C8: "ymtc"
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value.trim();
  return text ? text : undefined;
}

function readMetadata(value: unknown): Record<string, unknown> | undefined {
  return asRecord(value) ?? undefined;
}

export function isFdnextFdbgenV1Version(value: unknown): value is FdnextFdbgenV1Version {
  return typeof value === "string" && FDNEXT_FDBGEN_V1_VERSIONS.has(value);
}

export function normalizeFdnextFdbgenV1FlashId(value: unknown): string | undefined {
  const text = readString(value);
  return text ? normalizeSupportFlashId(text, true) : undefined;
}

export function normalizeFdnextFdbgenV1Text(value: unknown): string {
  return String(value ?? "").normalize("NFKC").replace(FDBGEN_V1_COMPAT_DASH, "-");
}

export function normalizeFdnextFdbgenV1BuildFlashId(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const hex = String(value).replace(/[^0-9a-f]/gi, "").toUpperCase();
  if (!hex || hex.length % 2 !== 0 || hex.length < 4 || hex.length > 16) {
    return undefined;
  }
  return hex;
}

export function normalizeFdnextFdbgenV1PartNumber(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  let text = normalizeFdnextFdbgenV1Text(value).trim();
  if (!text) {
    return undefined;
  }
  text = text.split("--")[0]!.trim();
  text = text.replace(/\(.*$/, "").trim();
  text = text.replace(/\s+/g, "");
  text = text.replace(/[;,]+$/, "");
  if (!/[a-z0-9]/i.test(text)) {
    return undefined;
  }
  return text.toUpperCase();
}

export function normalizeFdnextFdbgenV1VendorHint(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (/micron/.test(text)) return "micron";
  if (/spectek/.test(text)) return "spectek";
  if (/intel|pf29/.test(text)) return "intel";
  if (/samsung/.test(text)) return "samsung";
  if (/sk\s*hynix|hynix/.test(text)) return "skhynix";
  if (/kioxia|toshiba/.test(text)) return "kioxia";
  if (/sandisk|san\s*disk|western\s*digital|\bwd\b/.test(text)) return "sndk";
  if (/ymtc/.test(text)) return "ymtc";
  const normalized = normalizeFdbVendorName(text.replace(/[^a-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, ""));
  return normalized || undefined;
}

export function inferFdnextFdbgenV1VendorFromFlashId(flashId: unknown): string | undefined {
  const normalized = normalizeFdnextFdbgenV1BuildFlashId(flashId);
  return normalized ? FDBGEN_V1_VENDOR_BY_ID_PREFIX[normalized.slice(0, 2)] : undefined;
}

export function inferFdnextFdbgenV1VendorFromPartNumber(partNumber: unknown): string | undefined {
  const pn = normalizeFdnextFdbgenV1PartNumber(partNumber);
  if (!pn) {
    return undefined;
  }
  if (/^(MT29|NW|NY|NX|NQ|NC|NV)/.test(pn)) return "micron";
  if (/^PF29/.test(pn)) return "intel";
  if (/^K9/.test(pn)) return "samsung";
  if (/^(H27|H26|HY27)/.test(pn)) return "skhynix";
  if (/^(TH|TC58)/.test(pn)) return "kioxia";
  if (/^(SDUN|SDTN|05[0-9]{3})/.test(pn)) return "sndk";
  return undefined;
}

export function normalizeFdnextFdbgenV1ControllerName(value: unknown): string | undefined {
  return normalizeSupportListControllerName(value);
}

export function parseFdnextFdbgenV1ControllerList(value: unknown): string[] {
  return parseSupportListControllerList(value);
}

export function normalizeFdnextFdbgenV1Mode(options: FdnextFdbgenV1BuildOptions = {}): FdnextFdbgenV1Kind {
  if (options.mode === "full" || options.format === "full") {
    return "full";
  }
  if (options.mode === "compact" || options.format === "compact") {
    return "compact";
  }
  return options.full ? "full" : "compact";
}

function asBuildEntryInput(value: unknown): FdnextFdbgenV1BuildEntryInput {
  return asRecord(value) as FdnextFdbgenV1BuildEntryInput | null ?? {};
}

function asBuildControllerInput(value: unknown): FdnextFdbgenV1BuildControllerInput {
  return asRecord(value) as FdnextFdbgenV1BuildControllerInput | null ?? {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null || value === "" ? [] : [value];
}

function uniqueStrings(value: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of asArray(value)) {
    const text = readString(item);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    out.push(text);
  }
  return out;
}

function cleanObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null || item === "") {
      continue;
    }
    if (Array.isArray(item) && item.length === 0) {
      continue;
    }
    if (item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length === 0) {
      continue;
    }
    out[key as keyof T] = item as T[keyof T];
  }
  return out;
}

function metadataFrom(value: FdnextFdbgenV1BuildEntryInput | FdnextFdbgenV1BuildControllerInput | FdnextFdbgenV1BuildOptions): Record<string, unknown> | undefined {
  const merged = {
    ...(asRecord(value.m) ?? {}),
    ...(asRecord(value.metadata) ?? {})
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function buildFdnextFdbgenV1CompactEntry(input: unknown): FdnextFdbgenV1RawCompactEntry {
  const source = asBuildEntryInput(input);
  return cleanObject({
    pn: normalizeFdnextFdbgenV1PartNumber(source.pn ?? source.partNumber ?? source.flashName ?? source.FlashName),
    id: normalizeFdnextFdbgenV1BuildFlashId(source.id ?? source.flashId ?? source.FlashID),
    t: uniqueStrings(source.t ?? source.controllers ?? source.SupportedControllers)
  }) as FdnextFdbgenV1RawCompactEntry;
}

export function buildFdnextFdbgenV1FullEntry(input: unknown): FdnextFdbgenV1RawFullEntry {
  const source = asBuildEntryInput(input);
  const entry = buildFdnextFdbgenV1CompactEntry(source);
  return cleanObject({
    ...entry,
    vd:
      normalizeFdnextFdbgenV1VendorHint(source.vd ?? source.vendor ?? source.Vendor) ??
      inferFdnextFdbgenV1VendorFromFlashId(entry.id) ??
      inferFdnextFdbgenV1VendorFromPartNumber(entry.pn),
    c: readString(source.c ?? source.cell),
    cap: readString(source.cap ?? source.capacity),
    pkg: readString(source.pkg ?? source.package),
    w: readString(source.w ?? source.width),
    m: metadataFrom(source)
  }) as FdnextFdbgenV1RawFullEntry;
}

export function buildFdnextFdbgenV1Controller(input: unknown): FdnextFdbgenV1RawController {
  if (typeof input === "string") {
    return { n: input.trim() };
  }
  const source = asBuildControllerInput(input);
  return cleanObject({
    n: readString(source.n ?? source.name ?? source.controller ?? source.Controller),
    a: uniqueStrings(source.a ?? source.aliases ?? source.Aliases),
    mf: readString(source.mf ?? source.maker ?? source.Manufacturer),
    if: readString(source.if ?? source.interface ?? source.Interface),
    fw: readString(source.fw ?? source.firmware ?? source.Firmware),
    rev: readString(source.rev ?? source.revision ?? source.Revision),
    st: readString(source.st ?? source.status ?? source.Status),
    m: metadataFrom(source)
  }) as FdnextFdbgenV1RawController;
}

function controllerNamesFromEntries(entries: readonly unknown[]): string[] {
  return uniqueStrings(entries.flatMap((entry) => {
    const source = asBuildEntryInput(entry);
    return uniqueStrings(source.t ?? source.controllers ?? source.SupportedControllers);
  }));
}

export function buildFdnextFdbgenV1ControllerList(entries: readonly unknown[], controllers: readonly unknown[] = []): FdnextFdbgenV1RawController[] {
  const byName = new Map<string, FdnextFdbgenV1RawController>();
  for (const controller of controllers) {
    const definition = buildFdnextFdbgenV1Controller(controller);
    if (definition.n) {
      byName.set(definition.n, definition);
    }
  }
  for (const name of controllerNamesFromEntries(entries)) {
    if (!byName.has(name)) {
      byName.set(name, { n: name });
    }
  }
  return [...byName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, controller]) => controller);
}

export function buildFdnextFdbgenV1SupportList(entries: readonly unknown[], options: FdnextFdbgenV1BuildOptions = {}): FdnextFdbgenV1RawDocument {
  const mode = normalizeFdnextFdbgenV1Mode(options);
  if (mode === "full") {
    const document: FdnextFdbgenV1RawFullDocument = {
      v: FDNEXT_FDBGEN_V1_FULL_VERSION,
      cl: buildFdnextFdbgenV1ControllerList(entries, options.controllers ?? []),
      e: entries.map(buildFdnextFdbgenV1FullEntry).filter((entry) => Object.keys(entry).length > 0)
    };
    const metadata = metadataFrom(options);
    if (metadata) {
      document.m = metadata;
    }
    return document;
  }
  return {
    v: FDNEXT_FDBGEN_V1_COMPACT_VERSION,
    e: entries.map(buildFdnextFdbgenV1CompactEntry).filter((entry) => Object.keys(entry).length > 0)
  };
}

function parseEntry(value: unknown): FdnextFdbgenV1Entry | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const entry: FdnextFdbgenV1Entry = {
    controllers: parseFdnextFdbgenV1ControllerList(record.t)
  };
  const partNumber = readString(record.pn);
  const flashId = normalizeFdnextFdbgenV1FlashId(record.id);
  const vendor = readString(record.vd);
  const cellLevel = readString(record.c);
  const capacity = readString(record.cap);
  const packageName = readString(record.pkg);
  const width = readString(record.w);
  const metadata = readMetadata(record.m);

  if (partNumber) entry.partNumber = partNumber;
  if (flashId) entry.flashId = flashId;
  if (vendor) entry.vendor = vendor;
  if (cellLevel) entry.cellLevel = cellLevel;
  if (capacity) entry.capacity = capacity;
  if (packageName) entry.package = packageName;
  if (width) entry.width = width;
  if (metadata) entry.metadata = metadata;

  return entry.controllers.length > 0 ||
    Boolean(entry.partNumber ?? entry.flashId ?? entry.vendor ?? entry.cellLevel ?? entry.capacity ?? entry.package ?? entry.width ?? entry.metadata)
    ? entry
    : null;
}

function parseController(value: unknown): FdnextFdbgenV1Controller | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const controller: FdnextFdbgenV1Controller = {
    aliases: parseFdnextFdbgenV1ControllerList(record.a)
  };
  const name = normalizeFdnextFdbgenV1ControllerName(record.n);
  const maker = readString(record.mf);
  const interfaceName = readString(record.if);
  const firmware = readString(record.fw);
  const revision = readString(record.rev);
  const status = readString(record.st);
  const metadata = readMetadata(record.m);

  if (name) controller.name = name;
  if (maker) controller.maker = maker;
  if (interfaceName) controller.interfaceName = interfaceName;
  if (firmware) controller.firmware = firmware;
  if (revision) controller.revision = revision;
  if (status) controller.status = status;
  if (metadata) controller.metadata = metadata;

  return controller.aliases.length > 0 ||
    Boolean(controller.name ?? controller.maker ?? controller.interfaceName ?? controller.firmware ?? controller.revision ?? controller.status ?? controller.metadata)
    ? controller
    : null;
}

function parseEntries(value: unknown): FdnextFdbgenV1Entry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const entry = parseEntry(item);
    return entry ? [entry] : [];
  });
}

function parseControllers(value: unknown): FdnextFdbgenV1Controller[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const controller = parseController(item);
    return controller ? [controller] : [];
  });
}

export function parseFdnextFdbgenV1(input: unknown): FdnextFdbgenV1Document | null {
  const source = asRecord(input);
  if (!source || !isFdnextFdbgenV1Version(source.v) || !Array.isArray(source.e)) {
    return null;
  }

  const version = source.v;
  const kind: FdnextFdbgenV1Kind = version === FDNEXT_FDBGEN_V1_FULL_VERSION ? "full" : "compact";
  const out: FdnextFdbgenV1Document = {
    version,
    kind,
    entries: parseEntries(source.e),
    controllers: kind === "full" ? parseControllers(source.cl) : []
  };
  const metadata = kind === "full" ? readMetadata(source.m) : undefined;
  if (metadata) {
    out.metadata = metadata;
  }
  return out;
}

export function parseFdnextFdbgenV1Json(data: string): FdnextFdbgenV1Document | null {
  return parseFdnextFdbgenV1(JSON.parse(data) as unknown);
}

export function mergeFdnextFdbgenV1Document(
  context: ControllerMergeContext,
  document: FdnextFdbgenV1Document,
  options: FdnextFdbgenV1MergeOptions = {}
): FdnextFdbgenV1MergeResult {
  const controllers = new Set<string>();
  if (document.kind === "full") {
    for (const { name } of document.controllers) {
      if (name) controllers.add(name);
    }
  }

  let imported = 0;
  for (let index = 0; index < document.entries.length; index += 1) {
    const sourceEntry = document.entries[index]!;
    const entry = options.mapEntry ? options.mapEntry(sourceEntry, context) : sourceEntry;
    if (!entry) {
      continue;
    }
    const result = context.withSource({ recordIndex: index + 1, raw: JSON.stringify(sourceEntry) }, () => {
      return mergeSupportListEntry(context, {
        vendor: entry.vendor,
        partNumber: entry.partNumber,
        flashId: entry.flashId,
        controllers: entry.controllers,
        cellLevel: entry.cellLevel,
        strictFlashId: true,
        requireSupportedFlashIdPrefix: options.requireSupportedFlashIdPrefix
      });
    });
    if (result.imported) {
      imported += 1;
    }
    for (const controller of result.controllers) {
      controllers.add(controller);
    }
  }

  if (controllers.size > 0) {
    context.addInfoController([...controllers]);
  }

  return {
    controllers: [...controllers],
    entries: document.entries.length,
    imported
  };
}

export function mergeFdnextFdbgenV1SupportList(
  context: ControllerMergeContext,
  input: unknown,
  options: FdnextFdbgenV1MergeOptions = {}
): FdnextFdbgenV1MergeResult | null {
  const document = parseFdnextFdbgenV1(input);
  return document ? mergeFdnextFdbgenV1Document(context, document, options) : null;
}
