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
const INTEL_DENSITY_TOKEN_LIST = [
  "384G",
  "512G",
  "256G",
  "128G",
  "01G",
  "02G",
  "04G",
  "08G",
  "16G",
  "32G",
  "64G",
  "16B",
  "32B",
  "48B",
  "64B",
  "96B",
  "01T",
  "02T",
  "03T",
  "04T",
  "06T",
  "08T",
  "16T",
  "1G",
  "2G",
  "4G",
  "8G",
  "1T",
  "2T",
  "3T",
  "4T",
  "6T",
  "8T"
];
const INTEL_DENSITY_TOKENS = INTEL_DENSITY_TOKEN_LIST.join("|");
const INTEL_STRUCTURED_PART =
  new RegExp(`^((?:X)?(?:(?:(?:JS|PF|BK|CU)?29[FPHRA-Z])|(?:(?:JS|PF|BK|CU)F))(?:${INTEL_DENSITY_TOKENS})(?:16|08|2A|4A|A8)[0-9A-Z]{5})`);
const INTEL_CELL_CODES = new Set(["N", "M", "T", "Q"]);
const INTEL_MIN_BGA_PROCESS_CODE = "G";
const MICRON_RAW_DENSITY_TOKEN_LIST = [
  "768G",
  "512G",
  "384G",
  "336G",
  "256G",
  "192G",
  "168G",
  "128G",
  "84G",
  "64G",
  "42G",
  "32G",
  "21G",
  "16G",
  "8G",
  "4G",
  "2G",
  "1G",
  "32T",
  "16T",
  "8T",
  "6T",
  "4T",
  "3T",
  "2T",
  "1HT",
  "1T2",
  "1T"
];
const MICRON_RAW_DEVICE_TOKENS = new Set(["16", "01", "08"]);
const MICRON_RAW_CELL_CODES = new Set(["A", "C", "E", "G"]);
const MICRON_RAW_CLASSIFICATION_CODES = new Set(["1", "2", "3", "4", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"]);
const MICRON_RAW_VOLTAGE_CODES = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "S", "T"]);
const MICRON_RAW_DIE_CODES = new Set(["A", "B", "C", "D", "E", "F", "G", "K", "L"]);
const MICRON_RAW_INTERFACE_CODES = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "M", "N"]);
const MICRON_RAW_PACKAGE_CODES = new Set([
  "",
  "C3", "C4", "C5", "C6", "C7", "C8",
  "D1", "D4", "D5", "D6", "D7", "D8",
  "G1", "G2", "G4", "G5", "G6", "G7", "G8", "G9",
  "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "HC",
  "J1", "J2", "J3", "J4", "J5", "J6", "J7", "J9",
  "K3", "K4", "K6", "K7", "K8", "K9",
  "L4", "L5", "L6", "L7", "L8",
  "M4", "M5", "M6", "M8", "M8Z", "M9", "MD",
  "WC", "WP"
]);
const YMTC_PACKAGE_STRUCTURED_PART =
  /^((?:YM|KR|BP|BR|BW)[NS][0A][6789ABW][SMTQ][A-F][12](?:W0|T1|L1|B[1-5])[0A-Z][DUMCPEFX][0-68ABX][A-E])/;
const YMTC_CUSTOM_BGA_STRUCTURED_PART =
  /^((?:YM|KR|BP|BR|BW)[NS][0A][6789ABW][SMTQ][A-F][12]B[0A-Z][DUMCPEFX][0-68ABX][A-E])/;
const SAMSUNG_UNKNOWN_PACKAGE_SUFFIX_STRUCTURED_PART =
  /^(K9[39A-Z][0-9A-Z]{2}[DYB][068][A-Z][0-9A-Z][A-Z])2$/;

interface IntelStructuredPartTokens {
  cellCode: string;
  processCode: string;
}

