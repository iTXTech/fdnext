import type { PartDecodeDraft, PartNumberDecoder, PartNumberMatch } from "../types";
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

type DecodeContext = Record<string, unknown>;
type CompiledExpression = (context: DecodeContext) => unknown;
type CompiledPath = readonly string[];

interface CompiledAssignment {
  readonly key: string;
  readonly path: CompiledPath;
  readonly index: number;
  readonly evaluate: CompiledExpression;
}

interface TableMatchResult {
  readonly matched: boolean;
  readonly rest: string;
  readonly key?: string;
  readonly value?: DecodeJson;
}

type TableStartMatcher = (value: string) => TableMatchResult;

interface CompiledTakeLongestMatcher {
  match(value: string, scope?: unknown): TableMatchResult;
}

interface CompiledProjectionPlan extends DecodeProjectionPlan {
  readonly assignments: readonly CompiledAssignment[];
}

interface DecodeProgramRuntime {
  readonly program: DecodeProgram;
  readonly tables: Readonly<Record<string, Readonly<Record<string, DecodeJson>>>>;
  readonly patterns: ReadonlyMap<number, RegExp>;
  readonly templates: ReadonlyMap<number, CompiledExpression>;
  readonly setExpressions: ReadonlyMap<number, CompiledExpression>;
  readonly longestMatchers: ReadonlyMap<number, CompiledTakeLongestMatcher>;
  readonly assignments: readonly CompiledAssignment[];
  readonly assignmentsByIndex: ReadonlyMap<number, CompiledAssignment>;
  readonly projectionPlans: Map<string, CompiledProjectionPlan>;
}

interface PartRuleRuntime {
  readonly program?: DecodeProgramRuntime;
  readonly setAssignments: readonly CompiledAssignment[];
  readonly setProjectionAssignments: Map<string, readonly CompiledAssignment[]>;
}

function compileNormalizer(steps: readonly NormalizeStep[] = []): (input: string) => string {
  const operations = steps.map((step): ((value: string) => string) => {
    if (step === "trim") {
      return (value) => value.trim();
    }
    if (step === "uppercase") {
      return (value) => value.toUpperCase();
    }
    const removals = Object.freeze([...step.remove]);
    return (value) => {
      let next = value;
      for (const token of removals) {
        next = next.split(token).join("");
      }
      return next;
    };
  });
  if (operations.length === 0) {
    return (input) => input;
  }
  return (input) => {
    let value = input;
    for (const operation of operations) {
      value = operation(value);
    }
    return value;
  };
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
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = cloneJson(child);
    }
    return out as T;
  }
  return value;
}

function freezeJson<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach((item) => freezeJson(item));
    return Object.freeze(value);
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((child) => freezeJson(child));
    return Object.freeze(value);
  }
  return value;
}

function compilePath(path: string | readonly string[]): CompiledPath {
  return Object.freeze(typeof path === "string" ? path.split(".") : [...path]);
}

const DEVICE_PART_NUMBER_PATH = compilePath("device.partNumber");

function readPath(context: DecodeContext, path: string | readonly string[]): unknown {
  const parts = typeof path === "string" ? path.split(".") : path;
  let current: unknown = context;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compileTemplate(template: string): CompiledExpression {
  const parts: Array<string | CompiledPath> = [];
  let offset = 0;
  for (const match of template.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g)) {
    const index = match.index ?? 0;
    if (index > offset) {
      parts.push(template.slice(offset, index));
    }
    parts.push(compilePath(match[1] ?? ""));
    offset = index + match[0].length;
  }
  if (offset < template.length) {
    parts.push(template.slice(offset));
  }
  const compiled = Object.freeze(parts);
  return (context) => compiled.map((part) => typeof part === "string" ? part : String(readPath(context, part) ?? "")).join("");
}

