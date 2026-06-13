import { decodepackLookupPartNumber, removeMicronPackageSuffix } from "./decodepack";
import type { VendorDecoder } from "./types";

export function normalizeMicronPartNumber(partNumber: string): string {
  const lookupPartNumber = decodepackLookupPartNumber("micron", partNumber);
  return lookupPartNumber === partNumber && /^(FN|FT|FB|FX|CB)/.test(partNumber)
    ? removeMicronPackageSuffix(partNumber)
    : lookupPartNumber;
}

export const micronVendor: VendorDecoder = {
  id: "micron",
  identify: (partNumber) => /^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber),
  normalizePartNumber: normalizeMicronPartNumber
};
