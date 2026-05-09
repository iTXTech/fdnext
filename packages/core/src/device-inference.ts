import { UNKNOWN } from "./constants";
import type { FdnextChipKind, FdnextProductType, OperationConstraints } from "./result";
import type { InternalPartInfo } from "./types";

export function normalizeInfoText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .replaceAll(/\be\s+mmc\b/g, "emmc")
    .replaceAll(/\be\s+mcp\b/g, "emcp")
    .replaceAll(/\bu\s+mcp\b/g, "umcp")
    .trim()
    .replaceAll(/\s+/g, " ");
}

export function isKnownInfoValue(value: unknown): boolean {
  if (value == null || value === -1 || value === UNKNOWN) {
    return false;
  }
  if (typeof value === "string") {
    const text = normalizeInfoText(value);
    return text.length > 0 && text !== normalizeInfoText(UNKNOWN);
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return true;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function inferProductTypeFromInfo(info: InternalPartInfo): FdnextProductType | undefined {
  const type = normalizeInfoText(info.type);
  const extra = asRecord(info.fields);
  const dramType = normalizeInfoText(extra.dram_type);
  if (["emmc", "ufs", "emcp", "umcp", "e2nand", "inand"].includes(type)) {
    return type;
  }
  if (dramType) {
    return dramType.replaceAll(" sdram", "").replaceAll(" sgram", "").replaceAll(" ", "") as FdnextProductType;
  }
  if (/^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(type)) {
    return type.replaceAll(" ", "") as FdnextProductType;
  }
  return undefined;
}

export function inferChipKindFromInfo(info: InternalPartInfo, constraints: OperationConstraints = {}): FdnextChipKind {
  if (constraints.chipKind) {
    return constraints.chipKind;
  }

  const type = normalizeInfoText(info.type);
  const productType = inferProductTypeFromInfo(info);
  if (type === "on die ecc nand" || type === "片上 ecc nand") {
    return "on_die_ecc_nand";
  }
  if (productType && ["emmc", "ufs", "emcp", "umcp", "e2nand", "inand"].includes(String(productType))) {
    return "managed_nand";
  }
  if (productType && /^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(String(productType))) {
    return "dram";
  }
  if (type === "dram") {
    return "dram";
  }
  if (info.vendor === UNKNOWN && !isKnownInfoValue(info.density) && !isKnownInfoValue(info.cellLevel)) {
    return "unknown";
  }
  return "raw_nand";
}
