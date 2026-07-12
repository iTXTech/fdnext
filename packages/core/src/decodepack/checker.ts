import { fdnextFieldRegistry } from "../field-registry";
import type {
  DecodeExpr,
  DecodeJson,
  DecodePack,
  ValidatedDecodePack,
  DecodePackCheckFinding,
  DecodePackCheckResult,
  DecodeProgram,
  DecodeTable,
  IdentifierDecodeSpec,
  PartDecodeSpec
} from "./types";
import { normalizeDecodeTables } from "./table";

const validatedDecodePacks = new WeakSet<DecodePack>();

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => deepFreeze(item, seen));
  } else {
    Object.values(value).forEach((item) => deepFreeze(item, seen));
  }
  return Object.freeze(value);
}

export class DecodePackValidationError extends Error {
  readonly result: DecodePackCheckResult;

  constructor(result: DecodePackCheckResult) {
    const errors = result.findings
      .filter((finding) => finding.severity === "error")
      .map((finding) => `${finding.path}: ${finding.message}`);
    super(`Invalid DecodePack:\n${errors.join("\n")}`);
    this.name = "DecodePackValidationError";
    this.result = result;
  }
}

export function isValidatedDecodePack(pack: DecodePack): pack is ValidatedDecodePack {
  return validatedDecodePacks.has(pack);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function checkDecodeTable(
  table: DecodeTable,
  path: string,
  specId: string | undefined,
  findings: DecodePackCheckFinding[]
): void {
  if (!Array.isArray(table)) {
    return;
  }
  const seen = new Map<string, string>();
  table.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    const keys = typeof entry === "string"
      ? [entry]
      : isRecord(entry) && Array.isArray(entry.keys)
        ? entry.keys
        : undefined;
    if (!keys) {
      addFinding(
        findings,
        "error",
        "invalid_table_entry",
        entryPath,
        "Array DecodePack table entries must be strings or objects with a string keys array.",
        specId
      );
      return;
    }
    keys.forEach((key, keyIndex) => {
      const keyPath = typeof entry === "string" ? entryPath : `${entryPath}.keys[${keyIndex}]`;
      if (typeof key !== "string" || key.length === 0) {
        addFinding(
          findings,
          "error",
          "invalid_table_key",
          keyPath,
          "DecodePack table alias keys must be non-empty strings.",
          specId
        );
        return;
      }
      const previous = seen.get(key);
      if (previous) {
        addFinding(
          findings,
          "error",
          "duplicate_table_key",
          keyPath,
          `DecodePack table key "${key}" also appears at ${previous}.`,
          specId
        );
        return;
      }
      seen.set(key, typeof entry === "string" ? entryPath : `${entryPath}.keys[${keyIndex}]`);
    });
  });
}

function isInternalCodeFieldKey(key: string): boolean {
  return key.endsWith("_code");
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

const maintenanceDataKeys = new Set([
  "reference",
  "references",
  "source",
  "sources",
  "citation",
  "citations",
  "url",
  "urls",
  "notes",
  "status",
  "confidence",
  "collected_at",
  "retrieved_at",
  "inference_source",
  "external_confirmed",
  "external_table_confirmed",
  "local_pending_external_reference"
]);

const maintenanceDataValues = new Set([
  "external_confirmed",
  "external_table_confirmed",
  "local_pending_external_reference"
]);

function checkMaintenanceData(
  value: unknown,
  path: string,
  findings: DecodePackCheckFinding[]
): void {
  if (typeof value === "string") {
    if (maintenanceDataValues.has(value)) {
      addFinding(
        findings,
        "error",
        "maintenance_data",
        path,
        `DecodePack must not contain external evidence status "${value}"; keep it in the evidence manifest.`
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkMaintenanceData(item, `${path}[${index}]`, findings));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    const itemPath = path ? `${path}.${key}` : key;
    if (maintenanceDataKeys.has(key)) {
      addFinding(
        findings,
        "error",
        "maintenance_data",
        itemPath,
        `DecodePack key "${key}" is maintenance-only; keep external evidence and confidence outside runtime rules.`
      );
    }
    checkMaintenanceData(item, itemPath, findings);
  }
}

const packageDimensionPattern = /^\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)+(?:\/\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)*)?$/;
const packageTypePattern = /^[A-Za-z0-9][A-Za-z0-9+./ -]*(?:-\d[A-Za-z0-9./-]*)?(?: \/ [A-Za-z0-9][A-Za-z0-9+./ -]*(?:-\d[A-Za-z0-9./-]*)?)*$/;

