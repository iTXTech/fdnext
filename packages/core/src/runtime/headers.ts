import { FDNEXT_VERSION, type FdnextResult } from "../result";
import type { FdnextHttpRequest } from "./types";

export function baseHeaders(extra: Record<string, string> | undefined): Record<string, string> {
  return {
    "content-type": "application/json; charset=utf-8",
    "x-powered-by": `fdnext/${FDNEXT_VERSION}`,
    ...(extra ?? {})
  };
}

export function resultHttpStatus(result: FdnextResult): number {
  if (result.status === "unsupported" || result.status === "invalid_input") {
    return 400;
  }
  return 200;
}

export function getHeader(headers: FdnextHttpRequest["headers"], name: string): string | undefined {
  if (!headers) {
    return undefined;
  }
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lowerName) {
      continue;
    }
    if (Array.isArray(value)) {
      return value.join("; ");
    }
    return value;
  }
  return undefined;
}
