import type { NormalizeStep } from "./types";

export interface PartNumberSeparator {
  offset: number;
  separator: "-" | ":";
}

export function displayNormalization(steps: readonly NormalizeStep[] = []): NormalizeStep[] {
  return steps.map((step) => typeof step === "string" ? step : {
    remove: step.remove.filter((token) => token !== "-" && token !== ":")
  });
}

export function partNumberTokenLength(value: string): number {
  return value.replaceAll(/[-:]/g, "").length;
}

/** Rebuild only declared boundaries; keep unparsed tail punctuation and all tokens. */
export function formatPartNumber(input: string, boundaries: readonly PartNumberSeparator[]): string {
  if (boundaries.length === 0) return input;
  const separators = new Map(boundaries.map(({ offset, separator }) => [offset, separator]));
  const lastBoundary = Math.max(...separators.keys());
  let offset = 0;
  let formatted = "";
  for (const char of input) {
    if (char === "-" || char === ":") {
      if (offset > lastBoundary) formatted += char;
      continue;
    }
    const separator = separators.get(offset);
    if (separator) formatted += separator;
    formatted += char;
    offset += 1;
  }
  return formatted;
}
