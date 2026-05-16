import { UNKNOWN } from "./constants";
import { fdnextFieldRegistry, type FdnextFieldKey } from "./field-registry";
import type {
  FdnextChipKind,
  FdnextFieldValueData,
  FdnextProductType
} from "./result";
import type {
  DecodeDraftFields,
  IdentifierDecodeDraft,
  PartDecodeDraft
} from "./types";

export type AnyDecodeDraft = PartDecodeDraft | IdentifierDecodeDraft;

export function draftFields<T extends AnyDecodeDraft>(draft: T): DecodeDraftFields {
  draft.fields ??= {};
  return draft.fields;
}

export function draftField(draft: AnyDecodeDraft, key: FdnextFieldKey): FdnextFieldValueData | undefined {
  return draft.fields?.[key];
}

export function setDraftField(draft: AnyDecodeDraft, key: FdnextFieldKey, value: unknown): void {
  if (!Object.hasOwn(fdnextFieldRegistry, key) || value === undefined) {
    return;
  }
  draftFields(draft)[key] = value as FdnextFieldValueData;
}

export function deleteDraftField(draft: AnyDecodeDraft, key: FdnextFieldKey): void {
  if (draft.fields) {
    delete draft.fields[key];
  }
}

export function mergeDraftStringArray(current: string[] | undefined, values: unknown[] | undefined): string[] | undefined {
  const merged = new Set<string>();
  for (const item of current ?? []) {
    const text = String(item).trim();
    if (text) {
      merged.add(text);
    }
  }
  for (const item of values ?? []) {
    const text = String(item).trim();
    if (text) {
      merged.add(text);
    }
  }
  return merged.size > 0 ? [...merged] : undefined;
}

export function draftVendor(draft: AnyDecodeDraft): string {
  return draft.device.vendor && draft.device.vendor.trim() ? draft.device.vendor.trim() : UNKNOWN;
}

export function draftPartNumber(draft: PartDecodeDraft): string {
  return draft.device.partNumber;
}

export function draftIdentifier(draft: IdentifierDecodeDraft): string {
  return draft.device.identifier;
}

export function knownDraftNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return undefined;
}

export function draftDensity(draft: AnyDecodeDraft): number | undefined {
  const preferred = draft.device.chipKind === "dram" ? draftField(draft, "dram_density") : undefined;
  return knownDraftNumber(preferred) ??
    knownDraftNumber(draftField(draft, "storage_density")) ??
    knownDraftNumber(draftField(draft, "density")) ??
    knownDraftNumber(draftField(draft, "dram_density"));
}

export function managedProductType(value: unknown): FdnextProductType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return ["emmc", "ufs", "sata", "nvme", "emcp", "umcp", "e2nand"].includes(normalized)
    ? normalized as FdnextProductType
    : undefined;
}

export function dramProductType(value: unknown): FdnextProductType | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
  return /^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(normalized)
    ? normalized as FdnextProductType
    : undefined;
}

export function chipKindFromLegacyType(value: unknown): FdnextChipKind | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
  if (normalized === "dram") return "dram";
  if (normalized === "nand") return "raw_nand";
  if (managedProductType(normalized)) return "managed_nand";
  if (dramProductType(normalized)) return "dram";
  return undefined;
}

export function normalizeDraftControllers(draft: AnyDecodeDraft): void {
  draft.controllers = mergeDraftStringArray([], draft.controllers);
}
