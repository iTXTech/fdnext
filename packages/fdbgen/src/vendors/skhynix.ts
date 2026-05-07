import type { VendorDecoder } from "./types";

export function removeSkhynixPackage(partNumber: string): string {
  return partNumber.startsWith("H27") || partNumber.startsWith("H25") ? partNumber.slice(0, 10) : partNumber;
}

export const skhynixVendor: VendorDecoder = {
  id: "skhynix",
  aliases: ["hynix"],
  identify: (partNumber) => /^(HY27|H27|H25|H26|H2D|H2J|H9T|HYNIX)/.test(partNumber),
  normalizePartNumber: removeSkhynixPackage
};
