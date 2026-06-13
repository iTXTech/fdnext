import { getPartNumberLookupKeys, inferVendorFromPartNumber, normalizeVendor } from "./fdb-lookup";
import type { RuntimeFdbSection, RuntimeFlashIdTuple, RuntimePartNumberTuple } from "./runtime-data";
import type { FlashIdRecord, PartNumberRecord } from "./types";
import { normalizePartNumber, normalizePartNumberTokenKey } from "./utils/normalize";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function partRecordFromTuple(tuple: RuntimePartNumberTuple): PartNumberRecord {
  return {
    pn: String(tuple[0] ?? ""),
    id: stringArray(tuple[1]),
    f: stringArray(tuple[2]),
    a: stringArray(tuple[3]),
    l: optionalString(tuple[4]),
    c: optionalString(tuple[5]),
    t: stringArray(tuple[6]),
    m: optionalString(tuple[7]),
    pkg: optionalString(tuple[8]),
    sg: optionalString(tuple[9]),
    pc: optionalString(tuple[10]),
    vol: optionalString(tuple[11]),
    so: optionalString(tuple[12]),
    d: optionalNumber(tuple[13]),
    e: optionalNumber(tuple[14]),
    r: optionalNumber(tuple[15]),
    n: optionalNumber(tuple[16]),
    pl: optionalNumber(tuple[17])
  };
}

function flashRecordFromTuple(id: string, tuple: RuntimeFlashIdTuple): FlashIdRecord {
  return {
    id,
    s: optionalNumber(tuple[0]),
    p: optionalNumber(tuple[1]),
    b: optionalNumber(tuple[2]),
    t: stringArray(tuple[3]),
    n: stringArray(tuple[4])
  };
}

export function getPartNumberRecord(
  fdb: RuntimeFdbSection,
  vendor: string,
  partNumber: string
): PartNumberRecord | undefined {
  const normalizedVendor = normalizeVendor(vendor);
  const vendorData = fdb.p[normalizedVendor];
  if (!vendorData) {
    return undefined;
  }
  const lookupKeys = getPartNumberLookupKeys(normalizedVendor, partNumber);
  for (const lookupKey of lookupKeys) {
    const tuple = vendorData[lookupKey];
    if (tuple) {
      return partRecordFromTuple(tuple);
    }
  }
  const tokenLookup = fdb.tk[normalizedVendor];
  for (const lookupKey of lookupKeys) {
    const canonical = tokenLookup?.[normalizePartNumberTokenKey(lookupKey)];
    const tuple = canonical ? vendorData[canonical] : undefined;
    if (tuple) {
      return partRecordFromTuple(tuple);
    }
  }
  return undefined;
}

export function findPartNumberAcrossVendors(
  fdb: RuntimeFdbSection,
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
  for (const vendor of Object.keys(fdb.p)) {
    const record = getPartNumberRecord(fdb, vendor, target);
    if (record) {
      return { vendor, record };
    }
  }
  return undefined;
}

export function findFlashIdRecord(fdb: RuntimeFdbSection, flashId: string): FlashIdRecord | undefined {
  const id = flashId.toUpperCase();
  const tuple = fdb.id[id];
  return tuple ? flashRecordFromTuple(id, tuple) : undefined;
}
