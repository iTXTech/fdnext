import type { PartDecodeDraft, PartNumberDecoder } from "../types";
import type {
  DecodeExpr,
  DecodeJson,
  DecodePackTraceStep,
  DecodeProgram,
  DecodeTable,
  NormalizeStep,
  PartDecodeSpec
} from "./types";
import {
  orderedAssignEntries,
  projectedAssignEntries,
  projectionPlan,
  projectionPlanKey,
  type DecodeProjectionPlan
} from "./projection";
import { normalizeDecodeTables } from "./table";

export function normalize(input: string, steps: NormalizeStep[] = []): string {
  let value = input;
  for (const step of steps) {
    if (step === "trim") {
      value = value.trim();
      continue;
    }
    if (step === "uppercase") {
      value = value.toUpperCase();
      continue;
    }
    if (typeof step === "object" && Array.isArray(step.remove)) {
      for (const token of step.remove) {
        value = value.split(token).join("");
      }
    }
  }
  return value;
}

function isVarExpr(value: unknown): value is { $var: string } {
  return typeof value === "object" && value !== null && "$var" in value;
}

function isTplExpr(value: unknown): value is { $tpl: string } {
  return typeof value === "object" && value !== null && "$tpl" in value;
}

function isPathExpr(value: unknown): value is { $path: string | string[] } {
  return typeof value === "object" && value !== null && "$path" in value;
}

function cloneJson<T>(value: T): T {
  if (value && typeof value === "object") {
    return JSON.parse(JSON.stringify(value)) as T;
  }
  return value;
}

function isMutableRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isInternalCodeFieldKey(key: string): boolean {
  return key.endsWith("_code");
}

function pruneInternalCodeFieldRecord(fields: unknown): void {
  if (!isMutableRecord(fields)) {
    return;
  }
  for (const key of Object.keys(fields)) {
    if (isInternalCodeFieldKey(key)) {
      delete fields[key];
    }
  }
}

function pruneInternalCodeFields(draft: Record<string, unknown>): void {
  pruneInternalCodeFieldRecord(draft.fields);
  const components = draft.components;
  if (!Array.isArray(components)) {
    return;
  }
  for (const component of components) {
    if (isMutableRecord(component)) {
      pruneInternalCodeFieldRecord(component.fields);
    }
  }
}

function readPath(context: Record<string, unknown>, path: string | string[]): unknown {
  const parts = Array.isArray(path) ? path : path.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function renderTemplate(template: string, context: Record<string, unknown>): string {
  return template.replaceAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key: string) => String(readPath(context, key) ?? ""));
}

function evaluateExpr(expr: DecodeExpr, context: Record<string, unknown>): unknown {
  if (isVarExpr(expr)) {
    return context[expr.$var];
  }
  if (isTplExpr(expr)) {
    return renderTemplate(expr.$tpl, context);
  }
  if (isPathExpr(expr)) {
    return readPath(context, expr.$path);
  }
  if (Array.isArray(expr)) {
    return expr.map((item) => evaluateExpr(item, context));
  }
  if (expr && typeof expr === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(expr)) {
      out[key] = evaluateExpr(value as DecodeExpr, context);
    }
    return out;
  }
  return expr;
}

interface DecodeProgramRuntime {
  tables: Record<string, Record<string, DecodeJson>>;
  patterns: Map<number, RegExp>;
  projectionPlans: Map<string, DecodeProjectionPlan>;
}

function assignPath(out: Record<string, unknown>, key: string, value: unknown): void {
  if (value === undefined) {
    return;
  }
  const path = key.split(".");
  let current = out;
  for (const part of path.slice(0, -1)) {
    const existing = current[part];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const leaf = path[path.length - 1] ?? key;
  const existing = current[leaf];
  if (
    existing && typeof existing === "object" && !Array.isArray(existing) &&
    value && typeof value === "object" && !Array.isArray(value)
  ) {
    current[leaf] = { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) };
    return;
  }
  current[leaf] = value;
}

