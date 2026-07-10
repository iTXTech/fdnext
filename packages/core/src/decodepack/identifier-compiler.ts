import type { IdentifierDecodeDraft, IdentifierDecoder } from "../types";
import type {
  DecodeJson,
  DecodeTable,
  IdentifierBitRule,
  IdentifierDecodeExplainBitfield,
  IdentifierDecodeSpec,
  IdentifierFieldCondition,
  IdentifierFieldReuse
} from "./types";
import { normalizeDecodeTables } from "./table";

function checkMatch(
  normalized: string,
  match: { kind: "prefix"; value: string } | { kind: "regex"; value: string; flags?: string }
): boolean {
  if (match.kind === "prefix") {
    return normalized.startsWith(match.value);
  }
  return new RegExp(match.value, match.flags).test(normalized);
}

function normalizeOptionalDecodeTables(
  tables: Record<string, DecodeTable> | undefined
): Record<string, Record<string, DecodeJson>> | undefined {
  return tables ? normalizeDecodeTables(tables) : undefined;
}

function byteAt(id: string, offset: number): number {
  const idx = (offset - 1) * 2;
  return Number.parseInt(id.slice(idx, idx + 2), 16);
}

function byteHexAt(id: string, offset: number): string {
  const byte = byteAt(id, offset);
  return Number.isFinite(byte) ? byte.toString(16).toUpperCase().padStart(2, "0") : "";
}

function identifierWhenByteMatches(actual: string, expected: string): boolean {
  const pattern = expected.toUpperCase().padStart(2, "0");
  if (!pattern.includes("*") && !pattern.includes("?")) {
    return actual === pattern;
  }
  if (pattern.length !== actual.length) {
    return false;
  }
  return [...pattern].every((char, index) => char === "*" || char === "?" || char === actual[index]);
}

function identifierRuleMatchesWhen(id: string, when: Record<string, string | string[]> | undefined): boolean {
  if (!when) {
    return true;
  }
  for (const [offsetKey, expected] of Object.entries(when)) {
    const actual = byteHexAt(id, Number(offsetKey));
    const values = Array.isArray(expected) ? expected : [expected];
    if (!values.some((value) => identifierWhenByteMatches(actual, value))) {
      return false;
    }
  }
  return true;
}

function identifierScalarEquals(a: unknown, b: unknown): boolean {
  return a === b || String(a) === String(b);
}

function identifierFieldNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function identifierFieldConditionMatches(value: unknown, condition: IdentifierFieldCondition): boolean {
  if (Array.isArray(condition)) {
    return condition.some((item) => identifierScalarEquals(value, item));
  }
  if (!condition || typeof condition !== "object") {
    return identifierScalarEquals(value, condition);
  }

  const comparison = condition;
  if (comparison.eq !== undefined) {
    const expected = Array.isArray(comparison.eq) ? comparison.eq : [comparison.eq];
    if (!expected.some((item) => identifierScalarEquals(value, item))) {
      return false;
    }
  }

  const numeric = identifierFieldNumber(value);
  if (comparison.gte !== undefined && (numeric === undefined || numeric < comparison.gte)) {
    return false;
  }
  if (comparison.gt !== undefined && (numeric === undefined || numeric <= comparison.gt)) {
    return false;
  }
  if (comparison.lte !== undefined && (numeric === undefined || numeric > comparison.lte)) {
    return false;
  }
  if (comparison.lt !== undefined && (numeric === undefined || numeric >= comparison.lt)) {
    return false;
  }
  return true;
}

function identifierRuleMatchesFields(fields: Record<string, unknown>, whenFields: Record<string, IdentifierFieldCondition> | undefined): boolean {
  if (!whenFields) {
    return true;
  }
  for (const [field, condition] of Object.entries(whenFields)) {
    if (!identifierFieldConditionMatches(fields[field], condition)) {
      return false;
    }
  }
  return true;
}

function identifierRuleMatchesDieDensity(fields: Record<string, unknown>, minDieDensityMbit: number | undefined): boolean {
  if (minDieDensityMbit === undefined) {
    return true;
  }
  const density = identifierFieldNumber(fields.density);
  const dieCount = identifierFieldNumber(fields.die_count);
  return density !== undefined && dieCount !== undefined && dieCount > 0 && density / dieCount >= minDieDensityMbit;
}

