import type { VendorDecoder } from "./types";

export function removeSkhynixPackage(partNumber: string): string {
  const normalized = partNumber.replace(/^(H25[A-Z0-9]+)-X([0-9A-Z]+)(?:-([A-Z0-9]+))?$/, (_match, base: string, suffix: string, tail: string | undefined) => `${base}X${suffix}${tail ?? ""}`);
  return normalized.startsWith("H27") || (normalized.startsWith("H25") && !/X[0-9A-Z]+$/.test(normalized))
    ? normalized.slice(0, 10)
    : normalized;
}

export const skhynixVendor: VendorDecoder = {
  id: "skhynix",
  aliases: ["hynix"],
  identify: (partNumber) => /^(HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/.test(partNumber),
  normalizePartNumber: removeSkhynixPackage
};
