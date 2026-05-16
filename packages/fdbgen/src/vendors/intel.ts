import type { VendorDecoder } from "./types";

export const intelVendor: VendorDecoder = {
  id: "intel",
  identify: (partNumber) => /^(29F|JS29F|I29F|PF29F|PC29F|PD29F)/.test(partNumber)
};
