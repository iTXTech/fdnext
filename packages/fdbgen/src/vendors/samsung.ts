import type { VendorDecoder } from "./types";

export const samsungVendor: VendorDecoder = {
  id: "samsung",
  identify: (partNumber) => /^(K9|KLM|KLU|KMD|KMF|KMN|KMV)/.test(partNumber)
};
