import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeIdentifierInputJsonSchema,
  decodePartInputJsonSchema,
  fdnextCapabilitiesJsonSchema,
  fdnextFieldRegistry,
  fdnextOperationInputJsonSchemas,
  fdnextResultJsonSchema,
  formatFdnextFieldValue,
  searchIdentifiersInputJsonSchema,
  searchPartsInputJsonSchema,
  type FdnextFieldKey,
  type JsonSchema
} from "../src/index";

const fixtureRoot = fileURLToPath(new URL("./fixtures/", import.meta.url));
const resultFixtureRoot = join(fixtureRoot, "fdnext-result");

type SchemaObject = Exclude<JsonSchema, boolean> & Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  assert.ok(ref.startsWith("#/"), `Only local JSON Schema refs are supported in tests: ${ref}`);
  let current: unknown = root;
  for (const part of ref.slice(2).split("/")) {
    const key = part.replaceAll("~1", "/").replaceAll("~0", "~");
    assert.ok(isObject(current), `Cannot resolve ${ref} through ${key}`);
    current = current[key];
  }
  assert.ok(typeof current === "boolean" || isObject(current), `Resolved ${ref} is not a schema`);
  return current as JsonSchema;
}

function typeMatches(expected: string, value: unknown): boolean {
  if (expected === "array") return Array.isArray(value);
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "null") return value === null;
  if (expected === "object") return isObject(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === expected;
}

function validate(schema: JsonSchema, value: unknown, path = "$", root: JsonSchema = schema): string[] {
  if (typeof schema === "boolean") {
    return schema ? [] : [`${path}: schema is false`];
  }

  const current = schema as SchemaObject;
  const ref = current.$ref;
  if (typeof ref === "string") {
    return validate(resolveRef(root, ref), value, path, root);
  }

  const errors: string[] = [];
  if (Object.hasOwn(current, "const") && !sameJson(value, current.const)) {
    errors.push(`${path}: expected const ${JSON.stringify(current.const)}`);
  }

  if (Array.isArray(current.enum) && !current.enum.some((item) => sameJson(item, value))) {
    errors.push(`${path}: expected one of ${JSON.stringify(current.enum)}`);
  }

  if (Array.isArray(current.anyOf)) {
    const matched = current.anyOf.some((candidate) => validate(candidate as JsonSchema, value, path, root).length === 0);
    if (!matched) {
      errors.push(`${path}: did not match anyOf`);
    }
  }

  if (Array.isArray(current.oneOf)) {
    const matches = current.oneOf.filter((candidate) => validate(candidate as JsonSchema, value, path, root).length === 0);
    if (matches.length !== 1) {
      errors.push(`${path}: matched ${matches.length} oneOf branches`);
    }
  }

  const declaredType = current.type;
  const types = Array.isArray(declaredType) ? declaredType : typeof declaredType === "string" ? [declaredType] : [];
  if (types.length > 0 && !types.some((type) => typeMatches(type, value))) {
    errors.push(`${path}: expected type ${types.join(" | ")}`);
    return errors;
  }

  if (isObject(value) && (current.properties || current.required || current.additionalProperties !== undefined)) {
    const properties = isObject(current.properties) ? (current.properties as Record<string, JsonSchema>) : {};
    const required = Array.isArray(current.required) ? current.required : [];
    for (const requiredKey of required) {
      if (typeof requiredKey === "string" && !Object.hasOwn(value, requiredKey)) {
        errors.push(`${path}: missing required ${requiredKey}`);
      }
    }

    for (const [key, item] of Object.entries(value)) {
      const propertySchema = properties[key];
      if (propertySchema) {
        errors.push(...validate(propertySchema, item, `${path}.${key}`, root));
      } else if (current.additionalProperties === false) {
        errors.push(`${path}.${key}: additional property is not allowed`);
      } else if (typeof current.additionalProperties === "object") {
        errors.push(...validate(current.additionalProperties as JsonSchema, item, `${path}.${key}`, root));
      }
    }
  }

  if (Array.isArray(value) && current.items) {
    if (typeof current.minItems === "number" && value.length < current.minItems) {
      errors.push(`${path}: expected at least ${current.minItems} items`);
    }
    if (current.uniqueItems === true) {
      const unique = new Set(value.map((item) => JSON.stringify(item)));
      if (unique.size !== value.length) {
        errors.push(`${path}: expected unique items`);
      }
    }
    value.forEach((item, index) => {
      errors.push(...validate(current.items as JsonSchema, item, `${path}[${index}]`, root));
    });
  }

  if (typeof value === "string") {
    if (typeof current.minLength === "number" && value.length < current.minLength) {
      errors.push(`${path}: expected minLength ${current.minLength}`);
    }
    if (typeof current.pattern === "string" && !new RegExp(current.pattern).test(value)) {
      errors.push(`${path}: expected pattern ${current.pattern}`);
    }
  }

  if (typeof value === "number" && typeof current.minimum === "number" && value < current.minimum) {
    errors.push(`${path}: expected minimum ${current.minimum}`);
  }

  return errors;
}

