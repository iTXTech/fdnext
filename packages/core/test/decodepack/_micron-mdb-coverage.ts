import { normalizePartNumberTokenKey } from "../../src/utils/normalize";

const ignoredMdbText = /\bDO NOT USE\b/i;
const tokenSeparators = /[\s:.-]/;
const ignoredTokenCharacters = /[\s,&.|:-]/;

function micronMdbPartNumbers(raw: unknown): string[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }
  const micron = (raw as Record<string, unknown>).micron;
  if (!micron || typeof micron !== "object" || Array.isArray(micron)) {
    return [];
  }
  return [...new Set(
    Object.values(micron as Record<string, unknown>)
      .filter((value): value is string => typeof value === "string" && !ignoredMdbText.test(value))
  )];
}

function rawSuffixAfterTokenPrefix(partNumber: string, tokenLength: number): string {
  let consumed = 0;
  for (let index = 0; index < partNumber.length; index += 1) {
    const char = partNumber[index] ?? "";
    if (!ignoredTokenCharacters.test(char)) {
      consumed += 1;
    }
    if (consumed === tokenLength) {
      return partNumber.slice(index + 1);
    }
  }
  return "";
}

export function micronMdbCoverage(raw: unknown, partNumber: string): string[] {
  const tokenKey = normalizePartNumberTokenKey(partNumber);
  return micronMdbPartNumbers(raw).filter((mdbPartNumber) => {
    const mdbTokenKey = normalizePartNumberTokenKey(mdbPartNumber);
    if (mdbTokenKey === tokenKey) {
      return true;
    }
    if (!mdbTokenKey.startsWith(tokenKey)) {
      return false;
    }
    const suffix = rawSuffixAfterTokenPrefix(mdbPartNumber, tokenKey.length);
    return suffix.length > 0 && tokenSeparators.test(suffix[0] ?? "");
  });
}