function compileExpression(expr: DecodeExpr): CompiledExpression {
  if (isVarExpr(expr)) {
    const variable = expr.$var;
    return (context) => context[variable];
  }
  if (isTplExpr(expr)) {
    return compileTemplate(expr.$tpl);
  }
  if (isPathExpr(expr)) {
    const path = compilePath(expr.$path);
    return (context) => readPath(context, path);
  }
  if (Array.isArray(expr)) {
    const items = Object.freeze(expr.map((item) => compileExpression(item)));
    return (context) => items.map((evaluate) => evaluate(context));
  }
  if (expr && typeof expr === "object") {
    const entries = Object.freeze(Object.entries(expr).map(([key, value]) => [key, compileExpression(value as DecodeExpr)] as const));
    return (context) => Object.fromEntries(entries.map(([key, evaluate]) => [key, evaluate(context)]));
  }
  return () => expr;
}

function compileAssignments(entries: readonly (readonly [string, DecodeExpr, number])[]): readonly CompiledAssignment[] {
  return Object.freeze(entries.map(([key, expression, index]) => Object.freeze({
    key,
    path: compilePath(key),
    index,
    evaluate: compileExpression(expression)
  })));
}

function assignmentsByIndex(assignments: readonly CompiledAssignment[]): ReadonlyMap<number, CompiledAssignment> {
  return new Map(assignments.map((assignment) => [assignment.index, assignment]));
}

function projectedCompiledAssignments(
  assignments: readonly CompiledAssignment[],
  targets: readonly string[]
): readonly CompiledAssignment[] {
  const selected = new Set<number>();
  for (const target of new Set(targets.filter(Boolean))) {
    const exact = assignments.filter(({ key }) => key === target);
    const descendants = assignments.filter(({ key }) => key.startsWith(`${target}.`));
    if (exact.length > 0) {
      [...exact, ...descendants].forEach(({ index }) => selected.add(index));
      continue;
    }
    const closestAncestor = assignments
      .filter(({ key }) => target.startsWith(`${key}.`))
      .sort((a, b) => b.key.length - a.key.length)[0];
    if (closestAncestor) {
      selected.add(closestAncestor.index);
    }
    descendants.forEach(({ index }) => selected.add(index));
  }
  return Object.freeze(assignments.filter(({ index }) => selected.has(index)));
}

function getSetProjectionAssignments(
  runtime: PartRuleRuntime,
  targets: readonly string[]
): readonly CompiledAssignment[] {
  const key = projectionPlanKey(targets);
  const cached = runtime.setProjectionAssignments.get(key);
  if (cached) {
    return cached;
  }
  const assignments = projectedCompiledAssignments(runtime.setAssignments, targets);
  runtime.setProjectionAssignments.set(key, assignments);
  return assignments;
}

