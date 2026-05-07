import { MICRON_LIKE_PACKAGE_SUFFIXES } from "./package-suffixes";
import type { VendorDecoder } from "./types";

export function removeMicronPackage(partNumber: string): string {
  if (/^(FN|FT|FB|FX|CB)/.test(partNumber)) {
    const base = partNumber.split("-")[0] ?? partNumber;
    const suffix = base.slice(-2).toUpperCase();
    return MICRON_LIKE_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
  }
  const idx = partNumber.indexOf("08");
  if (idx !== -1 && partNumber.length - idx >= 8) {
    return partNumber.slice(0, idx + 7);
  }
  return partNumber;
}

export const micronVendor: VendorDecoder = {
  id: "micron",
  identify: (partNumber) => /^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber),
  normalizePartNumber: removeMicronPackage
};