function parseIntelStructuredPartTokens(partNumber: string): IntelStructuredPartTokens | undefined {
  let rest = partNumber.startsWith("X") ? partNumber.slice(1) : partNumber;
  for (const prefix of ["JS", "PF", "BK", "CU"]) {
    if (rest.startsWith(`${prefix}29`)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  if (!rest.startsWith("29")) {
    return undefined;
  }
  rest = rest.slice(2);
  if (!rest) {
    return undefined;
  }
  rest = rest.slice(1);
  const density = INTEL_DENSITY_TOKEN_LIST.find((token) => rest.startsWith(token));
  if (!density) {
    return undefined;
  }
  rest = rest.slice(density.length);
  if (!/^(?:16|08|2A|4A|A8)/.test(rest)) {
    return undefined;
  }
  rest = rest.slice(2);
  if (rest.length < 5) {
    return undefined;
  }
  return {
    cellCode: rest[2] ?? "",
    processCode: rest[3] ?? ""
  };
}

function isIntelProcessCodeAtLeastBga(processCode: string): boolean {
  return /^[A-Z]$/.test(processCode) && processCode >= INTEL_MIN_BGA_PROCESS_CODE;
}

function hasIntelProcessTail(partNumber: string): boolean {
  const tokens = parseIntelStructuredPartTokens(partNumber);
  return Boolean(tokens && INTEL_CELL_CODES.has(tokens.cellCode) && isIntelProcessCodeAtLeastBga(tokens.processCode));
}

function hasMicronRawTailOnIntelPart(partNumber: string): boolean {
  const bareIntel = partNumber.startsWith("PF29F") ? partNumber.slice(2) : partNumber;
  if (!/^29[EF]/.test(bareIntel)) {
    return false;
  }
  let rest = bareIntel.slice(2);
  rest = rest.slice(1);
  const density = MICRON_RAW_DENSITY_TOKEN_LIST.find((token) => rest.startsWith(token));
  if (!density) {
    return false;
  }
  rest = rest.slice(density.length);
  const device = rest.slice(0, 2);
  if (!MICRON_RAW_DEVICE_TOKENS.has(device)) {
    return false;
  }
  rest = rest.slice(2);
  if (rest.length < 5) {
    return false;
  }
  const [cellCode, classificationCode, voltageCode, dieCode, interfaceCode] = rest;
  return (
    MICRON_RAW_CELL_CODES.has(cellCode ?? "") &&
    MICRON_RAW_CLASSIFICATION_CODES.has(classificationCode ?? "") &&
    MICRON_RAW_VOLTAGE_CODES.has(voltageCode ?? "") &&
    MICRON_RAW_DIE_CODES.has(dieCode ?? "") &&
    MICRON_RAW_INTERFACE_CODES.has(interfaceCode ?? "") &&
    MICRON_RAW_PACKAGE_CODES.has(rest.slice(5))
  );
}

function normalizeBareIntelBgaPart(partNumber: string): string {
  return partNumber.startsWith("29F") && hasIntelProcessTail(partNumber) ? `PF${partNumber}` : partNumber;
}

function dropCrossVendorRawPartNumber(partNumber: string): boolean {
  return hasMicronRawTailOnIntelPart(partNumber) || (partNumber.startsWith("MT29F") && hasIntelProcessTail(partNumber.slice(2)));
}

function trimKnownStructuredPartNumber(partNumber: string): string {
  return (
    YMTC_PACKAGE_STRUCTURED_PART.exec(partNumber)?.[1] ??
    YMTC_CUSTOM_BGA_STRUCTURED_PART.exec(partNumber)?.[1] ??
    SAMSUNG_UNKNOWN_PACKAGE_SUFFIX_STRUCTURED_PART.exec(partNumber)?.[1] ??
    INTEL_STRUCTURED_PART.exec(partNumber)?.[1] ??
    partNumber
  );
}

export function normalizeFdbPartNumber(partNumber: string): string {
  let normalized = partNumber
    .trim()
    .toUpperCase()
    .replace(/\uFFFD/g, "-")
    .replace(/[ ,&.|]/g, "");
  if (normalized.includes("/")) {
    return "";
  }
  normalized = normalized.replace(/^(H25T[A-Z0-9]+)-X[0-9A-Z]+(?:-[A-Z0-9]+)?$/, "$1");
  if (/(?:^|[-_])X\d+(?:[-_]|$)/.test(normalized)) {
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
  normalized = trimKnownStructuredPartNumber(normalized);
  if (dropCrossVendorRawPartNumber(normalized)) {
    return "";
  }
  normalized = normalizeBareIntelBgaPart(normalized);
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
  vendor = vendor.replace(/^sk\s*hynix$/, "skhynix").replace("skhynixnix", "skhynix");
  if (vendor !== "skhynix" && vendor.includes("hynix")) {
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
    ? String(value ?? "").trim().toUpperCase()
    : String(value ?? "")
        .replace(/[\s:_-]+/g, "")
        .toUpperCase();
  if (
    !normalized ||
    normalized.length % 2 !== 0 ||
    normalized.length < FDB_FLASH_ID_HEX_LENGTH ||
    normalized.length > SUPPORT_LIST_MAX_FLASH_ID_HEX_LENGTH
  ) {
    return undefined;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized.slice(0, FDB_FLASH_ID_HEX_LENGTH) : undefined;
}

export function normalizeFdbPartReference(value: unknown): string | undefined {
  const text = String(value).trim();
  const match = /^(\S+)\s+(.+)$/.exec(text);
  if (!match) {
    return undefined;
  }
  const partNumber = normalizeFdbPartNumber(match[2] ?? "");
  const vendor = normalizeVendor(match[1] ?? "");
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
    /^(?:DUALDIE|QUALDIE|SANDISKPRO|SANDISKX16|GEN\d|SNDK|YMTC|SS|HY|EMMC|N18A|B74A|L74|L84A(?:[-_]?HP|HALF)?|F41|3DV\d|[0-9][A-Z0-9]{2,3}|[0-9]+G(?:B)?)$/.test(
      normalized
    ) ||
    /^K9-/.test(normalized) ||
    normalized === "TC58NVG" ||
    /^TC58(?:BVG|NVG|TEG|TVG)[0-9][A-Z][0-9]$/.test(normalized) ||
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
