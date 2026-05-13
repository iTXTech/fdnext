import type { ControllerMergeContext } from "./controllers/types";
import { normalizeSupportFlashId } from "./normalize";
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

const FDNEXT_FDBGEN_V1_VERSIONS = new Set<string>([FDNEXT_FDBGEN_V1_COMPACT_VERSION, FDNEXT_FDBGEN_V1_FULL_VERSION]);
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

export function normalizeFdnextFdbgenV1ControllerName(value: unknown): string | undefined {
  return normalizeSupportListControllerName(value);
}

export function parseFdnextFdbgenV1ControllerList(value: unknown): string[] {
  return parseSupportListControllerList(value);
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
