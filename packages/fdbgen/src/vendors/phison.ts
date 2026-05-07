import type { VendorDecoder } from "./types";

export const phisonVendor: VendorDecoder = {
  id: "phison",
  identify: (partNumber) => /^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(partNumber)
};