function matchFromStart(
  value: string,
  table: Record<string, DecodeJson>
): { matched: boolean; rest: string; key?: string; value?: DecodeJson } {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (value.startsWith(key)) {
      return { matched: true, rest: value.slice(key.length), key, value: table[key] };
    }
  }
  for (const key of keys) {
    const consumed = matchOptionalDashPrefix(value, key);
    if (consumed !== null) {
      return { matched: true, rest: value.slice(consumed), key, value: table[key] };
    }
  }
  return { matched: false, rest: value };
}

function matchOptionalDashPrefix(value: string, key: string): number | null {
  if (!key.includes("-")) {
    return null;
  }
  let valueIndex = 0;
  for (const char of key) {
    if (char === "-") {
      if (value[valueIndex] === "-") {
        valueIndex += 1;
      }
      continue;
    }
    if (value[valueIndex] !== char) {
      return null;
    }
    valueIndex += 1;
  }
  return valueIndex;
}

function matchScopedFromStart(
  value: string,
  table: Record<string, DecodeJson>,
  scope: unknown,
  separator = ":"
): { matched: boolean; rest: string; key?: string; value?: DecodeJson } {
  const scopeValue = String(scope ?? "");
  if (!scopeValue) {
    return matchFromStart(value, table);
  }
  const prefix = `${scopeValue}${separator}`;
  const scopedTable: Record<string, DecodeJson> = {};
  for (const [key, tableValue] of Object.entries(table)) {
    if (key.startsWith(prefix)) {
      scopedTable[key.slice(prefix.length)] = tableValue;
    }
  }
  const scopedResult = matchFromStart(value, scopedTable);
  if (scopedResult.matched) {
    return {
      ...scopedResult,
      key: `${prefix}${scopedResult.key ?? ""}`
    };
  }
  return matchFromStart(value, table);
}

function traceStep(trace: DecodePackTraceStep[] | undefined, step: DecodePackTraceStep): void {
  trace?.push(step);
}

function resolveDecodeTables(
  decoder: DecodeProgram,
  sharedTables?: Record<string, DecodeTable>
): Record<string, Record<string, DecodeJson>> {
  return normalizeDecodeTables({
    ...(sharedTables ?? {}),
    ...(decoder.tables ?? {})
  });
}
function createDecodeProgramRuntime(
  decoder: DecodeProgram,
  sharedTables?: Record<string, DecodeTable>
): DecodeProgramRuntime {
  const patterns = new Map<number, RegExp>();
  decoder.steps.forEach((step, index) => {
    if (step.op === "takeRegex") {
      patterns.set(index, new RegExp(step.pattern));
    }
  });
  return {
    tables: resolveDecodeTables(decoder, sharedTables),
    patterns,
    projectionPlans: new Map()
  };
}

function getProjectionPlan(
  runtime: DecodeProgramRuntime,
  decoder: DecodeProgram,
  targets: readonly string[]
): DecodeProjectionPlan {
  const key = projectionPlanKey(targets);
  const cached = runtime.projectionPlans.get(key);
  if (cached) {
    return cached;
  }
  const plan = projectionPlan(decoder, targets);
  runtime.projectionPlans.set(key, plan);
  return plan;
}

function normalizeOptionalDecodeTables(
  tables: Record<string, DecodeTable> | undefined
): Record<string, Record<string, DecodeJson>> | undefined {
  return tables ? normalizeDecodeTables(tables) : undefined;
}

function formatDieDensityMbit(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  if (value >= 1024 * 1024 && value % (1024 * 1024) === 0) {
    return `${value / (1024 * 1024)}Tb`;
  }
  if (value >= 1024 * 1024) {
    return `${Number((value / (1024 * 1024)).toFixed(2))}Tb`;
  }
  if (value % 1024 === 0) {
    return `${value / 1024}Gb`;
  }
  return `${value}Mb`;
}

