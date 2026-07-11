import { getPartNumberLookupKeys, inferVendorFromPartNumber, normalizeVendor } from "./fdb-lookup";
import type { FdbDataset, FlashIdRecord, MdbDataset, PartNumberRecord } from "./types";
import { normalizePartNumber, normalizePartNumberTokenKey } from "./utils/normalize";

interface PartNumberTokenIndexEntry {
  readonly order: number;
  readonly record: PartNumberRecord;
}

const partNumberTokenIndexes = new WeakMap<
  Map<string, PartNumberRecord>,
  ReadonlyMap<string, PartNumberTokenIndexEntry>
>();

function normalizeFlashIdKey(id: string): string | null {
  const normalized = id.replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return null;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : null;
}

function mergeStringArray(target: string[] | undefined, source: string[]): string[] {
  const set = new Set<string>();
  for (const item of target ?? []) {
    const text = String(item).trim();
    if (text) {
      set.add(text);
    }
  }
  for (const item of source) {
    const text = String(item).trim();
    if (text) {
      set.add(text);
    }
  }
  return [...set];
}

function parsePartReference(value: unknown): { vendor: string; partNumber: string } | null {
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
  return { vendor, partNumber };
}

function toPartReference(value: unknown, vendors: Map<string, Map<string, PartNumberRecord>>): string | null {
  const parsed = parsePartReference(value);
  if (!parsed) {
    return null;
  }
  const vendorParts = vendors.get(parsed.vendor);
  if (!vendorParts) {
    return null;
  }
  const partNumber = canonicalPartNumberKey(parsed.partNumber, vendorParts);
  if (!vendorParts.has(partNumber)) {
    return null;
  }
  return `${parsed.vendor} ${partNumber}`;
}

function canonicalPartNumberKey(partNumber: string, partNumbers: Map<string, PartNumberRecord>): string {
  const inferredVendor = inferVendorFromPartNumber(partNumber);
  if (inferredVendor) {
    for (const candidate of getPartNumberLookupKeys(inferredVendor, partNumber)) {
      if (candidate !== partNumber && partNumbers.has(candidate)) {
        return candidate;
      }
    }
  }
  const duplicateSuffix = /^(.*)_1$/.exec(partNumber);
  if (duplicateSuffix?.[1] && partNumbers.has(duplicateSuffix[1])) {
    return duplicateSuffix[1];
  }
  if (partNumber.endsWith("-")) {
    const withoutTrailingDash = partNumber.slice(0, -1);
    if (withoutTrailingDash && partNumbers.has(withoutTrailingDash)) {
      return withoutTrailingDash;
    }
  }
  return partNumber;
}

function buildPartNumberTokenIndex(
  partNumbers: Map<string, PartNumberRecord>
): ReadonlyMap<string, PartNumberTokenIndexEntry> {
  const index = new Map<string, PartNumberTokenIndexEntry>();
  let order = 0;
  for (const [partNumber, record] of partNumbers) {
    const tokenKey = normalizePartNumberTokenKey(partNumber);
    if (!index.has(tokenKey)) {
      index.set(tokenKey, { order, record });
    }
    order += 1;
  }
  partNumberTokenIndexes.set(partNumbers, index);
  return index;
}

function tokenEquivalentPartNumberRecord(
  partNumbers: Map<string, PartNumberRecord>,
  lookupKeys: string[]
): PartNumberRecord | undefined {
  const index = partNumberTokenIndexes.get(partNumbers) ?? buildPartNumberTokenIndex(partNumbers);
  let selected: PartNumberTokenIndexEntry | undefined;
  for (const lookupKey of lookupKeys) {
    const candidate = index.get(normalizePartNumberTokenKey(lookupKey));
    if (candidate && (!selected || candidate.order < selected.order)) {
      selected = candidate;
    }
  }
  return selected?.record;
}

function hasExactSupplementalFields(record: PartNumberRecord): boolean {
  return Boolean(record.pkg || record.sg || record.pc || record.vol || record.so || record.d != null || record.e != null || record.r != null || record.n != null || record.pl != null);
}

function shouldPreserveExactPartNumberKey(partNumber: string, record: PartNumberRecord): boolean {
  return /^H25[A-Z0-9]{8,}/.test(partNumber) && partNumber.length > 10 && hasExactSupplementalFields(record);
}

