import type { ControllerMergeContext } from "./controllers";
import { inferVendorFromPartNumber, normalizeVendor } from "./vendors";

export interface SupportListEntryInput {
  vendor?: unknown;
  partNumber?: unknown;
  flashId?: unknown;
  controllers?: unknown;
  cellLevel?: unknown;
  strictFlashId?: boolean;
  requireSupportedFlashIdPrefix?: boolean;
}

export interface SupportListMergeResult {
  flashId?: string;
  controllers: string[];
  imported: boolean;
  importedPartNumber?: string;
  importedVendor?: string;
}

const SUPPORTED_FLASH_ID_PREFIXES = new Set(["2C", "45", "89", "98", "9B", "AD", "B5", "EC"]);
const COMPATIBLE_PART_VENDORS: Record<string, Set<string>> = {
  intel: new Set(["intel", "micron", "spectek"]),
  kioxia: new Set(["kioxia", "sndk"]),
  micron: new Set(["micron", "intel", "spectek"]),
  samsung: new Set(["samsung"]),
  skhynix: new Set(["skhynix"]),
  sndk: new Set(["sndk", "kioxia"]),
  spectek: new Set(["spectek", "micron", "intel"]),
  ymtc: new Set(["ymtc"])
};
const PART_PREFIX_BY_VENDOR: Record<string, RegExp> = {
  intel: /^(?:JS29F|I29F|PF29F|PC29F|PD29F)/,
  kioxia: /^(?:TC58|TH58|THG)/,
  micron: /^(?:MT29|MTFC|MTFD|NW[0-9A-Z]{3,}|FNMB)/,
  samsung: /^(?:K9|KLM|KLU|KMD|KMF|KMN|KMV)/,
  skhynix: /^(?:HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/,
  sndk: /^(?:SD[A-Z0-9]{3,}|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/,
  spectek: /^(?:FBNL|FNNL|FNN|FXXL)/,
  ymtc: /^(?:YM|YMN|KRN|XT)/
};
const CONTROLLER_NAME = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]+$/;

export function normalizeSupportListFlashId(value: unknown, strict = false): string | undefined {
  const normalized = strict
    ? String(value ?? "").trim()
    : String(value ?? "")
        .replace(/[\s:_-]+/g, "")
        .toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return undefined;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : undefined;
}

export function isSupportedSupportListFlashId(id: string): boolean {
  return SUPPORTED_FLASH_ID_PREFIXES.has(id.slice(0, 2));
}

export function vendorFromSupportListFlashId(id: string): string | null {
  const prefix = id.slice(0, 2).toUpperCase();
  switch (prefix) {
    case "2C":
    case "B5":
      return "micron";
    case "45":
      return "sndk";
    case "89":
      return "intel";
    case "98":
      return "kioxia";
    case "9B":
      return "ymtc";
    case "AD":
      return "skhynix";
    case "EC":
      return "samsung";
    default:
      return null;
  }
}

function partVendorFromFlashId(id: string): string | null {
  return id.slice(0, 2).toUpperCase() === "B5" ? "spectek" : vendorFromSupportListFlashId(id);
}

export function normalizeSupportListControllerName(value: unknown): string | undefined {
  const controller = String(value ?? "").trim().toUpperCase();
  return controller && CONTROLLER_NAME.test(controller) ? controller : undefined;
}

export function parseSupportListControllerList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const controllers = new Set<string>();
  for (const item of value) {
    const controller = normalizeSupportListControllerName(item);
    if (controller) {
      controllers.add(controller);
    }
  }
  return [...controllers];
}