function identifierRuleMatches(id: string, rule: IdentifierBitRule, fields: Record<string, unknown>): boolean {
  return (
    identifierRuleMatchesWhen(id, rule.when) &&
    identifierRuleMatchesFields(fields, rule.whenFields) &&
    identifierRuleMatchesDieDensity(fields, rule.whenDieDensityMbitGte)
  );
}

type IdentifierDecodeTarget = "fields" | "meta";

function canonicalIdentifierField(name: string): { target: IdentifierDecodeTarget; key: string; outputKey: string; scale?: number } {
  const raw = name.startsWith("field:") ? name.slice(6) : name;
  if (raw === "meta.nandDieProfileKey" || raw === "meta.nandDieProfileKeys") {
    return { target: "meta", key: raw.slice("meta.".length), outputKey: raw };
  }
  switch (raw) {
    case "page_size":
      return { target: "fields", key: "page_size", outputKey: "page_size", scale: 1024 };
    case "block_size":
      return { target: "fields", key: "block_size", outputKey: "block_size", scale: 1024 };
    default:
      return { target: "fields", key: raw, outputKey: raw };
  }
}

function isIdentifierFieldReuse(value: unknown): value is IdentifierFieldReuse {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as IdentifierFieldReuse).from === "string";
}

function readIdentifierOutput(out: Record<string, unknown>, name: string): unknown {
  const field = canonicalIdentifierField(name);
  const source = field.target === "meta"
    ? out.meta as Record<string, unknown> | undefined
    : out.fields as Record<string, unknown> | undefined;
  return source?.[field.key];
}

function writeIdentifierOutput(out: Record<string, unknown>, name: string, value: unknown): void {
  const field = canonicalIdentifierField(name);
  if (field.target === "meta") {
    const meta = out.meta as Record<string, unknown>;
    meta[field.key] = value;
  } else {
    const fields = out.fields as Record<string, unknown>;
    fields[field.key] = value;
  }
}

export function decodeIdentifierByDefinition(
  id: string,
  rule: IdentifierDecodeSpec,
  bitfields?: IdentifierDecodeExplainBitfield[]
): IdentifierDecodeDraft {
  const out: Record<string, unknown> = {
    device: {
      identifier: id,
      idScheme: rule.idScheme,
      vendor: rule.vendor,
      domain: "memory",
      chipKind: "raw_nand"
    },
    fields: {},
    meta: {
      ruleId: rule.id,
      fieldProfile: "nand.flash_id"
    }
  };
  const fields = out.fields as Record<string, unknown>;

  for (const [offsetKey, rules] of Object.entries(rule.definition)) {
    const byte = byteAt(id, Number(offsetKey));
    for (const [name, ruleSet] of Object.entries(rules)) {
      if (isIdentifierFieldReuse(ruleSet)) {
        const value = readIdentifierOutput(out, ruleSet.from);
        if (value !== undefined) {
          writeIdentifierOutput(out, name, value);
        }
        continue;
      }
      const entries = Array.isArray(ruleSet) ? ruleSet : [ruleSet];
      for (const rule of entries) {
        if (!identifierRuleMatches(id, rule, fields)) {
          continue;
        }
        let data = 0;
        for (const bit of rule.dq) {
          data = (data << 1) + ((byte >> bit) & 0b1);
        }
        const resolved = rule.def[String(data)];
        if (resolved === undefined) {
          continue;
        }
        const field = canonicalIdentifierField(name);
        const value = typeof resolved === "number" && field.scale ? resolved * field.scale : resolved;
        writeIdentifierOutput(out, name, value);
        bitfields?.push({
          offset: Number(offsetKey),
          byte,
          field: name,
          outputKey: field.outputKey,
          bits: rule.dq,
          data,
          value
        });
        break;
      }
    }
  }

  return out as unknown as IdentifierDecodeDraft;
}

export function compileIdentifierDecodeSpecs(
  rules: IdentifierDecodeSpec[],
  sharedTables?: Record<string, DecodeTable>
): IdentifierDecoder[] {
  const profileTables = normalizeOptionalDecodeTables(sharedTables);
  return rules.map((rule) => {
    const check = (id: string): boolean => checkMatch(id.toUpperCase(), rule.match);
    const decode = (id: string): IdentifierDecodeDraft | null => {
      const normalized = id.toUpperCase();
      if (!check(normalized)) {
        return null;
      }
      return decodeIdentifierByDefinition(normalized, rule);
    };

    return {
      id: rule.id,
      idScheme: rule.idScheme,
      priority: rule.priority,
      profileTables,
      check,
      decode
    } satisfies IdentifierDecoder;
  });
}
