import { inferVendorFromPartNumber, normalizeKnownPackage, normalizeVendor } from "./vendors";

export type FdbPartNumberClass = "exact_pn" | "synthetic_alias" | "date_code" | "family_label";

export interface FdbPartNumberClassification {
  kind: FdbPartNumberClass;
  reasons: string[];
}

export const FDB_FLASH_ID_BYTES = 6;
export const FDB_FLASH_ID_HEX_LENGTH = FDB_FLASH_ID_BYTES * 2;

const SUPPORT_LIST_MAX_FLASH_ID_HEX_LENGTH = 16;
const CONTROLLER_NAME = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9()-]*$/;
const PART_METADATA_SUFFIX =
  /[_-](?:DUAL|TWIN|DIC|QDP|HP|H45|SI\d+|S\d+|BINZZ|GEN\d+|EX\d+|TF_EX\d+|[1248]DIE|[1248]CE|[0-9]+CE[0-9]+DIE|[12]C[1248]D|[0-9A-F]{3,}|L\d{2}|TI\d+|ES|UNKNOWN|SLC|MLC|TLC|QLC|[0-9]+)$/;

export function normalizeFdbPartNumber(partNumber: string): string {
  let normalized = partNumber
    .trim()
    .toUpperCase()
    .replace(/\uFFFD/g, "-")
    .replace(/[ ,&.|]/g, "");
  if (normalized.includes("/")) {
    return "";
  }
  normalized = normalized.replace(/\([^)]*\)/g, "");
  normalized = normalized.replace(/^INAND_/, "INAND-");
  normalized = normalized.replace(/_(?:H45|[1248]CE)-/g, "-");
  normalized = normalized.replace(/^EMT29F/, "MT29F");
  while (PART_METADATA_SUFFIX.test(normalized)) {
    normalized = normalized.replace(PART_METADATA_SUFFIX, "");
  }
  while (/\*[0-9A-Z]*$/i.test(normalized)) {
    normalized = normalized.replace(/\*[0-9A-Z]*$/i, "");
  }
  return normalized.includes("*") ? "" : normalized;
}

export function normalizeFdbVendorName(value: unknown): string {
  let vendor = String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  vendor = vendor
    .replace(/^tsb$/, "toshiba")
    .replace(/^koxia$/, "kioxia")
    .replace(/^ss$/, "samsung")
    .replace(/^hy$/, "hynix")
    .replace("samaung", "samsung")
    .replace("speteck", "spectek")
    .replace("septeck", "spectek")
    .replace("power flash", "powerchip")
    .replace("powerflash", "powerchip")
    .replace(/^psc$/, "powerchip")
    .replace(/^stm$/, "st");
  vendor = vendor.replace("skhynixnix", "skhynix");
  if (vendor.includes("hynix")) {
    vendor = vendor.replace("hynix", "skhynix").replace("skhynixnix", "skhynix");
  }
  return normalizeVendor(vendor);
}

export function normalizeFdbFlashId(value: unknown): string | undefined {
  const normalized = String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < FDB_FLASH_ID_HEX_LENGTH || !/^[0-9A-F]+$/.test(normalized)) {
    return undefined;
  }
  return normalized.slice(0, FDB_FLASH_ID_HEX_LENGTH);
}

export function normalizeSupportFlashId(value: unknown, strict = false): string | undefined {
  const normalized = strict
    ? String(value ?? "").trim()
    : String(value ?? "")
        .replace(/[\s:_-]+/g, "")
        .toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > SUPPORT_LIST_MAX_FLASH_ID_HEX_LENGTH) {
    return undefined;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : undefined;
}

export function normalizeFdbPartReference(value: unknown): string | undefined {
  const text = String(value).trim();
  const match = /^(\S+)\s+(.+)$/.exec(text);
  if (!match) {
    return undefined;
  }
  const partNumber = normalizeFdbPartNumber(match[2] ?? "");
  const vendor = inferVendorFromPartNumber(partNumber) ?? normalizeVendor(match[1] ?? "");
  if (!vendor || !partNumber) {
    return undefined;
  }
  return `${vendor} ${partNumber}`;
}

export function normalizeFdbPartKey(vendor: string, partNumber: string): string {
  return `${normalizeVendor(vendor)} ${normalizeFdbPartNumber(partNumber)}`;
}

