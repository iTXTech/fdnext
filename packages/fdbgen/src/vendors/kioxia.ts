import type { VendorDecoder } from "./types";

export const kioxiaVendor: VendorDecoder = {
  id: "kioxia",
  aliases: ["toshiba", "toshiba-iver"],
  identify: (partNumber) => /^(TC58|TH58)/.test(partNumber)
};
