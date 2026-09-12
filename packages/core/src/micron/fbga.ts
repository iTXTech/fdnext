import type { ResultWarning } from "../result";
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
  F: "cty_ph",
  G: "cty_in"
};

export interface MicronFbgaParsed {
  key: string;
  display: string;
  prod?: {
    yearDigit?: string;
    week?: number;
    dieRevision: string;
    diffusion?: string;
    encapsulation?: string;
  };
  warnings?: ResultWarning[];
}

export interface MicronFbgaCodeLookup {
  has(code: string): boolean;
}

function parseProductionMeta(normalized: string, key: string): MicronFbgaParsed {
  const meta = normalized.slice(0, 5);
  const yearDigit = /^[0-9]$/.test(meta.charAt(0)) ? meta.charAt(0) : undefined;
  const week = /^[A-Z]$/.test(meta.charAt(1)) ? (meta.charCodeAt(1) - 64) * 2 : undefined;
  const diffusion = MICRON_FBGA_COUNTRY[meta.charAt(3)];
  const encapsulation = MICRON_FBGA_COUNTRY[meta.charAt(4)];
  const warnings: ResultWarning[] = [];
  if (yearDigit === undefined || week === undefined) {
    warnings.push({ code: "invalid_marking_date", message: "Invalid marking date; only recognized year and week values are shown.", severity: "warning" });
  }
  if (!diffusion || !encapsulation) {
    warnings.push({ code: "unknown_marking_location", message: "Unrecognized marking location; refer to the original input.", severity: "warning" });
  }
  return {
    key, display: key,
    prod: { yearDigit, week, dieRevision: meta.charAt(2), diffusion, encapsulation },
    ...(warnings.length ? { warnings } : {})
  };
}

/** Accept a short code or two five-character marking rows, not arbitrary PN suffixes. */
export function normalizeMicronFbgaInput(input: string): string {
  const trimmed = input.trim().toUpperCase();
  return /^[0-9A-Z]{5}(?:\s*[0-9A-Z]{5})?$/.test(trimmed) ? trimmed.replace(/\s/g, "") : trimmed;
}

export function parseMicronFbgaCode(input: string): MicronFbgaParsed | null {
  const normalized = normalizeMicronFbgaInput(input);
  if (!/^(?:[0-9A-Z]{5}|[0-9A-Z]{10})$/.test(normalized)) {
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

export function parseKnownMicronFbgaCode(input: string, knownCodes: MicronFbgaCodeLookup): MicronFbgaParsed | null {
  const normalized = normalizeMicronFbgaInput(input);
  if (normalized.length === 5 && knownCodes.has(normalized)) {
    return { key: normalized, display: normalized };
  }
  if (/^[0-9A-Z]{10}$/.test(normalized)) {
    const key = normalized.slice(5);
    if (knownCodes.has(key)) {
      return parseProductionMeta(normalized, key);
    }
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
      partNumber: resolvedPn,
      markingCode: parsed.display
    }
  };
  const extra = isRecord(out.fields) ? { ...out.fields } : {};

  if (parsed.prod) {
    extra.marking_year_digit = parsed.prod.yearDigit;
    extra.marking_week = parsed.prod.week;
    extra.marking_die_revision = parsed.prod.dieRevision;
    extra.diffusion_loc = parsed.prod.diffusion;
    extra.encapsulation_loc = parsed.prod.encapsulation;
  }
  out.fields = extra;
  if (parsed.warnings?.length) out.warnings = [...(base.warnings ?? []), ...parsed.warnings];

  return out;
}