function isPublicPackageValuePath(path: string[]): boolean {
  if (
    path.some((part) =>
      /package_code|packageCode|package_configuration|packageConfiguration|packageEnv|reference|source|notes|special_option/i.test(part)
    )
  ) {
    return false;
  }

  const leaf = path[path.length - 1] ?? "";
  if (leaf === "packing_type") {
    return false;
  }
  if (leaf === "package" || leaf === "fields.package") {
    return true;
  }

  const tableIndex = path.findIndex((part) => part === "tables" || part === "sharedTables");
  if (tableIndex < 0) {
    return false;
  }
  const tableName = path[tableIndex + 1] ?? "";
  if (/^(?:basePackage|packageToken)$/i.test(tableName)) {
    return false;
  }
  return /package/i.test(tableName);
}

function checkPublicPackageValue(
  value: string,
  path: string,
  specId: string | undefined,
  findings: DecodePackCheckFinding[]
): void {
  const reasons: string[] = [];
  if (!value || value === "Unknown") {
    reasons.push("unknown-or-empty");
  } else {
    if (/\b(?:mm|ball|pin|pad)\b/i.test(value)) {
      reasons.push("unit-word");
    }
    if (/[()]/.test(value)) {
      reasons.push("parenthesized-detail");
    }
    const parts = value.split(",").map((part) => part.trim());
    if (parts.some((part) => part.length === 0)) {
      reasons.push("empty-segment");
    } else {
      const [head, ...tail] = parts;
      if (head && (/\b\d+\s+[A-Z]*BGA\b/i.test(head) || /\b\d+(?:[A-Z]*BGA|LGA|TSOP|WSON)\b/i.test(head))) {
        reasons.push("pin-before-type");
      }
      if (head && /\b(?:[A-Z]*BGA|LGA|TSOP|WSON)\d+(?![-/])\b/i.test(head)) {
        reasons.push("missing-pin-separator");
      }
      if (!head || (!packageTypePattern.test(head) && !packageDimensionPattern.test(head))) {
        reasons.push("head-shape");
      }
      if (tail.some((part) => /^\d+(?:\.\d+)?x/.test(part) && !packageDimensionPattern.test(part))) {
        reasons.push("dimension-shape");
      }
    }
  }

  for (const reason of reasons) {
    addFinding(
      findings,
      "error",
      "package_shape",
      path,
      `Public package value "${value}" must use TYPE[-PIN][, DIM][, SPECIAL] (${reason}).`,
      specId
    );
  }
}

function checkPublicPackageValues(
  value: unknown,
  path: string[],
  findings: DecodePackCheckFinding[],
  specId?: string
): void {
  if (typeof value === "string") {
    if (isPublicPackageValuePath(path)) {
      checkPublicPackageValue(value, path.join("."), specId, findings);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkPublicPackageValues(item, [...path, `[${index}]`], findings, specId));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    checkPublicPackageValues(item, [...path, key], findings, specId);
  }
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
    if (isRecord(component) && "hidden" in component && typeof component.hidden !== "boolean") {
      addFinding(findings, "error", "component_hidden", `${path}[${index}].hidden`, "Component hidden flag must be boolean.", specId);
    }
  });
}

function checkHiddenFields(value: unknown, path: string, specId: string, findings: DecodePackCheckFinding[]): void {
  if (!Array.isArray(value)) {
    addFinding(findings, "error", "hidden_fields", path, "meta.hiddenFields must be an array of canonical field keys.", specId);
    return;
  }
  value.forEach((field, index) => {
    if (typeof field !== "string" || !Object.hasOwn(fdnextFieldRegistry, field)) {
      addFinding(findings, "error", "hidden_fields", `${path}[${index}]`, `Hidden field "${String(field)}" is not a registered canonical field key.`, specId);
    }
  });
}

function hasTerminalEndAnchor(pattern: string): boolean {
  if (!pattern.endsWith("$")) {
    return false;
  }
  let slashCount = 0;
  for (let index = pattern.length - 2; index >= 0 && pattern[index] === "\\"; index--) {
    slashCount++;
  }
  return slashCount % 2 === 0;
}

function isExactLiteralFullMatch(pattern: string): boolean {
  if (!pattern.startsWith("^") || !hasTerminalEndAnchor(pattern)) {
    return false;
  }
  return /^[A-Z0-9:_-]+$/i.test(pattern.slice(1, -1));
}