export function cleanSupportListPartNumber(value: string): string {
  let partNumber = value
    .trim()
    .replaceAll(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();

  partNumber = partNumber.replace(/^L(?=(?:JS|PF|MT|FN|29F))/, "");
  partNumber = partNumber.replace(/^JF29F/, "JS29F");
  partNumber = partNumber.replace(/^((?:MT|JS|PF)29F[0-9]+)GB(?=08)/, "$1G");
  const paren = partNumber.indexOf("(");
  if (paren !== -1) {
    partNumber = partNumber.slice(0, paren);
  }
  partNumber = partNumber.replace(/_多BANK$/i, "");
  while (/_[A-Z0-9*]+$/.test(partNumber)) {
    partNumber = partNumber.replace(/_[A-Z0-9*]+$/, "");
  }
  partNumber = partNumber.replace(/\*[0-9A-Z]+$/i, "");
  return partNumber;
}

export function supportListVendorCandidates(rawVendor: string, partNumber: string, id: string): string[] {
  const candidates = new Set<string>();
  const inferred = inferVendorFromPartNumber(partNumber);
  const idVendor = vendorFromSupportListFlashId(id);
  if (inferred) candidates.add(inferred);
  if (idVendor) candidates.add(idVendor);

  const normalizedRaw = rawVendor.trim().toLowerCase();
  if (normalizedRaw === "micron/intel") {
    candidates.add("micron");
    candidates.add("intel");
    candidates.add("spectek");
  } else if (normalizedRaw === "sd/tc") {
    candidates.add("sndk");
    candidates.add("kioxia");
  } else if (normalizedRaw) {
    candidates.add(normalizeVendor(normalizedRaw.replace("hynix", "skhynix")));
  }

  return [...candidates];
}

function isSyntheticPartNumber(partNumber: string): boolean {
  return (
    /^(?:INTEL[RL]?(?:_|$)|SPECTEK(?:_|$)|SANDISK$|TOSHI-|TOSHIBA(?:_|$)|TC[-_]|TS_|SD-)/.test(partNumber) ||
    /^29F/.test(partNumber)
  );
}

function isGenericPartNumber(partNumber: string): boolean {
  if (/^K9-/.test(partNumber) || partNumber === "TC58NVG") {
    return true;
  }
  return /^SD[A-Z0-9]+$/.test(partNumber) && !/[0-9](?:G|GB|T|TB)/.test(partNumber);
}

function isPartVendorCompatible(partNumber: string, id: string): boolean {
  const idVendor = partVendorFromFlashId(id);
  const inferred = inferVendorFromPartNumber(partNumber);
  if (!idVendor || !inferred) {
    return true;
  }
  return COMPATIBLE_PART_VENDORS[idVendor]?.has(inferred) ?? idVendor === inferred;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanPartNameText(value: unknown, id: string): string {
  let text = String(value ?? "")
    .trim()
    .replaceAll(/[\u2010-\u2015\u2212]/g, "-");
  text = text.replace(/--.*$/, "");
  text = text.replace(new RegExp(`[-_]?${escapeRegExp(id)}$`, "i"), "");
  return text.trim();
}

export function cleanTrustedSupportListPartNumber(rawPartNumber: unknown, id: string): string | undefined {
  const raw = cleanPartNameText(rawPartNumber, id);
  if (!raw || /[^\x20-\x7E]/.test(raw)) {
    return undefined;
  }
  const partNumber = cleanSupportListPartNumber(raw);
  if (
    !partNumber ||
    /[^\x20-\x7E]/.test(partNumber) ||
    partNumber.includes("\\") ||
    partNumber.includes("--") ||
    partNumber.includes(id) ||
    isSyntheticPartNumber(partNumber) ||
    isGenericPartNumber(partNumber) ||
    !isPartVendorCompatible(partNumber, id)
  ) {
    return undefined;
  }
  return partNumber;
}

function normalizeSupportedPartNumber(context: ControllerMergeContext, vendor: string, partNumber: string): string {
  const normalizedPartNumber = context.normalizeKnownPackage(vendor, partNumber);
  const partPrefix = PART_PREFIX_BY_VENDOR[vendor];
  return partPrefix?.test(normalizedPartNumber) ? normalizedPartNumber : "";
}

function chooseSupportListPartRecord(
  context: ControllerMergeContext,
  rawVendor: string,
  partNumber: string,
  id: string
): { vendor: string; partNumber: string } | null {
  if (isSyntheticPartNumber(partNumber)) {
    return null;
  }
  const candidates = supportListVendorCandidates(rawVendor, partNumber, id);
  for (const candidate of candidates) {
    const normalizedPartNumber = normalizeSupportedPartNumber(context, candidate, partNumber);
    if (normalizedPartNumber) {
      return { vendor: candidate, partNumber: normalizedPartNumber };
    }
  }
  return null;
}

export function resolveSupportListPartRecord(
  context: ControllerMergeContext,
  rawVendor: unknown,
  rawPartNumber: unknown,
  id: string
): { vendor: string; partNumber: string } | null {
  const partNumber = cleanTrustedSupportListPartNumber(rawPartNumber, id);
  return partNumber ? chooseSupportListPartRecord(context, String(rawVendor ?? ""), partNumber, id) : null;
}

export function mergeSupportListEntry(context: ControllerMergeContext, input: SupportListEntryInput): SupportListMergeResult {
  const id = normalizeSupportListFlashId(input.flashId, input.strictFlashId);
  const requireSupportedFlashIdPrefix = input.requireSupportedFlashIdPrefix ?? true;
  if (!id || (requireSupportedFlashIdPrefix && !isSupportedSupportListFlashId(id))) {
    return { controllers: [], imported: false };
  }

  const controllers = parseSupportListControllerList(input.controllers);
  if (controllers.length === 0) {
    return { flashId: id, controllers, imported: false };
  }

  const partNumber = cleanTrustedSupportListPartNumber(input.partNumber, id);
  if (!partNumber) {
    context.mergeFlashPayload(id, { t: controllers });
    return { flashId: id, controllers, imported: true };
  }

  const rawVendor = String(input.vendor ?? "");
  const candidates = supportListVendorCandidates(rawVendor, partNumber, id);
  const matchedExisting = candidates.some((vendor) => context.addControllersToMatchingFlashId(vendor, id, controllers));
  if (matchedExisting) {
    return { flashId: id, controllers, imported: true };
  }

  const partRecord = chooseSupportListPartRecord(context, rawVendor, partNumber, id);
  if (!partRecord) {
    context.mergeFlashPayload(id, { t: controllers });
    return { flashId: id, controllers, imported: true };
  }

  context.addPartId(partRecord.vendor, partRecord.partNumber, id, controllers);
  const cellLevel = typeof input.cellLevel === "string" ? input.cellLevel.trim() : "";
  if (cellLevel) {
    context.mergePartPayload(partRecord.vendor, partRecord.partNumber, { c: cellLevel, t: controllers });
  }
  return {
    flashId: id,
    controllers,
    imported: true,
    importedPartNumber: partRecord.partNumber,
    importedVendor: partRecord.vendor
  };
}
