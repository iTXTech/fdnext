import type { VendorDecoder } from "./types";

export const spectekVendor: VendorDecoder = {
  id: "spectek",
  aliases: ["septeck"],
  identify: (partNumber) => /^(FBNL|FNNL|FNN|FXXL)/.test(partNumber)
};
