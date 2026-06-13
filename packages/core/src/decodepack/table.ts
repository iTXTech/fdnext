import type { DecodeJson, DecodeTable } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeDecodeTable(table: DecodeTable | undefined): Record<string, DecodeJson> {
  if (!table) {
    return {};
  }
  if (!Array.isArray(table)) {
    return table;
  }

  const out: Record<string, DecodeJson> = {};
  for (const entry of table) {
    if (typeof entry === "string") {
      out[entry] = entry;
      continue;
    }
    if (!isRecord(entry) || !Array.isArray(entry.keys)) {
      continue;
    }
    const hasValue = Object.hasOwn(entry, "value");
    for (const key of entry.keys) {
      if (typeof key !== "string") {
        continue;
      }
      out[key] = hasValue ? (entry.value as DecodeJson) : key;
    }
  }
  return out;
}

export function normalizeDecodeTables(tables: Record<string, DecodeTable> | undefined): Record<string, Record<string, DecodeJson>> {
  const out: Record<string, Record<string, DecodeJson>> = {};
  for (const [name, table] of Object.entries(tables ?? {})) {
    out[name] = normalizeDecodeTable(table);
  }
  return out;
}
