import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { CONTROLLER_GENERATORS, type ControllerMergeContext } from "./controllers";
import type { ExtraPayload, FdbInfoPayload, FlashIdPayload, GenerateFdbOptions, PartNumberPayload } from "./types";
import { inferVendorFromPartNumber, normalizeKnownPackage, normalizeVendor } from "./vendors";

type PartNumberMap = Map<string, PartNumberPayload>;
type VendorMap = Map<string, PartNumberMap>;
type FlashIdMap = Map<string, FlashIdPayload>;

const DEFAULT_CONTROLLER_BLACKLIST = ["3281FL", "3379FL"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizePartNumber(partNumber: string): string {
  let normalized = partNumber
    .trim()
    .toUpperCase()
    .replace(/\uFFFD/g, "-")
    .replace(/[ ,&.|]/g, "");
  normalized = normalized.replace(/^EMT29F/, "MT29F");
  while (/\*[0-9A-Z]*$/i.test(normalized)) {
    normalized = normalized.replace(/\*[0-9A-Z]*$/i, "");
  }
  return normalized.includes("*") ? "" : normalized;
}

function normalizeFlashId(id: string): string | null {
  const normalized = id.replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return null;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : null;
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

function toFlashIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const normalized = normalizeFlashId(String(item));
    if (normalized) {
      out.push(normalized);
    }
  }
  return out;
}

function normalizePartReference(value: unknown): string | null {
  const text = String(value).trim();
  const match = /^(\S+)\s+(.+)$/.exec(text);
  if (!match) {
    return null;
  }
  const partNumber = normalizePartNumber(match[2] ?? "");
  const vendor = inferVendorFromPartNumber(partNumber) ?? normalizeVendor(match[1] ?? "");
  if (!vendor || !partNumber) {
    return null;
  }
  return `${vendor} ${partNumber}`;
}

function toPartReferenceArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const normalized = normalizePartReference(item);
    if (normalized) {
      out.push(normalized);
    }
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

