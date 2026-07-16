import { UNKNOWN } from "../constants";
import { draftField, draftFields, draftVendor, setDraftField } from "../draft";
import { fdnextFieldRegistry, type FdnextFieldKey } from "../field-registry";
import type { IdentifierDecoder, IdentifierDecodeDraft, PartDecodeDraft, PartNumberDecoder } from "../types";

const GBIT_TO_MBIT = 1024;
const TBIT_TO_MBIT = GBIT_TO_MBIT * GBIT_TO_MBIT;

const vendorAliases: Record<string, string[]> = {
  biwin: ["biwin"],
  esmt: ["esmt", "elite semiconductor"],
  etron: ["etron", "etron technology"],
  gigadevice: ["gigadevice", "giga device", "gd", "兆易创新"],
  intel: ["intel"],
  issi: ["issi"],
  kingston: ["kingston"],
  kioxia: ["kioxia", "toshiba"],
  longsys: ["longsys", "foresee", "lexar"],
  micron: ["micron"],
  samsung: ["samsung"],
  siliconmotion: ["silicon motion", "smi"],
  sndk: ["sandisk", "western digital", "wd"],
  skhynix: ["sk hynix", "skhynix"],
  spectek: ["spectek"],
  winbond: ["winbond"],
  ymtc: ["ymtc"]
};

export function getHumanReadableDensity(density: number, useByte = false): string {
  const unit = useByte ? ["MB", "GB", "TB"] : ["Mb", "Gb", "Tb"];
  let numeric = useByte ? density / 8 : density;
  let idx = 0;
  while (numeric >= 1024 && unit[idx + 1]) {
    numeric /= 1024;
    idx += 1;
  }
  return `${numeric}${unit[idx]}`;
}

export function parseDieDensityMbit(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const match = /^\s*(\d+(?:\.\d+)?)\s*([gmt])b(?:it)?\s*$/i.exec(value);
  if (!match) {
    return undefined;
  }

  const numeric = Number.parseFloat(match[1] ?? "");
  const unit = (match[2] ?? "").toLowerCase();
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }

  if (unit === "m") {
    return Math.round(numeric);
  }
  if (unit === "g") {
    return Math.round(numeric * GBIT_TO_MBIT);
  }
  if (unit === "t") {
    if (numeric > 1.32 && numeric < 1.34) {
      return 1365 * GBIT_TO_MBIT;
    }
    return Math.round(numeric * TBIT_TO_MBIT);
  }
  return undefined;
}

function normalizeInfoText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .replaceAll(/\be\s+mmc\b/g, "emmc")
    .replaceAll(/\be\s+mcp\b/g, "emcp")
    .replaceAll(/\bu\s+mcp\b/g, "umcp")
    .replaceAll(/\bv(?=\d)/g, "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function aliasesForVendor(vendor: unknown): string[] {
  if (typeof vendor !== "string") {
    return [];
  }
  return vendorAliases[vendor] ?? [vendor];
}

function removeVendorPrefix(value: string, vendor: unknown): string {
  let normalized = normalizeInfoText(value);
  for (const alias of aliasesForVendor(vendor)) {
    const aliasText = normalizeInfoText(alias);
    if (aliasText.length > 0 && normalized.startsWith(`${aliasText} `)) {
      normalized = normalized.slice(aliasText.length + 1);
      break;
    }
  }
  return normalized;
}

function partTypeText(info: PartDecodeDraft): string {
  return normalizeInfoText(
    info.device.productType ??
    draftField(info, "product_type") ??
    draftField(info, "dram_type") ??
    info.device.chipKind
  );
}

function isRedundantManagedFamily(value: unknown, info: PartDecodeDraft, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  return text === partTypeText(info) || text === normalizeInfoText(extra.product_family);
}

function matchesDieCodename(value: unknown, info: PartDecodeDraft): boolean {
  const text = normalizeInfoText(value);
  const dieCodename = normalizeInfoText(draftField(info, "die_codename"));
  return text.length > 0 && dieCodename.length > 0 && text === dieCodename;
}

function isRedundantNandTechnology(value: unknown, info: PartDecodeDraft, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  if (matchesDieCodename(value, info) || text === normalizeInfoText(extra.generation_info)) {
    return true;
  }

  const dieCodename = normalizeInfoText(draftField(info, "die_codename"));
  return text === "bics flash" && dieCodename.includes("bics");
}

function isManagedNandType(info: PartDecodeDraft): boolean {
  return info.device.chipKind === "managed_nand" ||
    ["emmc", "ufs", "sata", "sas", "nvme", "emcp", "umcp", "e2nand", "e3nand"].includes(partTypeText(info));
}

