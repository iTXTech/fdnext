import type { DecodeJson, DecodePack, DecodeTable, PartDecodeSpec } from "./types";

export type DecodePackStringMatcher = string | RegExp | ((value: string) => boolean);
export type PartDecodeSpecMatcher = string | RegExp | ((spec: PartDecodeSpec) => boolean);

export interface ReadPartDecodeSpecTablesOptions {
  specId?: PartDecodeSpecMatcher;
  tableName?: DecodePackStringMatcher;
}

export interface PartDecodeSpecTable {
  specId: string;
  tableName: string;
  table: Record<string, DecodeJson>;
}

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

function matchesString(value: string, matcher: DecodePackStringMatcher | undefined): boolean {
  if (matcher === undefined) {
    return true;
  }
  if (typeof matcher === "string") {
    return value === matcher;
  }
  if (matcher instanceof RegExp) {
    matcher.lastIndex = 0;
    return matcher.test(value);
  }
  return matcher(value);
}

function matchesPartSpec(spec: PartDecodeSpec, matcher: ReadPartDecodeSpecTablesOptions["specId"]): boolean {
  if (matcher === undefined) {
    return true;
  }
  if (typeof matcher === "function") {
    return matcher(spec);
  }
  return matchesString(spec.id, matcher);
}

export function readPartDecodeSpecTables(
  pack: DecodePack,
  options: ReadPartDecodeSpecTablesOptions = {}
): PartDecodeSpecTable[] {
  const out: PartDecodeSpecTable[] = [];
  for (const spec of pack.partSpecs) {
    if (!matchesPartSpec(spec, options.specId)) {
      continue;
    }
    for (const [tableName, table] of Object.entries(spec.tokenDecoder?.tables ?? {})) {
      if (!matchesString(tableName, options.tableName)) {
        continue;
      }
      out.push({
        specId: spec.id,
        tableName,
        table: normalizeDecodeTable(table)
      });
    }
  }
  return out;
}
