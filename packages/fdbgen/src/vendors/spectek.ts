import { decodepackLookupPartNumber } from "./decodepack";
import type { VendorDecoder } from "./types";

export function normalizeSpectekPartNumber(partNumber: string): string {
  return decodepackLookupPartNumber("spectek", partNumber);
}

export const spectekVendor: VendorDecoder = {
  id: "spectek",
  aliases: ["septeck"],
  identify: (partNumber) => /^(FBNL|FNNL|FNN|FXXL)/.test(partNumber),
  normalizePartNumber: normalizeSpectekPartNumber
};
