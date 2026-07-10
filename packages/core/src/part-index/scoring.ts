import { normalizeInfoText } from "../device-inference";
import type { MarkingIndexSource, PartIndexSource } from "./types";

export function vendorKey(vendor: string): string {
  return normalizeInfoText(vendor);
}

export function vendorMatches(actual: string, expected: string): boolean {
  const actualText = vendorKey(actual);
  const expectedText = vendorKey(expected);
  if (!expectedText) {
    return true;
  }
  if (actualText === expectedText) {
    return true;
  }
  const aliases: Record<string, string[]> = {
    esmt: ["elite semiconductor"],
    "elite semiconductor": ["esmt"],
    etron: ["etron technology"],
    "etron technology": ["etron"],
    sndk: ["sandisk", "western digital", "wd"],
    "western digital": ["sndk", "sandisk", "wd"],
    wd: ["sndk", "sandisk", "western digital"],
    skhynix: ["sk hynix"],
    "sk hynix": ["skhynix"]
  };
  return aliases[actualText]?.includes(expectedText) || aliases[expectedText]?.includes(actualText) || false;
}

export function sourceWeight(source: PartIndexSource | MarkingIndexSource): number {
  switch (source) {
    case "micron_fbga":
    case "spectek_fbga":
      return 100;
    case "dram":
      return 92;
    case "managed_nand":
      return 88;
    case "mdb":
      return 78;
    case "fdb":
      return 62;
    case "fallback":
      return 15;
  }
}

export function shouldPreferDecodedClassification(source: PartIndexSource | MarkingIndexSource): boolean {
  return source === "mdb" || source === "micron_fbga" || source === "spectek_fbga";
}
