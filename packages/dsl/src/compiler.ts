import type { InternalIdentifierInfo, InternalPartInfo, IdentifierDecoder, PartNumberDecoder } from "@itxtech/fdnext-core";
import type { DslEmit, DslEmitComponent, DslEmitField, DslExpr, DslJson, DslRule, IdentifierDslRule, NormalizeStep, DslTokenDecoder } from "./types";

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

function evaluateExpr(expr: DslExpr, context: Record<string, unknown>): unknown {
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
      out[key] = evaluateExpr(value as DslExpr, context);
    }
    return out;
  }
  return expr;
}

function evaluateEmitField(field: DslEmitField, context: Record<string, unknown>): Record<string, unknown> {
  return {
    key: field.key,
    value: evaluateExpr(cloneJson(field.value), context),
    ...(field.unit ? { unit: field.unit } : {}),
    ...(field.display !== undefined ? { display: evaluateExpr(cloneJson(field.display), context) } : {}),
    ...(field.importance ? { importance: field.importance } : {}),
    ...(field.block ? { block: field.block } : {})
  };
}

function evaluateEmitComponent(component: DslEmitComponent, context: Record<string, unknown>): Record<string, unknown> {
  return {
    role: component.role,
    ...(component.domain ? { domain: component.domain } : {}),
    ...(component.chipKind ? { chipKind: component.chipKind } : {}),
    ...(component.productType ? { productType: component.productType } : {}),
    ...(component.fields ? { fields: component.fields.map((field) => evaluateEmitField(field, context)) } : {})
  };
}

function evaluateEmit(emit: DslEmit | undefined, context: Record<string, unknown>): Record<string, unknown> {
  if (!emit) {
    return {};
  }
  return {
    ...(emit.fields ? { fields: emit.fields.map((field) => evaluateEmitField(field, context)) } : {}),
    ...(emit.components ? { components: emit.components.map((component) => evaluateEmitComponent(component, context)) } : {})
  };
}

function mergeEvaluatedEmit(...emits: Record<string, unknown>[]): Record<string, unknown> {
  const fields = emits.flatMap((emit) => Array.isArray(emit.fields) ? emit.fields : []);
  const components = emits.flatMap((emit) => Array.isArray(emit.components) ? emit.components : []);
  return {
    ...(fields.length > 0 ? { fields } : {}),
    ...(components.length > 0 ? { components } : {})
  };
}

function applyRuleMetadata(out: Record<string, unknown>, rule: DslRule, context: Record<string, unknown>): void {
  const emit = mergeEvaluatedEmit(evaluateEmit(rule.emit, context), evaluateEmit(rule.tokenDecoder?.emit, context));
  const metadata = {
    ...(rule.domain ? { domain: rule.domain } : {}),
    ...(rule.chipKind ? { chipKind: rule.chipKind } : {}),
    ...(rule.productType ? { productType: rule.productType } : {}),
    ...(rule.fieldProfile ? { fieldProfile: rule.fieldProfile } : {}),
    ...(rule.capabilities ? { capabilities: rule.capabilities } : {}),
    ...emit
  };
  if (Object.keys(metadata).length > 0) {
    out.__fdnext = metadata;
  }
}

function matchFromStart(
  value: string,
  table: Record<string, DslJson>
): { matched: boolean; rest: string; value?: DslJson } {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (value.startsWith(key)) {
      return { matched: true, rest: value.slice(key.length), value: table[key] };
    }
  }
  return { matched: false, rest: value };
}