function mergePartNumberRecord(target: PartNumberRecord, source: PartNumberRecord): PartNumberRecord {
  return {
    ...target,
    id: mergeStringArray(target.id, source.id),
    t: mergeStringArray(target.t, source.t ?? []),
    f: mergeStringArray(target.f, source.f ?? []),
    a: mergeStringArray(target.a, source.a ?? []),
    l: source.l ?? target.l,
    c: source.c ?? target.c,
    m: source.m ?? target.m,
    pkg: source.pkg ?? target.pkg,
    sg: source.sg ?? target.sg,
    pc: source.pc ?? target.pc,
    vol: source.vol ?? target.vol,
    so: source.so ?? target.so,
    d: source.d ?? target.d,
    e: source.e ?? target.e,
    r: source.r ?? target.r,
    n: source.n ?? target.n,
    pl: source.pl ?? target.pl
  };
}

function canonicalizePartNumbers(partNumbers: Map<string, PartNumberRecord>): void {
  for (const [partNumber, record] of [...partNumbers.entries()]) {
    if (shouldPreserveExactPartNumberKey(partNumber, record)) {
      continue;
    }
    const canonical = canonicalPartNumberKey(partNumber, partNumbers);
    if (canonical === partNumber) {
      continue;
    }
    const existing = partNumbers.get(canonical);
    if (existing) {
      partNumbers.set(canonical, mergePartNumberRecord(existing, { ...record, pn: canonical }));
    } else {
      partNumbers.set(canonical, { ...record, pn: canonical });
    }
    partNumbers.delete(partNumber);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function buildFdb(rawInput: Record<string, unknown>): FdbDataset {
  const raw = asRecord(rawInput);
  const info = asRecord(raw.info);
  const infoControllers = Array.isArray(info.controllers) ? info.controllers.map(String) : [];

  const vendors = new Map<string, Map<string, PartNumberRecord>>();
  const flashIds = new Map<string, FlashIdRecord>();

  const iddb = asRecord(raw.iddb);
  for (const [flashId, value] of Object.entries(iddb)) {
    const normalizedId = normalizeFlashIdKey(flashId);
    if (!normalizedId) {
      continue;
    }
    const data = asRecord(value);
    const existing = flashIds.get(normalizedId);
    flashIds.set(normalizedId, {
      ...(existing ?? {}),
      id: normalizedId,
      s: typeof data.s === "number" ? data.s : undefined,
      p: typeof data.p === "number" ? data.p : undefined,
      b: typeof data.b === "number" ? data.b : undefined,
      t: mergeStringArray(existing?.t, Array.isArray(data.t) ? data.t.map(String) : []),
      n: mergeStringArray(existing?.n, Array.isArray(data.n) ? data.n.map(String) : [])
    });
  }

  for (const [vendorName, value] of Object.entries(raw)) {
    if (vendorName === "schemaVersion" || vendorName === "info" || vendorName === "iddb") {
      continue;
    }

    const vendor = normalizeVendor(vendorName);
    for (const [pn, pnDataRaw] of Object.entries(asRecord(value))) {
      const normalizedPn = normalizePartNumber(pn);
      if (!normalizedPn) {
        continue;
      }
      const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? vendor;
      let vendorMap = vendors.get(correctedVendor);
      if (!vendorMap) {
        vendorMap = new Map<string, PartNumberRecord>();
        vendors.set(correctedVendor, vendorMap);
      }
      const pnData = asRecord(pnDataRaw);
      const id = Array.isArray(pnData.id) ? pnData.id.map((item) => normalizeFlashIdKey(String(item))).filter((item): item is string => !!item) : [];
      const f = Array.isArray(pnData.f) ? pnData.f.map((item) => normalizeFlashIdKey(String(item))).filter((item): item is string => !!item) : [];
      const a = Array.isArray(pnData.a) ? pnData.a.map(String) : [];
      const next = {
        pn: normalizedPn,
        id,
        f,
        a,
        l: typeof pnData.l === "string" ? pnData.l : undefined,
        c: typeof pnData.c === "string" ? pnData.c : undefined,
        t: Array.isArray(pnData.t) ? pnData.t.map(String) : [],
        m: typeof pnData.m === "string" ? pnData.m : undefined,
        pkg: typeof pnData.pkg === "string" ? pnData.pkg : undefined,
        sg: typeof pnData.sg === "string" ? pnData.sg : undefined,
        pc: typeof pnData.pc === "string" ? pnData.pc : undefined,
        vol: typeof pnData.vol === "string" ? pnData.vol : undefined,
        so: typeof pnData.so === "string" ? pnData.so : undefined,
        d: typeof pnData.d === "number" ? pnData.d : undefined,
        e: typeof pnData.e === "number" ? pnData.e : undefined,
        r: typeof pnData.r === "number" ? pnData.r : undefined,
        n: typeof pnData.n === "number" ? pnData.n : undefined,
        pl: typeof pnData.pl === "number" ? pnData.pl : undefined
      };
      const existing = vendorMap.get(normalizedPn);
      vendorMap.set(normalizedPn, existing ? mergePartNumberRecord(existing, next) : next);
    }
  }

  for (const partNumbers of vendors.values()) {
    canonicalizePartNumbers(partNumbers);
  }

  for (const partNumbers of vendors.values()) {
    for (const [partNumber, record] of partNumbers.entries()) {
      const refs = mergeStringArray(
        [],
        (record.a ?? []).map((item) => toPartReference(item, vendors)).filter((item): item is string => !!item)
      );
      partNumbers.set(partNumber, {
        ...record,
        a: refs
      });
    }
  }

  for (const [flashId, record] of flashIds.entries()) {
    const refs = mergeStringArray(
      [],
      (record.n ?? []).map((item) => toPartReference(item, vendors)).filter((item): item is string => !!item)
    );
    flashIds.set(flashId, {
      ...record,
      n: refs
    });
  }

  for (const partNumbers of vendors.values()) {
    buildPartNumberTokenIndex(partNumbers);
  }

  return {
    info: {
      name: String(info.name ?? "iTXTech fdnext Flash Database"),
      version: String(info.version ?? "0"),
      website: String(info.website ?? ""),
      time: String(info.time ?? ""),
      controllers: infoControllers
    },
    vendors,
    flashIds
  };
}

export function buildMdb(rawInput: Record<string, unknown>): MdbDataset {
  const raw = asRecord(rawInput);
  const micronRaw = asRecord(raw.micron);
  const spectekRaw = asRecord(raw.spectek);

  const micron: Record<string, string> = {};
  for (const [code, partNumber] of Object.entries(micronRaw)) {
    micron[code.toUpperCase()] = String(partNumber).toUpperCase();
  }

  const spectek: Record<string, string[]> = {};
  for (const [code, partNumbers] of Object.entries(spectekRaw)) {
    if (Array.isArray(partNumbers)) {
      spectek[code.toUpperCase()] = partNumbers.map((value) => String(value).toUpperCase());
    }
  }

  return { micron, spectek };
}

export function getPartNumberRecord(
  fdb: FdbDataset,
  vendor: string,
  partNumber: string
): PartNumberRecord | undefined {
  const vendorData = fdb.vendors.get(normalizeVendor(vendor));
  const lookupKeys = getPartNumberLookupKeys(vendor, partNumber);
  for (const lookupKey of lookupKeys) {
    const record = vendorData?.get(lookupKey);
    if (record) {
      return record;
    }
  }
  return vendorData ? tokenEquivalentPartNumberRecord(vendorData, lookupKeys) : undefined;
}

export function findPartNumberAcrossVendors(
  fdb: FdbDataset,
  partNumber: string
): { vendor: string; record: PartNumberRecord } | undefined {
  const target = normalizePartNumber(partNumber);
  const inferredVendor = inferVendorFromPartNumber(target);
  if (inferredVendor) {
    const record = getPartNumberRecord(fdb, inferredVendor, target);
    if (record) {
      return { vendor: inferredVendor, record };
    }
  }
  for (const [vendor, partNumbers] of fdb.vendors.entries()) {
    const lookupKeys = getPartNumberLookupKeys(vendor, target);
    for (const lookupKey of lookupKeys) {
      const record = partNumbers.get(lookupKey);
      if (record) {
        return { vendor, record };
      }
    }
    const tokenEquivalent = tokenEquivalentPartNumberRecord(partNumbers, lookupKeys);
    if (tokenEquivalent) {
      return { vendor, record: tokenEquivalent };
    }
  }
  return undefined;
}

export function findFlashIdRecord(fdb: FdbDataset, flashId: string): FlashIdRecord | undefined {
  return fdb.flashIds.get(flashId.toUpperCase());
}
