import { VENDOR_PATCH } from "./constants";
import { normalizePartNumber } from "./utils/normalize";

export type PartNumberLookupKeyResolver = (vendor: string, partNumber: string) => string[];

const SNDK_TWELVE_DIGIT_MARKING = /^[0-9]{4}[0-9A-Z][HKRPQVXEFCJGU][0-9A-Z]{6}$/;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

export function inferVendorFromPartNumber(partNumber: string): string | null {
  const normalized = normalizePartNumber(partNumber);
  if (/^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(normalized)) {
    return "micron";
  }
  if (/^(K9|KLM|KLU|KMD|KMF|KMN|KMV)/.test(normalized)) {
    return "samsung";
  }
  if (/^(HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/.test(normalized)) {
    return "skhynix";
  }
  if (/^(TC58|TH58|THG)/.test(normalized)) {
    return "kioxia";
  }
  if (
    /^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(normalized) ||
    SNDK_TWELVE_DIGIT_MARKING.test(normalized)
  ) {
    return "sndk";
  }
  if (/^(JS29F|I29F|PF29F|PC29F|PD29F)/.test(normalized)) {
    return "intel";
  }
  if (/^(FBNL|FNNL|FNN|FXXL)/.test(normalized)) {
    return "spectek";
  }
  if (/^(NAND|M29F)/.test(normalized)) {
    return "st";
  }
  if (/^(YM|YMN|XT|YMC|YME|YMUS)/.test(normalized)) {
    return "ymtc";
  }
  if (/^(GDP|GDQ|GDB)/.test(normalized)) {
    return "gigadevice";
  }
  if (/^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(normalized)) {
    return "phison";
  }
  return null;
}

function normalizeSkhynixH25XPackage(partNumber: string): string {
  return partNumber.replace(/^(H25[A-Z0-9]+)-X([0-9A-Z]+)(?:-([A-Z0-9]+))?$/, (_match, base: string, suffix: string, tail: string | undefined) => `${base}X${suffix}${tail ?? ""}`);
}

function removeSkhynixPackage(partNumber: string): string {
  const normalized = normalizeSkhynixH25XPackage(partNumber);
  const base = normalized.split("-")[0] ?? normalized;
  return base.startsWith("H27") || base.startsWith("H25") ? base.slice(0, 10) : base;
}

function samsungLookupKeys(partNumber: string): string[] {
  const base = partNumber.split("-")[0] ?? partNumber;
  return unique([partNumber, base]);
}

export function getPartNumberLookupKeys(vendor: string, partNumber: string, resolveLookupKeys?: PartNumberLookupKeyResolver): string[] {
  const normalizedPartNumber = normalizePartNumber(partNumber);
  if (!normalizedPartNumber) {
    return [];
  }
  const decodepackLookupKeys = resolveLookupKeys?.(vendor, normalizedPartNumber).map(normalizePartNumber) ?? [];

  switch (normalizeVendor(vendor)) {
    case "micron":
      return unique([normalizedPartNumber, ...decodepackLookupKeys]);
    case "spectek":
      return unique([normalizedPartNumber, ...decodepackLookupKeys]);
    case "skhynix":
      return unique([normalizedPartNumber, ...decodepackLookupKeys, normalizeSkhynixH25XPackage(normalizedPartNumber), removeSkhynixPackage(normalizedPartNumber)]);
    case "samsung":
      return unique([normalizedPartNumber, ...decodepackLookupKeys, ...samsungLookupKeys(normalizedPartNumber)]);
    default:
      return unique([normalizedPartNumber, ...decodepackLookupKeys]);
  }
}