function runTokenDecoder(partNumber: string, rule: DslRule, decoder: DslTokenDecoder): Partial<InternalPartInfo> {
  const context: Record<string, unknown> = {
    partNumber,
    rest: partNumber
  };

  for (const prefix of decoder.stripPrefixes ?? []) {
    const rest = String(context.rest ?? "");
    if (rest.startsWith(prefix)) {
      context.rest = rest.slice(prefix.length);
    }
  }

  for (const step of decoder.steps) {
    if (step.op === "take") {
      const rest = String(context.rest ?? "");
      if (step.len > rest.length) {
        context[step.to] = "";
      } else {
        context[step.to] = rest.slice(0, step.len);
        context.rest = rest.slice(step.len);
      }
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
      continue;
    }

    if (step.op === "stripIfPrefix") {
      if (step.if && !context[step.if]) {
        if (step.to) {
          context[step.to] = false;
        }
        continue;
      }
      const rest = String(context.rest ?? "");
      const matched = rest.startsWith(step.prefix);
      if (matched) {
        context.rest = rest.slice(step.prefix.length);
      }
      if (step.to) {
        context[step.to] = matched;
      }
      continue;
    }

    if (step.op === "tpl") {
      const value = step.template.replaceAll(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => String(context[key] ?? ""));
      context[step.to] = value;
      continue;
    }

    if (step.op === "fallback") {
      const primary = context[step.primary];
      const secondary = context[step.secondary];
      if (primary === undefined || primary === null) {
        context[step.to] = secondary;
        continue;
      }
      if (typeof primary === "string") {
        context[step.to] = primary.length > 0 ? primary : secondary;
        continue;
      }
      context[step.to] = primary;
      continue;
    }

    if (step.op === "set") {
      context[step.to] = evaluateExpr(cloneJson(step.value), context);
      continue;
    }

    if (step.op === "mul") {
      const a = Number(context[step.a]);
      const b = Number(context[step.b]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        context[step.to] = a * b;
      } else {
        context[step.to] = step.default ?? 0;
      }
      continue;
    }

    if (step.op === "merge") {
      const into = context[step.into];
      const from = context[step.from];
      if (into && typeof into === "object" && !Array.isArray(into) && from && typeof from === "object" && !Array.isArray(from)) {
        Object.assign(into as Record<string, unknown>, from as Record<string, unknown>);
      }
      continue;
    }

    if (step.op === "notEmpty") {
      const value = String(context[step.from] ?? "");
      context[step.to] = value.length > 0;
      continue;
    }

    if (step.op === "mergeIf") {
      if (!context[step.if]) {
        continue;
      }
      const into = context[step.into];
      const from = context[step.from];
      if (into && typeof into === "object" && !Array.isArray(into) && from && typeof from === "object" && !Array.isArray(from)) {
        Object.assign(into as Record<string, unknown>, from as Record<string, unknown>);
      }
      continue;
    }

    if (step.op === "takeLongest") {
      const rest = String(context.rest ?? "");
      const table = decoder.tables?.[step.table] ?? {};
      const result = matchFromStart(rest, table);
      if (result.matched) {
        context[step.to] = result.value;
        context.rest = result.rest;
      } else {
        context[step.to] = step.default;
      }
      continue;
    }

    const table = decoder.tables?.[step.table] ?? {};
    const source = String(context[step.from] ?? "");
    if (Object.hasOwn(table, source)) {
      context[step.to] = table[source];
    } else {
      context[step.to] = step.default;
    }
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(decoder.assign)) {
    out[key] = evaluateExpr(value, context);
  }
  applyRuleMetadata(out, rule, context);

  return out as Partial<InternalPartInfo>;
}

function checkMatch(normalized: string, match: { kind: "prefix"; value: string } | { kind: "regex"; value: string; flags?: string }): boolean {
  if (match.kind === "prefix") {
    return normalized.startsWith(match.value);
  }
  return new RegExp(match.value, match.flags).test(normalized);
}

export function compileRulesToDecoders(rules: DslRule[]): PartNumberDecoder[] {
  return rules.map((rule) => {
    const check = (partNumber: string): boolean => {
      const normalized = normalize(partNumber, rule.normalize);
      return checkMatch(normalized, rule.match);
    };

    const decode = (partNumber: string): Partial<InternalPartInfo> | null => {
      const normalized = normalize(partNumber, rule.normalize);
      if (!check(normalized)) {
        return null;
      }
      if (rule.tokenDecoder) {
        return runTokenDecoder(normalized, rule, rule.tokenDecoder);
      }
      const out: Record<string, unknown> = {
        partNumber: normalized,
        ...(rule.set ?? {})
      };
      applyRuleMetadata(out, rule, { partNumber: normalized, rest: normalized });
      return out as Partial<InternalPartInfo>;
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

function decodeIdentifierByDefinition(id: string, definition: Record<string, Record<string, { dq: number[]; def: Record<string, DslJson> }>>): Partial<InternalIdentifierInfo> {
  const out: Partial<InternalIdentifierInfo> = {};
  const ext: Record<string, unknown> = {};

  for (const [offsetKey, rules] of Object.entries(definition)) {
    const byte = byteAt(id, Number(offsetKey));
    for (const [name, rule] of Object.entries(rules)) {
      let data = 0;
      for (const bit of rule.dq) {
        data = (data << 1) + ((byte >> bit) & 0b1);
      }
      const resolved = rule.def[String(data)];
      if (resolved === undefined) {
        continue;
      }
      if (name.startsWith("ext:")) {
        ext[name.slice(4)] = resolved;
      } else {
        (out as Record<string, unknown>)[name] = resolved;
      }
    }
  }

  out.ext = ext;
  return out;
}

export function compileIdentifierRulesToDecoders(rules: IdentifierDslRule[]): IdentifierDecoder[] {
  return rules.map((rule) => {
    const check = (id: string): boolean => checkMatch(id.toUpperCase(), rule.match);
    const decode = (id: string): Partial<InternalIdentifierInfo> | null => {
      const normalized = id.toUpperCase();
      if (!check(normalized)) {
        return null;
      }
      return {
        vendor: rule.vendor,
        ...decodeIdentifierByDefinition(normalized, rule.definition)
      };
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
