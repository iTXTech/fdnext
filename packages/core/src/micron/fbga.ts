import { UNKNOWN } from "../constants";
import type { PartDecodeDraft } from "../types";

const MICRON_FBGA_HEADERS = ["NW", "NX", "NQ", "PF", "NY", "NC", "NV"] as const;

const MICRON_FBGA_COUNTRY: Record<string, string> = {
  "1": "cty_us",
  "2": "cty_sg",
  "3": "cty_it",
  "4": "cty_jp",
  "5": "cty_cn",
  "7": "cty_tw",
  "8": "cty_kr",
  "9": "cty_mixed",
  B: "cty_il",
  C: "cty_ie",
  D: "cty_my",
  F: "cty_ph"
};

export interface MicronFbgaParsed {
  key: string;
  display: string;
  prod?: {
    prodDate: string;
    diffusion: string;
    encapsulation: string;
  };
}

function parseProductionMeta(normalized: string, key: string): MicronFbgaParsed {
  const meta = normalized.slice(0, 5);

  const year = meta.slice(0, 1);
  const weekCode = meta.slice(1, 2);
  const week = (weekCode.charCodeAt(0) - 64) * 2;
  const weekStr = Number.isFinite(week) && week > 0 ? String(week).padStart(2, "0") : "00";
  const prodDate = `${year}${weekStr}`;

  const diffusionCode = meta.slice(3, 4);
  const encapsulationCode = meta.slice(4, 5);
  const diffusion = MICRON_FBGA_COUNTRY[diffusionCode] ?? UNKNOWN;
  const encapsulation = MICRON_FBGA_COUNTRY[encapsulationCode] ?? UNKNOWN;

  return { key, display: key, prod: { prodDate, diffusion, encapsulation } };
}

export function parseMicronFbgaCode(input: string): MicronFbgaParsed | null {
  const normalized = input.toUpperCase();
  if (normalized.length !== 5 && normalized.length !== 10) {
    return null;
  }

  for (const header of MICRON_FBGA_HEADERS) {
    if (normalized.length === 5 && normalized.startsWith(header)) {
      return { key: normalized, display: normalized };
    }
    if (normalized.length === 10 && normalized.slice(5, 7) === header) {
      const key = normalized.slice(5);
      return parseProductionMeta(normalized, key);
    }
  }
  return null;
}

export function parseKnownMicronFbgaCode(input: string, knownCodes: ReadonlySet<string>): MicronFbgaParsed | null {
  const normalized = input.toUpperCase();
  if (normalized.length === 5 && knownCodes.has(normalized)) {
    return { key: normalized, display: normalized };
  }
  if (normalized.length === 10) {
    const key = normalized.slice(5);
    if (knownCodes.has(key)) {
      return parseProductionMeta(normalized, key);
    }
  }
  return null;
}

export function parseKnownFiveDigitMicronFbgaCode(input: string, knownCodes: ReadonlySet<string>): MicronFbgaParsed | null {
  const normalized = input.toUpperCase();
  if (normalized.length === 5 && knownCodes.has(normalized)) {
    return { key: normalized, display: normalized };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function applyMicronFbgaMeta(base: PartDecodeDraft, parsed: MicronFbgaParsed, resolvedPn: string): PartDecodeDraft {
  const out: PartDecodeDraft = {
    ...base,
    device: {
      ...base.device,
      partNumber: parsed.display,
      markingCode: parsed.display
    }
  };
  const extra = isRecord(out.fields) ? { ...out.fields } : {};

  extra.micron_part_number = resolvedPn;
  extra.marking_code = parsed.display;
  if (parsed.prod) {
    extra.prod_date = parsed.prod.prodDate;
    extra.diffusion_loc = parsed.prod.diffusion;
    extra.encapsulation_loc = parsed.prod.encapsulation;
  }
  out.fields = extra;

  return out;
}
