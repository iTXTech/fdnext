import { UNKNOWN } from "./constants";
import type { LangPacks } from "./types";

const TRANSLATION_KEY_ALIASES: Record<string, string> = {
  badBlock: "bad_block",
  blockSize: "block_size",
  blocksPerLun: "blocks_per_lun",
  densityGrade: "density_grade",
  dieCode: "die_code",
  eccEnabled: "ecc_enabled",
  eccLevel: "ecc_level",
  halogenFree: "halogen_free",
  halfPageAndSize: "half_page_and_size",
  idSummary: "id_summary",
  interfaceInfo: "interface_type",
  leadFree: "lead_free",
  micronPartNumber: "micron_part_number",
  multiChip: "multi_chip",
  opTemp: "operation_temperature",
  packageFunctionalityPartialType: "package_functionality_partial_type",
  pageSize: "page_size",
  pagesPerBlock: "pages_per_block",
  redundantAreaSize: "redundant_area_size",
  simultaneouslyProgrammedPages: "simultaneously_programmed_pages",
  spareAreaSizePer512B: "spare_area_size_per_512b",
  timingModeAsync: "timing_mode_async",
  unsupportedReason: "unsupported_reason"
};

function normalizeTranslationKey(key: string): string {
  return TRANSLATION_KEY_ALIASES[key] ?? key;
}

export function translateString(langPacks: LangPacks, fallbackLang: string, key: string, lang?: string | null): string {
  const targetLang = lang ?? fallbackLang;
  const normalizedKey = normalizeTranslationKey(key);
  const fallback = langPacks[fallbackLang]?.[normalizedKey] ?? langPacks[fallbackLang]?.[key] ?? normalizedKey;
  const value = langPacks[targetLang]?.[normalizedKey] ?? langPacks[targetLang]?.[key] ?? fallback;
  return value.replaceAll("<br>", "\n");
}

export function translateValue(
  langPacks: LangPacks,
  fallbackLang: string,
  value: unknown,
  lang?: string | null,
  translateKey = true
): unknown {
  if (typeof value === "boolean") {
    return translateString(langPacks, fallbackLang, value ? "true" : "false", lang);
  }
  if (typeof value === "string") {
    return translateString(langPacks, fallbackLang, value, lang);
  }
  if (value === -1) {
    return translateString(langPacks, fallbackLang, UNKNOWN, lang);
  }
  if (Array.isArray(value)) {
    return value.map((item) => translateValue(langPacks, fallbackLang, item, lang, translateKey));
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const outKey = translateKey ? translateString(langPacks, fallbackLang, key, lang) : key;
      result[outKey] = translateValue(langPacks, fallbackLang, item, lang, translateKey);
    }
    return result;
  }
  return value;
}
