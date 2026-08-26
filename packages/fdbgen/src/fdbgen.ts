import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { createEngine, type FdnextEngine, type FdnextResourceBundle, type IdentifierDecodeDraft, type PartDecodeDraft } from "@itxtech/fdnext-core";
import { CONTROLLER_GENERATORS, type ControllerMergeContext } from "./controllers";
import { normalizeExtraPayload } from "./extra";
import { isLowConfidenceFlashPayload } from "./flash-payload";
import {
  normalizeFdbControllerName,
  normalizeFdbFlashId,
  normalizeFdbPartNumber,
  normalizeFdbPartReference,
  isAuthoritativeFdbPartNumber
} from "./normalize";
import { isLowInformationPartPayload } from "./part-payload";
import { isStrictSupportListFlashIdVendorCompatible, vendorFromSupportListFlashId } from "./support-list";
import { createFdbProvenanceTrace, mergeProvenanceSource, type FdbProvenanceSource, type FdbProvenanceTrace } from "./trace";
import { FDNEXT_FDB_SCHEMA_VERSION } from "./types";
import type { ExtraPayload, FdbInfoPayload, FlashIdPayload, GenerateFdbOptions, PartNumberPayload } from "./types";
import { isCompatibleVendor } from "./vendor-compat";
import { inferVendorFromPartNumber, normalizeKnownPackage, normalizeVendor } from "./vendors";
import { chooseGeneratedFdbDieProfile, normalizeGeneratedFdbDieProfile } from "./nand-die-profile";

type PartNumberMap = Map<string, PartNumberPayload>;
type VendorMap = Map<string, PartNumberMap>;
type FlashIdMap = Map<string, FlashIdPayload>;

interface LoadedExtraPayload {
  payload: ExtraPayload;
  source: FdbProvenanceSource;
}

const DEFAULT_CONTROLLER_BLACKLIST = ["3281FL", "3379FL"];
const MIN_SAMSUNG_K9_PART_NUMBER_LENGTH = "K9OKGY8S7C".length;

interface DecodePackRelationMatcher {
  partProfile(vendor: string, partNumber: string): RelationProfile;
  identifierProfile(flashId: string): RelationProfile;
}

interface RelationProfile {
  keys: Set<string>;
  labels: Set<string>;
  diesPerCe?: number;
}

type RelationCompatibility = "compatible" | "conflict" | "unknown";

let defaultRelationMatcher: DecodePackRelationMatcher | undefined;

const relationMatcherResources = {
  partIndex: {
    rawNand: {},
    managedNand: [],
    dram: []
  },
  identifierIndex: {
    nandFlash: {}
  },
  markingIndex: {
    packageMarkings: {}
  },
  vendorIndex: {},
  controllerIndex: {},
  translationIndex: {}
} satisfies FdnextResourceBundle;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function shouldRejectVendorPartNumber(vendor: string, partNumber: string): boolean {
  const normalizedVendor = normalizeVendor(vendor);
  return (
    (normalizedVendor === "samsung" && shouldRejectSamsungPartNumber(partNumber)) ||
    (normalizedVendor === "intel" && /^MT29[EF](?=[0-9])/.test(partNumber)) ||
    (normalizedVendor === "micron" && /^29F(?=[0-9])/.test(partNumber))
  );
}

function shouldRejectFlashIdPartNumber(idVendor: string | null, partNumber: string): boolean {
  return (
    (idVendor === "samsung" && shouldRejectSamsungPartNumber(partNumber)) ||
    (idVendor === "intel" && /^MT29[EF](?=[0-9])/.test(partNumber)) ||
    (idVendor === "micron" && /^29F(?=[0-9])/.test(partNumber))
  );
}

function shouldRejectSamsungPartNumber(partNumber: string): boolean {
  return /^K9/.test(partNumber) && (partNumber.length < MIN_SAMSUNG_K9_PART_NUMBER_LENGTH || partNumber.slice(-3).includes("X"));
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
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
    const normalized = normalizeFdbFlashId(item);
    if (normalized) {
      out.push(normalized);
    }
  }
  return out;
}

function toPartReferenceArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const normalized = normalizeFdbPartReference(item);
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