function normalizeControllerName(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function buildControllerBlacklist(...sources: Array<unknown>): Set<string> {
  const blacklist = new Set<string>();
  for (const item of DEFAULT_CONTROLLER_BLACKLIST) {
    const normalized = normalizeControllerName(item);
    if (normalized) {
      blacklist.add(normalized);
    }
  }
  for (const source of sources) {
    for (const item of toStringArray(source, false)) {
      const normalized = normalizeControllerName(item);
      if (normalized) {
        blacklist.add(normalized);
      }
    }
  }
  return blacklist;
}

function filterControllerArray(controllers: string[] | undefined, blacklist: Set<string>): string[] | undefined {
  const filtered = mergeStringArray([], controllers ?? [], false).filter((controller) => !blacklist.has(normalizeControllerName(controller)));
  return filtered.length > 0 ? filtered : undefined;
}

function mergePartNumber(target: PartNumberPayload | undefined, source: unknown): PartNumberPayload {
  const src = asRecord(source);
  const out: PartNumberPayload = { ...(target ?? {}) };

  const ids = toFlashIdArray(src.id);
  if (ids.length > 0) {
    out.id = mergeStringArray(out.id, ids, true);
  }
  const linkedIds = toFlashIdArray(src.f);
  if (linkedIds.length > 0) {
    out.f = mergeStringArray(out.f, linkedIds, true);
  }
  const alternatePartNumbers = toPartReferenceArray(src.a);
  if (alternatePartNumbers.length > 0) {
    out.a = mergeStringArray(out.a, alternatePartNumbers, false);
  }
  const forcedIds = toFlashIdArray(src.fid);
  if (forcedIds.length > 0) {
    out.id = forcedIds;
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

  const partNumbers = toPartReferenceArray(src.n);
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
  const normalizedVendor = normalizeVendor(vendor);
  for (const [pn, payload] of Object.entries(asRecord(record))) {
    const normalizedPn = normalizePartNumber(pn);
    if (!normalizedPn) {
      continue;
    }
    const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? normalizedVendor;
    const vendorMap = ensureVendor(vendors, correctedVendor);
    const next = mergePartNumber(vendorMap.get(normalizedPn), payload);
    vendorMap.set(normalizedPn, next);
  }
}

function mergeIddbRecord(iddb: FlashIdMap, record: unknown): void {
  for (const [flashId, payload] of Object.entries(asRecord(record))) {
    const normalizedId = normalizeFlashId(flashId);
    if (!normalizedId) {
      continue;
    }
    const next = mergeFlashId(iddb.get(normalizedId), payload);
    iddb.set(normalizedId, next);
  }
}

function addInfoController(info: FdbInfoPayload, controller: string | string[]): void {
  const controllers = info.controllers ?? [];
  for (const item of Array.isArray(controller) ? controller : [controller]) {
    const text = String(item).trim();
    if (text && !controllers.includes(text)) {
      controllers.push(text);
    }
  }
  info.controllers = controllers;
}

function mergePartPayload(vendors: VendorMap, vendor: string, partNumber: string, payload: PartNumberPayload): PartNumberPayload | null {
  const normalizedPn = normalizePartNumber(partNumber);
  if (!normalizedPn) {
    return null;
  }
  const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? normalizeVendor(vendor);
  const vendorMap = ensureVendor(vendors, correctedVendor);
  const next = mergePartNumber(vendorMap.get(normalizedPn), payload);
  vendorMap.set(normalizedPn, next);
  return next;
}

function mergeFlashPayload(iddb: FlashIdMap, id: string, payload: FlashIdPayload): FlashIdPayload | null {
  const normalizedId = normalizeFlashId(id);
  if (!normalizedId) {
    return null;
  }
  const next = mergeFlashId(iddb.get(normalizedId), payload);
  iddb.set(normalizedId, next);
  return next;
}

function addPartId(vendors: VendorMap, iddb: FlashIdMap, vendor: string, partNumber: string, id: string, controllers: string[] = []): void {
  const normalizedId = normalizeFlashId(id);
  if (!normalizedId) {
    return;
  }
  mergePartPayload(vendors, vendor, partNumber, { id: [normalizedId], ...(controllers.length > 0 ? { t: controllers } : {}) });
  mergeFlashPayload(iddb, normalizedId, { ...(controllers.length > 0 ? { t: controllers } : {}) });
}

function findPartReferencesByFlashId(vendors: VendorMap, id: string, excludeVendor?: string): string[] {
  const normalizedId = normalizeFlashId(id);
  if (!normalizedId) {
    return [];
  }
  const excluded = excludeVendor ? normalizeVendor(excludeVendor) : "";
  const refs: string[] = [];
  for (const [vendor, records] of vendors.entries()) {
    if (vendor === excluded) {
      continue;
    }
    for (const [partNumber, payload] of records.entries()) {
      if (payload.id?.includes(normalizedId)) {
        refs.push(`${vendor} ${partNumber}`);
      }
    }
  }
  return refs;
}

function lines(data: string): string[] {
  return data.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function cleanHexByte(value: string | undefined): string {
  const text = (value ?? "").trim().replace(/^0x/i, "").toUpperCase();
  return text.length === 1 ? `0${text}` : text.slice(-2);
}

function parseIni(data: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let section = "";
  for (const rawLine of lines(data)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) {
      continue;
    }
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch?.[1]) {
      section = sectionMatch[1];
      result[section] ??= {};
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    const values = (result[section] ??= {});
    values[key] = value;
  }
  return result;
}

function vendorExists(vendors: VendorMap, vendor: string): boolean {
  return vendors.has(normalizeVendor(vendor));
}

function forEachPartWithVendor(vendors: VendorMap, vendor: string, fn: (partNumber: string, payload: PartNumberPayload) => boolean | void): void {
  const records = vendors.get(normalizeVendor(vendor));
  if (!records) {
    return;
  }
  for (const [partNumber, payload] of records.entries()) {
    if (fn(partNumber, payload) === false) {
      return;
    }
  }
}

function addControllersToMatchingFlashId(
  vendors: VendorMap,
  iddb: FlashIdMap,
  vendor: string,
  flashIdPrefix: string,
  controllers: string[],
  patch?: FlashIdPayload
): boolean {
  const prefix = normalizeFlashId(flashIdPrefix);
  if (!prefix) {
    return false;
  }
  let found = false;
  forEachPartWithVendor(vendors, vendor, (_partNumber, payload) => {
    for (const id of payload.id ?? []) {
      if (!id.startsWith(prefix)) {
        continue;
      }
      payload.t = mergeStringArray(payload.t, controllers, false);
      mergeFlashPayload(iddb, id, { ...(patch ?? {}), t: controllers });
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
}

function createControllerContext(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload): ControllerMergeContext {
  return {
    info,
    addInfoController: (controller) => addInfoController(info, controller),
    mergePartPayload: (vendor, partNumber, payload) => mergePartPayload(vendors, vendor, partNumber, payload),
    mergeFlashPayload: (id, payload) => mergeFlashPayload(iddb, id, payload),
    addPartId: (vendor, partNumber, id, controllers = []) => addPartId(vendors, iddb, vendor, partNumber, id, controllers),
    vendorExists: (vendor) => vendorExists(vendors, vendor),
    findPartReferencesByFlashId: (id, options = {}) => findPartReferencesByFlashId(vendors, id, options.excludeVendor),
    addControllersToMatchingFlashId: (vendor, flashIdPrefix, controllers, patch) =>
      addControllersToMatchingFlashId(vendors, iddb, vendor, flashIdPrefix, controllers, patch),
    lines,
    cleanHexByte,
    parseIni,
    normalizeKnownPackage
  };
}

function loadRawInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload): boolean {
  const rawDirs = CONTROLLER_GENERATORS.flatMap((controller) => [...controller.directories]);
  const hasRawDir = rawDirs.some((dir) => existsSync(resolve(inputDir, dir)));
  if (!hasRawDir) {
    return false;
  }
  const context = createControllerContext(vendors, iddb, info);
  for (const controller of CONTROLLER_GENERATORS) {
    for (const dir of controller.directories) {
      const dirPath = resolve(inputDir, dir);
      if (!existsSync(dirPath)) {
        continue;
      }
      for (const file of readdirSync(dirPath).filter((item) => item !== "." && item !== "..").sort()) {
        controller.mergeFile(context, {
          directory: dir,
          filename: file,
          data: readFileSync(resolve(dirPath, file), "utf8")
        });
      }
    }
  }
  return true;
}

function canonicalPartNumber(partNumber: string, records: PartNumberMap): string {
  const duplicateSuffix = /^(.*)_1$/.exec(partNumber);
  if (duplicateSuffix?.[1] && records.has(duplicateSuffix[1])) {
    return duplicateSuffix[1];
  }

  if (partNumber.endsWith("-")) {
    const withoutTrailingDash = partNumber.slice(0, -1);
    if (withoutTrailingDash && records.has(withoutTrailingDash)) {
      return withoutTrailingDash;
    }
  }

  return partNumber;
}

function canonicalizeVendorRecords(vendors: VendorMap): void {
  for (const records of vendors.values()) {
    for (const [partNumber, payload] of [...records.entries()]) {
      const canonical = canonicalPartNumber(partNumber, records);
      if (canonical === partNumber) {
        continue;
      }
      const existing = records.get(canonical);
      records.set(canonical, mergePartNumber(existing, payload));
      records.delete(partNumber);
    }
  }
}

function canonicalizePartReference(value: string, vendors: VendorMap): string | null {
  const normalized = normalizePartReference(value);
  if (!normalized) {
    return null;
  }
  const [vendor, partNumber] = normalized.split(" ", 2);
  if (!vendor || !partNumber) {
    return null;
  }
  const records = vendors.get(vendor);
  if (!records) {
    return null;
  }
  const canonical = records ? canonicalPartNumber(partNumber, records) : partNumber;
  if (!records.has(canonical)) {
    return null;
  }
  return `${vendor} ${canonical}`;
}

function canonicalizeIddbReferences(iddb: FlashIdMap, vendors: VendorMap): void {
  for (const [flashId, payload] of iddb.entries()) {
    const refs = (payload.n ?? []).map((item) => canonicalizePartReference(item, vendors)).filter((item): item is string => !!item);
    iddb.set(flashId, {
      ...payload,
      ...(refs.length > 0 ? { n: mergeStringArray([], refs, false) } : { n: undefined })
    });
  }
}

function canonicalizePartPayloadReferences(vendors: VendorMap): void {
  for (const records of vendors.values()) {
    for (const [partNumber, payload] of records.entries()) {
      const refs = (payload.a ?? []).map((item) => canonicalizePartReference(item, vendors)).filter((item): item is string => !!item);
      records.set(partNumber, {
        ...payload,
        ...(refs.length > 0 ? { a: mergeStringArray([], refs, false) } : { a: undefined })
      });
    }
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
  const rawExtraVendors: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (key !== "info" && key !== "controllerBlacklist" && key !== "vendors" && key !== "iddb") {
      rawExtraVendors[key] = value;
    }
  }
  for (const [vendor, record] of Object.entries(rawExtraVendors)) {
    mergeVendorRecord(vendors, vendor, record);
  }

  if (extra.vendors) {
    for (const [vendor, record] of Object.entries(extra.vendors)) {
      mergeVendorRecord(vendors, vendor, record);
    }
  }
  if (extra.iddb) {
    mergeIddbRecord(iddb, extra.iddb);
  }
}

function applyControllerBlacklist(
  info: FdbInfoPayload,
  vendors: VendorMap,
  iddb: FlashIdMap,
  controllerBlacklist: Set<string>
): void {
  if (controllerBlacklist.size === 0) {
    return;
  }

  const infoControllers = filterControllerArray(info.controllers, controllerBlacklist);
  if (infoControllers) {
    info.controllers = infoControllers;
  } else {
    delete info.controllers;
  }

  for (const records of vendors.values()) {
    for (const payload of records.values()) {
      const controllers = filterControllerArray(payload.t, controllerBlacklist);
      if (controllers) {
        payload.t = controllers;
      } else {
        delete payload.t;
      }
    }
  }

  for (const payload of iddb.values()) {
    const controllers = filterControllerArray(payload.t, controllerBlacklist);
    if (controllers) {
      payload.t = controllers;
    } else {
      delete payload.t;
    }
  }
}

function sortObjectKeys<T>(input: Record<string, T>): Record<string, T> {
  const output: Record<string, T> = {};
  for (const key of Object.keys(input).sort()) {
    output[key] = input[key] as T;
  }
  return output;
}

function buildOutput(infoInput: FdbInfoPayload & { version: string }, vendors: VendorMap, iddb: FlashIdMap): Record<string, unknown> {
  if (!infoInput.version) {
    throw new Error("Missing required info.version");
  }

  const controllers = new Set<string>(toStringArray(infoInput.controllers, false));

  for (const [vendor, parts] of vendors.entries()) {
    for (const [partNumber, partInfo] of parts.entries()) {
      for (const controller of partInfo.t ?? []) {
        controllers.add(controller);
      }
      for (const id of partInfo.id ?? []) {
        const normalizedId = normalizeFlashId(id);
        if (!normalizedId) {
          continue;
        }
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
    name: infoInput.name ?? "iTXTech fdnext FDB",
    website: infoInput.website ?? "https://github.com/iTXTech/fdnext",
    version: infoInput.version,
    time: new Date().toUTCString(),
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
        ...(payload.f && payload.f.length > 0 ? { f: [...new Set(payload.f)].sort() } : {}),
        ...(payload.a && payload.a.length > 0 ? { a: [...new Set(payload.a)].sort() } : {}),
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
  const version = options.version.trim();
  if (!version) {
    throw new Error("Missing required version");
  }

  const inputDir = resolve(options.inputDir);
  if (!existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  const vendors: VendorMap = new Map();
  const iddb: FlashIdMap = new Map();
  const meta = loadMeta(inputDir, options.metaFile);
  const rawInfo: FdbInfoPayload = { ...meta };
  const usedRawInput = loadRawInputDirectory(inputDir, vendors, iddb, rawInfo);
  if (!usedRawInput) {
    loadInputDirectory(inputDir, vendors, iddb);
  }

  const extra = loadExtra(inputDir, options.extraFile);
  applyExtra(extra, vendors, iddb);
  canonicalizeVendorRecords(vendors);
  canonicalizePartPayloadReferences(vendors);
  canonicalizeIddbReferences(iddb, vendors);
  const controllerBlacklist = buildControllerBlacklist(options.controllerBlacklist, extra.controllerBlacklist);

  const supplementalInfo = extra.info ?? {};
  const infoInput: FdbInfoPayload & { version: string } = {
    ...rawInfo,
    ...supplementalInfo,
    controllers: mergeStringArray(toStringArray(rawInfo.controllers, false), toStringArray(supplementalInfo.controllers, false), false),
    ...(options.name ? { name: options.name } : {}),
    ...(options.website ? { website: options.website } : {}),
    version
  };
  applyControllerBlacklist(infoInput, vendors, iddb, controllerBlacklist);

  const output = buildOutput(infoInput, vendors, iddb);

  if (options.outputFile) {
    const outputFile = resolve(options.outputFile);
    mkdirSync(resolve(outputFile, ".."), { recursive: true });
    const formatted = (options.pretty ? JSON.stringify(output, null, 4) : JSON.stringify(output)).replace(/\//g, "\\/");
    writeFileSync(outputFile, `${formatted}\n`, "utf8");
  }

  return output;
}
