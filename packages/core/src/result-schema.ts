import {
  FDNEXT_CAPABILITIES_SCHEMA_VERSION,
  FDNEXT_RESULT_SCHEMA_VERSION,
  fdnextCapabilityNames,
  fdnextChipKinds,
  fdnextDomains,
  fdnextExternalLinkCategories,
  fdnextFieldImportances,
  fdnextIdSchemes,
  fdnextOperations,
  fdnextRelationKinds,
  fdnextResultStatuses
} from "./result";
import { fdnextFieldKeys } from "./field-registry";

export type JsonSchema =
  | boolean
  | {
      $schema?: string;
      $id?: string;
      $ref?: string;
      $defs?: Record<string, JsonSchema>;
      title?: string;
      description?: string;
      type?: string | readonly string[];
      const?: unknown;
      enum?: readonly unknown[];
      properties?: Record<string, JsonSchema>;
      required?: readonly string[];
      additionalProperties?: boolean | JsonSchema;
      items?: JsonSchema;
      minItems?: number;
      uniqueItems?: boolean;
      minLength?: number;
      pattern?: string;
      minimum?: number;
      oneOf?: readonly JsonSchema[];
      anyOf?: readonly JsonSchema[];
    };

const scalarValueSchema = {
  anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }]
} as const satisfies JsonSchema;

const fieldValueDataSchema = {
  anyOf: [
    scalarValueSchema,
    { type: "array", items: scalarValueSchema },
    {
      type: "object",
      additionalProperties: {
        anyOf: [scalarValueSchema, { type: "array", items: scalarValueSchema }]
      }
    }
  ]
} as const satisfies JsonSchema;

const operationConstraintsSchema = {
  type: "object",
  properties: {
    chipKind: { enum: fdnextChipKinds },
    productType: { type: "string", minLength: 1 },
    vendor: { type: "string", minLength: 1 },
    strict: { type: "boolean" },
    idScheme: { enum: fdnextIdSchemes }
  },
  additionalProperties: false
} as const satisfies JsonSchema;

const requestInputSchema = {
  type: "object",
  required: ["query"],
  properties: {
    query: { type: "string", minLength: 1 },
    lang: { type: ["string", "null"] },
    idScheme: { enum: fdnextIdSchemes },
    constraints: operationConstraintsSchema,
    limit: { type: "integer", minimum: 1 }
  },
  additionalProperties: false
} as const satisfies JsonSchema;