function positiveIntegerField(
  draft: PartDecodeDraft | IdentifierDecodeDraft | null | undefined,
  field: "die_count" | "ce_count"
): number | undefined {
  const value = draft?.fields?.[field];
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function readRelationProfileFromDraft(
  draft: PartDecodeDraft | IdentifierDecodeDraft | null | undefined,
  side: "part" | "identifier"
): RelationProfile {
  const keys = new Set<string>();
  const labels = new Set<string>();
  const meta = draft?.meta;
  const primary = typeof meta?.nandDieProfileKey === "string" ? meta.nandDieProfileKey.trim() : "";
  if (primary) {
    keys.add(primary);
  }
  if (Array.isArray(meta?.nandDieProfileKeys)) {
    for (const item of meta.nandDieProfileKeys) {
      const text = typeof item === "string" ? item.trim() : "";
      if (text) {
        keys.add(text);
      }
    }
  }
  const dieCodename = typeof draft?.fields?.die_codename === "string" ? draft.fields.die_codename.trim() : "";
  if (dieCodename) {
    labels.add(dieCodename);
  }

  const dieCount = positiveIntegerField(draft, "die_count");
  if (side === "identifier") {
    return { keys, labels, ...(dieCount !== undefined ? { diesPerCe: dieCount } : {}) };
  }

  const ceCount = positiveIntegerField(draft, "ce_count");
  const diesPerCe = dieCount !== undefined && ceCount !== undefined && dieCount >= ceCount && dieCount % ceCount === 0
    ? dieCount / ceCount
    : undefined;
  return { keys, labels, ...(diesPerCe !== undefined ? { diesPerCe } : {}) };
}

function draftVendor(draft: PartDecodeDraft | IdentifierDecodeDraft | null | undefined): string {
  const vendor = draft?.device?.vendor;
  return typeof vendor === "string" ? normalizeVendor(vendor) : "";
}

function getDefaultRelationMatcher(): DecodePackRelationMatcher {
  if (defaultRelationMatcher) {
    return defaultRelationMatcher;
  }

  const engine: FdnextEngine = createEngine({ resources: relationMatcherResources });
  const partCache = new Map<string, RelationProfile>();
  const identifierCache = new Map<string, RelationProfile>();

  defaultRelationMatcher = {
    partProfile(vendor, partNumber) {
      const normalizedVendor = normalizeVendor(vendor);
      const cacheKey = `${normalizedVendor} ${partNumber}`;
      const cached = partCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const draft = engine.decodePartDraft({
        query: partNumber,
        constraints: normalizedVendor ? { vendor: normalizedVendor } : undefined
      });
      const decodedVendor = draftVendor(draft);
      const profile = normalizedVendor && decodedVendor && decodedVendor !== "unknown" && !isCompatibleVendor(normalizedVendor, decodedVendor)
        ? { keys: new Set<string>(), labels: new Set<string>() }
        : readRelationProfileFromDraft(draft, "part");
      partCache.set(cacheKey, profile);
      return profile;
    },
    identifierProfile(flashId) {
      const cached = identifierCache.get(flashId);
      if (cached) {
        return cached;
      }

      const profile = readRelationProfileFromDraft(
        engine.decodeIdentifierDraft({ query: flashId, idScheme: "nand.flash_id" }),
        "identifier"
      );
      identifierCache.set(flashId, profile);
      return profile;
    }
  };
  return defaultRelationMatcher;
}

function setsIntersect(left: Set<string>, right: Set<string>): boolean {
  for (const item of left) {
    if (right.has(item)) {
      return true;
    }
  }
  return false;
}

function processCompatibility(partProfile: RelationProfile, identifierProfile: RelationProfile): RelationCompatibility {
  if (partProfile.keys.size === 0 || identifierProfile.keys.size === 0) {
    return "unknown";
  }
  return setsIntersect(partProfile.keys, identifierProfile.keys) || setsIntersect(partProfile.labels, identifierProfile.labels)
    ? "compatible"
    : "conflict";
}

function topologyCompatibility(partProfile: RelationProfile, identifierProfile: RelationProfile): RelationCompatibility {
  if (partProfile.diesPerCe === undefined || identifierProfile.diesPerCe === undefined) {
    return "unknown";
  }
  return partProfile.diesPerCe === identifierProfile.diesPerCe ? "compatible" : "conflict";
}

function shouldKeepRelation(partProfile: RelationProfile, identifierProfile: RelationProfile): boolean {
  return (
    processCompatibility(partProfile, identifierProfile) !== "conflict" &&
    topologyCompatibility(partProfile, identifierProfile) !== "conflict"
  );
}

function buildControllerBlacklist(...sources: Array<unknown>): Set<string> {
  const blacklist = new Set<string>();
  for (const item of DEFAULT_CONTROLLER_BLACKLIST) {
    const normalized = normalizeFdbControllerName(item);
    if (normalized) {
      blacklist.add(normalized);
    }
  }
  for (const source of sources) {
    for (const item of toStringArray(source, false)) {
      const normalized = normalizeFdbControllerName(item);
      if (normalized) {
        blacklist.add(normalized);
      }
    }
  }
  return blacklist;
}

function filterControllerArray(controllers: string[] | undefined, blacklist: Set<string>): string[] | undefined {
  const filtered = mergeStringArray([], controllers ?? [], false).filter((controller) => !blacklist.has(normalizeFdbControllerName(controller)));
  return filtered.length > 0 ? filtered : undefined;
}

function mergePartNumber(vendor: string, target: PartNumberPayload | undefined, source: unknown): PartNumberPayload {
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

  if (typeof src.c === "string") {
    out.c = src.c;
  }
  const chosenLitho = chooseGeneratedFdbDieProfile(vendor, out.l, typeof src.l === "string" ? src.l : undefined, out.c);
  if (chosenLitho !== undefined) {
    out.l = chosenLitho;
  } else {
    delete out.l;
  }
  if (typeof src.m === "string") {
    out.m = src.m;
  }
  if (typeof src.pkg === "string") {
    out.pkg = src.pkg;
  }
  if (typeof src.sg === "string") {
    out.sg = src.sg;
  }
  if (typeof src.pc === "string") {
    out.pc = src.pc;
  }
  if (typeof src.vol === "string") {
    out.vol = src.vol;
  }
  if (typeof src.so === "string") {
    out.so = src.so;
  }

  const d = toOptionalNumber(src.d);
  const e = toOptionalNumber(src.e);
  const r = toOptionalNumber(src.r);
  const n = toOptionalNumber(src.n);
  const pl = toOptionalNumber(src.pl);
  if (d !== undefined) out.d = d;
  if (e !== undefined) out.e = e;
  if (r !== undefined) out.r = r;
  if (n !== undefined) out.n = n;
  if (pl !== undefined) out.pl = pl;

  return out;
}

function hasPartIdentity(payload: PartNumberPayload | undefined): boolean {
  return Boolean(payload && ((payload.id?.length ?? 0) > 0 || (payload.fid?.length ?? 0) > 0));
}

function mainPartIdentityIds(payload: PartNumberPayload): string[] {
  return mergeStringArray(toFlashIdArray(payload.fid), toFlashIdArray(payload.id), true);
}

function mergeStackedExtraPartNumber(target: PartNumberPayload | undefined, source: PartNumberPayload): PartNumberPayload {
  const out: PartNumberPayload = { ...(target ?? {}) };
  const preserveExistingIdentity = hasPartIdentity(out);
  const sourceForcedIds = toFlashIdArray(source.fid);
  const sourceIds = toFlashIdArray(source.id);

  if (!preserveExistingIdentity) {
    if (sourceIds.length > 0) {
      out.fid = sourceIds;
      delete out.id;
    }
    if (sourceForcedIds.length > 0) {
      out.fid = sourceForcedIds;
      delete out.id;
    }
  } else if (sourceForcedIds.length > 0) {
    const existingMainIds = mainPartIdentityIds(out);
    if (existingMainIds.length > 0) {
      out.fid = existingMainIds;
      delete out.id;
    }
  }

  const linkedIds = toFlashIdArray(source.f);
  if (linkedIds.length > 0) {
    out.f = mergeStringArray(out.f, linkedIds, true);
  }

  const alternatePartNumbers = toPartReferenceArray(source.a);
  if (alternatePartNumbers.length > 0) {
    out.a = mergeStringArray(out.a, alternatePartNumbers, false);
  }

  const controllers = toStringArray(source.t, false);
  if (controllers.length > 0) {
    out.t = mergeStringArray(out.t, controllers, false);
  }

  for (const field of ["l", "c", "m", "pkg", "sg", "pc", "vol", "so"] as const) {
    if (out[field] === undefined && typeof source[field] === "string") {
      out[field] = source[field];
    }
  }

  for (const field of ["d", "e", "r", "n", "pl"] as const) {
    const value = toOptionalNumber(source[field]);
    if (out[field] === undefined && value !== undefined) {
      out[field] = value;
    }
  }

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

function mergeVendorRecord(vendors: VendorMap, vendor: string, record: unknown, trace?: FdbProvenanceTrace, source?: FdbProvenanceSource): void {
  for (const [pn, payload] of Object.entries(asRecord(record))) {
    mergePartPayload(vendors, vendor, pn, asRecord(payload) as PartNumberPayload, trace, source, "merge_vendor_record");
  }
}

function mergeIddbRecord(iddb: FlashIdMap, record: unknown, trace?: FdbProvenanceTrace, source?: FdbProvenanceSource): void {
  for (const [flashId, payload] of Object.entries(asRecord(record))) {
    mergeFlashPayload(iddb, flashId, asRecord(payload) as FlashIdPayload, trace, source, "merge_iddb_record");
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

function recordPartTrace(
  trace: FdbProvenanceTrace | undefined,
  decision: string,
  source: FdbProvenanceSource | undefined,
  rawVendor: string,
  rawPartNumber: string,
  normalizedVendor: string,
  normalizedPartNumber: string
): void {
  trace?.record({
    target: "part",
    decision,
    vendor: normalizedVendor,
    partNumber: normalizedPartNumber,
    source,
    raw: { vendor: rawVendor, partNumber: rawPartNumber },
    normalized: { vendor: normalizedVendor, partNumber: normalizedPartNumber }
  });
}

function recordFlashTrace(
  trace: FdbProvenanceTrace | undefined,
  decision: string,
  source: FdbProvenanceSource | undefined,
  rawFlashId: string,
  normalizedFlashId: string
): void {
  trace?.record({
    target: "flash",
    decision,
    flashId: normalizedFlashId,
    source,
    raw: { flashId: rawFlashId },
    normalized: { flashId: normalizedFlashId }
  });
}

function mergePartPayload(
  vendors: VendorMap,
  vendor: string,
  partNumber: string,
  payload: PartNumberPayload,
  trace?: FdbProvenanceTrace,
  source?: FdbProvenanceSource,
  decision = "merge_part_payload"
): PartNumberPayload | null {
  const normalizedPn = normalizeFdbPartNumber(partNumber);
  if (!normalizedPn) {
    return null;
  }
  if (shouldRejectVendorPartNumber(vendor, normalizedPn)) {
    return null;
  }
  if (!isAuthoritativeFdbPartNumber(normalizedPn)) {
    return null;
  }
  const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? normalizeVendor(vendor);
  const vendorMap = ensureVendor(vendors, correctedVendor);
  const next = mergePartNumber(correctedVendor, vendorMap.get(normalizedPn), payload);
  vendorMap.set(normalizedPn, next);
  recordPartTrace(trace, decision, source, vendor, partNumber, correctedVendor, normalizedPn);
  return next;
}

function mergeFlashPayload(
  iddb: FlashIdMap,
  id: string,
  payload: FlashIdPayload,
  trace?: FdbProvenanceTrace,
  source?: FdbProvenanceSource,
  decision = "merge_flash_payload"
): FlashIdPayload | null {
  const normalizedId = normalizeFdbFlashId(id);
  if (!normalizedId) {
    return null;
  }
  const next = mergeFlashId(iddb.get(normalizedId), payload);
  iddb.set(normalizedId, next);
  recordFlashTrace(trace, decision, source, id, normalizedId);
  return next;
}

function addPartId(
  vendors: VendorMap,
  iddb: FlashIdMap,
  vendor: string,
  partNumber: string,
  id: string,
  controllers: string[] = [],
  trace?: FdbProvenanceTrace,
  source?: FdbProvenanceSource
): void {
  const normalizedId = normalizeFdbFlashId(id);
  if (!normalizedId) {
    return;
  }
  const normalizedVendor = normalizeVendor(vendor);
  const idVendor = vendorFromSupportListFlashId(normalizedId);
  const normalizedPn = normalizeFdbPartNumber(partNumber);
  const inferredVendor = normalizedPn ? inferVendorFromPartNumber(normalizedPn) : null;
  if (normalizedPn && shouldRejectFlashIdPartNumber(idVendor, normalizedPn)) {
    mergeFlashPayload(iddb, normalizedId, { ...(controllers.length > 0 ? { t: controllers } : {}) }, trace, source, "add_part_id");
    return;
  }
  const hasTrustedIdVendor = !!idVendor && idVendor === normalizedVendor;
  if (hasTrustedIdVendor && inferredVendor && !isCompatibleVendor(normalizedVendor, inferredVendor)) {
    mergeFlashPayload(iddb, normalizedId, { ...(controllers.length > 0 ? { t: controllers } : {}) }, trace, source, "add_part_id");
    return;
  }
  mergePartPayload(
    vendors,
    vendor,
    partNumber,
    { id: [normalizedId], ...(controllers.length > 0 ? { t: controllers } : {}) },
    trace,
    source,
    "add_part_id"
  );
  mergeFlashPayload(iddb, normalizedId, { ...(controllers.length > 0 ? { t: controllers } : {}) }, trace, source, "add_part_id");
}

function findPartReferencesByFlashId(vendors: VendorMap, id: string, excludeVendor?: string): string[] {
  const normalizedId = normalizeFdbFlashId(id);
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
  patch?: FlashIdPayload,
  trace?: FdbProvenanceTrace,
  source?: FdbProvenanceSource
): boolean {
  const prefix = normalizeFdbFlashId(flashIdPrefix);
  if (!prefix) {
    return false;
  }
  let found = false;
  forEachPartWithVendor(vendors, vendor, (partNumber, payload) => {
    for (const id of payload.id ?? []) {
      if (!id.startsWith(prefix)) {
        continue;
      }
      payload.t = mergeStringArray(payload.t, controllers, false);
      mergeFlashPayload(iddb, id, { ...(patch ?? {}), t: controllers }, trace, source, "add_controllers_to_matching_flash_id");
      recordPartTrace(trace, "add_controllers_to_matching_flash_id", source, vendor, partNumber, normalizeVendor(vendor), partNumber);
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
}

function createControllerContext(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, trace?: FdbProvenanceTrace): ControllerMergeContext {
  let currentSource: FdbProvenanceSource | undefined;
  const context: ControllerMergeContext = {
    info,
    addInfoController: (controller) => addInfoController(info, controller),
    mergePartPayload: (vendor, partNumber, payload) => mergePartPayload(vendors, vendor, partNumber, payload, trace, currentSource),
    mergeFlashPayload: (id, payload) => mergeFlashPayload(iddb, id, payload, trace, currentSource),
    addPartId: (vendor, partNumber, id, controllers = []) => addPartId(vendors, iddb, vendor, partNumber, id, controllers, trace, currentSource),
    vendorExists: (vendor) => vendorExists(vendors, vendor),
    findPartReferencesByFlashId: (id, options = {}) => findPartReferencesByFlashId(vendors, id, options.excludeVendor),
    addControllersToMatchingFlashId: (vendor, flashIdPrefix, controllers, patch) =>
      addControllersToMatchingFlashId(vendors, iddb, vendor, flashIdPrefix, controllers, patch, trace, currentSource),
    lines,
    cleanHexByte,
    parseIni,
    normalizeKnownPackage,
    withSource(source, callback) {
      const previous = currentSource;
      currentSource = mergeProvenanceSource(previous, source);
      try {
        return callback();
      } finally {
        currentSource = previous;
      }
    }
  };
  return context;
}

function loadRawInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, trace?: FdbProvenanceTrace): boolean {
  const rawDirs = CONTROLLER_GENERATORS.flatMap((controller) => [...controller.directories]);
  const hasRawDir = rawDirs.some((dir) => existsSync(resolve(inputDir, dir)));
  if (!hasRawDir) {
    return false;
  }
  const context = createControllerContext(vendors, iddb, info, trace);
  for (const controller of CONTROLLER_GENERATORS) {
    for (const dir of controller.directories) {
      const dirPath = resolve(inputDir, dir);
      if (!existsSync(dirPath)) {
        continue;
      }
      for (const file of readdirSync(dirPath).filter((item) => item !== "." && item !== "..").sort()) {
        const filePath = resolve(dirPath, file);
        context.withSource({ controller: controller.id, directory: dir, filename: file, file: filePath }, () => {
          controller.mergeFile(context, {
            directory: dir,
            filename: file,
            data: readFileSync(filePath, "utf8")
          });
        });
      }
    }
  }
  return true;
}

function canonicalPartNumber(vendor: string, partNumber: string, records: PartNumberMap): string {
  const packageCanonical = normalizeKnownPackage(vendor, partNumber);
  if (packageCanonical && packageCanonical !== partNumber) {
    return packageCanonical;
  }

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
  for (const [vendor, records] of vendors.entries()) {
    for (const [partNumber, payload] of [...records.entries()]) {
      const canonical = canonicalPartNumber(vendor, partNumber, records);
      if (canonical === partNumber) {
        continue;
      }
      const existing = records.get(canonical);
      records.set(canonical, mergePartNumber(vendor, existing, payload));
      records.delete(partNumber);
    }
  }
}

function pruneLowInformationPartRecords(vendors: VendorMap): void {
  for (const [vendor, records] of [...vendors.entries()]) {
    for (const [partNumber, payload] of [...records.entries()]) {
      if (isLowInformationPartPayload(payload)) {
        records.delete(partNumber);
      }
    }
    if (records.size === 0) {
      vendors.delete(vendor);
    }
  }
}

function isFlashIdOwnedByVendor(vendor: string, flashId: string): boolean {
  return isStrictSupportListFlashIdVendorCompatible(vendor, flashId);
}

function pruneCrossVendorPartIds(vendors: VendorMap): void {
  for (const [vendor, records] of vendors.entries()) {
    for (const payload of records.values()) {
      const ids = payload.id?.filter((id) => isFlashIdOwnedByVendor(vendor, id));
      if (ids && ids.length > 0) {
        payload.id = ids;
      } else {
        delete payload.id;
      }
    }
  }
}

function filterFlashIdRelations(vendor: string, partNumber: string, ids: string[] | undefined, matcher: DecodePackRelationMatcher): string[] | undefined {
  const partProfile = matcher.partProfile(vendor, partNumber);
  const kept = ids?.filter((id) => shouldKeepRelation(partProfile, matcher.identifierProfile(id))) ?? [];
  return kept.length > 0 ? kept : undefined;
}

function trimMismatchedRelations(vendors: VendorMap, iddb: FlashIdMap): Set<string> {
  const matcher = getDefaultRelationMatcher();
  const trimmedFlashIds = new Set<string>();
  for (const [vendor, parts] of vendors.entries()) {
    for (const [partNumber, payload] of parts.entries()) {
      const ids = filterFlashIdRelations(vendor, partNumber, payload.id, matcher);
      if (ids) {
        payload.id = ids;
      } else {
        delete payload.id;
      }

      const linkedIds = filterFlashIdRelations(vendor, partNumber, payload.f, matcher);
      if (linkedIds) {
        payload.f = linkedIds;
      } else {
        delete payload.f;
      }
    }
  }

  for (const [flashId, payload] of iddb.entries()) {
    const identifierProfile = matcher.identifierProfile(flashId);
    const refs: string[] = [];
    let removedForConflict = false;
    for (const rawReference of payload.n ?? []) {
      const reference = normalizeFdbPartReference(rawReference);
      if (!reference) {
        continue;
      }
      const [vendor, partNumber] = reference.split(" ", 2);
      if (!vendor || !partNumber || !vendors.get(vendor)?.has(partNumber)) {
        continue;
      }
      if (shouldKeepRelation(matcher.partProfile(vendor, partNumber), identifierProfile)) {
        refs.push(reference);
      } else {
        removedForConflict = true;
      }
    }
    if (refs.length > 0) {
      payload.n = mergeStringArray([], refs, false);
    } else {
      delete payload.n;
    }
    if (removedForConflict) {
      trimmedFlashIds.add(flashId);
    }
  }
  return trimmedFlashIds;
}

function linkPartFlashIds(vendors: VendorMap, iddb: FlashIdMap): void {
  for (const [vendor, parts] of vendors.entries()) {
    for (const [partNumber, partInfo] of parts.entries()) {
      for (const id of partInfo.id ?? []) {
        const normalizedId = normalizeFdbFlashId(id);
        if (!normalizedId) {
          continue;
        }
        const flash = iddb.get(normalizedId) ?? {};
        flash.n = mergeStringArray(flash.n, [`${vendor} ${partNumber}`], false);
        iddb.set(normalizedId, flash);
      }
    }
  }
}

function removeFlashIdReferences(vendors: VendorMap, removedFlashIds: Set<string>): void {
  if (removedFlashIds.size === 0) {
    return;
  }
  for (const records of vendors.values()) {
    for (const payload of records.values()) {
      const ids = payload.id?.filter((id) => !removedFlashIds.has(id));
      if (ids && ids.length > 0) {
        payload.id = ids;
      } else {
        delete payload.id;
      }
      const linkedIds = payload.f?.filter((id) => !removedFlashIds.has(id));
      if (linkedIds && linkedIds.length > 0) {
        payload.f = linkedIds;
      } else {
        delete payload.f;
      }
    }
  }
}

function hasExactSupplementalPartReference(payload: FlashIdPayload, vendors: VendorMap): boolean {
  for (const reference of payload.n ?? []) {
    const normalized = normalizeFdbPartReference(reference);
    if (!normalized) {
      continue;
    }
    const [vendor, partNumber] = normalized.split(" ", 2);
    if (!vendor || !partNumber) {
      continue;
    }
    const part = vendors.get(vendor)?.get(partNumber);
    if (part && (part.pkg || part.sg || part.pc || part.vol || part.so || part.pl !== undefined)) {
      return true;
    }
  }
  return false;
}

function pruneLowConfidenceFlashRecords(vendors: VendorMap, iddb: FlashIdMap, protectedFlashIds = new Set<string>()): void {
  const removed = new Set<string>();
  for (const [flashId, payload] of [...iddb.entries()]) {
    if (protectedFlashIds.has(flashId)) {
      continue;
    }
    if (isLowConfidenceFlashPayload(payload) && !hasExactSupplementalPartReference(payload, vendors)) {
      iddb.delete(flashId);
      removed.add(flashId);
    }
  }
  removeFlashIdReferences(vendors, removed);
}

function canonicalizePartReference(value: string, vendors: VendorMap): string | null {
  const normalized = normalizeFdbPartReference(value);
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
  const canonical = records ? canonicalPartNumber(vendor, partNumber, records) : partNumber;
  if (!records.has(canonical)) {
    return null;
  }
  return `${vendor} ${canonical}`;
}

function canonicalizeIddbReferences(iddb: FlashIdMap, vendors: VendorMap): void {
  for (const [flashId, payload] of iddb.entries()) {
    const refs = (payload.n ?? [])
      .map((item) => canonicalizePartReference(item, vendors))
      .filter((item): item is string => {
        if (!item) {
          return false;
        }
        const vendor = item.split(" ", 1)[0] ?? "";
        return isStrictSupportListFlashIdVendorCompatible(vendor, flashId);
      });
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

function uniqueResolvedFiles(files: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const resolved = resolve(file);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      out.push(resolved);
    }
  }
  return out;
}

function discoverExtraFiles(inputDir: string, extraFile?: string, extraFiles?: string[]): string[] {
  const explicit = uniqueResolvedFiles([...(extraFile ? [extraFile] : []), ...(extraFiles ?? [])]);
  if (explicit.length > 0) {
    return explicit;
  }

  const extraDir = resolve(inputDir, "extra");
  if (existsSync(extraDir)) {
    return readJsonFiles(extraDir);
  }

  const legacyExtra = resolve(inputDir, "extra.json");
  return existsSync(legacyExtra) ? [legacyExtra] : [];
}

function loadExtras(inputDir: string, extraFile?: string, extraFiles?: string[]): LoadedExtraPayload[] {
  return discoverExtraFiles(inputDir, extraFile, extraFiles)
    .map((file) => ({
      payload: normalizeExtraPayload(readJson(file)),
      source: { file, filename: basename(file) }
    }))
    .sort((left, right) => {
      const byPriority = (right.payload.priority ?? 0) - (left.payload.priority ?? 0);
      return byPriority || (left.source.filename ?? "").localeCompare(right.source.filename ?? "");
    });
}

function mergeExtraInfo(target: FdbInfoPayload | undefined, source: FdbInfoPayload | undefined): FdbInfoPayload | undefined {
  if (!source) {
    return target;
  }
  const out: FdbInfoPayload = { ...(target ?? {}) };
  if (source.name) {
    out.name = source.name;
  }
  if (source.website) {
    out.website = source.website;
  }
  out.controllers = mergeStringArray(toStringArray(out.controllers, false), toStringArray(source.controllers, false), false);
  if (out.controllers.length === 0) {
    delete out.controllers;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function mergeExtraPayload(target: ExtraPayload, source: ExtraPayload): void {
  target.info = mergeExtraInfo(target.info, source.info);
  target.controllerBlacklist = mergeStringArray(target.controllerBlacklist, toStringArray(source.controllerBlacklist, false), false);
  if (target.controllerBlacklist.length === 0) {
    delete target.controllerBlacklist;
  }

  if (source.vendors) {
    const vendors = target.vendors ?? {};
    for (const [vendor, records] of Object.entries(source.vendors)) {
      const normalizedVendor = normalizeVendor(vendor);
      const targetRecords = vendors[normalizedVendor] ?? {};
      for (const [partNumber, payload] of Object.entries(records)) {
        const normalizedPartNumber = normalizeFdbPartNumber(partNumber);
        if (!normalizedPartNumber) {
          continue;
        }
        targetRecords[normalizedPartNumber] = mergeStackedExtraPartNumber(targetRecords[normalizedPartNumber], payload);
      }
      vendors[normalizedVendor] = targetRecords;
    }
    target.vendors = vendors;
  }

  if (source.iddb) {
    const iddb = target.iddb ?? {};
    for (const [flashId, payload] of Object.entries(source.iddb)) {
      const normalizedFlashId = normalizeFdbFlashId(flashId);
      if (!normalizedFlashId) {
        continue;
      }
      iddb[normalizedFlashId] = mergeFlashId(iddb[normalizedFlashId], payload);
    }
    target.iddb = iddb;
  }
}

function combineExtras(extras: LoadedExtraPayload[]): ExtraPayload {
  const combined: ExtraPayload = {};
  for (const extra of extras) {
    if (extra.payload.schemaVersion) {
      combined.schemaVersion = extra.payload.schemaVersion;
    }
    if (extra.payload.priority !== undefined && combined.priority === undefined) {
      combined.priority = extra.payload.priority;
    }
    mergeExtraPayload(combined, extra.payload);
  }
  return combined;
}

function sourceForCombinedExtras(inputDir: string, extras: LoadedExtraPayload[]): FdbProvenanceSource | undefined {
  if (extras.length === 0) {
    return undefined;
  }
  if (extras.length === 1) {
    return extras[0]?.source;
  }
  return {
    directory: resolve(inputDir, "extra"),
    filename: "*.json"
  };
}

function loadInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap, trace?: FdbProvenanceTrace): void {
  const fdbPath = resolve(inputDir, "fdb.json");
  if (existsSync(fdbPath)) {
    const source = asRecord(readJson(fdbPath));
    mergeIddbRecord(iddb, source.iddb, trace, { file: fdbPath, filename: "fdb.json" });
    for (const [key, value] of Object.entries(source)) {
      if (key === "schemaVersion" || key === "info" || key === "iddb") {
        continue;
      }
      mergeVendorRecord(vendors, key, value, trace, { file: fdbPath, filename: "fdb.json" });
    }
  }

  const vendorsDir = resolve(inputDir, "vendors");
  if (existsSync(vendorsDir)) {
    for (const file of readJsonFiles(vendorsDir)) {
      const vendor = normalizeVendor(basename(file, ".json"));
      mergeVendorRecord(vendors, vendor, readJson(file), trace, { file, filename: basename(file) });
    }
  }

  const iddbDir = resolve(inputDir, "iddb");
  if (existsSync(iddbDir)) {
    for (const file of readJsonFiles(iddbDir)) {
      mergeIddbRecord(iddb, readJson(file), trace, { file, filename: basename(file) });
    }
  }

  const flashIdsDir = resolve(inputDir, "flashids");
  if (existsSync(flashIdsDir)) {
    for (const file of readJsonFiles(flashIdsDir)) {
      mergeIddbRecord(iddb, readJson(file), trace, { file, filename: basename(file) });
    }
  }
}

function applyExtra(extra: ExtraPayload, vendors: VendorMap, iddb: FlashIdMap, trace?: FdbProvenanceTrace, source?: FdbProvenanceSource): void {
  const rawExtraVendors: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (key !== "schemaVersion" && key !== "priority" && key !== "info" && key !== "controllerBlacklist" && key !== "vendors" && key !== "iddb") {
      rawExtraVendors[key] = value;
    }
  }
  for (const [vendor, record] of Object.entries(rawExtraVendors)) {
    mergeVendorRecord(vendors, vendor, record, trace, source);
  }

  if (extra.vendors) {
    for (const [vendor, record] of Object.entries(extra.vendors)) {
      mergeVendorRecord(vendors, vendor, record, trace, source);
    }
  }
  if (extra.iddb) {
    mergeIddbRecord(iddb, extra.iddb, trace, source);
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

  for (const parts of vendors.values()) {
    for (const partInfo of parts.values()) {
      for (const controller of partInfo.t ?? []) {
        controllers.add(controller);
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
    schemaVersion: FDNEXT_FDB_SCHEMA_VERSION,
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
        ...(payload.l !== undefined ? { l: normalizeGeneratedFdbDieProfile(vendor, payload.l, payload.c) } : {}),
        ...(payload.c !== undefined ? { c: payload.c } : {}),
        ...(payload.t && payload.t.length > 0 ? { t: [...new Set(payload.t)].sort() } : {}),
        ...(payload.m !== undefined ? { m: payload.m } : {}),
        ...(payload.pkg !== undefined ? { pkg: payload.pkg } : {}),
        ...(payload.sg !== undefined ? { sg: payload.sg } : {}),
        ...(payload.pc !== undefined ? { pc: payload.pc } : {}),
        ...(payload.vol !== undefined ? { vol: payload.vol } : {}),
        ...(payload.so !== undefined ? { so: payload.so } : {}),
        ...(payload.d !== undefined ? { d: payload.d } : {}),
        ...(payload.e !== undefined ? { e: payload.e } : {}),
        ...(payload.r !== undefined ? { r: payload.r } : {}),
        ...(payload.n !== undefined ? { n: payload.n } : {}),
        ...(payload.pl !== undefined ? { pl: payload.pl } : {})
      };
      if (normalized.l === undefined) {
        delete normalized.l;
      }
      vendorOutput[pn] = normalized;
    }
    output[vendor] = sortObjectKeys(vendorOutput);
  }

  return output;
}

export interface GenerateFdbTraceResult {
  fdb: Record<string, unknown>;
  trace: FdbProvenanceTrace;
}

function generateFdbInternal(options: GenerateFdbOptions, trace?: FdbProvenanceTrace): Record<string, unknown> {
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
  const usedRawInput = loadRawInputDirectory(inputDir, vendors, iddb, rawInfo, trace);
  if (!usedRawInput) {
    loadInputDirectory(inputDir, vendors, iddb, trace);
  }

  const extras = loadExtras(inputDir, options.extraFile, options.extraFiles);
  const extra = combineExtras(extras);
  applyExtra(extra, vendors, iddb, trace, sourceForCombinedExtras(inputDir, extras));
  canonicalizeVendorRecords(vendors);
  pruneLowInformationPartRecords(vendors);
  canonicalizePartPayloadReferences(vendors);
  pruneCrossVendorPartIds(vendors);
  pruneLowInformationPartRecords(vendors);
  canonicalizeIddbReferences(iddb, vendors);
  linkPartFlashIds(vendors, iddb);
  const trimmedFlashIds = trimMismatchedRelations(vendors, iddb);
  pruneLowInformationPartRecords(vendors);
  canonicalizeIddbReferences(iddb, vendors);
  pruneLowConfidenceFlashRecords(vendors, iddb, trimmedFlashIds);
  pruneLowInformationPartRecords(vendors);
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

export function generateFdb(options: GenerateFdbOptions): Record<string, unknown> {
  return generateFdbInternal(options);
}

export function generateFdbWithTrace(options: GenerateFdbOptions): GenerateFdbTraceResult {
  const trace = createFdbProvenanceTrace();
  return {
    fdb: generateFdbInternal(options, trace),
    trace
  };
}
