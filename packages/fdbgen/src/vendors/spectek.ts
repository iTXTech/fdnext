import { decodepackLookupPartNumber, removeMicronPackageSuffix } from "./decodepack";
import type { VendorDecoder } from "./types";

export function normalizeSpectekPartNumber(partNumber: string): string {
  const lookupPartNumber = decodepackLookupPartNumber("spectek", partNumber);
  return lookupPartNumber === partNumber ? removeMicronPackageSuffix(partNumber) : lookupPartNumber;
}

export const spectekVendor: VendorDecoder = {
  id: "spectek",
  aliases: ["septeck"],
  identify: (partNumber) => /^(FBNL|FNNL|FNN|FXXL)/.test(partNumber),
  normalizePartNumber: normalizeSpectekPartNumber
};
