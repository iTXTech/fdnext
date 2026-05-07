import { VENDOR_PATCH } from "./constants";
import type { FdbDataset, FlashIdRecord, MdbDataset, PartNumberRecord } from "./types";
import { normalizePartNumber } from "./utils/normalize";

function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

function normalizeFlashIdKey(id: string): string | null {
  const normalized = id.replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return null;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : null;
}

function inferVendorFromPartNumber(partNumber: string): string | null {
  if (/^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber)) {
    return "micron";
  }
  if (/^(K9|KLM|KLU|KMD|KMF|KMN|KMV)/.test(partNumber)) {
    return "samsung";
  }
  if (/^(HY27|H27|H25|H26|H2D|H2J|H9T|HYNIX)/.test(partNumber)) {
    return "skhynix";
  }
  if (/^(TC58|TH58)/.test(partNumber)) {
    return "kioxia";
  }
  if (/^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(partNumber)) {
    return "sndk";
  }
  if (/^(JS29F|I29F|PF29F|PC29F|PD29F)/.test(partNumber)) {
    return "intel";
  }
  if (/^(FBNL|FNNL|FNN|FXXL)/.test(partNumber)) {
    return "spectek";
  }
  if (/^(NAND|M29F)/.test(partNumber)) {
    return "st";
  }
  if (/^(YM|YMN|XT)/.test(partNumber)) {
    return "ymtc";
  }
  if (/^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(partNumber)) {
    return "phison";
  }
  return null;
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

function mergePartNumberRecord(target: PartNumberRecord, source: PartNumberRecord): PartNumberRecord {
  return {
    ...target,
    id: mergeStringArray(target.id, source.id),
    t: mergeStringArray(target.t, source.t ?? []),
    l: source.l ?? target.l,
    c: source.c ?? target.c,
    m: source.m ?? target.m,
    d: source.d ?? target.d,
    e: source.e ?? target.e,
    r: source.r ?? target.r,
    n: source.n ?? target.n
  };
}

function canonicalizePartNumbers(partNumbers: Map<string, PartNumberRecord>): void {
  for (const [partNumber, record] of [...partNumbers.entries()]) {
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
    if (vendorName === "info" || vendorName === "iddb") {
      continue;
    }

    const vendor = normalizeVendor(vendorName);
    for (const [pn, pnDataRaw] of Object.entries(asRecord(value))) {
      const normalizedPn = normalizePartNumber(pn);
      if (!normalizedPn) {
        continue;
      }
      const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? vendor;
      const existingVendorMap = vendors.get(correctedVendor);
      const vendorMap = new Map<string, PartNumberRecord>(existingVendorMap);
      const pnData = asRecord(pnDataRaw);
      const id = Array.isArray(pnData.id) ? pnData.id.map((item) => normalizeFlashIdKey(String(item))).filter((item): item is string => !!item) : [];
      const next = {
        pn: normalizedPn,
        id,
        l: typeof pnData.l === "string" ? pnData.l : undefined,
        c: typeof pnData.c === "string" ? pnData.c : undefined,
        t: Array.isArray(pnData.t) ? pnData.t.map(String) : [],
        m: typeof pnData.m === "string" ? pnData.m : undefined,
        d: typeof pnData.d === "number" ? pnData.d : undefined,
        e: typeof pnData.e === "number" ? pnData.e : undefined,
        r: typeof pnData.r === "number" ? pnData.r : undefined,
        n: typeof pnData.n === "number" ? pnData.n : undefined
      };
      const existing = vendorMap.get(normalizedPn) ?? existingVendorMap?.get(normalizedPn);
      vendorMap.set(normalizedPn, existing ? mergePartNumberRecord(existing, next) : next);
      vendors.set(correctedVendor, vendorMap);
    }
  }

  for (const partNumbers of vendors.values()) {
    canonicalizePartNumbers(partNumbers);
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

  return {
    info: {
      name: String(info.name ?? "iTXTech FlashDetector Flash Database"),
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
  return vendorData?.get(normalizePartNumber(partNumber));
}

export function findPartNumberAcrossVendors(
  fdb: FdbDataset,
  partNumber: string
): { vendor: string; record: PartNumberRecord } | undefined {
  const target = normalizePartNumber(partNumber);
  for (const [vendor, partNumbers] of fdb.vendors.entries()) {
    const record = partNumbers.get(target);
    if (record) {
      return { vendor, record };
    }
  }
  return undefined;
}

export function findFlashIdRecord(fdb: FdbDataset, flashId: string): FlashIdRecord | undefined {
  return fdb.flashIds.get(flashId.toUpperCase());
}