function isNandDieProfileType(info: PartDecodeDraft): boolean {
  return info.device.chipKind === "raw_nand" ||
    isManagedNandType(info) ||
    info.device.idScheme === "nand.flash_id";
}

function publicDramType(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const type = value.trim().replace(/\s+(?:sdram|sgram)$/i, "");
  return type.length > 0 ? type : undefined;
}

function isDdrFamilyDramType(value: unknown): boolean {
  const type = normalizeInfoText(value);
  return /^(?:ddr[2-5]?|lpddr[2-5]?x?|gddr[2-7]?x?)(?: (?:sdram|sgram))?$/.test(type);
}

function isPlainDdrDramType(value: unknown): boolean {
  const type = normalizeInfoText(value);
  return /^ddr[2-5]?(?: sdram)?$/.test(type);
}

export function isKnownClassificationValue(value: unknown): boolean {
  if (value == null || value === -1 || value === UNKNOWN) {
    return false;
  }
  if (typeof value === "string") {
    const normalized = normalizeInfoText(value);
    return normalized.length > 0 && normalized !== normalizeInfoText(UNKNOWN);
  }
  return true;
}

export function collectDecoderProfileTables(
  explicit: Record<string, Record<string, unknown>> | undefined,
  decoders: readonly (PartNumberDecoder | IdentifierDecoder)[]
): Record<string, Record<string, unknown>> {
  const tables: Record<string, Record<string, unknown>> = { ...(explicit ?? {}) };
  for (const decoder of decoders) {
    for (const [tableName, table] of Object.entries(decoder.profileTables ?? {})) {
      tables[tableName] ??= table;
    }
  }
  return tables;
}

export function isFdnextFieldKey(key: string): key is FdnextFieldKey {
  return Object.hasOwn(fdnextFieldRegistry, key);
}

function normalizeNandCellLevel(value: unknown): "SLC" | "MLC" | "TLC" | "QLC" | "" {
  if (typeof value === "number") {
    return ({ 1: "SLC", 2: "MLC", 3: "TLC", 4: "QLC" } as const)[value] ?? "";
  }
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "1") {
    return "SLC";
  }
  if (normalized === "2") {
    return "MLC";
  }
  if (normalized === "3") {
    return "TLC";
  }
  if (normalized === "4") {
    return "QLC";
  }
  if (/\bSLC\b/.test(normalized)) {
    return "SLC";
  }
  if (/\bMLC\b/.test(normalized)) {
    return "MLC";
  }
  if (/\bTLC\b/.test(normalized)) {
    return "TLC";
  }
  if (/\bQLC\b/.test(normalized)) {
    return "QLC";
  }
  return "";
}

const kioxiaSandiskBicsProfileByCell: Record<string, Partial<Record<"SLC" | "MLC" | "QLC", string>>> = {
  KBICS2: { MLC: "KBiCS2M" },
  KBICS3: { MLC: "KBiCS3M" },
  KBICS4: { SLC: "KBiCS4S", MLC: "KBiCS4M", QLC: "KBiCS4Q" },
  "KBICS4.5": { MLC: "KBiCS4.5M", QLC: "KBiCS4.5Q" },
  KBICS5: { MLC: "KBiCS5M", QLC: "KBiCS5Q" },
  KBICS6: { MLC: "KBiCS6M", QLC: "KBiCS6Q" },
  SBICS2: { MLC: "SBiCS2M" },
  SBICS3: { MLC: "SBiCS3M" },
  SBICS4: { MLC: "SBiCS4M", QLC: "SBiCS4Q" },
  "SBICS4.5": { MLC: "SBiCS4.5M", QLC: "SBiCS4.5Q" },
  SBICS5: { MLC: "SBiCS5M", QLC: "SBiCS5Q" },
  SBICS6: { MLC: "SBiCS6M", QLC: "SBiCS6Q" }
};

