import { removeChars } from "./string";

const PN_REMOVALS = [" ", ",", "&", ".", "|"];
const PN_TOKEN_SEPARATORS = [":"];

function normalizePartNumberAlias(partNumber: string): string {
  return partNumber
    .replace(/^EMT29F/, "MT29F")
    .replace(/^(H25[A-Z0-9]+)-X([0-9A-Z]+)(?:-([A-Z0-9]+))?$/, (_match, base: string, suffix: string, tail: string | undefined) => `${base}X${suffix}${tail ?? ""}`);
}

export function normalizePartNumber(partNumber: string): string {
  return normalizePartNumberAlias(removeChars(partNumber.toUpperCase().replace(/\uFFFD/g, "-"), PN_REMOVALS));
}

export function normalizePartNumberTokenKey(partNumber: string): string {
  return removeChars(normalizePartNumber(partNumber), PN_TOKEN_SEPARATORS);
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
