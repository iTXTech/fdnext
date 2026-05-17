import { getHeader } from "./headers";
import type { FdnextCorsOptions, FdnextCorsOrigins, FdnextHttpRequest } from "./types";

export const FDNEXT_CORS_ORIGINS_ENV = "FDNEXT_CORS_ORIGINS";
const corsAllowMethods = "GET, HEAD, OPTIONS";
const corsDefaultAllowHeaders = "content-type";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function splitCorsOrigins(value: string): string[] {
  return value
    .split(/[,\s;]+/g)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeCorsOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === "*") {
    return "*";
  }
  if (trimmed === "null") {
    return "null";
  }
  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
}

export function parseFdnextCorsOrigins(value: unknown): FdnextCorsOrigins | undefined {
  const rawOrigins = Array.isArray(value)
    ? value.flatMap((entry) => (typeof entry === "string" ? splitCorsOrigins(entry) : []))
    : typeof value === "string"
      ? splitCorsOrigins(value)
      : [];
  const origins = uniqueStrings(rawOrigins.map((origin) => normalizeCorsOrigin(origin)).filter((origin): origin is string => !!origin));
  if (origins.includes("*")) {
    return "*";
  }
  return origins.length > 0 ? origins : undefined;
}

export function createFdnextCorsOptionsFromEnv(env: Record<string, unknown> | undefined): FdnextCorsOptions | undefined {
  const origins = parseFdnextCorsOrigins(env?.[FDNEXT_CORS_ORIGINS_ENV]);
  return origins ? { origins } : undefined;
}

function appendVary(headers: Record<string, string>, value: string): Record<string, string> {
  const current = headers.vary;
  if (!current) {
    return { ...headers, vary: value };
  }
  const entries = current.split(",").map((entry) => entry.trim().toLowerCase());
  return entries.includes(value.toLowerCase()) ? headers : { ...headers, vary: `${current}, ${value}` };
}

function corsAllowOrigin(cors: FdnextCorsOptions, headers: FdnextHttpRequest["headers"]): string | null {
  if (cors.origins === "*") {
    return "*";
  }
  const origin = getHeader(headers, "origin");
  if (!origin) {
    return null;
  }
  const normalized = normalizeCorsOrigin(origin);
  return normalized && cors.origins.includes(normalized) ? normalized : null;
}

export function applyCorsHeaders(
  base: Record<string, string>,
  requestHeaders: FdnextHttpRequest["headers"],
  cors: FdnextCorsOptions | undefined,
  preflight: boolean
): Record<string, string> {
  if (!cors) {
    return base;
  }
  const allowOrigin = corsAllowOrigin(cors, requestHeaders);
  let headers = cors.origins === "*" ? base : appendVary(base, "Origin");
  if (!allowOrigin) {
    return headers;
  }
  headers = {
    ...headers,
    "access-control-allow-origin": allowOrigin
  };
  if (!preflight) {
    return headers;
  }
  return {
    ...headers,
    "access-control-allow-methods": corsAllowMethods,
    "access-control-allow-headers": getHeader(requestHeaders, "access-control-request-headers") ?? corsDefaultAllowHeaders,
    "access-control-max-age": "86400"
  };
}