export const decodePartInputJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/decode-part-input-v1.json",
  title: "DecodePartInput",
  type: "object",
  required: ["query"],
  properties: {
    query: { type: "string", minLength: 1 },
    lang: { type: ["string", "null"] },
    constraints: {
      type: "object",
      properties: {
        chipKind: { enum: fdnextChipKinds },
        productType: { type: "string", minLength: 1 },
        vendor: { type: "string", minLength: 1 },
        strict: { type: "boolean" }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
} as const satisfies JsonSchema;

export const searchPartsInputJsonSchema = {
  ...decodePartInputJsonSchema,
  $id: "https://itxtech.org/fdnext/schemas/search-parts-input-v1.json",
  title: "SearchPartsInput",
  properties: {
    ...decodePartInputJsonSchema.properties,
    limit: { type: "integer", minimum: 1 }
  }
} as const satisfies JsonSchema;

export const decodeIdentifierInputJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/decode-identifier-input-v1.json",
  title: "DecodeIdentifierInput",
  type: "object",
  required: ["query"],
  properties: {
    query: { type: "string", minLength: 1 },
    lang: { type: ["string", "null"] },
    idScheme: { enum: fdnextIdSchemes },
    constraints: operationConstraintsSchema
  },
  additionalProperties: false
} as const satisfies JsonSchema;

export const searchIdentifiersInputJsonSchema = {
  ...decodeIdentifierInputJsonSchema,
  $id: "https://itxtech.org/fdnext/schemas/search-identifiers-input-v1.json",
  title: "SearchIdentifiersInput",
  properties: {
    ...decodeIdentifierInputJsonSchema.properties,
    limit: { type: "integer", minimum: 1 }
  }
} as const satisfies JsonSchema;

const resultDefs = {
  operationConstraints: operationConstraintsSchema,
  normalizedInput: {
    type: "object",
    required: ["query", "normalized", "constraints"],
    properties: {
      query: { type: "string", minLength: 1 },
      normalized: { type: "string", minLength: 1 },
      lang: { type: "string", minLength: 1 },
      constraints: { $ref: "#/$defs/operationConstraints" }
    },
    additionalProperties: false
  },
  vendorIdentity: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 }
    },
    additionalProperties: false
  },
  deviceIdentity: {
    type: "object",
    required: ["domain", "chipKind", "vendor"],
    properties: {
      domain: { enum: fdnextDomains },
      chipKind: { enum: fdnextChipKinds },
      productType: { type: "string", minLength: 1 },
      partNumber: { type: "string", minLength: 1 },
      identifier: { type: "string", minLength: 1 },
      idScheme: { enum: fdnextIdSchemes },
      markingCode: { type: "string", minLength: 1 },
      vendor: { $ref: "#/$defs/vendorIdentity" }
    },
    additionalProperties: false
  },
  fieldValue: {
    type: "object",
    required: ["key", "label", "value", "importance"],
    properties: {
      key: { enum: fdnextFieldKeys },
      label: { type: "string", minLength: 1 },
      value: fieldValueDataSchema,
      unit: { type: "string", minLength: 1 },
      display: { type: "string", minLength: 1 },
      importance: { enum: fdnextFieldImportances }
    },
    additionalProperties: false
  },
  resultBlock: {
    type: "object",
    required: ["id", "label", "fields"],
    properties: {
      id: { type: "string", minLength: 1 },
      label: { type: "string", minLength: 1 },
      fields: { type: "array", items: { $ref: "#/$defs/fieldValue" } },
      importance: { enum: fdnextFieldImportances }
    },
    additionalProperties: false
  },
  relationEndpoint: {
    type: "object",
    properties: {
      role: { type: "string", minLength: 1 },
      label: { type: "string", minLength: 1 },
      device: { $ref: "#/$defs/deviceIdentity" },
      partNumber: { type: "string", minLength: 1 },
      identifier: { type: "string", minLength: 1 },
      idScheme: { enum: fdnextIdSchemes },
      markingCode: { type: "string", minLength: 1 }
    },
    additionalProperties: false
  },
  relation: {
    type: "object",
    required: ["kind", "target"],
    properties: {
      kind: { enum: fdnextRelationKinds },
      label: { type: "string", minLength: 1 },
      source: { $ref: "#/$defs/relationEndpoint" },
      target: { $ref: "#/$defs/relationEndpoint" },
      fields: { type: "array", items: { $ref: "#/$defs/fieldValue" } },
      action: { $ref: "#/$defs/action" }
    },
    additionalProperties: false
  },
  warning: {
    type: "object",
    required: ["code", "message"],
    properties: {
      code: { type: "string", minLength: 1 },
      message: { type: "string", minLength: 1 },
      fieldKey: { enum: fdnextFieldKeys },
      severity: { enum: ["info", "warning"] },
      details: {
        type: "object",
        additionalProperties: fieldValueDataSchema
      }
    },
    additionalProperties: false
  },
  action: {
    type: "object",
    required: ["name", "label", "operation", "input"],
    properties: {
      name: { enum: fdnextOperations },
      label: { type: "string", minLength: 1 },
      operation: { enum: fdnextOperations },
      input: requestInputSchema
    },
    additionalProperties: false
  },
  externalLink: {
    type: "object",
    required: ["id", "label", "url"],
    properties: {
      id: { type: "string", minLength: 1 },
      label: { type: "string", minLength: 1 },
      url: { type: "string", minLength: 1 },
      category: { enum: fdnextExternalLinkCategories },
      image: { type: "string", minLength: 1 },
      hint: { type: "string", minLength: 1 },
      fieldKey: { enum: fdnextFieldKeys },
      priority: { type: "number" }
    },
    additionalProperties: false
  },
  candidate: {
    type: "object",
    required: ["device"],
    properties: {
      device: { $ref: "#/$defs/deviceIdentity" },
      fields: { type: "array", items: { $ref: "#/$defs/fieldValue" } },
      warnings: { type: "array", items: { $ref: "#/$defs/warning" } }
    },
    additionalProperties: false
  },
  searchResultItem: {
    type: "object",
    required: ["label", "device"],
    properties: {
      label: { type: "string", minLength: 1 },
      device: { $ref: "#/$defs/deviceIdentity" },
      badges: { type: "array", items: { type: "string", minLength: 1 } },
      fields: { type: "array", items: { $ref: "#/$defs/fieldValue" } },
      relations: { type: "array", items: { $ref: "#/$defs/relation" } },
      links: { type: "array", items: { $ref: "#/$defs/externalLink" } }
    },
    additionalProperties: false
  }
} as const satisfies Record<string, JsonSchema>;

function decodeResultSchema(operation: "part.decode" | "identifier.decode"): JsonSchema {
  return {
    type: "object",
    required: ["schemaVersion", "operation", "status", "input", "blocks", "relations", "warnings"],
    properties: {
      schemaVersion: { const: FDNEXT_RESULT_SCHEMA_VERSION },
      operation: { const: operation },
      status: { enum: fdnextResultStatuses },
      input: { $ref: "#/$defs/normalizedInput" },
      subtitle: { type: "string", minLength: 1 },
      device: { $ref: "#/$defs/deviceIdentity" },
      blocks: { type: "array", items: { $ref: "#/$defs/resultBlock" } },
      relations: { type: "array", items: { $ref: "#/$defs/relation" } },
      candidates: { type: "array", items: { $ref: "#/$defs/candidate" } },
      links: { type: "array", items: { $ref: "#/$defs/externalLink" } },
      warnings: { type: "array", items: { $ref: "#/$defs/warning" } }
    },
    additionalProperties: false
  };
}

