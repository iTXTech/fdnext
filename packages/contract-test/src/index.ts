import Ajv2020 from "ajv/dist/2020.js";
import type { AnySchema, ErrorObject, ValidateFunction } from "ajv";
import {
  createEngine,
  fdnextCapabilitiesJsonSchema,
  fdnextResultJsonSchema,
  type FdnextCapabilities,
  type FdnextEngine,
  type FdnextResult,
  type JsonSchema
} from "@itxtech/fdnext-core";

export interface ContractCheckSummary {
  checked: number;
  operations: string[];
}

const schemaValidator = new Ajv2020({ allErrors: true, strict: true });
const compiledSchemas = new Map<JsonSchema, ValidateFunction>();

function formatSchemaError(error: ErrorObject): string {
  return `${error.instancePath || "$"} ${error.message ?? error.keyword}`;
}

export function validateSchema(schema: JsonSchema, value: unknown): string[] {
  let validate = compiledSchemas.get(schema);
  if (!validate) {
    validate = schemaValidator.compile(schema as AnySchema);
    compiledSchemas.set(schema, validate);
  }
  return validate(value) ? [] : (validate.errors ?? []).map(formatSchemaError);
}

let cachedContractEngine: FdnextEngine | undefined;

export function createContractEngine(): FdnextEngine {
  cachedContractEngine ??= createEngine();
  return cachedContractEngine;
}

export function runContractChecks(): ContractCheckSummary {
  const engine = createContractEngine();
  const results: Array<FdnextResult | FdnextCapabilities> = [
    engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" }),
    engine.searchParts({ query: "MT62", lang: "eng", limit: 2 }),
    engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" }),
    engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2 }),
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
