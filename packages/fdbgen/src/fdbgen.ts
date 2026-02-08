import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import type { ExtraPayload, FdbInfoPayload, FlashIdPayload, GenerateFdbOptions, PartNumberPayload } from "./types";

const VENDOR_PATCH: Record<string, string> = {
  sandisk: "westerndigital",
  toshiba: "kioxia",
  "toshiba-iver": "kioxia",
  sndk: "westerndigital",
  hynix: "skhynix"
};

type PartNumberMap = Map<string, PartNumberPayload>;
type VendorMap = Map<string, PartNumberMap>;
type FlashIdMap = Map<string, FlashIdPayload>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

function normalizePartNumber(partNumber: string): string {
  return partNumber.trim().toUpperCase();
}

function normalizeFlashId(id: string): string {
  return id.trim().toUpperCase();
}

function toStringArray(value: unknown, toUpper = false): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    out.push(toUpper ? text.toUpperCase() : text);
  }
  return out;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mergeStringArray(target: string[] | undefined, source: string[], toUpper = false): string[] {
  const set = new Set<string>();
  for (const item of target ?? []) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    set.add(toUpper ? text.toUpperCase() : text);
  }
  for (const item of source) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    set.add(toUpper ? text.toUpperCase() : text);
  }
  return [...set];
}

function mergePartNumber(target: PartNumberPayload | undefined, source: unknown): PartNumberPayload {
  const src = asRecord(source);
  const out: PartNumberPayload = { ...(target ?? {}) };

  const ids = toStringArray(src.id, true);
  if (ids.length > 0) {
    out.id = mergeStringArray(out.id, ids, true);
  }

  const controllers = toStringArray(src.t, false);
  if (controllers.length > 0) {
    out.t = mergeStringArray(out.t, controllers, false);
  }

  if (typeof src.l === "string") {
    out.l = src.l;
  }
  if (typeof src.c === "string") {
    out.c = src.c;
  }
  if (typeof src.m === "string") {
    out.m = src.m;
  }

  const d = toOptionalNumber(src.d);
  const e = toOptionalNumber(src.e);
  const r = toOptionalNumber(src.r);
  const n = toOptionalNumber(src.n);
  if (d !== undefined) out.d = d;
  if (e !== undefined) out.e = e;
  if (r !== undefined) out.r = r;
  if (n !== undefined) out.n = n;

  return out;
}

function mergeFlashId(target: FlashIdPayload | undefined, source: unknown): FlashIdPayload {
  const src = asRecord(source);
  const out: FlashIdPayload = { ...(target ?? {}) };

  const partNumbers = toStringArray(src.n, false);
  if (partNumbers.length > 0) {
    out.n = mergeStringArray(out.n, partNumbers, false);
  }

  const controllers = toStringArray(src.t, false);
  if (controllers.length > 0) {
    out.t = mergeStringArray(out.t, controllers, false);
  }

  const s = toOptionalNumber(src.s);
  const p = toOptionalNumber(src.p);
  const b = toOptionalNumber(src.b);
  if (s !== undefined) out.s = s;
  if (p !== undefined) out.p = p;
  if (b !== undefined) out.b = b;

  return out;
}

function ensureVendor(vendors: VendorMap, vendor: string): PartNumberMap {
  const normalized = normalizeVendor(vendor);
  const existing = vendors.get(normalized);
  if (existing) {
    return existing;
  }
  const created = new Map<string, PartNumberPayload>();
  vendors.set(normalized, created);
  return created;
}

function mergeVendorRecord(vendors: VendorMap, vendor: string, record: unknown): void {
  const vendorMap = ensureVendor(vendors, vendor);
  for (const [pn, payload] of Object.entries(asRecord(record))) {
    const normalizedPn = normalizePartNumber(pn);
    const next = mergePartNumber(vendorMap.get(normalizedPn), payload);
    vendorMap.set(normalizedPn, next);
  }
}

function mergeIddbRecord(iddb: FlashIdMap, record: unknown): void {
  for (const [flashId, payload] of Object.entries(asRecord(record))) {
    const normalizedId = normalizeFlashId(flashId);
    const next = mergeFlashId(iddb.get(normalizedId), payload);
    iddb.set(normalizedId, next);
  }
}

function readJsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => extname(file).toLowerCase() === ".json")
    .sort()
    .map((file) => resolve(dir, file));
}

function loadMeta(inputDir: string, metaFile?: string): FdbInfoPayload {
  const metaPath = metaFile ? resolve(metaFile) : resolve(inputDir, "meta.json");
  if (!existsSync(metaPath)) {
    return {};
  }
  const raw = asRecord(readJson(metaPath));
  if ("info" in raw) {
    return asRecord(raw.info) as FdbInfoPayload;
  }
  return raw as FdbInfoPayload;
}

function loadExtra(inputDir: string, extraFile?: string): ExtraPayload {
  const extraPath = extraFile ? resolve(extraFile) : resolve(inputDir, "extra.json");
  if (!existsSync(extraPath)) {
    return {};
  }
  return asRecord(readJson(extraPath)) as ExtraPayload;
}

function loadInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap): void {
  const fdbPath = resolve(inputDir, "fdb.json");
  if (existsSync(fdbPath)) {
    const source = asRecord(readJson(fdbPath));
    mergeIddbRecord(iddb, source.iddb);
    for (const [key, value] of Object.entries(source)) {
      if (key === "info" || key === "iddb") {
        continue;
      }
      mergeVendorRecord(vendors, key, value);
    }
  }

  const vendorsDir = resolve(inputDir, "vendors");
  if (existsSync(vendorsDir)) {
    for (const file of readJsonFiles(vendorsDir)) {
      const vendor = normalizeVendor(basename(file, ".json"));
      mergeVendorRecord(vendors, vendor, readJson(file));
    }
  }

  const iddbDir = resolve(inputDir, "iddb");
  if (existsSync(iddbDir)) {
    for (const file of readJsonFiles(iddbDir)) {
      mergeIddbRecord(iddb, readJson(file));
    }
  }

  const flashIdsDir = resolve(inputDir, "flashids");
  if (existsSync(flashIdsDir)) {
    for (const file of readJsonFiles(flashIdsDir)) {
      mergeIddbRecord(iddb, readJson(file));
    }
  }
}

function applyExtra(extra: ExtraPayload, vendors: VendorMap, iddb: FlashIdMap): void {
  if (extra.vendors) {
    for (const [vendor, record] of Object.entries(extra.vendors)) {
      mergeVendorRecord(vendors, vendor, record);
    }
  }
  if (extra.iddb) {
    mergeIddbRecord(iddb, extra.iddb);
  }
}

function sortObjectKeys<T>(input: Record<string, T>): Record<string, T> {
  const output: Record<string, T> = {};
  for (const key of Object.keys(input).sort()) {
    output[key] = input[key] as T;
  }
  return output;
}

function buildOutput(infoInput: FdbInfoPayload, vendors: VendorMap, iddb: FlashIdMap): Record<string, unknown> {
  const controllers = new Set<string>(toStringArray(infoInput.controllers, false));

  for (const [vendor, parts] of vendors.entries()) {
    for (const [partNumber, partInfo] of parts.entries()) {
      for (const controller of partInfo.t ?? []) {
        controllers.add(controller);
      }
      for (const id of partInfo.id ?? []) {
        const normalizedId = normalizeFlashId(id);
        const flash = iddb.get(normalizedId) ?? {};
        flash.n = mergeStringArray(flash.n, [`${vendor} ${partNumber}`], false);
        iddb.set(normalizedId, flash);
      }
    }
  }

  for (const flash of iddb.values()) {
    for (const controller of flash.t ?? []) {
      controllers.add(controller);
    }
  }

  const info = {
    name: infoInput.name ?? "iTXTech FlashDetector Flash Database",
    website: infoInput.website ?? "https://github.com/iTXTech/FlashDetector",
    version: infoInput.version ?? "Undefined",
    time: infoInput.time ?? new Date().toUTCString(),
    controllers: [...controllers].sort()
  };

  const outputIddb: Record<string, FlashIdPayload> = {};
  for (const [id, payload] of [...iddb.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    outputIddb[id] = {
      ...(payload.s !== undefined ? { s: payload.s } : {}),
      ...(payload.p !== undefined ? { p: payload.p } : {}),
      ...(payload.b !== undefined ? { b: payload.b } : {}),
      ...(payload.t && payload.t.length > 0 ? { t: [...new Set(payload.t)].sort() } : {}),
      ...(payload.n && payload.n.length > 0 ? { n: [...new Set(payload.n)].sort() } : {})
    };
  }

  const output: Record<string, unknown> = {
    info,
    iddb: outputIddb
  };

  for (const [vendor, records] of [...vendors.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const vendorOutput: Record<string, PartNumberPayload> = {};
    for (const [pn, payload] of [...records.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const normalized: PartNumberPayload = {
        ...(payload.id && payload.id.length > 0 ? { id: [...new Set(payload.id)].sort() } : {}),
        ...(payload.l !== undefined ? { l: payload.l } : {}),
        ...(payload.c !== undefined ? { c: payload.c } : {}),
        ...(payload.t && payload.t.length > 0 ? { t: [...new Set(payload.t)].sort() } : {}),
        ...(payload.m !== undefined ? { m: payload.m } : {}),
        ...(payload.d !== undefined ? { d: payload.d } : {}),
        ...(payload.e !== undefined ? { e: payload.e } : {}),
        ...(payload.r !== undefined ? { r: payload.r } : {}),
        ...(payload.n !== undefined ? { n: payload.n } : {})
      };
      vendorOutput[pn] = normalized;
    }
    output[vendor] = sortObjectKeys(vendorOutput);
  }

  return output;
}

export function generateFdb(options: GenerateFdbOptions): Record<string, unknown> {
  const inputDir = resolve(options.inputDir);
  if (!existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  const vendors: VendorMap = new Map();
  const iddb: FlashIdMap = new Map();
  loadInputDirectory(inputDir, vendors, iddb);

  const meta = loadMeta(inputDir, options.metaFile);
  const extra = loadExtra(inputDir, options.extraFile);
  applyExtra(extra, vendors, iddb);

  const infoInput: FdbInfoPayload = {
    ...meta,
    ...(extra.info ?? {}),
    ...(options.name ? { name: options.name } : {}),
    ...(options.website ? { website: options.website } : {}),
    ...(options.version ? { version: options.version } : {}),
    ...(options.time ? { time: options.time } : {})
  };

  const output = buildOutput(infoInput, vendors, iddb);

  if (options.outputFile) {
    const outputFile = resolve(options.outputFile);
    mkdirSync(resolve(outputFile, ".."), { recursive: true });
    const formatted = options.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    writeFileSync(outputFile, `${formatted}\n`, "utf8");
  }

  return output;
}