function searchResultSchema(operation: "part.search" | "identifier.search"): JsonSchema {
  return {
    type: "object",
    required: ["schemaVersion", "operation", "status", "input", "items", "warnings"],
    properties: {
      schemaVersion: { const: FDNEXT_RESULT_SCHEMA_VERSION },
      operation: { const: operation },
      status: { enum: fdnextResultStatuses },
      input: { $ref: "#/$defs/normalizedInput" },
      items: { type: "array", items: { $ref: "#/$defs/searchResultItem" } },
      relations: { type: "array", items: { $ref: "#/$defs/relation" } },
      candidates: { type: "array", items: { $ref: "#/$defs/candidate" } },
      links: { type: "array", items: { $ref: "#/$defs/externalLink" } },
      warnings: { type: "array", items: { $ref: "#/$defs/warning" } }
    },
    additionalProperties: false
  };
}

export const fdnextResultJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/result-v1.json",
  title: "FdnextResult",
  oneOf: [
    decodeResultSchema("part.decode"),
    searchResultSchema("part.search"),
    decodeResultSchema("identifier.decode"),
    searchResultSchema("identifier.search")
  ],
  $defs: resultDefs
} as const satisfies JsonSchema;

export const fdnextCapabilitiesJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/capabilities-v1.json",
  title: "FdnextCapabilities",
  type: "object",
  required: ["schemaVersion", "server", "fdb", "inventory", "decoders", "capabilities"],
  properties: {
    schemaVersion: { const: FDNEXT_CAPABILITIES_SCHEMA_VERSION },
    server: {
      type: "object",
      required: ["name", "version"],
      properties: {
        name: { type: "string", minLength: 1 },
        version: { type: "string", minLength: 1 }
      },
      additionalProperties: false
    },
    fdb: {
      type: "object",
      required: ["name", "version", "time", "website"],
      properties: {
        name: { type: "string", minLength: 1 },
        version: { type: "string", minLength: 1 },
        time: { type: "string" },
        website: { type: "string" }
      },
      additionalProperties: false
    },
    inventory: {
      type: "object",
      required: ["controllers", "flashIds", "partNumbers", "micronFbga"],
      properties: {
        controllers: {
          type: "object",
          required: ["count", "items"],
          properties: {
            count: { type: "integer", minimum: 0 },
            items: { type: "array", items: { type: "string", minLength: 1 } }
          },
          additionalProperties: false
        },
        flashIds: {
          type: "object",
          required: ["count"],
          properties: {
            count: { type: "integer", minimum: 0 }
          },
          additionalProperties: false
        },
        partNumbers: {
          type: "object",
          required: ["total", "fdb", "managedNand", "dram"],
          properties: {
            total: { type: "integer", minimum: 0 },
            fdb: { type: "integer", minimum: 0 },
            managedNand: { type: "integer", minimum: 0 },
            dram: { type: "integer", minimum: 0 }
          },
          additionalProperties: false
        },
        micronFbga: {
          type: "object",
          required: ["total", "dramLookup"],
          properties: {
            total: { type: "integer", minimum: 0 },
            dramLookup: { type: "integer", minimum: 0 }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    },
    decoders: {
      type: "object",
      required: ["partNumber", "identifier"],
      properties: {
        partNumber: {
          type: "array",
          items: {
            type: "object",
            required: ["id"],
            properties: {
              id: { type: "string", minLength: 1 },
              priority: { type: "number" }
            },
            additionalProperties: false
          }
        },
        identifier: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "idScheme"],
            properties: {
              id: { type: "string", minLength: 1 },
              idScheme: { enum: fdnextIdSchemes },
              priority: { type: "number" }
            },
            additionalProperties: false
          }
        }
      },
      additionalProperties: false
    },
    capabilities: {
      type: "array",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { enum: fdnextCapabilityNames },
          operation: { enum: fdnextOperations },
          domains: { type: "array", items: { enum: fdnextDomains } },
          chipKinds: { type: "array", items: { enum: fdnextChipKinds } },
          productTypes: { type: "array", items: { type: "string", minLength: 1 } },
          idSchemes: { type: "array", items: { enum: fdnextIdSchemes } },
          description: { type: "string", minLength: 1 }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const satisfies JsonSchema;

export const fdnextOperationInputJsonSchemas = {
  decodePart: decodePartInputJsonSchema,
  searchParts: searchPartsInputJsonSchema,
  decodeIdentifier: decodeIdentifierInputJsonSchema,
  searchIdentifiers: searchIdentifiersInputJsonSchema
} as const;
