import { UNKNOWN } from "./constants";
import { draftField, draftVendor, dramProductType, managedProductType } from "./draft";
import type { FdnextChipKind, FdnextProductType, OperationConstraints } from "./result";
import type { PartDecodeDraft } from "./types";

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

export function inferProductTypeFromDraft(info: PartDecodeDraft): FdnextProductType | undefined {
  if (typeof info.device.productType === "string" && info.device.productType.trim()) {
    return info.device.productType;
  }
  const productType = managedProductType(draftField(info, "product_type"));
  if (productType) {
    return productType;
  }
  const dramType = dramProductType(draftField(info, "dram_type"));
  if (dramType) {
    return dramType;
  }
  return undefined;
}

export function inferChipKindFromDraft(info: PartDecodeDraft, constraints: OperationConstraints = {}): FdnextChipKind {
  if (constraints.chipKind) {
    return constraints.chipKind;
  }
  if (info.device.chipKind) {
    return info.device.chipKind;
  }

  const productType = inferProductTypeFromDraft(info);
  if (productType && ["emmc", "ufs", "sata", "sas", "nvme", "emcp", "umcp", "e2nand", "e3nand"].includes(String(productType))) {
    return "managed_nand";
  }
  if (productType && /^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(String(productType))) {
    return "dram";
  }
  if (isKnownInfoValue(draftField(info, "dram_type"))) {
    return "dram";
  }
  if (
    draftVendor(info) === UNKNOWN &&
    !isKnownInfoValue(draftField(info, "density")) &&
    !isKnownInfoValue(draftField(info, "storage_density")) &&
    !isKnownInfoValue(draftField(info, "dram_density")) &&
    !isKnownInfoValue(draftField(info, "cell_level"))
  ) {
    return "unknown";
  }
  return "raw_nand";
}
