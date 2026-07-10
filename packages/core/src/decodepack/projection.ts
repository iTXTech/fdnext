import type { DecodeExpr, DecodeProgram, DecodeStep } from "./types";

export type DecodeAssignEntry = readonly [key: string, value: DecodeExpr, index: number];

export interface DecodeProjectionPlan {
  activeSteps: ReadonlySet<number>;
  lastStep: number;
  assignEntries: DecodeAssignEntry[];
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

function expressionVariables(expr: DecodeExpr, variables = new Set<string>()): Set<string> {
  if (isVarExpr(expr)) {
    variables.add(expr.$var);
    return variables;
  }
  if (isPathExpr(expr)) {
    const path = Array.isArray(expr.$path) ? expr.$path[0] : expr.$path.split(".")[0];
    if (path) {
      variables.add(path);
    }
    return variables;
  }
  if (isTplExpr(expr)) {
    for (const match of expr.$tpl.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g)) {
      const variable = match[1]?.split(".")[0];
      if (variable) {
        variables.add(variable);
      }
    }
    return variables;
  }
  if (Array.isArray(expr)) {
    for (const item of expr) {
      expressionVariables(item, variables);
    }
    return variables;
  }
  if (expr && typeof expr === "object") {
    for (const value of Object.values(expr)) {
      expressionVariables(value as DecodeExpr, variables);
    }
  }
  return variables;
}

function templateVariables(template: string): string[] {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g)]
    .map((match) => match[1]?.split(".")[0])
    .filter((value): value is string => Boolean(value));
}

function decodeStepAccess(step: DecodeStep): { reads: string[]; writes: string[] } {
  switch (step.op) {
    case "take":
      return { reads: ["rest"], writes: ["rest", step.to] };
    case "takeRegex":
      return {
        reads: ["rest"],
        writes: ["rest", ...(step.to ? [step.to] : []), ...Object.keys(step.groups ?? {})]
      };
    case "stripIfPrefix":
      return {
        reads: ["rest", ...(step.if ? [step.if] : [])],
        writes: ["rest", ...(step.to ? [step.to] : [])]
      };
    case "markLookupPartNumber":
      return { reads: ["partNumber", "rest"], writes: [step.to] };
    case "tpl":
      return { reads: templateVariables(step.template), writes: [step.to] };
    case "fallback":
      return { reads: [step.primary, step.secondary], writes: [step.to] };
    case "mul":
      return { reads: [step.a, step.b], writes: [step.to] };
    case "dieDensity":
      return { reads: [step.density, step.dieCount], writes: [step.to] };
    case "set":
      return { reads: [...expressionVariables(step.value)], writes: [step.to] };
    case "merge":
      return { reads: [step.into, step.from], writes: [step.into] };
    case "omit":
      return {
        reads: [step.from, ...(step.to && step.to !== step.from ? [step.to] : [])],
        writes: [step.to ?? step.from]
      };
    case "notEmpty":
      return { reads: [step.from], writes: [step.to] };
    case "mergeIf":
      return { reads: [step.into, step.from, step.if], writes: [step.into] };
    case "takeLongest":
      return {
        reads: ["rest", ...(step.scope ? [step.scope] : []), ...(step.keyTo ? [step.keyTo] : [])],
        writes: ["rest", step.to, ...(step.keyTo ? [step.keyTo] : [])]
      };
    case "map":
      return {
        reads: [step.from, ...(step.keyTo ? [step.keyTo] : [])],
        writes: [step.to, ...(step.keyTo ? [step.keyTo] : [])]
      };
  }
}

export function orderedAssignEntries(assign: Record<string, DecodeExpr>): DecodeAssignEntry[] {
  const entries = Object.entries(assign).map(([key, value], index) => [key, value, index] as const);
  return [
    ...entries.filter(([key]) => key !== "fields"),
    ...entries.filter(([key]) => key === "fields")
  ];
}

export function projectedAssignEntries(assign: Record<string, DecodeExpr>, targets: readonly string[]): DecodeAssignEntry[] {
  const entries = orderedAssignEntries(assign);
  const selected = new Set<number>();
  for (const target of new Set(targets.filter(Boolean))) {
    const exact = entries.filter(([key]) => key === target);
    const descendants = entries.filter(([key]) => key.startsWith(`${target}.`));
    if (exact.length > 0) {
      [...exact, ...descendants].forEach(([, , index]) => selected.add(index));
      continue;
    }
    const ancestors = entries
      .filter(([key]) => target.startsWith(`${key}.`))
      .sort(([a], [b]) => b.length - a.length);
    const closest = ancestors[0];
    if (closest) {
      selected.add(closest[2]);
    }
    descendants.forEach(([, , index]) => selected.add(index));
  }
  return entries.filter(([, , index]) => selected.has(index));
}

export function projectionPlan(decoder: DecodeProgram, targets: readonly string[]): DecodeProjectionPlan {
  const assignEntries = projectedAssignEntries(decoder.assign, targets);
  const required = new Set<string>();
  for (const [, value] of assignEntries) {
    expressionVariables(value, required);
  }

  const activeSteps = new Set<number>();
  for (let index = decoder.steps.length - 1; index >= 0; index -= 1) {
    const step = decoder.steps[index];
    if (!step) {
      continue;
    }
    const access = decodeStepAccess(step);
    if (!access.writes.some((variable) => required.has(variable))) {
      continue;
    }
    activeSteps.add(index);
    for (const variable of access.writes) {
      required.delete(variable);
    }
    for (const variable of access.reads) {
      required.add(variable);
    }
  }

  return {
    activeSteps,
    lastStep: activeSteps.size > 0 ? Math.max(...activeSteps) : -1,
    assignEntries
  };
}

export function projectionPlanKey(targets: readonly string[]): string {
  return [...new Set(targets.filter(Boolean))].sort().join("\u0000");
}