function assignPath(out: Record<string, unknown>, path: CompiledPath, value: unknown): void {
  if (value === undefined) {
    return;
  }
  let current = out;
  for (const part of path.slice(0, -1)) {
    const existing = current[part];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const leaf = path[path.length - 1] ?? "";
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

function compileStartMatcher(
  entries: readonly (readonly [token: string, key: string, value: DecodeJson])[]
): TableStartMatcher {
  const sorted = Object.freeze([...entries].sort(([a], [b]) => b.length - a.length));
  const optionalDash = Object.freeze(sorted.filter(([token]) => token.includes("-")));
  return (value) => {
    for (const [token, key, tableValue] of sorted) {
      if (value.startsWith(token)) {
        return { matched: true, rest: value.slice(token.length), key, value: tableValue };
      }
    }
    for (const [token, key, tableValue] of optionalDash) {
      const consumed = matchOptionalDashPrefix(value, token);
      if (consumed !== null) {
        return { matched: true, rest: value.slice(consumed), key, value: tableValue };
      }
    }
    return { matched: false, rest: value };
  };
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

function compileTakeLongestMatcher(
  table: Readonly<Record<string, DecodeJson>>,
  scoped: boolean,
  separator = ":"
): CompiledTakeLongestMatcher {
  const entries = Object.entries(table).map(([key, value]) => [key, key, value] as const);
  const base = compileStartMatcher(entries);
  if (!scoped) {
    return Object.freeze({ match: (value: string) => base(value) });
  }
  const grouped = new Map<string, Array<readonly [string, string, DecodeJson]>>();
  for (const [key, value] of Object.entries(table)) {
    let separatorIndex = key.indexOf(separator);
    while (separatorIndex >= 1) {
      const scope = key.slice(0, separatorIndex);
      const token = key.slice(separatorIndex + separator.length);
      const scopeEntries = grouped.get(scope) ?? [];
      scopeEntries.push([token, key, value]);
      grouped.set(scope, scopeEntries);
      separatorIndex = key.indexOf(separator, separatorIndex + separator.length);
    }
  }
  const scopedMatchers = new Map(
    [...grouped].map(([scope, scopeEntries]) => [scope, compileStartMatcher(scopeEntries)] as const)
  );
  return Object.freeze({
    match(value: string, scope?: unknown): TableMatchResult {
      const scopeValue = String(scope ?? "");
      const matcher = scopeValue ? scopedMatchers.get(scopeValue) : undefined;
      const scopedResult = matcher?.(value);
      return scopedResult?.matched ? scopedResult : base(value);
    }
  });
}

function resolveDecodeTables(
  decoder: DecodeProgram,
  sharedTables?: Record<string, DecodeTable>
): Readonly<Record<string, Readonly<Record<string, DecodeJson>>>> {
  const normalized = normalizeDecodeTables({
    ...(sharedTables ?? {}),
    ...(decoder.tables ?? {})
  });
  const tables: Record<string, Readonly<Record<string, DecodeJson>>> = {};
  for (const [name, table] of Object.entries(normalized)) {
    const compiledTable = Object.fromEntries(
      Object.entries(table).map(([key, value]) => [key, freezeJson(cloneJson(value))])
    );
    tables[name] = Object.freeze(compiledTable);
  }
  return Object.freeze(tables);
}

function createDecodeProgramRuntime(
  decoder: DecodeProgram,
  sharedTables?: Record<string, DecodeTable>
): DecodeProgramRuntime {
  const program = freezeJson(cloneJson(decoder));
  const tables = resolveDecodeTables(program, sharedTables);
  const patterns = new Map<number, RegExp>();
  const templates = new Map<number, CompiledExpression>();
  const setExpressions = new Map<number, CompiledExpression>();
  const longestMatchers = new Map<number, CompiledTakeLongestMatcher>();
  program.steps.forEach((step, index) => {
    if (step.op === "takeRegex") {
      patterns.set(index, new RegExp(step.pattern));
    }
    if (step.op === "tpl") {
      templates.set(index, compileTemplate(step.template));
    }
    if (step.op === "set") {
      setExpressions.set(index, compileExpression(step.value));
    }
    if (step.op === "takeLongest") {
      longestMatchers.set(index, compileTakeLongestMatcher(
        tables[step.table] ?? {},
        Boolean(step.scope),
        step.scopeSeparator
      ));
    }
  });
  const assignments = compileAssignments(orderedAssignEntries(program.assign));
  return {
    program,
    tables,
    patterns,
    templates,
    setExpressions,
    longestMatchers,
    assignments,
    assignmentsByIndex: assignmentsByIndex(assignments),
    projectionPlans: new Map()
  };
}

function getProjectionPlan(
  runtime: DecodeProgramRuntime,
  targets: readonly string[]
): CompiledProjectionPlan {
  const key = projectionPlanKey(targets);
  const cached = runtime.projectionPlans.get(key);
  if (cached) {
    return cached;
  }
  const basePlan = projectionPlan(runtime.program, targets);
  const plan: CompiledProjectionPlan = {
    ...basePlan,
    assignments: Object.freeze(basePlan.assignEntries.flatMap(([, , index]) => {
      const assignment = runtime.assignmentsByIndex.get(index);
      return assignment ? [assignment] : [];
    }))
  };
  runtime.projectionPlans.set(key, plan);
  return plan;
}

function normalizeOptionalDecodeTables(
  tables: Record<string, DecodeTable> | undefined
): Record<string, Record<string, DecodeJson>> | undefined {
  if (!tables) {
    return undefined;
  }
  const normalized = normalizeDecodeTables(tables);
  return Object.freeze(Object.fromEntries(Object.entries(normalized).map(([name, table]) => [
    name,
    Object.freeze(Object.fromEntries(Object.entries(table).map(([key, value]) => [key, freezeJson(cloneJson(value))])))
  ])));
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
  runtime: DecodeProgramRuntime,
  trace?: DecodePackTraceStep[],
  targets?: readonly string[]
): PartDecodeDraft {
  const decoder = runtime.program;
  const context: Record<string, unknown> = {
    partNumber,
    rest: partNumber
  };
  const tables = runtime.tables;
  const plan = targets ? getProjectionPlan(runtime, targets) : undefined;

  for (const [index, prefix] of (decoder.stripPrefixes ?? []).entries()) {
    const rest = String(context.rest ?? "");
    const matched = rest.startsWith(prefix);
    if (matched) {
      context.rest = rest.slice(prefix.length);
    }
    trace?.push({
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
    const path = trace ? `steps[${index}]` : "";
    if (step.op === "take") {
      const rest = String(context.rest ?? "");
      if (step.len > rest.length) {
        context[step.to] = "";
      } else {
        context[step.to] = rest.slice(0, step.len);
        context.rest = rest.slice(step.len);
      }
      trace?.push({
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
      const pattern = runtime.patterns.get(index) as RegExp;
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
          context[step.to] = cloneJson(step.default ?? "");
        }
        for (const [to] of Object.entries(step.groups ?? {})) {
          context[to] = "";
        }
      }
      trace?.push({
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
        trace?.push({
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
      trace?.push({
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
      trace?.push({
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
      const value = (runtime.templates.get(index) as CompiledExpression)(context);
      context[step.to] = value;
      trace?.push({
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
      trace?.push({
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
      context[step.to] = matched ? formatDieDensityMbit(density / dieCount) : cloneJson(step.default ?? "");
      trace?.push({
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
      context[step.to] = (runtime.setExpressions.get(index) as CompiledExpression)(context);
      trace?.push({
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
      trace?.push({
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
      trace?.push({
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
      trace?.push({
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
      trace?.push({
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
        trace?.push({
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
      trace?.push({
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
      const result = (runtime.longestMatchers.get(index) as CompiledTakeLongestMatcher)
        .match(rest, step.scope ? context[step.scope] : undefined);
      if (result.matched) {
        context[step.to] = cloneJson(result.value);
        if (step.keyTo) {
          context[step.keyTo] = result.key;
        }
        context.rest = result.rest;
      } else {
        context[step.to] = cloneJson(step.default);
      }
      trace?.push({
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
    trace?.push({
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
  const assignments = plan?.assignments ?? runtime.assignments;
  for (const [traceIndex, assignment] of assignments.entries()) {
    const evaluated = assignment.evaluate(context);
    assignPath(out, assignment.path, evaluated);
    trace?.push({
      op: "assign",
      path: `assign[${traceIndex}]`,
      target: assignment.key,
      value: evaluated
    });
  }

  if (!readPath(out, DEVICE_PART_NUMBER_PATH)) {
    assignPath(out, DEVICE_PART_NUMBER_PATH, partNumber);
  }

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
  ruleRuntime?: PartRuleRuntime
): PartDecodeDraft {
  const runtime = ruleRuntime ?? createPartRuleRuntime(rule, sharedTables);
  if (runtime.program) {
    return runTokenDecoder(normalized, runtime.program, trace, targets);
  }
  const context = { partNumber: normalized, rest: normalized };
  const out: Record<string, unknown> = {};
  const assignments = targets
    ? getSetProjectionAssignments(runtime, targets)
    : runtime.setAssignments;
  for (const [traceIndex, assignment] of assignments.entries()) {
    const evaluated = assignment.evaluate(context);
    assignPath(out, assignment.path, evaluated);
    trace?.push({
      op: "set",
      path: `set[${traceIndex}]`,
      target: assignment.key,
      value: evaluated
    });
  }
  if (!readPath(out, DEVICE_PART_NUMBER_PATH)) {
    assignPath(out, DEVICE_PART_NUMBER_PATH, normalized);
    trace?.push({
      op: "default",
      path: "device.partNumber",
      target: "device.partNumber",
      value: normalized
    });
  }
  return out as unknown as PartDecodeDraft;
}

function createPartRuleRuntime(
  rule: PartDecodeSpec,
  sharedTables?: Record<string, DecodeTable>
): PartRuleRuntime {
  const setAssignments = compileAssignments(
    Object.entries(rule.set ?? {}).map(([key, value], index) => [key, value, index] as const)
  );
  return Object.freeze({
    program: rule.tokenDecoder ? createDecodeProgramRuntime(rule.tokenDecoder, sharedTables) : undefined,
    setAssignments,
    setProjectionAssignments: new Map()
  });
}

function hasTopLevelAlternation(pattern: string): boolean {
  let depth = 0;
  let inClass = false;
  for (let index = 1; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "[") {
      inClass = true;
      continue;
    }
    if (char === "]") {
      inClass = false;
      continue;
    }
    if (inClass) {
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === "|" && depth === 0) {
      return true;
    }
  }
  return false;
}

function literalRegexPrefix(pattern: string): string | undefined {
  if (!pattern.startsWith("^") || hasTopLevelAlternation(pattern)) {
    return undefined;
  }
  const prefix: string[] = [];
  for (let index = 1; index < pattern.length; index += 1) {
    const char = pattern[index] as string;
    if (char === "\\") {
      break;
    }
    if (char === "?" || char === "*" || char === "{") {
      prefix.pop();
      break;
    }
    if (char === "+") {
      break;
    }
    if (".$()[]|".includes(char)) {
      break;
    }
    prefix.push(char);
  }
  return prefix.length > 0 ? prefix.join("") : undefined;
}

function dispatchPrefixesForRule(
  rule: PartDecodeSpec,
  normalizeInput: (input: string) => string
): readonly string[] {
  const rawPrefix = rule.match.kind === "prefix" ? rule.match.value : literalRegexPrefix(rule.match.value);
  if (!rawPrefix) {
    return Object.freeze([]);
  }
  const normalized = normalizeInput(rawPrefix);
  return Object.freeze(/^[0-9A-Z:-]+$/i.test(normalized) ? [normalized.toUpperCase()] : []);
}

export function compilePartDecodeSpecs(
  rules: PartDecodeSpec[],
  sharedTables?: Record<string, DecodeTable>
): PartNumberDecoder[] {
  const profileTables = normalizeOptionalDecodeTables(sharedTables);
  return rules.map((rule) => {
    const id = rule.id;
    const priority = rule.priority;
    const ruleRuntime = createPartRuleRuntime(rule, sharedTables);
    const normalizeInput = compileNormalizer(rule.normalize);
    const matchPrefix = rule.match.kind === "prefix" ? rule.match.value : undefined;
    const matchPattern = rule.match.kind === "regex" ? new RegExp(rule.match.value, rule.match.flags) : undefined;
    const matchesNormalized = (normalized: string): boolean => {
      if (matchPrefix !== undefined) {
        return normalized.startsWith(matchPrefix);
      }
      const pattern = matchPattern as RegExp;
      pattern.lastIndex = 0;
      return pattern.test(normalized);
    };
    const match = (partNumber: string): PartNumberMatch | null => {
      const normalized = normalizeInput(partNumber);
      if (!matchesNormalized(normalized)) {
        return null;
      }
      return Object.freeze({ decoderId: id, input: partNumber, normalized });
    };
    const matchedPartNumber = (matched: PartNumberMatch): string => {
      if (matched.decoderId !== id) {
        throw new TypeError(`Part-number match for ${matched.decoderId} cannot be decoded by ${id}`);
      }
      return matched.normalized;
    };
    const decoder = {
      id,
      priority,
      profileTables,
      dispatchPrefixes: dispatchPrefixesForRule(rule, normalizeInput),
      match,
      decode: (matched: PartNumberMatch): PartDecodeDraft =>
        decodePartBySpec(rule, matchedPartNumber(matched), undefined, sharedTables, undefined, ruleRuntime),
      project: (matched: PartNumberMatch, targets: readonly string[]): PartDecodeDraft =>
        decodePartBySpec(rule, matchedPartNumber(matched), undefined, sharedTables, targets, ruleRuntime)
    } satisfies PartNumberDecoder;
    return Object.freeze(decoder);
  });
}
