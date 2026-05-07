import type { VendorDecoder } from "./types";

export const sndkVendor: VendorDecoder = {
  id: "sndk",
  aliases: ["sandisk", "san disk", "westerndigital", "western digital", "wd"],
  identify: (partNumber) => /^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(partNumber)
};
