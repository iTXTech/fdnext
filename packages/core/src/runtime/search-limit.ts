export const DEFAULT_HTTP_SEARCH_LIMIT = 300;
export const FDNEXT_SEARCH_LIMIT_ENV = "FDNEXT_SEARCH_LIMIT";

export function parseFdnextSearchLimit(
  value: unknown,
  fallback = DEFAULT_HTTP_SEARCH_LIMIT
): number {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value)
      : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function fdnextSearchLimitFromEnv(
  env: Record<string, unknown> | undefined,
  fallback = DEFAULT_HTTP_SEARCH_LIMIT
): number {
  return parseFdnextSearchLimit(env?.[FDNEXT_SEARCH_LIMIT_ENV], fallback);
}
