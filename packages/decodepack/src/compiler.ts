import { fdnextFieldRegistry } from "@itxtech/fdnext-core";
import type { IdentifierDecodeDraft, IdentifierDecoder, PartDecodeDraft, PartNumberDecoder } from "@itxtech/fdnext-core";
import type {
  CompileDecodePackResult,
  DecodeExpr,
  DecodeJson,
  DecodePack,
  DecodePackCheckFinding,
  DecodePackCheckResult,
  DecodePackTraceStep,
  DecodeProgram,
  IdentifierDecodeExplainBitfield,
  IdentifierDecodeExplainResult,
  IdentifierDecodeSpec,
  NormalizeStep,
  PartDecodeExplainResult,
  PartDecodeSpec
} from "./types";

function normalize(input: string, steps: NormalizeStep[] = []): string {
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

function evaluateExpr(expr: DecodeExpr, context: Record<string, unknown>): unknown {
  if (isVarExpr(expr)) {
    return context[expr.$var];
  }
  if (isTplExpr(expr)) {
    return expr.$tpl.replaceAll(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => String(context[key] ?? ""));
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
  return { matched: false, rest: value };
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

function runTokenDecoder(partNumber: string, decoder: DecodeProgram, trace?: DecodePackTraceStep[]): PartDecodeDraft {
  const context: Record<string, unknown> = {
    partNumber,
    rest: partNumber
  };

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
      const match = new RegExp(step.pattern).exec(rest);
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

    if (step.op === "tpl") {
      const rest = String(context.rest ?? "");
      const value = step.template.replaceAll(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => String(context[key] ?? ""));
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
        Object.assign(into as Record<string, unknown>, from as Record<string, unknown>);
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
        Object.assign(into as Record<string, unknown>, from as Record<string, unknown>);
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
      const table = decoder.tables?.[step.table] ?? {};
      const result = step.scope
        ? matchScopedFromStart(rest, table, context[step.scope], step.scopeSeparator)
        : matchFromStart(rest, table);
      if (result.matched) {
        context[step.to] = result.value;
        context.rest = result.rest;
      } else {
        context[step.to] = step.default;
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
    const table = decoder.tables?.[step.table] ?? {};
    const source = String(context[step.from] ?? "");
    if (Object.hasOwn(table, source)) {
      context[step.to] = table[source];
    } else {
      context[step.to] = step.default;
    }
    traceStep(trace, {
      op: step.op,
      path,
      matched: Object.hasOwn(table, source),
      table: step.table,
      key: source,
      target: step.to,
      value: context[step.to],
      restBefore: rest,
      restAfter: String(context.rest ?? "")
    });
  }

  const out: Record<string, unknown> = {};
  const assignEntries = Object.entries(decoder.assign);
  const orderedAssignEntries = [
    ...assignEntries.filter(([key]) => key !== "fields"),
    ...assignEntries.filter(([key]) => key === "fields")
  ];
  for (const [index, [key, value]] of orderedAssignEntries.entries()) {
    const evaluated = evaluateExpr(value, context);
    assignPath(out, key, evaluated);
    traceStep(trace, {
      op: "assign",
      path: `assign[${index}]`,
      target: key,
      value: evaluated
    });
  }

  pruneInternalCodeFields(out);
  return out as unknown as PartDecodeDraft;
}

function checkMatch(normalized: string, match: { kind: "prefix"; value: string } | { kind: "regex"; value: string; flags?: string }): boolean {
  if (match.kind === "prefix") {
    return normalized.startsWith(match.value);
  }
  return new RegExp(match.value, match.flags).test(normalized);
}

function decodePartBySpec(rule: PartDecodeSpec, normalized: string, trace?: DecodePackTraceStep[]): PartDecodeDraft {
  if (rule.tokenDecoder) {
    return runTokenDecoder(normalized, rule.tokenDecoder, trace);
  }
  const context = { partNumber: normalized, rest: normalized };
  const out: Record<string, unknown> = {};
  for (const [index, [key, value]] of Object.entries(rule.set ?? {}).entries()) {
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

function compilePartDecodeSpecs(rules: PartDecodeSpec[]): PartNumberDecoder[] {
  return rules.map((rule) => {
    const check = (partNumber: string): boolean => {
      const normalized = normalize(partNumber, rule.normalize);
      return checkMatch(normalized, rule.match);
    };

    const decode = (partNumber: string): PartDecodeDraft | null => {
      const normalized = normalize(partNumber, rule.normalize);
      if (!check(normalized)) {
        return null;
      }
      return decodePartBySpec(rule, normalized);
    };

    return {
      id: rule.id,
      priority: rule.priority,
      check,
      decode
    } satisfies PartNumberDecoder;
  });
}

function byteAt(id: string, offset: number): number {
  const idx = (offset - 1) * 2;
  return Number.parseInt(id.slice(idx, idx + 2), 16);
}

function byteHexAt(id: string, offset: number): string {
  const byte = byteAt(id, offset);
  return Number.isFinite(byte) ? byte.toString(16).toUpperCase().padStart(2, "0") : "";
}

function identifierRuleMatchesWhen(id: string, when: Record<string, string | string[]> | undefined): boolean {
  if (!when) {
    return true;
  }
  for (const [offsetKey, expected] of Object.entries(when)) {
    const actual = byteHexAt(id, Number(offsetKey));
    const values = (Array.isArray(expected) ? expected : [expected]).map((value) => value.toUpperCase().padStart(2, "0"));
    if (!values.includes(actual)) {
      return false;
    }
  }
  return true;
}

function canonicalIdentifierField(name: string): { key: string; scale?: number } {
  const raw = name.startsWith("field:") ? name.slice(6) : name;
  switch (raw) {
    case "page_size":
      return { key: "page_size", scale: 1024 };
    case "block_size":
      return { key: "block_size", scale: 1024 };
    default:
      return { key: raw };
  }
}

function decodeIdentifierByDefinition(
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
      const entries = Array.isArray(ruleSet) ? ruleSet : [ruleSet];
      for (const rule of entries) {
        if (!identifierRuleMatchesWhen(id, rule.when)) {
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
        fields[field.key] = value;
        bitfields?.push({
          offset: Number(offsetKey),
          byte,
          field: name,
          outputKey: field.key,
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

function compileIdentifierDecodeSpecs(rules: IdentifierDecodeSpec[]): IdentifierDecoder[] {
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
      check,
      decode
    } satisfies IdentifierDecoder;
  });
}

export function compileDecodePack(pack: DecodePack): CompileDecodePackResult {
  return {
    partDecoders: compilePartDecodeSpecs(pack.partSpecs),
    identifierDecoders: compileIdentifierDecodeSpecs(pack.identifierSpecs)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function addFinding(
  findings: DecodePackCheckFinding[],
  severity: DecodePackCheckFinding["severity"],
  code: string,
  path: string,
  message: string,
  specId?: string
): void {
  findings.push({ severity, code, path, message, ...(specId ? { specId } : {}) });
}

function checkFieldKeys(value: unknown, path: string, specId: string, findings: DecodePackCheckFinding[]): void {
  if (!isRecord(value)) {
    return;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith("$")) {
      continue;
    }
    if (isInternalCodeFieldKey(key)) {
      addFinding(findings, "error", "internal_field", `${path}.${key}`, `Internal code field "${key}" must not be assigned as a public field.`, specId);
    }
    if (!Object.hasOwn(fdnextFieldRegistry, key)) {
      addFinding(findings, "error", "unknown_field", `${path}.${key}`, `Unknown canonical field key "${key}".`, specId);
    }
  }
}

function walkPolicy(value: unknown, path: string, specId: string, findings: DecodePackCheckFinding[], inFields = false): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPolicy(item, `${path}[${index}]`, specId, findings, inFields));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key === "ext" || key.startsWith("ext:")) {
      addFinding(findings, "error", "legacy_identifier_ext", `${path}.${key}`, "Identifier output must use canonical fields instead of ext.", specId);
    }
    const nextInFields = inFields || key === "fields";
    if (nextInFields && !key.startsWith("$") && key !== "fields" && isInternalCodeFieldKey(key)) {
      addFinding(findings, "error", "internal_field", `${path}.${key}`, `Internal code field "${key}" must not be assigned as a public field.`, specId);
    }
    if (nextInFields && !key.startsWith("$") && key !== "fields" && !Object.hasOwn(fdnextFieldRegistry, key)) {
      addFinding(findings, "error", "unknown_field", `${path}.${key}`, `Unknown canonical field key "${key}".`, specId);
    }
    walkPolicy(item, `${path}.${key}`, specId, findings, nextInFields);
  }
}

function checkComponentRoles(value: unknown, path: string, specId: string, findings: DecodePackCheckFinding[]): void {
  if (!Array.isArray(value)) {
    return;
  }
  value.forEach((component, index) => {
    if (!isRecord(component) || typeof component.role !== "string" || component.role.length === 0) {
      addFinding(findings, "error", "component_role", `${path}[${index}]`, "Component drafts must include a non-empty role.", specId);
    }
  });
}

function templateVariableNames(template: string): string[] {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]).filter((name): name is string => Boolean(name));
}

function addUndefinedVariableFinding(
  findings: DecodePackCheckFinding[],
  specId: string,
  path: string,
  name: string,
  defined: Set<string>
): void {
  const root = name.split(".")[0] ?? name;
  if (!defined.has(root)) {
    addFinding(findings, "error", "undefined_variable", path, `DecodePack expression reads undefined token variable "${name}".`, specId);
  }
}

function checkExprVariables(
  expr: unknown,
  path: string,
  specId: string,
  defined: Set<string>,
  findings: DecodePackCheckFinding[]
): void {
  if (Array.isArray(expr)) {
    expr.forEach((item, index) => checkExprVariables(item, `${path}[${index}]`, specId, defined, findings));
    return;
  }
  if (!isRecord(expr)) {
    return;
  }

  if (typeof expr.$var === "string") {
    addUndefinedVariableFinding(findings, specId, `${path}.$var`, expr.$var, defined);
  }
  if (typeof expr.$path === "string") {
    addUndefinedVariableFinding(findings, specId, `${path}.$path`, expr.$path, defined);
  } else if (Array.isArray(expr.$path) && typeof expr.$path[0] === "string") {
    addUndefinedVariableFinding(findings, specId, `${path}.$path`, expr.$path[0], defined);
  }
  if (typeof expr.$tpl === "string") {
    for (const name of templateVariableNames(expr.$tpl)) {
      addUndefinedVariableFinding(findings, specId, `${path}.$tpl`, name, defined);
    }
  }

  for (const [key, value] of Object.entries(expr)) {
    if (key === "$var" || key === "$path" || key === "$tpl") {
      continue;
    }
    checkExprVariables(value, `${path}.${key}`, specId, defined, findings);
  }
}

function checkTokenVariable(
  name: string | undefined,
  path: string,
  specId: string,
  defined: Set<string>,
  findings: DecodePackCheckFinding[]
): void {
  if (!name) {
    return;
  }
  addUndefinedVariableFinding(findings, specId, path, name, defined);
}

function defineTokenVariable(defined: Set<string>, name: string | undefined): void {
  if (name) {
    defined.add(name);
  }
}

function checkTokenDecoderProgram(spec: PartDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  const decoder = spec.tokenDecoder;
  if (!decoder) {
    return;
  }

  const defined = new Set(["partNumber", "rest"]);
  const tables = decoder.tables ?? {};

  decoder.steps.forEach((step, index) => {
    const stepPath = `${path}.tokenDecoder.steps[${index}]`;
    if ((step.op === "map" || step.op === "takeLongest") && !Object.hasOwn(tables, step.table)) {
      addFinding(findings, "error", "missing_table", `${stepPath}.table`, `DecodePack step references missing table "${step.table}".`, spec.id);
    }

    switch (step.op) {
      case "take":
        break;
      case "takeRegex":
        break;
      case "stripIfPrefix":
        checkTokenVariable(step.if, `${stepPath}.if`, spec.id, defined, findings);
        break;
      case "tpl":
        for (const name of templateVariableNames(step.template)) {
          addUndefinedVariableFinding(findings, spec.id, `${stepPath}.template`, name, defined);
        }
        break;
      case "fallback":
        checkTokenVariable(step.primary, `${stepPath}.primary`, spec.id, defined, findings);
        checkTokenVariable(step.secondary, `${stepPath}.secondary`, spec.id, defined, findings);
        break;
      case "mul":
        checkTokenVariable(step.a, `${stepPath}.a`, spec.id, defined, findings);
        checkTokenVariable(step.b, `${stepPath}.b`, spec.id, defined, findings);
        break;
      case "set":
        checkExprVariables(step.value, `${stepPath}.value`, spec.id, defined, findings);
        break;
      case "merge":
        checkTokenVariable(step.into, `${stepPath}.into`, spec.id, defined, findings);
        checkTokenVariable(step.from, `${stepPath}.from`, spec.id, defined, findings);
        break;
      case "omit":
        checkTokenVariable(step.from, `${stepPath}.from`, spec.id, defined, findings);
        break;
      case "notEmpty":
        checkTokenVariable(step.from, `${stepPath}.from`, spec.id, defined, findings);
        break;
      case "mergeIf":
        checkTokenVariable(step.if, `${stepPath}.if`, spec.id, defined, findings);
        checkTokenVariable(step.into, `${stepPath}.into`, spec.id, defined, findings);
        checkTokenVariable(step.from, `${stepPath}.from`, spec.id, defined, findings);
        break;
      case "takeLongest":
        checkTokenVariable(step.scope, `${stepPath}.scope`, spec.id, defined, findings);
        break;
      case "map":
        checkTokenVariable(step.from, `${stepPath}.from`, spec.id, defined, findings);
        break;
    }

    if ("to" in step) {
      defineTokenVariable(defined, step.to);
    }
    if (step.op === "takeRegex") {
      Object.keys(step.groups ?? {}).forEach((target) => defineTokenVariable(defined, target));
    }
  });

  for (const [key, value] of Object.entries(decoder.assign)) {
    checkExprVariables(value, `${path}.tokenDecoder.assign.${key}`, spec.id, defined, findings);
  }
}

function checkPartSetVariables(spec: PartDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  if (!spec.set) {
    return;
  }
  const defined = new Set(["partNumber", "rest"]);
  for (const [key, value] of Object.entries(spec.set)) {
    checkExprVariables(value, `${path}.set.${key}`, spec.id, defined, findings);
  }
}

function checkIdentifierDefinition(spec: IdentifierDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  for (const [offsetKey, fields] of Object.entries(spec.definition)) {
    for (const fieldName of Object.keys(fields)) {
      const fieldKey = fieldName.startsWith("field:") ? fieldName.slice(6) : fieldName;
      if (!Object.hasOwn(fdnextFieldRegistry, fieldKey)) {
        addFinding(findings, "error", "unknown_field", `${path}.${offsetKey}.${fieldName}`, `Unknown canonical identifier field key "${fieldKey}".`, spec.id);
      }
    }
  }
}

function checkOutputSurface(output: unknown, path: string, specId: string, findings: DecodePackCheckFinding[]): void {
  if (!isRecord(output)) {
    return;
  }
  const allowedRoots = new Set(["device", "fields", "identifiers", "controllers", "components", "meta", "warnings"]);
  const forbiddenExact = new Set([
    "type",
    "density",
    "rawDensity",
    "rawVendor",
    "processNode",
    "cellLevel",
    "deviceWidth",
    "classification",
    "flashId",
    "controller",
    "remark",
    "url",
    "urls",
    "__fdnext"
  ]);
  for (const [key, value] of Object.entries(output)) {
    const root = key.split(".")[0] ?? key;
    if (forbiddenExact.has(key) || key.includes("__fdnext") || !allowedRoots.has(root)) {
      addFinding(findings, "error", "legacy_output_root", `${path}.${key}`, `Decoder output key "${key}" is not a native DecodePack draft path.`, specId);
    }
    if (key.startsWith("fields.")) {
      const fieldKey = key.split(".")[1] ?? "";
      if (isInternalCodeFieldKey(fieldKey)) {
        addFinding(findings, "error", "internal_field", `${path}.${key}`, `Internal code field "${fieldKey}" must not be assigned as a public field.`, specId);
      }
      if (!Object.hasOwn(fdnextFieldRegistry, fieldKey)) {
        addFinding(findings, "error", "unknown_field", `${path}.${key}`, `Unknown canonical field key "${fieldKey}".`, specId);
      }
    }
    if (key === "fields") {
      checkFieldKeys(value, `${path}.${key}`, specId, findings);
    }
    if (key === "components") {
      checkComponentRoles(value, `${path}.${key}`, specId, findings);
    }
    walkPolicy(value, `${path}.${key}`, specId, findings);
  }
}

export function checkDecodePack(pack: DecodePack): DecodePackCheckResult {
  const findings: DecodePackCheckFinding[] = [];
  const ids = new Map<string, string>();
  for (const [kind, specs] of [
    ["part", pack.partSpecs],
    ["identifier", pack.identifierSpecs]
  ] as const) {
    specs.forEach((spec, index) => {
      const path = `${kind}Specs[${index}]`;
      const previous = ids.get(spec.id);
      if (previous) {
        addFinding(findings, "error", "duplicate_id", `${path}.id`, `Duplicate spec id "${spec.id}" also appears at ${previous}.`, spec.id);
      } else {
        ids.set(spec.id, `${path}.id`);
      }
      if (kind === "part") {
        const partSpec = spec as PartDecodeSpec;
        checkPartSetVariables(partSpec, path, findings);
        checkTokenDecoderProgram(partSpec, path, findings);
        checkOutputSurface(partSpec.set, `${path}.set`, partSpec.id, findings);
        checkOutputSurface(partSpec.tokenDecoder?.assign, `${path}.tokenDecoder.assign`, partSpec.id, findings);
      } else {
        const identifierSpec = spec as IdentifierDecodeSpec;
        checkIdentifierDefinition(identifierSpec, `${path}.definition`, findings);
        walkPolicy(identifierSpec.definition, `${path}.definition`, spec.id, findings);
      }
    });
  }
  return {
    ok: findings.every((finding) => finding.severity !== "error"),
    findings
  };
}

function sortedPartSpecs(pack: DecodePack): PartDecodeSpec[] {
  return [...pack.partSpecs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function sortedIdentifierSpecs(pack: DecodePack): IdentifierDecodeSpec[] {
  return [...pack.identifierSpecs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function explainPartDecode(
  pack: DecodePack,
  input: string,
  options: { specId?: string } = {}
): PartDecodeExplainResult {
  const candidates = sortedPartSpecs(pack).filter((spec) => !options.specId || spec.id === options.specId);
  for (const spec of candidates) {
    const normalized = normalize(input, spec.normalize);
    if (!checkMatch(normalized, spec.match)) {
      continue;
    }
    const steps: DecodePackTraceStep[] = [];
    return {
      kind: "part",
      input,
      normalized,
      status: "matched",
      specId: spec.id,
      priority: spec.priority,
      steps,
      draft: decodePartBySpec(spec, normalized, steps)
    };
  }
  const normalized = candidates[0] ? normalize(input, candidates[0].normalize) : input;
  return {
    kind: "part",
    input,
    normalized,
    status: "not_matched",
    steps: [],
    draft: null
  };
}

export function explainIdentifierDecode(
  pack: DecodePack,
  input: string,
  options: { idScheme?: "nand.flash_id"; specId?: string } = {}
): IdentifierDecodeExplainResult {
  const idScheme = options.idScheme ?? "nand.flash_id";
  const normalized = input.toUpperCase();
  const candidates = sortedIdentifierSpecs(pack).filter((spec) => spec.idScheme === idScheme && (!options.specId || spec.id === options.specId));
  for (const spec of candidates) {
    if (!checkMatch(normalized, spec.match)) {
      continue;
    }
    const bitfields: IdentifierDecodeExplainBitfield[] = [];
    return {
      kind: "identifier",
      input,
      normalized,
      idScheme,
      status: "matched",
      specId: spec.id,
      priority: spec.priority,
      bitfields,
      draft: decodeIdentifierByDefinition(normalized, spec, bitfields)
    };
  }
  return {
    kind: "identifier",
    input,
    normalized,
    idScheme,
    status: "not_matched",
    bitfields: [],
    draft: null
  };
}
