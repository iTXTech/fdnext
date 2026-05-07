import type { VendorDecoder } from "./types";

const SNDK_TWELVE_DIGIT_MARKING = /^[0-9]{4}[0-9A-Z][HKRPQVXEFCJGU][0-9A-Z]{6}$/;

export const sndkVendor: VendorDecoder = {
  id: "sndk",
  aliases: ["sandisk", "san disk", "westerndigital", "western digital", "wd"],
  identify: (partNumber) => {
    const normalized = partNumber.toUpperCase();
    return /^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(normalized) || SNDK_TWELVE_DIGIT_MARKING.test(normalized);
  }
};
