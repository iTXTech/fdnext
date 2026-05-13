import { normalizeFdbVendorName } from "./normalize";
import { vendorFromSupportListFlashId } from "./support-list";

export interface PartNameAuditSignal {
  code: string;
  message: string;
}

export interface VendorIdentityInput {
  storedVendor: string;
  partNumber: string;
  rawVendor?: unknown;
  flashIds: readonly string[];
}

const METADATA_SUFFIX = /(?:_[A-Z0-9]+|\/[A-Z0-9/]+|\([A-Z0-9+-]+\))$/;
const GENERIC_LABEL = /^(?:DUALDIE|QUALDIE|SANDISKPRO|SANDISKX16|GEN\d|SNDK|YMTC|SS|HY|EMMC|N18A|B74A|F41|[0-9A-F]{3,4}|[0-9]+G)$/;
const PLACEHOLDER_TOKEN = /(?:\/X(?:$|\d)|\(X\d+\)|(?:^|[-_])X\d+(?:[-_]|$)|SANDISKX\d+)/;

function normalizeRawVendor(value: unknown): string {
  return normalizeFdbVendorName(value);
}

function distinct<T>(items: Iterable<T>): T[] {
  return [...new Set(items)];
}

export function partNameAuditSignals(partNumber: string): PartNameAuditSignal[] {
  const signals: PartNameAuditSignal[] = [];
  if (METADATA_SUFFIX.test(partNumber)) {
    signals.push({
      code: "part.metadata_suffix",
      message: "Part-number keys should not keep package notes, die notes, bin markers, slash variants, or parenthesized metadata."
    });
  }
  if (GENERIC_LABEL.test(partNumber)) {
    signals.push({
      code: "part.generic_label",
      message: "Generic labels and short descriptive tokens should not live in authoritative PN tables."
    });
  }
  if (PLACEHOLDER_TOKEN.test(partNumber)) {
    signals.push({
      code: "part.placeholder_token",
      message: "Placeholder X tokens should be resolved, moved to metadata, or dropped instead of kept in PN keys."
    });
  }
  return signals;
}

export function hasVendorIdentityConflict(input: VendorIdentityInput): boolean {
  const rawVendor = normalizeRawVendor(input.rawVendor);
  if (!rawVendor || rawVendor === input.storedVendor) {
    return false;
  }
  const idVendors = distinct(input.flashIds.map((id) => vendorFromSupportListFlashId(id)).filter((item): item is string => !!item));
  return idVendors.includes(rawVendor) && !idVendors.includes(input.storedVendor);
}
