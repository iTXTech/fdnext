import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeIdentifierInputJsonSchema,
  decodePartInputJsonSchema,
  createEngine,
  fdnextCapabilitiesJsonSchema,
  FDNEXT_VERSION,
  fdnextOperationInputJsonSchemas,
  fdnextResultJsonSchema,
  searchIdentifiersInputJsonSchema,
  searchPartsInputJsonSchema,
  type JsonSchema,
  type PartNumberDecoder
} from "../src/index";
import { fdnextFieldRegistry, formatFdnextFieldValue, type FdnextFieldKey } from "../src/field-registry";
import { buildFdb, findPartNumberAcrossVendors, getPartNumberRecord } from "../src/fdb";

const fixtureRoot = fileURLToPath(new URL("./fixtures/", import.meta.url));
const resultFixtureRoot = join(fixtureRoot, "fdnext-result");
const engLang = parseJson(fileURLToPath(new URL("../resources/lang/eng.json", import.meta.url))) as Record<string, string>;
const rootPackageMetadata = parseJson(fileURLToPath(new URL("../../../package.json", import.meta.url))) as { version?: unknown };
assert.equal(typeof rootPackageMetadata.version, "string", "root package metadata must expose a version");
const fdnextPackageVersion = rootPackageMetadata.version as string;

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
  if (typeof value === "number" && typeof current.maximum === "number" && value > current.maximum) {
    errors.push(`${path}: expected maximum ${current.maximum}`);
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

function collectResultBlockFields(fixture: unknown): Record<string, unknown>[] {
  assert.ok(isObject(fixture));
  const blocks = fixture.blocks;
  assert.ok(Array.isArray(blocks), "decode fixture should have blocks");
  return collectFieldValues(blocks);
}

const expectedResultFixtures = [
  "dram.part.decode.json",
  "emcp.part.decode.json",
  "emmc.part.decode.json",
  "micron-fbga-marking.part.search.json",
  "nand-flash-id.identifier.decode.json",
  "raw-nand.part.decode.json",
  "ufs.part.decode.json"
];

assert.deepEqual(resultFixtureNames(), expectedResultFixtures, "result contract must keep one schema fixture per current product family");

const colonTokenFdb = buildFdb({
  info: { version: "test" },
  micron: {
    "MT62F512M64D4EK-031FAAT:B": { id: ["2C00"] },
    "MT29FB16T08GALAAM5-TES:B": { id: ["2C01"] }
  }
});
assert.equal(
  getPartNumberRecord(colonTokenFdb, "micron", "MT62F512M64D4EK-031FAATB")?.pn,
  "MT62F512M64D4EK-031FAAT:B",
  "FDB PN lookup should treat colon revision tokens as optional separators"
);
assert.equal(
  getPartNumberRecord(colonTokenFdb, "micron", "MT62F512M64D4EK031FAATB")?.pn,
  "MT62F512M64D4EK-031FAAT:B",
  "FDB PN lookup should treat ordered dash suffix tokens as optional separators"
);
assert.equal(
  findPartNumberAcrossVendors(colonTokenFdb, "MT62F512M64D4EK-031FAATB")?.record.pn,
  "MT62F512M64D4EK-031FAAT:B",
  "cross-vendor FDB lookup should treat colon revision tokens as optional separators"
);
assert.equal(
  findPartNumberAcrossVendors(colonTokenFdb, "MT62F512M64D4EK031FAATB")?.record.pn,
  "MT62F512M64D4EK-031FAAT:B",
  "cross-vendor FDB lookup should treat ordered dash suffix tokens as optional separators"
);
assert.equal(
  getPartNumberRecord(colonTokenFdb, "micron", "MT29FB16T08GALAAM5-TESB")?.pn,
  "MT29FB16T08GALAAM5-TES:B",
  "FDB Micron NAND PN lookup should treat colon revision tokens as optional separators"
);
assert.equal(
  getPartNumberRecord(colonTokenFdb, "micron", "MT29FB16T08GALAAM5TESB")?.pn,
  "MT29FB16T08GALAAM5-TES:B",
  "FDB Micron NAND PN lookup should treat ordered dash suffix tokens as optional separators"
);
assert.equal(
  findPartNumberAcrossVendors(colonTokenFdb, "MT29FB16T08GALAAM5-TESB")?.record.pn,
  "MT29FB16T08GALAAM5-TES:B",
  "cross-vendor FDB Micron NAND lookup should treat colon revision tokens as optional separators"
);
assert.equal(
  findPartNumberAcrossVendors(colonTokenFdb, "MT29FB16T08GALAAM5TESB")?.record.pn,
  "MT29FB16T08GALAAM5-TES:B",
  "cross-vendor FDB Micron NAND lookup should treat ordered dash suffix tokens as optional separators"
);

const samsungMultiDieFdb = buildFdb({
  info: { version: "test" },
  samsung: {
    K9GBGD8U0M: { id: ["EC00"], l: "SS32", c: "MLC", t: ["SINGLE"] },
    K9HDGD8U5M: { id: ["EC01"], l: "SS32_MULTI", c: "MLC", t: ["MULTI"] }
  }
});
assert.equal(
  getPartNumberRecord(samsungMultiDieFdb, "samsung", "K9HDGD8U5M")?.pn,
  "K9HDGD8U5M",
  "Samsung FDB PN lookup must not canonicalize multi-die parts through synthetic single-die keys"
);
assert.deepEqual(
  getPartNumberRecord(samsungMultiDieFdb, "samsung", "K9HDGD8U5M")?.id,
  ["EC01"],
  "Samsung multi-die exact PN should keep its own Flash ID references"
);
assert.deepEqual(
  getPartNumberRecord(samsungMultiDieFdb, "samsung", "K9GBGD8U0M")?.id,
  ["EC00"],
  "Samsung single-die PN should not inherit multi-die Flash ID references"
);

let lookupMetadataDecodeCalls = 0;
const lookupMetadataDecoder = {
  id: "test.lookup-metadata",
  check: (partNumber: string) => partNumber === "K9LOOKUPPKG",
  decode: (partNumber: string) => {
    lookupMetadataDecodeCalls += 1;
    return {
      device: {
        partNumber,
        vendor: "samsung",
        domain: "memory",
        chipKind: "raw_nand"
      },
      fields: {},
      meta: {
        lookupPartNumbers: ["K9LOOKUPCORE"]
      }
    };
  }
} satisfies PartNumberDecoder;
const lookupMetadataEngine = createEngine({
  resources: {
    partIndex: {
      rawNand: {
        info: { version: "test" },
        samsung: {
          K9LOOKUPCORE: { id: ["EC02"], t: ["LOOKUPCTRL"] }
        }
      }
    },
    translationIndex: { eng: engLang }
  },
  decoders: [lookupMetadataDecoder]
});
assert.equal(
  lookupMetadataDecodeCalls,
  0,
  "DecodePack lookup metadata should not be evaluated during FDB startup canonicalization"
);
const lookupMetadataResult = lookupMetadataEngine.decodePart({ query: "K9LOOKUPPKG", lang: "eng" });
assert.equal(lookupMetadataResult.status, "ok", "DecodePack lookup metadata test PN should decode");
assert.ok(lookupMetadataDecodeCalls > 0, "DecodePack lookup metadata should be evaluated for the active PN decode");
const lookupMetadataController = collectResultBlockFields(lookupMetadataResult).find((field) => field.key === "controller")?.value;
assert.ok(
  Array.isArray(lookupMetadataController) && lookupMetadataController.includes("LOOKUPCTRL"),
  "DecodePack meta.lookupPartNumbers should participate in FDB controller lookup"
);

const samsungFdbMetadataEngine = createEngine({
  resources: {
    partIndex: {
      rawNand: {
        info: { version: "test" },
        samsung: {
          K9CERTEST00: { id: ["EC5C94D364CB"], m: "SSV4_MLC(CERCE3)" },
          K9NORMALNOTE: { id: ["EC5C98BF84CC"], m: "Toggle" }
        }
      }
    },
    translationIndex: { eng: engLang }
  }
});
const samsungCerResult = samsungFdbMetadataEngine.decodePart({ query: "K9CERTEST00", lang: "eng" });
assert.equal(samsungCerResult.status, "ok", "Samsung CER FDB metadata test PN should decode");
assert.equal(
  collectResultBlockFields(samsungCerResult).find((field) => field.key === "special_option")?.value,
  "CER",
  "Samsung FDB CER metadata should map to public special_option"
);
assert.equal(
  JSON.stringify(samsungCerResult).includes("CERCE3"),
  false,
  "Samsung CER raw FDB metadata should not leak verbatim"
);
const samsungGenericMetadataResult = samsungFdbMetadataEngine.decodePart({ query: "K9NORMALNOTE", lang: "eng" });
assert.equal(samsungGenericMetadataResult.status, "ok", "Samsung generic metadata test PN should decode");
assert.equal(
  collectResultBlockFields(samsungGenericMetadataResult).some((field) => field.key === "special_option"),
  false,
  "ordinary Samsung FDB metadata should not map to special_option"
);
assert.equal(
  JSON.stringify(samsungGenericMetadataResult).includes("Toggle"),
  false,
  "ordinary FDB metadata should not leak to public result"
);

for (const name of expectedResultFixtures) {
  const fixture = loadResultFixture(name);
  assertValid(name, fdnextResultJsonSchema, fixture);
  if (isObject(fixture)) {
    assert.equal("actions" in fixture, false, `${name}: runnable actions should live on relations, not top-level actions`);
    if (Array.isArray(fixture.items)) {
      assert.ok(fixture.items.every((item) => !isObject(item) || !("actions" in item)), `${name}: search item actions should live on relations`);
    }
  }
  if (isObject(fixture) && (fixture.operation === "part.decode" || fixture.operation === "identifier.decode") && fixture.status === "ok") {
    assert.equal(typeof fixture.subtitle, "string", `${name}: ok decode result should expose subtitle`);
    assert.ok((fixture.subtitle as string).length > 0, `${name}: subtitle should not be empty`);
    const duplicateIdentityKeys = collectResultBlockFields(fixture)
      .map((field) => field.key)
      .filter((key) => ["vendor", "chip_kind", "product_type", "part_number", "identifier", "id_scheme", "marking_code"].includes(String(key)));
    assert.deepEqual(duplicateIdentityKeys, [], `${name}: identity fields should live in device, not blocks`);
  }

  for (const field of collectFieldValues(fixture)) {
    const key = field.key as FdnextFieldKey;
    assert.ok(Object.hasOwn(fdnextFieldRegistry, key), `${name}: ${String(field.key)} must be registered`);
    const definition = fdnextFieldRegistry[key];
    assert.equal(field.label, engLang[key] ?? definition.defaultLabel, `${name}: ${key} label should come from the English language pack`);
    const display = formatFdnextFieldValue(key, field.value as never, field.unit as string | undefined);
    if (display) {
      assert.equal(field.display, display, `${name}: ${key} display should come from the registry formatter`);
    }
  }
}

const capabilitiesFixture = parseJson(join(fixtureRoot, "fdnext-capabilities.json"));
assertValid("capabilities fixture", fdnextCapabilitiesJsonSchema, capabilitiesFixture);
assert.equal(FDNEXT_VERSION, fdnextPackageVersion);
const capabilitiesServer = isObject(capabilitiesFixture) ? capabilitiesFixture.server : undefined;
assert.equal(
  isObject(capabilitiesServer) ? capabilitiesServer.version : undefined,
  fdnextPackageVersion,
  "capabilities fixture server.version should track root package metadata"
);

assert.deepEqual(
  Object.keys(fdnextOperationInputJsonSchemas).sort(),
  ["decodeIdentifier", "decodePart", "searchIdentifiers", "searchParts"],
  "operation input schemas must cover every public operation input"
);

assertValid("decodePart input", decodePartInputJsonSchema, {
  query: "MT62",
  controllerGroup: "if:sata",
  constraints: { chipKind: "dram", vendor: "micron", strict: true }
});
assertValid("searchParts input", searchPartsInputJsonSchema, {
  query: "MTFC",
  constraints: { productType: "emmc" },
  limit: 10
});
assertValid("decodeIdentifier input", decodeIdentifierInputJsonSchema, {
  query: "2C DA 90 95 56",
  controllerGroup: "if:usb32g1",
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
assertInvalid("searchParts input must not accept controllerGroup", searchPartsInputJsonSchema, {
  query: "MTFC",
  controllerGroup: "if:sata"
});
assertInvalid("searchIdentifiers input must not accept controllerGroup", searchIdentifiersInputJsonSchema, {
  query: "2C",
  controllerGroup: "all"
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
assertValid("result may carry schema-safe external links", fdnextResultJsonSchema, (() => {
  const fixture = structuredClone(loadResultFixture("raw-nand.part.decode.json"));
  assert.ok(isObject(fixture));
  fixture.links = [
    {
      id: "micron.product",
      label: "Micron product page",
      url: "https://www.micron.com/",
      category: "vendor",
      fieldKey: "part_number",
      priority: 10
    }
  ];
  return fixture;
})());
assertInvalid("external links must not carry arbitrary metadata", fdnextResultJsonSchema, (() => {
  const fixture = structuredClone(loadResultFixture("raw-nand.part.decode.json"));
  assert.ok(isObject(fixture));
  fixture.links = [
    {
      id: "bad",
      label: "Bad link",
      url: "https://example.com",
      source: "adscript"
    }
  ];
  return fixture;
})());