function checkPartMatch(spec: PartDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  if (spec.match.kind === "regex" && isExactLiteralFullMatch(spec.match.value)) {
    addFinding(
      findings,
      "error",
      "full_string_match",
      `${path}.match.value`,
      "Part DecodePack match regex must not match one complete literal PN; use structured token classes and preserve known fields when later tokens are unknown.",
      spec.id
    );
  }
}

function templateVariableNames(template: string): string[] {
  return [...template.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g)].map((match) => match[1]).filter((name): name is string => Boolean(name));
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

function unionInternalFieldKeys(...sets: ReadonlySet<string>[]): Set<string> {
  return new Set(sets.flatMap((set) => [...set]));
}

function internalFieldKeysFromObject(value: unknown): Set<string> {
  if (!isRecord(value)) {
    return new Set();
  }
  return new Set(Object.keys(value).filter(isInternalCodeFieldKey));
}

function internalFieldKeysFromExpr(
  expr: unknown,
  variables: ReadonlyMap<string, ReadonlySet<string>>
): Set<string> {
  if (!isRecord(expr)) {
    return new Set();
  }
  if (typeof expr.$var === "string") {
    return new Set(variables.get(expr.$var) ?? []);
  }
  const path = typeof expr.$path === "string"
    ? expr.$path.split(".")
    : Array.isArray(expr.$path)
      ? expr.$path
      : undefined;
  if (path?.length === 1 && typeof path[0] === "string") {
    return new Set(variables.get(path[0]) ?? []);
  }
  if ("$tpl" in expr || path) {
    return new Set();
  }
  return internalFieldKeysFromObject(expr);
}

function internalFieldKeysFromTable(table: Record<string, DecodeJson> | undefined): Set<string> {
  const keys = new Set<string>();
  for (const value of Object.values(table ?? {})) {
    internalFieldKeysFromObject(value).forEach((key) => keys.add(key));
  }
  return keys;
}

function checkTokenDecoderProgram(
  spec: PartDecodeSpec,
  path: string,
  findings: DecodePackCheckFinding[],
  sharedTables?: Record<string, DecodeTable>
): void {
  const decoder = spec.tokenDecoder;
  if (!decoder) {
    return;
  }

  const defined = new Set(["partNumber", "rest"]);
  const internalFieldKeys = new Map<string, Set<string>>();
  const tables = resolveDecodeTables(decoder, sharedTables);

  for (const [tableName, table] of Object.entries(decoder.tables ?? {})) {
    checkDecodeTable(table, `${path}.tokenDecoder.tables.${tableName}`, spec.id, findings);
  }

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
      case "markLookupPartNumber":
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
      case "dieDensity":
        checkTokenVariable(step.density, `${stepPath}.density`, spec.id, defined, findings);
        checkTokenVariable(step.dieCount, `${stepPath}.dieCount`, spec.id, defined, findings);
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

    switch (step.op) {
      case "set":
        internalFieldKeys.set(step.to, internalFieldKeysFromExpr(step.value, internalFieldKeys));
        break;
      case "map":
      case "takeLongest":
        internalFieldKeys.set(step.to, unionInternalFieldKeys(
          internalFieldKeysFromTable(tables[step.table]),
          internalFieldKeysFromObject(step.default)
        ));
        break;
      case "fallback":
        internalFieldKeys.set(step.to, unionInternalFieldKeys(
          internalFieldKeys.get(step.primary) ?? new Set(),
          internalFieldKeys.get(step.secondary) ?? new Set()
        ));
        break;
      case "merge":
      case "mergeIf":
        internalFieldKeys.set(step.into, unionInternalFieldKeys(
          internalFieldKeys.get(step.into) ?? new Set(),
          internalFieldKeys.get(step.from) ?? new Set()
        ));
        break;
      case "omit": {
        const remaining = new Set(internalFieldKeys.get(step.from) ?? []);
        step.keys.forEach((key) => remaining.delete(key));
        internalFieldKeys.set(step.to ?? step.from, remaining);
        break;
      }
      default:
        if ("to" in step && step.to) {
          internalFieldKeys.set(step.to, new Set());
        }
        break;
    }

    if ("to" in step) {
      defineTokenVariable(defined, step.to);
    }
    if ((step.op === "takeLongest" || step.op === "map") && step.keyTo) {
      defineTokenVariable(defined, step.keyTo);
    }
    if (step.op === "takeRegex") {
      Object.keys(step.groups ?? {}).forEach((target) => defineTokenVariable(defined, target));
    }
  });

  for (const [key, value] of Object.entries(decoder.assign)) {
    checkExprVariables(value, `${path}.tokenDecoder.assign.${key}`, spec.id, defined, findings);
    if (key === "fields") {
      for (const internalKey of internalFieldKeysFromExpr(value, internalFieldKeys)) {
        addFinding(
          findings,
          "error",
          "internal_field",
          `${path}.tokenDecoder.assign.fields.${internalKey}`,
          `Internal code field "${internalKey}" may flow into public fields; remove it explicitly with an omit step.`,
          spec.id
        );
      }
    }
  }
}