function runTokenDecoder(
  partNumber: string,
  decoder: DecodeProgram,
  runtime: DecodeProgramRuntime,
  trace?: DecodePackTraceStep[],
  targets?: readonly string[]
): PartDecodeDraft {
  const context: Record<string, unknown> = {
    partNumber,
    rest: partNumber
  };
  const tables = runtime.tables;
  const plan = targets ? getProjectionPlan(runtime, decoder, targets) : undefined;

  for (const [index, prefix] of (decoder.stripPrefixes ?? []).entries()) {
    const rest = String(context.rest ?? "");
    const matched = rest.startsWith(prefix);
    if (matched) {
      context.rest = rest.slice(prefix.length);
    }
    traceStep(trace, {
      op: "stripPrefix",
      path: `stripPrefixes[${index}]`,
      matched,
      key: prefix,
      restBefore: rest,
      restAfter: String(context.rest ?? "")
    });
  }

  for (const [index, step] of decoder.steps.entries()) {
    if (plan && index > plan.lastStep) {
      break;
    }
    if (plan && !plan.activeSteps.has(index)) {
      continue;
    }
    const path = `steps[${index}]`;
    if (step.op === "take") {
      const rest = String(context.rest ?? "");
      if (step.len > rest.length) {
        context[step.to] = "";
      } else {
        context[step.to] = rest.slice(0, step.len);
        context.rest = rest.slice(step.len);
      }
      traceStep(trace, {
        op: step.op,
        path,
        matched: step.len <= rest.length,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "takeRegex") {
      const rest = String(context.rest ?? "");
      const pattern = runtime.patterns.get(index) ?? new RegExp(step.pattern);
      pattern.lastIndex = 0;
      const match = pattern.exec(rest);
      const matched = match && match.index === 0;
      if (matched) {
        if (step.to) {
          context[step.to] = match[0];
        }
        context.rest = rest.slice(match[0].length);
        for (const [to, group] of Object.entries(step.groups ?? {})) {
          context[to] = typeof group === "number" ? (match[group] ?? "") : (match.groups?.[group] ?? "");
        }
      } else {
        if (step.to) {
          context[step.to] = step.default ?? "";
        }
        for (const [to] of Object.entries(step.groups ?? {})) {
          context[to] = "";
        }
      }
      traceStep(trace, {
        op: step.op,
        path,
        matched: Boolean(matched),
        target: step.to,
        value: step.to ? context[step.to] : undefined,
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "stripIfPrefix") {
      const rest = String(context.rest ?? "");
      if (step.if && !context[step.if]) {
        if (step.to) {
          context[step.to] = false;
        }
        traceStep(trace, {
          op: step.op,
          path,
          matched: false,
          key: step.prefix,
          target: step.to,
          value: step.to ? context[step.to] : undefined,
          restBefore: rest,
          restAfter: rest
        });
        continue;
      }
      const matched = rest.startsWith(step.prefix);
      if (matched) {
        context.rest = rest.slice(step.prefix.length);
      }
      if (step.to) {
        context[step.to] = matched;
      }
      traceStep(trace, {
        op: step.op,
        path,
        matched,
        key: step.prefix,
        target: step.to,
        value: step.to ? context[step.to] : undefined,
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "markLookupPartNumber") {
      const rest = String(context.rest ?? "");
      const consumedLength = Math.max(0, partNumber.length - rest.length);
      context[step.to] = partNumber.slice(0, consumedLength);
      traceStep(trace, {
        op: step.op,
        path,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: rest
      });
      continue;
    }

    if (step.op === "tpl") {
      const rest = String(context.rest ?? "");
      const value = renderTemplate(step.template, context);
      context[step.to] = value;
      traceStep(trace, {
        op: step.op,
        path,
        target: step.to,
        value,
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "fallback") {
      const rest = String(context.rest ?? "");
      const primary = context[step.primary];
      const secondary = context[step.secondary];
      if (primary === undefined || primary === null) {
        context[step.to] = secondary;
      } else if (typeof primary === "string") {
        context[step.to] = primary.length > 0 ? primary : secondary;
      } else {
        context[step.to] = primary;
      }
      traceStep(trace, {
        op: step.op,
        path,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "dieDensity") {
      const rest = String(context.rest ?? "");
      const density = Number(context[step.density]);
      const dieCount = Number(context[step.dieCount]);
      const matched = Number.isFinite(density) && Number.isFinite(dieCount) && dieCount > 0;
      context[step.to] = matched ? formatDieDensityMbit(density / dieCount) : (step.default ?? "");
      traceStep(trace, {
        op: step.op,
        path,
        matched,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "set") {
      const rest = String(context.rest ?? "");
      context[step.to] = evaluateExpr(cloneJson(step.value), context);
      traceStep(trace, {
        op: step.op,
        path,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "mul") {
      const rest = String(context.rest ?? "");
      const a = Number(context[step.a]);
      const b = Number(context[step.b]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        context[step.to] = a * b;
      } else {
        context[step.to] = step.default ?? 0;
      }
      traceStep(trace, {
        op: step.op,
        path,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "merge") {
      const rest = String(context.rest ?? "");
      const into = context[step.into];
      const from = context[step.from];
      if (into && typeof into === "object" && !Array.isArray(into) && from && typeof from === "object" && !Array.isArray(from)) {
        context[step.into] = { ...(into as Record<string, unknown>), ...(from as Record<string, unknown>) };
      }
      traceStep(trace, {
        op: step.op,
        path,
        target: step.into,
        value: context[step.into],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "omit") {
      const rest = String(context.rest ?? "");
      const source = context[step.from];
      const target = step.to ?? step.from;
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const next = { ...(source as Record<string, unknown>) };
        for (const key of step.keys) {
          delete next[key];
        }
        context[target] = next;
      }
      traceStep(trace, {
        op: step.op,
        path,
        target,
        value: context[target],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "notEmpty") {
      const rest = String(context.rest ?? "");
      const value = String(context[step.from] ?? "");
      context[step.to] = value.length > 0;
      traceStep(trace, {
        op: step.op,
        path,
        matched: Boolean(context[step.to]),
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "mergeIf") {
      const rest = String(context.rest ?? "");
      if (!context[step.if]) {
        traceStep(trace, {
          op: step.op,
          path,
          matched: false,
          target: step.into,
          restBefore: rest,
          restAfter: String(context.rest ?? "")
        });
        continue;
      }
      const into = context[step.into];
      const from = context[step.from];
      if (into && typeof into === "object" && !Array.isArray(into) && from && typeof from === "object" && !Array.isArray(from)) {
        context[step.into] = { ...(into as Record<string, unknown>), ...(from as Record<string, unknown>) };
      }
      traceStep(trace, {
        op: step.op,
        path,
        matched: true,
        target: step.into,
        value: context[step.into],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    if (step.op === "takeLongest") {
      const rest = String(context.rest ?? "");
      const table = tables[step.table] ?? {};
      const result = step.scope
        ? matchScopedFromStart(rest, table, context[step.scope], step.scopeSeparator)
        : matchFromStart(rest, table);
      if (result.matched) {
        context[step.to] = cloneJson(result.value);
        if (step.keyTo) {
          context[step.keyTo] = result.key;
        }
        context.rest = result.rest;
      } else {
        context[step.to] = cloneJson(step.default);
      }
      traceStep(trace, {
        op: step.op,
        path,
        matched: result.matched,
        table: step.table,
        key: result.key,
        target: step.to,
        value: context[step.to],
        restBefore: rest,
        restAfter: String(context.rest ?? "")
      });
      continue;
    }

    const rest = String(context.rest ?? "");
    const table = tables[step.table] ?? {};
    const source = String(context[step.from] ?? "");
    const matched = Object.hasOwn(table, source);
    if (matched) {
      context[step.to] = cloneJson(table[source]);
      if (step.keyTo) {
        context[step.keyTo] = source;
      }
    } else {
      context[step.to] = cloneJson(step.default);
    }
    traceStep(trace, {
      op: step.op,
      path,
      matched,
      table: step.table,
      key: source,
      target: step.to,
      value: context[step.to],
      restBefore: rest,
      restAfter: String(context.rest ?? "")
    });
  }

  const out: Record<string, unknown> = {};
  const assignments = plan?.assignEntries ?? orderedAssignEntries(decoder.assign);
  for (const [index, [key, value]] of assignments.entries()) {
    const evaluated = evaluateExpr(value, context);
    assignPath(out, key, evaluated);
    traceStep(trace, {
      op: "assign",
      path: `assign[${index}]`,
      target: key,
      value: evaluated
    });
  }

  if (!readPath(out, "device.partNumber")) {
    assignPath(out, "device.partNumber", partNumber);
  }

  pruneInternalCodeFields(out);
  return out as unknown as PartDecodeDraft;
}

export function checkMatch(normalized: string, match: { kind: "prefix"; value: string } | { kind: "regex"; value: string; flags?: string }): boolean {
  if (match.kind === "prefix") {
    return normalized.startsWith(match.value);
  }
  return new RegExp(match.value, match.flags).test(normalized);
}

export function decodePartBySpec(
  rule: PartDecodeSpec,
  normalized: string,
  trace?: DecodePackTraceStep[],
  sharedTables?: Record<string, DecodeTable>,
  targets?: readonly string[],
  programRuntime?: DecodeProgramRuntime
): PartDecodeDraft {
  if (rule.tokenDecoder) {
    const runtime = programRuntime ?? createDecodeProgramRuntime(rule.tokenDecoder, sharedTables);
    return runTokenDecoder(normalized, rule.tokenDecoder, runtime, trace, targets);
  }
  const context = { partNumber: normalized, rest: normalized };
  const out: Record<string, unknown> = {};
  const entries = targets
    ? projectedAssignEntries(rule.set ?? {}, targets)
    : Object.entries(rule.set ?? {}).map(([key, value], index) => [key, value, index] as const);
  for (const [index, [key, value]] of entries.entries()) {
    const evaluated = evaluateExpr(value, context);
    assignPath(out, key, evaluated);
    traceStep(trace, {
      op: "set",
      path: `set[${index}]`,
      target: key,
      value: evaluated
    });
  }
  if (!readPath(out, "device.partNumber")) {
    assignPath(out, "device.partNumber", normalized);
    traceStep(trace, {
      op: "default",
      path: "device.partNumber",
      target: "device.partNumber",
      value: normalized
    });
  }
  pruneInternalCodeFields(out);
  return out as unknown as PartDecodeDraft;
}

export function compilePartDecodeSpecs(
  rules: PartDecodeSpec[],
  sharedTables?: Record<string, DecodeTable>
): PartNumberDecoder[] {
  const profileTables = normalizeOptionalDecodeTables(sharedTables);
  return rules.map((rule) => {
    const programRuntime = rule.tokenDecoder ? createDecodeProgramRuntime(rule.tokenDecoder, sharedTables) : undefined;
    const matchPattern = rule.match.kind === "regex" ? new RegExp(rule.match.value, rule.match.flags) : undefined;
    const matchesNormalized = (normalized: string): boolean => {
      if (rule.match.kind === "prefix") {
        return normalized.startsWith(rule.match.value);
      }
      const pattern = matchPattern as RegExp;
      pattern.lastIndex = 0;
      return pattern.test(normalized);
    };
    const check = (partNumber: string): boolean => {
      const normalized = normalize(partNumber, rule.normalize);
      return matchesNormalized(normalized);
    };

    const decode = (partNumber: string): PartDecodeDraft | null => {
      const normalized = normalize(partNumber, rule.normalize);
      if (!matchesNormalized(normalized)) {
        return null;
      }
      return decodePartBySpec(rule, normalized, undefined, sharedTables, undefined, programRuntime);
    };

    const project = (partNumber: string, targets: readonly string[]): PartDecodeDraft | null => {
      const normalized = normalize(partNumber, rule.normalize);
      if (!matchesNormalized(normalized)) {
        return null;
      }
      return decodePartBySpec(rule, normalized, undefined, sharedTables, targets, programRuntime);
    };

    return {
      id: rule.id,
      priority: rule.priority,
      profileTables,
      check,
      decode,
      project
    } satisfies PartNumberDecoder;
  });
}