function assertValid(name: string, schema: JsonSchema, value: unknown): void {
  const errors = validate(schema, value);
  assert.deepEqual(errors, [], `${name} should validate:\n${errors.join("\n")}`);
}

function assertInvalid(name: string, schema: JsonSchema, value: unknown): void {
  const errors = validate(schema, value);
  assert.notDeepEqual(errors, [], `${name} should not validate`);
}

function resultFixtureNames(): string[] {
  return readdirSync(resultFixtureRoot)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

function loadResultFixture(name: string): unknown {
  return parseJson(join(resultFixtureRoot, name));
}

function collectFieldValues(value: unknown, fields: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFieldValues(item, fields);
    }
    return fields;
  }
  if (!isObject(value)) {
    return fields;
  }

  if (typeof value.key === "string" && Object.hasOwn(value, "label") && Object.hasOwn(value, "value")) {
    fields.push(value);
  }
  for (const item of Object.values(value)) {
    collectFieldValues(item, fields);
  }
  return fields;
}

function firstFixtureField(fixture: unknown): Record<string, unknown> {
  const field = collectFieldValues(fixture)[0];
  assert.ok(field, "fixture should contain at least one field");
  return field;
}

const expectedResultFixtures = [
  "dram.part.decode.json",
  "emcp.part.decode.json",
  "emmc.part.decode.json",
  "micron-fbga-marking.part.search.json",
  "nand-flash-id.identifier.decode.json",
  "on-die-ecc-nand.part.decode.json",
  "raw-nand.part.decode.json",
  "ufs.part.decode.json"
];

assert.deepEqual(resultFixtureNames(), expectedResultFixtures, "result contract must keep one schema fixture per current product family");

for (const name of expectedResultFixtures) {
  const fixture = loadResultFixture(name);
  assertValid(name, fdnextResultJsonSchema, fixture);

  for (const field of collectFieldValues(fixture)) {
    const key = field.key as FdnextFieldKey;
    assert.ok(Object.hasOwn(fdnextFieldRegistry, key), `${name}: ${String(field.key)} must be registered`);
    const definition = fdnextFieldRegistry[key];
    assert.equal(field.label, definition.defaultLabel, `${name}: ${key} label should come from the registry`);
    const display = formatFdnextFieldValue(key, field.value as never, field.unit as string | undefined);
    if (display) {
      assert.equal(field.display, display, `${name}: ${key} display should come from the registry formatter`);
    }
  }
}

assertValid("capabilities fixture", fdnextCapabilitiesJsonSchema, parseJson(join(fixtureRoot, "fdnext-capabilities.json")));

assert.deepEqual(
  Object.keys(fdnextOperationInputJsonSchemas).sort(),
  ["decodeIdentifier", "decodePart", "searchIdentifiers", "searchParts"],
  "operation input schemas must cover every public operation input"
);

assertValid("decodePart input", decodePartInputJsonSchema, {
  query: "MT62",
  constraints: { chipKind: "dram", vendor: "micron", strict: true }
});
assertValid("searchParts input", searchPartsInputJsonSchema, {
  query: "MTFC",
  constraints: { productType: "emmc" },
  limit: 10
});
assertValid("decodeIdentifier input", decodeIdentifierInputJsonSchema, {
  query: "2C DA 90 95 56",
  idScheme: "nand.flash_id"
});
assertValid("searchIdentifiers input", searchIdentifiersInputJsonSchema, {
  query: "2C",
  constraints: { idScheme: "nand.flash_id" },
  limit: 5
});

assertInvalid("part input must not accept identifier constraints", decodePartInputJsonSchema, {
  query: "MT62",
  constraints: { idScheme: "nand.flash_id" }
});
assertInvalid("identifier input must reject unknown schemes", decodeIdentifierInputJsonSchema, {
  query: "2C",
  idScheme: "nor.flash_id"
});
assertInvalid("result field must not carry source metadata", fdnextResultJsonSchema, (() => {
  const fixture = structuredClone(loadResultFixture("raw-nand.part.decode.json"));
  firstFixtureField(fixture).source = "datasheet";
  return fixture;
})());
assertInvalid("result field keys must reject reference metadata", fdnextResultJsonSchema, (() => {
  const fixture = structuredClone(loadResultFixture("raw-nand.part.decode.json"));
  firstFixtureField(fixture).key = "reference";
  return fixture;
})());
assertInvalid("device identity must not carry reference status metadata", fdnextResultJsonSchema, (() => {
  const fixture = structuredClone(loadResultFixture("dram.part.decode.json"));
  assert.ok(isObject(fixture));
  assert.ok(isObject(fixture.device));
  fixture.device.reference_status = "external_confirmed";
  return fixture;
})());