export function normalizeFdbControllerName(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export function normalizeSupportControllerName(value: unknown): string | undefined {
  const controller = normalizeFdbControllerName(value);
  return controller && CONTROLLER_NAME.test(controller) ? controller : undefined;
}

export function cleanSupportListPartNumberText(value: string): string {
  let partNumber = value
    .trim()
    .replaceAll(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();

  partNumber = partNumber.replace(/^L(?=(?:JS|PF|MT|FN|29F))/, "");
  partNumber = partNumber.replace(/^JF29F/, "JS29F");
  partNumber = partNumber.replace(/^((?:MT|JS|PF)29F[0-9]+)GB(?=08)/, "$1G");
  partNumber = partNumber.replace(/^MICRON_((?:MT29|MTFC|MTFD|NW[0-9A-Z]{3,}|FNMB)[A-Z0-9-]*)/, "$1");
  partNumber = partNumber.replace(/^HYNIX_((?:HY27|H27|H25|H26|H2D|H2J|H9[ATHQ])[A-Z0-9-]*)/, "$1");
  partNumber = partNumber.replace(/^(?:INTEL|INTER|NTEL)_((?:JS29F|I29F|PF29F|PC29F|PD29F)[A-Z0-9-]*)/, "$1");
  partNumber = partNumber.replace(/^TOSHIBA_((?:TC58|TH58|THG)[A-Z0-9-]*)/, "$1");
  partNumber = partNumber.replace(/^SAMSUNG_((?:K9|KLM|KLU|KMD|KMF|KMN|KMV)[A-Z0-9-]*)/, "$1");
  const paren = partNumber.indexOf("(");
  if (paren !== -1) {
    partNumber = partNumber.slice(0, paren);
  }
  partNumber = partNumber.replace(/_多BANK$/i, "");
  while (/_[A-Z0-9*]+$/.test(partNumber)) {
    partNumber = partNumber.replace(/_[A-Z0-9*]+$/, "");
  }
  while (/\*[0-9A-Z]*$/i.test(partNumber)) {
    partNumber = partNumber.replace(/\*[0-9A-Z]*$/i, "");
  }
  return partNumber;
}

export function normalizeKnownFdbPackage(vendor: string, partNumber: string): string {
  return normalizeKnownPackage(vendor, partNumber);
}

export function classifyFdbPartNumber(partNumber: string): FdbPartNumberClassification {
  const normalized = normalizeFdbPartNumber(partNumber);
  const reasons: string[] = [];
  if (/^[RSTUW]\d{4}$/.test(normalized)) {
    reasons.push("date-code");
    return { kind: "date_code", reasons };
  }
  if (
    /^(?:MICRON|HYNIX|INTEL|TOSHIBA|SAMSUNG|SANDISK|SPECTEK|POWERCHIP|NUMONYX|MTRON|HY|SD|TS|TC[-_])[_-]/.test(
      normalized
    ) ||
    /_(?:SLC|MLC|TLC|QLC|X\d+|\d+(?:M|MB|G|GB)|[0-9A-F]{6,})$/.test(normalized)
  ) {
    reasons.push("synthetic-label");
  }
  if (
    /^(?:BICS\d?|QUALDIE|DUALDIE|GEN\d|NAND|AAA|MCP)[_-]/.test(normalized) ||
    /^K9-/.test(normalized) ||
    normalized === "TC58NVG" ||
    /^MT29F(?:[0-9]+G?(?:08|16)?|[0-9]*)?$/.test(normalized) ||
    /^(?:I|JS|PF|PC|PD)29F[0-9]+[GB]?$/.test(normalized) ||
    (/^SD[A-Z0-9]+$/.test(normalized) && !/[0-9](?:G|GB|T|TB)/.test(normalized))
  ) {
    reasons.push("family-label");
  }
  if (reasons.includes("synthetic-label")) {
    return { kind: "synthetic_alias", reasons };
  }
  if (reasons.includes("family-label")) {
    return { kind: "family_label", reasons };
  }
  return { kind: "exact_pn", reasons };
}

export function isAuthoritativeFdbPartNumber(partNumber: string): boolean {
  return classifyFdbPartNumber(partNumber).kind === "exact_pn";
}

export function isTrustedSupportPartNumber(partNumber: string, id: string): boolean {
  const classification = classifyFdbPartNumber(partNumber);
  return (
    classification.kind === "exact_pn" &&
    !/[^\x20-\x7E]/.test(partNumber) &&
    !partNumber.includes("\\") &&
    !partNumber.includes("*") &&
    !partNumber.includes("--") &&
    !partNumber.includes(id)
  );
}
