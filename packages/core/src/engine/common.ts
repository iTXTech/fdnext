import { UNKNOWN } from "../constants";

export function cloneObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function inferSingleVendorFromPartReferences(refs: string[] | undefined): string | undefined {
  const vendors = new Set<string>();
  for (const ref of refs ?? []) {
    const match = /^(\S+)\s+/.exec(ref);
    if (match?.[1] && match[1] !== UNKNOWN) {
      vendors.add(match[1]);
    }
  }
  return vendors.size === 1 ? [...vendors][0] : undefined;
}

export function mergeStringArray(target: string[] | undefined, source: string[] | undefined): string[] {
  const merged = new Set<string>();
  for (const item of [...(target ?? []), ...(source ?? [])]) {
    const text = String(item).trim();
    if (text) {
      merged.add(text);
    }
  }
  return [...merged];
}