export function canonicalNandDieProfileKey(
  dieCodename: string,
  info: PartDecodeDraft | IdentifierDecodeDraft,
  hasProfileKey?: (key: string) => boolean
): string {
  const key = dieCodename.trim();
  const upper = key.toUpperCase();
  const cellLevel = normalizeNandCellLevel(draftField(info, "cell_level"));
  const knownProfile = (candidate: string): string | undefined => {
    if (!hasProfileKey || hasProfileKey(candidate)) {
      return candidate;
    }
    return undefined;
  };
  if (draftVendor(info) === "kioxia" || draftVendor(info) === "sndk") {
    const bicsProfile = kioxiaSandiskBicsProfileByCell[upper]?.[cellLevel as "SLC" | "MLC" | "QLC"];
    if (bicsProfile && knownProfile(bicsProfile)) {
      return bicsProfile;
    }
  }
  if (draftVendor(info) === "skhynix") {
    if (cellLevel === "MLC") {
      const hynixMlcProfile = knownProfile(upper.endsWith("M") ? upper : `${upper}M`);
      if (hynixMlcProfile) {
        return hynixMlcProfile;
      }
    }
    if (cellLevel === "QLC") {
      const hynixQlcProfile = knownProfile(upper.endsWith("Q") ? upper : `${upper}Q`);
      if (hynixQlcProfile) {
        return hynixQlcProfile;
      }
    }
  }
  if (draftVendor(info) === "samsung") {
    if (cellLevel === "MLC") {
      if (/^SS(?:14|16|19|21|27)$/.test(upper)) {
        return knownProfile(`${upper}M`) ?? key;
      }
      if (/^SSV[1-9](?:HS)?$/.test(upper)) {
        return knownProfile(`${upper}M`) ?? key;
      }
    }
    if (cellLevel === "QLC") {
      if (/^SSV[1-9](?:HS)?$/.test(upper)) {
        return knownProfile(`${upper}Q`) ?? key;
      }
    }
    if (cellLevel === "SLC") {
      if (/^SS(?:14|16|19|21|27)$/.test(upper)) {
        return knownProfile(`${upper}S`) ?? key;
      }
      if (/^SSV[1-9](?:HS)?$/.test(upper)) {
        return knownProfile(`${upper}S`) ?? key;
      }
    }
  }
  return key;
}

function hasDramStackLayoutOption(value: unknown): boolean {
  return /\bstack(?:ed)?\b/.test(normalizeInfoText(value));
}

export function applyDramClassification(info: PartDecodeDraft): void {
  if (info.device.chipKind !== "dram") {
    return;
  }

  const extra = draftFields(info);
  const hasExplicitDramDieCount = isKnownClassificationValue(extra.dram_die_count);
  const hasExplicitCsCount = isKnownClassificationValue(extra.cs_count);
  const hasStackLayoutOption = hasDramStackLayoutOption(extra.special_option);
  const defaultDieClassification = isDdrFamilyDramType(extra.dram_type);
  const defaultCsClassification = isPlainDdrDramType(extra.dram_type);
  const topologyTokenRecognized =
    info.meta?.dramTopologyTokenRecognized ?? isKnownClassificationValue(extra.package);
  if (
    (!defaultDieClassification && !defaultCsClassification) ||
    !topologyTokenRecognized
  ) {
    return;
  }

  if (
    !hasExplicitCsCount &&
    !hasStackLayoutOption &&
    defaultDieClassification &&
    !isKnownClassificationValue(draftField(info, "dram_die_count"))
  ) {
    setDraftField(info, "dram_die_count", 1);
  }

  if (!hasExplicitDramDieCount && defaultCsClassification && !isKnownClassificationValue(draftField(info, "cs_count"))) {
    setDraftField(info, "cs_count", 1);
  }
}

export function applyDramPublicType(info: PartDecodeDraft): void {
  if (info.device.chipKind !== "dram") {
    return;
  }

  const extra = draftFields(info);
  const type = publicDramType(extra.dram_type);
  if (type) {
    setDraftField(info, "dram_type", type);
  }
}

export function pruneRedundantFields(info: PartDecodeDraft): void {
  const extra = info.fields;
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return;
  }

  const productVersion = extra.product_version;
  const storageInterface = extra.storage_interface;
  const productFamily = extra.product_family;
  const managedNandType = isManagedNandType(info);

  if (isRedundantManagedFamily(extra.managed_family, info, extra)) {
    delete extra.managed_family;
  }
  if (managedNandType && matchesDieCodename(extra.generation_info, info)) {
    delete extra.generation_info;
  }
  if (managedNandType && isRedundantNandTechnology(extra.nand_technology, info, extra)) {
    delete extra.nand_technology;
  }

  const productVersionText = normalizeInfoText(productVersion);
  if (
    productVersionText.length > 0 &&
    (productVersionText === normalizeInfoText(storageInterface) || productVersionText === partTypeText(info))
  ) {
    delete extra.product_version;
  }

  const productFamilyText = removeVendorPrefix(String(productFamily ?? ""), draftVendor(info));
  if (
    productFamilyText.length > 0 &&
    (
      productFamilyText === normalizeInfoText(productVersion) ||
      productFamilyText === normalizeInfoText(storageInterface) ||
      productFamilyText === partTypeText(info)
    )
  ) {
    delete extra.product_family;
  }

  if (managedNandType && normalizeInfoText(storageInterface) === partTypeText(info)) {
    delete extra.storage_interface;
  }

  if (isNandDieProfileType(info)) {
    delete extra.process_node;
  }
}