function checkPartSetVariables(spec: PartDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  if (!spec.set) {
    return;
  }
  const defined = new Set(["partNumber", "rest"]);
  for (const [key, value] of Object.entries(spec.set)) {
    checkExprVariables(value as DecodeExpr, `${path}.set.${key}`, spec.id, defined, findings);
  }
}

function checkIdentifierDefinition(spec: IdentifierDecodeSpec, path: string, findings: DecodePackCheckFinding[]): void {
  const allowedMetaKeys = new Set(["meta.nandDieProfileKey", "meta.nandDieProfileKeys"]);
  for (const [offsetKey, fields] of Object.entries(spec.definition)) {
    for (const [fieldName, ruleSet] of Object.entries(fields)) {
      const fieldKey = fieldName.startsWith("field:") ? fieldName.slice(6) : fieldName;
      if (allowedMetaKeys.has(fieldKey)) {
        // allowed
      } else if (!Object.hasOwn(fdnextFieldRegistry, fieldKey)) {
        addFinding(findings, "error", "unknown_field", `${path}.${offsetKey}.${fieldName}`, `Unknown canonical identifier field key "${fieldKey}".`, spec.id);
      }

      if (!isRecord(ruleSet) || Array.isArray(ruleSet) || typeof ruleSet.from !== "string") {
        continue;
      }
      const fromKey = ruleSet.from.startsWith("field:") ? ruleSet.from.slice(6) : ruleSet.from;
      if (!allowedMetaKeys.has(fromKey) && !Object.hasOwn(fdnextFieldRegistry, fromKey)) {
        addFinding(
          findings,
          "error",
          "unknown_identifier_reuse_field",
          `${path}.${offsetKey}.${fieldName}.from`,
          `Unknown identifier reuse source field "${fromKey}".`,
          spec.id
        );
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
    if (key === "meta.hiddenFields") {
      checkHiddenFields(value, `${path}.${key}`, specId, findings);
    }
    walkPolicy(value, `${path}.${key}`, specId, findings);
  }
}

export function checkDecodePack(pack: DecodePack): DecodePackCheckResult {
  const findings: DecodePackCheckFinding[] = [];
  checkMaintenanceData(pack, "", findings);
  const ids = new Map<string, string>();
  const sharedTables = pack.sharedTables ?? {};
  for (const [tableName, table] of Object.entries(sharedTables)) {
    checkDecodeTable(table, `sharedTables.${tableName}`, undefined, findings);
  }
  checkPublicPackageValues(sharedTables, ["sharedTables"], findings);
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
        checkPartMatch(partSpec, path, findings);
        checkPartSetVariables(partSpec, path, findings);
        checkTokenDecoderProgram(partSpec, path, findings, sharedTables);
        checkOutputSurface(partSpec.set, `${path}.set`, partSpec.id, findings);
        checkOutputSurface(partSpec.tokenDecoder?.assign, `${path}.tokenDecoder.assign`, partSpec.id, findings);
      } else {
        const identifierSpec = spec as IdentifierDecodeSpec;
        checkIdentifierDefinition(identifierSpec, `${path}.definition`, findings);
        walkPolicy(identifierSpec.definition, `${path}.definition`, spec.id, findings);
      }
      checkPublicPackageValues(spec, [path], findings, spec.id);
    });
  }
  return {
    ok: findings.every((finding) => finding.severity !== "error"),
    findings
  };
}

export function validateDecodePack(pack: DecodePack): ValidatedDecodePack {
  if (isValidatedDecodePack(pack)) {
    return pack;
  }
  const result = checkDecodePack(pack);
  if (!result.ok) {
    throw new DecodePackValidationError(result);
  }
  deepFreeze(pack);
  validatedDecodePacks.add(pack);
  return pack as ValidatedDecodePack;
}
