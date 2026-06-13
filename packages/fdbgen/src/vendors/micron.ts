import { decodepackLookupPartNumber } from "./decodepack";
import type { VendorDecoder } from "./types";

export function normalizeMicronPartNumber(partNumber: string): string {
  return decodepackLookupPartNumber("micron", partNumber);
}

export const micronVendor: VendorDecoder = {
  id: "micron",
  identify: (partNumber) => /^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber),
  normalizePartNumber: normalizeMicronPartNumber
};
