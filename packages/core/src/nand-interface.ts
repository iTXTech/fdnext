import type { FdnextFieldValueData } from "./result";

/** PN rating and die capability are different scopes, even when their values agree. */
export interface NandInterface {
  rating?: string;
  capability?: string;
}

export function formatNandInterface(value: FdnextFieldValueData): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const { rating, capability } = value;
  if (typeof rating === "string" && typeof capability === "string") {
    return rating === capability
      ? `Grade / Die: ${rating}`
      : `Grade: ${rating}; Die: ${capability}`;
  }
  if (typeof rating === "string") return `Grade: ${rating}`;
  return typeof capability === "string" ? capability : undefined;
}
