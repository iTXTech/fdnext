import { MICRON_LIKE_PACKAGE_SUFFIXES } from "./package-suffixes";
import type { VendorDecoder } from "./types";

export function removeSpectekPackage(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  const suffix = base.slice(-2).toUpperCase();
  return MICRON_LIKE_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
}

export const spectekVendor: VendorDecoder = {
  id: "spectek",
  aliases: ["septeck"],
  identify: (partNumber) => /^(FBNL|FNNL|FNN|FXXL)/.test(partNumber),
  normalizePartNumber: removeSpectekPackage
};
