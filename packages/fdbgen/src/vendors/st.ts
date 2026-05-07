import type { VendorDecoder } from "./types";

export const stVendor: VendorDecoder = {
  id: "st",
  aliases: ["stm"],
  identify: (partNumber) => /^(NAND|M29F)/.test(partNumber)
};
