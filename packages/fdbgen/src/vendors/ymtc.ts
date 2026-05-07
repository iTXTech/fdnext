import type { VendorDecoder } from "./types";

export const ymtcVendor: VendorDecoder = {
  id: "ymtc",
  identify: (partNumber) => /^(YM|YMN|XT)/.test(partNumber)
};
