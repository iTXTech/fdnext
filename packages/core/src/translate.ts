import { UNKNOWN } from "./constants";
import type { LangPacks } from "./types";

export function translateString(langPacks: LangPacks, fallbackLang: string, key: string, lang?: string | null): string {
  const targetLang = lang ?? fallbackLang;
  const fallback = langPacks[fallbackLang]?.[key] ?? key;
  const value = langPacks[targetLang]?.[key] ?? fallback;
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
