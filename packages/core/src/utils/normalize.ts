import { removeChars } from "./string.js";

const PN_REMOVALS = [" ", ",", "&", ".", "|"];

export function normalizePartNumber(partNumber: string): string {
  return removeChars(partNumber.toUpperCase(), PN_REMOVALS);
}

export function normalizeFlashId(id: string): string {
  return id.toUpperCase().replace(/[^0-9A-F]/g, "");
}

export function padFlashId(id: string, length = 12): string {
  if (id.length >= length) {
    return id;
  }
  return `${id}${"0".repeat(length - id.length)}`;
}
