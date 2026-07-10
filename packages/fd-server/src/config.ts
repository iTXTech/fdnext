import type { ControllerGroupSelection } from "@itxtech/fdnext-core";
import type { FdServerConfig, FdServerEnv, FdServerHandlerOptions, LegacyLang } from "./types";

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseLegacyLang(value: string | null | undefined, fallback: LegacyLang = "chs"): LegacyLang {
  const lang = value?.trim();
  return lang === "chs" || lang === "eng" ? lang : fallback;
}

function parseControllerGroup(value: string | ControllerGroupSelection | null | undefined): ControllerGroupSelection {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === "all") {
    return "all";
  }
  const raw = typeof value === "string" ? value : "selected";
  const pieces = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (pieces.includes("all")) {
    return "all";
  }
  if (pieces.length === 0) {
    return "selected";
  }
  return pieces.length === 1 ? pieces[0] as ControllerGroupSelection : pieces as ControllerGroupSelection;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeUrlMap(input: Record<string, string>, warn?: (message: string) => void): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawLabel, rawUrl] of Object.entries(input)) {
    const label = rawLabel.trim();
    const url = rawUrl.trim();
    if (!label || !isHttpUrl(url)) {
      warn?.(`Ignoring invalid FD_SERVER_EXTRA_URLS entry: ${rawLabel}`);
      continue;
    }
    out[label] = url;
  }
  return out;
}

function parseExtraUrls(env: FdServerEnv, warn?: (message: string) => void): Record<string, string> {
  const raw = cleanEnvValue(env.FD_SERVER_EXTRA_URLS);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      warn?.("Ignoring FD_SERVER_EXTRA_URLS because it is not a JSON object.");
      return {};
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        values[key] = value;
      }
    }
    return sanitizeUrlMap(values, warn);
  } catch {
    warn?.("Ignoring FD_SERVER_EXTRA_URLS because it is not valid JSON.");
    return {};
  }
}

export function createFdServerConfig(options: FdServerHandlerOptions): FdServerConfig {
  const env = options.env ?? {};
  const warn = options.warn;
  return {
    defaultLang: parseLegacyLang(options.defaultLang ?? cleanEnvValue(env.FD_SERVER_DEFAULT_LANG), "chs"),
    controllerGroup: parseControllerGroup(options.controllerGroup ?? cleanEnvValue(env.FD_SERVER_CONTROLLER_GROUP) ?? "selected"),
    extraUrls: options.extraUrls ? sanitizeUrlMap(options.extraUrls, warn) : parseExtraUrls(env, warn)
  };
}
