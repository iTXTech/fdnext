import { VENDOR_PATCH } from "./constants";
import { normalizePartNumber } from "./utils/normalize";

// These lookup keys mirror the upstream PHP FDB lookup: keep the displayed PN intact,
// but query controller/FDB support with the vendor's canonical database key.
const MICRON_LIKE_PACKAGE_SUFFIXES = new Set([
  "WP",
  "WC",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "D1",
  "D4",
  "D5",
  "D6",
  "D7",
  "G1",
  "G2",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "H7",
  "H8",
  "H9",
  "HC",
  "J1",
  "J2",
  "J3",
  "J4",
  "J5",
  "J6",
  "J7",
  "J9",
  "K3",
  "K4",
  "K6",
  "K7",
  "K8",
  "K9",
  "L4",
  "M4",
  "M5",
  "M8",
  "M9",
  "MD"
]);

const SAMSUNG_CLASSIFICATION: Record<string, { cellLevel: number; die: number }> = {
  "3": { cellLevel: 4, die: 1 },
  "9": { cellLevel: 4, die: 8 },
  A: { cellLevel: 3, die: 1 },
  B: { cellLevel: 3, die: 2 },
  C: { cellLevel: 3, die: 4 },
  D: { cellLevel: 3, die: 16 },
  F: { cellLevel: 1, die: 1 },
  G: { cellLevel: 2, die: 1 },
  H: { cellLevel: 2, die: 4 },
  K: { cellLevel: 1, die: 2 },
  L: { cellLevel: 2, die: 2 },
  M: { cellLevel: 2, die: 2 },
  N: { cellLevel: 1, die: 2 },
  O: { cellLevel: 3, die: 8 },
  P: { cellLevel: 2, die: 8 },
  Q: { cellLevel: 1, die: 8 },
  R: { cellLevel: 2, die: 12 },
  S: { cellLevel: 2, die: 6 },
  T: { cellLevel: 1, die: 1 },
  U: { cellLevel: 2, die: 16 },
  V: { cellLevel: 1, die: 16 },
  W: { cellLevel: 1, die: 4 },
  X: { cellLevel: 4, die: -1 }
};

const SAMSUNG_DENSITY: Record<string, number> = {
  "12": 512,
  "16": 16,
  "28": 128,
  "32": 32,
  "40": 4,
  "56": 256,
  "64": 64,
  "80": 8,
  "1G": 1024,
  "2G": 2048,
  "4G": 4096,
  "8G": 8192,
  AG: 16384,
  BG: 32768,
  CG: 65536,
  DG: 131072,
  EG: 262144,
  FG: 262144,
  GG: 393216,
  HG: 524288,
  LG: 24576,
  NG: 98304,
  ZG: 49152,
  PG: 175104,
  QG: 349184,
  RG: 699392,
  SG: 1397760,
  KG: 1048576,
  MG: 2097152,
  UG: 4194304,
  VG: 8388608,
  "00": 0
};

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
  if (/^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(normalized)) {
    return "phison";
  }
  return null;
}

function removeSpectekPackage(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  const suffix = base.slice(-2);
  return MICRON_LIKE_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
}

function removeMicronPackage(partNumber: string): string {
  if (/^(FN|FT|FB|FX|CB)/.test(partNumber)) {
    return removeSpectekPackage(partNumber);
  }
  const bit = partNumber.indexOf("08");
  return bit !== -1 && partNumber.length - bit >= 8 ? partNumber.slice(0, bit + 7) : partNumber;
}

function removeSkhynixPackage(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  return base.startsWith("H27") || base.startsWith("H25") ? base.slice(0, 10) : base;
}

function samsungSingleDieKey(partNumber: string): string | null {
  if (!partNumber.startsWith("K9") || partNumber.length !== 10) {
    return null;
  }

  const classification = SAMSUNG_CLASSIFICATION[partNumber[2] ?? ""];
  if (!classification || classification.die <= 1) {
    return null;
  }

  const singleDieCode = Object.entries(SAMSUNG_CLASSIFICATION).find(([, value]) => value.cellLevel === classification.cellLevel && value.die === 1)?.[0];
  if (!singleDieCode) {
    return null;
  }

  const density = SAMSUNG_DENSITY[partNumber.slice(3, 5)];
  const singleDieDensityCode = Object.entries(SAMSUNG_DENSITY).find(([, value]) => value * classification.die === density)?.[0];
  if (!singleDieDensityCode) {
    return null;
  }

  const chars = [...partNumber];
  chars[2] = singleDieCode;
  chars[3] = singleDieDensityCode[0] ?? chars[3] ?? "";
  chars[4] = singleDieDensityCode[1] ?? chars[4] ?? "";
  chars[8] = "0";
  return chars.join("");
}

function samsungLookupKeys(partNumber: string): string[] {
  const base = partNumber.split("-")[0] ?? partNumber;
  return unique([partNumber, base, samsungSingleDieKey(base) ?? ""]);
}

export function getPartNumberLookupKeys(vendor: string, partNumber: string): string[] {
  const normalizedPartNumber = normalizePartNumber(partNumber);
  if (!normalizedPartNumber) {
    return [];
  }

  switch (normalizeVendor(vendor)) {
    case "micron":
      return unique([normalizedPartNumber, removeMicronPackage(normalizedPartNumber)]);
    case "spectek":
      return unique([normalizedPartNumber, removeSpectekPackage(normalizedPartNumber)]);
    case "skhynix":
      return unique([normalizedPartNumber, removeSkhynixPackage(normalizedPartNumber)]);
    case "samsung":
      return samsungLookupKeys(normalizedPartNumber);
    default:
      return [normalizedPartNumber];
  }
}
