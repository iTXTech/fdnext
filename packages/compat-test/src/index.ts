import {
  createEngine,
  fdnextCapabilitiesJsonSchema,
  fdnextResultJsonSchema,
  type FdnextCapabilities,
  type FdnextResult,
  type JsonSchema
} from "../../core/src/index";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "../../dsl/src/index";
import { embeddedResources } from "../../resources/index";

export interface ContractCheckSummary {
  checked: number;
  operations: string[];
}

type SchemaObject = Exclude<JsonSchema, boolean> & Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  let current: unknown = root;
  for (const part of ref.slice(2).split("/")) {
    const key = part.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!isObject(current)) {
      return false;
    }
    current = current[key];
  }
  return typeof current === "boolean" || isObject(current) ? current as JsonSchema : false;
}

function typeMatches(expected: string, value: unknown): boolean {
  if (expected === "array") return Array.isArray(value);
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "null") return value === null;
  if (expected === "object") return isObject(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === expected;
}

export function validateSchema(schema: JsonSchema, value: unknown, root: JsonSchema = schema): string[] {
  if (typeof schema === "boolean") {
    return schema ? [] : ["schema is false"];
  }
  const current = schema as SchemaObject;
  if (typeof current.$ref === "string") {
    return validateSchema(resolveRef(root, current.$ref), value, root);
  }
  if (Object.hasOwn(current, "const") && !sameJson(value, current.const)) {
    return [`expected const ${JSON.stringify(current.const)}`];
  }
  if (Array.isArray(current.enum) && !current.enum.some((item) => sameJson(item, value))) {
    return [`expected enum ${JSON.stringify(current.enum)}`];
  }
  if (Array.isArray(current.oneOf)) {
    const matches = current.oneOf.filter((candidate) => validateSchema(candidate as JsonSchema, value, root).length === 0);
    return matches.length === 1 ? [] : [`matched ${matches.length} oneOf branches`];
  }
  if (Array.isArray(current.anyOf)) {
    return current.anyOf.some((candidate) => validateSchema(candidate as JsonSchema, value, root).length === 0) ? [] : ["did not match anyOf"];
  }

  const declaredType = current.type;
  const types = Array.isArray(declaredType) ? declaredType : typeof declaredType === "string" ? [declaredType] : [];
  if (types.length > 0 && !types.some((type) => typeMatches(type, value))) {
    return [`expected type ${types.join(" | ")}`];
  }

  const errors: string[] = [];
  if (isObject(value)) {
    const properties = isObject(current.properties) ? current.properties as Record<string, JsonSchema> : {};
    for (const required of Array.isArray(current.required) ? current.required : []) {
      if (typeof required === "string" && !Object.hasOwn(value, required)) {
        errors.push(`missing ${required}`);
      }
    }
    for (const [key, item] of Object.entries(value)) {
      if (properties[key]) {
        errors.push(...validateSchema(properties[key], item, root).map((error) => `${key}.${error}`));
      } else if (current.additionalProperties === false) {
        errors.push(`unexpected ${key}`);
      } else if (typeof current.additionalProperties === "object") {
        errors.push(...validateSchema(current.additionalProperties as JsonSchema, item, root).map((error) => `${key}.${error}`));
      }
    }
  }
  if (Array.isArray(value) && current.items) {
    value.forEach((item, index) => {
      errors.push(...validateSchema(current.items as JsonSchema, item, root).map((error) => `[${index}].${error}`));
    });
  }
  return errors;
}

export function createContractEngine() {
  return createEngine({
    resources: embeddedResources,
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });
}

export function runContractChecks(): ContractCheckSummary {
  const engine = createContractEngine();
  const results: Array<FdnextResult | FdnextCapabilities> = [
    engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" }),
    engine.searchParts({ query: "MT62", lang: "eng", limit: 2 }),
    engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng", idScheme: "nand.flash_id" }),
    engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2, idScheme: "nand.flash_id" }),
    engine.getCapabilities()
  ];

  for (const result of results) {
    const schema = "capabilities" in result ? fdnextCapabilitiesJsonSchema : fdnextResultJsonSchema;
    const errors = validateSchema(schema, result);
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  }

  return {
    checked: results.length,
    operations: results.map((result) => "operation" in result ? result.operation : "capabilities")
  };
}
