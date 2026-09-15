import type { VendorDecoder } from "./types";

export const micronVendor: VendorDecoder = {
  id: "micron",
  identify: (partNumber) => /^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber)
};
