import { nandDieProfileKeys } from "@itxtech/fdnext-core";
import { FDNEXT_FDBGEN_V1_COMPACT_VERSION, FDNEXT_FDBGEN_V1_FULL_VERSION } from "./fdbgen-v1";
import { FDNEXT_FDB_EXTRA_SCHEMA_VERSION, FDNEXT_FDB_SCHEMA_VERSION } from "./types";

export type JsonSchema = Record<string, unknown>;

const flashIdPattern = "^(?:[0-9A-Fa-f]{2}){6,}$";
const generatedFlashIdPattern = "^[0-9A-F]{12}$";
const fdbgenV1FlashIdPattern = "^(?:[0-9A-F]{2}){2,8}$";

export const fdnextFdbgenV1CompactSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/fdnext-fdbgen-v1-compact.schema.json",
  title: "fdnext fdbgen v1 compact support list",
  type: "object",
  additionalProperties: false,
  required: ["v", "e"],
  properties: {
    v: {
      const: FDNEXT_FDBGEN_V1_COMPACT_VERSION
    },
    e: {
      type: "array",
      items: {
        $ref: "#/$defs/compactEntry"
      }
    }
  },
  $defs: {
    flashId: {
      type: "string",
      pattern: fdbgenV1FlashIdPattern
    },
    controllerName: {
      type: "string",
      minLength: 1
    },
    compactEntry: {
      type: "object",
      additionalProperties: false,
      properties: {
        pn: {
          type: "string",
          minLength: 1
        },
        id: {
          $ref: "#/$defs/flashId"
        },
        t: {
          type: "array",
          items: {
            $ref: "#/$defs/controllerName"
          },
          uniqueItems: true
        }
      }
    }
  }
} as const satisfies JsonSchema;

export const fdnextFdbgenV1FullSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/fdnext-fdbgen-v1-full.schema.json",
  title: "fdnext fdbgen v1 full support list",
  type: "object",
  additionalProperties: false,
  required: ["v", "e", "cl"],
  properties: {
    v: {
      const: FDNEXT_FDBGEN_V1_FULL_VERSION
    },
    m: {
      $ref: "#/$defs/metadata"
    },
    cl: {
      type: "array",
      items: {
        $ref: "#/$defs/controller"
      }
    },
    e: {
      type: "array",
      items: {
        $ref: "#/$defs/fullEntry"
      }
    }
  },
  $defs: {
    metadata: {
      type: "object",
      additionalProperties: true
    },
    flashId: {
      type: "string",
      pattern: fdbgenV1FlashIdPattern
    },
    controllerName: {
      type: "string",
      minLength: 1
    },
    stringList: {
      type: "array",
      items: {
        type: "string",
        minLength: 1
      },
      uniqueItems: true
    },
    compactFields: {
      type: "object",
      properties: {
        pn: {
          type: "string",
          minLength: 1
        },
        id: {
          $ref: "#/$defs/flashId"
        },
        t: {
          type: "array",
          items: {
            $ref: "#/$defs/controllerName"
          },
          uniqueItems: true
        }
      }
    },
    fullEntry: {
      allOf: [
        {
          $ref: "#/$defs/compactFields"
        },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            pn: {
              type: "string",
              minLength: 1
            },
            id: {
              $ref: "#/$defs/flashId"
            },
            t: {
              type: "array",
              items: {
                $ref: "#/$defs/controllerName"
              },
              uniqueItems: true
            },
            vd: {
              type: "string",
              minLength: 1
            },
            c: {
              type: "string",
              minLength: 1
            },
            cap: {
              type: "string",
              minLength: 1
            },
            pkg: {
              type: "string",
              minLength: 1
            },
            w: {
              type: "string",
              minLength: 1
            },
            m: {
              $ref: "#/$defs/metadata"
            }
          }
        }
      ]
    },
    controller: {
      type: "object",
      additionalProperties: false,
      properties: {
        n: {
          $ref: "#/$defs/controllerName"
        },
        a: {
          $ref: "#/$defs/stringList"
        },
        mf: {
          type: "string",
          minLength: 1
        },
        if: {
          type: "string",
          minLength: 1
        },
        fw: {
          type: "string",
          minLength: 1
        },
        rev: {
          type: "string",
          minLength: 1
        },
        st: {
          type: "string",
          minLength: 1
        },
        m: {
          $ref: "#/$defs/metadata"
        }
      }
    }
  }
} as const satisfies JsonSchema;

export const fdnextFdbgenV1Schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/fdnext-fdbgen-v1.schema.json",
  title: "fdnext fdbgen v1 support list",
  oneOf: [fdnextFdbgenV1CompactSchema, fdnextFdbgenV1FullSchema]
} as const satisfies JsonSchema;

const partPayloadProperties = {
  id: {
    type: "array",
    items: {
      type: "string",
      pattern: flashIdPattern
    },
    uniqueItems: true
  },
  fid: {
    type: "array",
    items: {
      type: "string",
      pattern: flashIdPattern
    },
    uniqueItems: true
  },
  f: {
    type: "array",
    items: {
      type: "string",
      pattern: flashIdPattern
    },
    uniqueItems: true
  },
  a: {
    type: "array",
    items: {
      type: "string",
      minLength: 1
    },
    uniqueItems: true
  },
  l: {
    type: "string",
    minLength: 1
  },
  c: {
    type: "string",
    minLength: 1
  },
  t: {
    type: "array",
    items: {
      type: "string",
      minLength: 1
    },
    uniqueItems: true
  },
  m: {
    type: "string",
    minLength: 1
  },
  d: {
    type: "integer",
    minimum: 1
  },
  e: {
    type: "integer",
    minimum: 1
  },
  r: {
    type: "integer",
    minimum: 1
  },
  n: {
    type: "integer",
    minimum: 1
  }
} as const;

const generatedFlashIdArrayProperty = {
  type: "array",
  items: {
    type: "string",
    pattern: generatedFlashIdPattern
  },
  uniqueItems: true
} as const;

const fdbPartPayloadProperties = {
  ...partPayloadProperties,
  id: generatedFlashIdArrayProperty,
  f: generatedFlashIdArrayProperty,
  l: {
    ...partPayloadProperties.l,
    enum: nandDieProfileKeys
  },
  fid: false
} as const;

export const extraJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/fdnext.fdb.extra.v1.schema.json",
  title: FDNEXT_FDB_EXTRA_SCHEMA_VERSION,
  type: "object",
  properties: {
    schemaVersion: {
      const: FDNEXT_FDB_EXTRA_SCHEMA_VERSION
    },
    priority: {
      type: "number"
    },
    info: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: {
          type: "string"
        },
        website: {
          type: "string"
        },
        controllers: {
          type: "array",
          items: {
            type: "string",
            minLength: 1
          },
          uniqueItems: true
        }
      }
    },
    controllerBlacklist: {
      type: "array",
      items: {
        type: "string",
        minLength: 1
      },
      uniqueItems: true
    },
    vendors: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/vendorBucket"
      }
    },
    iddb: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/flashIdPayload"
      }
    }
  },
  additionalProperties: {
    $ref: "#/$defs/vendorBucket"
  },
  $defs: {
    partPayload: {
      type: "object",
      additionalProperties: false,
      properties: partPayloadProperties,
      not: {
        required: ["id", "fid"]
      }
    },
    vendorBucket: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/partPayload"
      }
    },
    flashIdPayload: {
      type: "object",
      additionalProperties: false,
      properties: {
        s: {
          type: "integer",
          minimum: 0
        },
        p: {
          type: "integer",
          minimum: 0
        },
        b: {
          type: "integer",
          minimum: 0
        },
        t: {
          type: "array",
          items: {
            type: "string",
            minLength: 1
          },
          uniqueItems: true
        },
        n: {
          type: "array",
          items: {
            type: "string",
            minLength: 1
          },
          uniqueItems: true
        }
      }
    }
  }
} as const satisfies JsonSchema;

export const fdbJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://itxtech.org/fdnext/schemas/fdnext.fdb.v1.schema.json",
  title: FDNEXT_FDB_SCHEMA_VERSION,
  type: "object",
  properties: {
    schemaVersion: {
      const: FDNEXT_FDB_SCHEMA_VERSION
    },
    info: {
      type: "object",
      additionalProperties: true
    },
    iddb: {
      type: "object",
      propertyNames: {
        pattern: generatedFlashIdPattern
      },
      additionalProperties: {
        $ref: "#/$defs/flashIdPayload"
      }
    }
  },
  additionalProperties: {
    $ref: "#/$defs/vendorBucket"
  },
  $defs: {
    partPayload: {
      type: "object",
      additionalProperties: false,
      properties: fdbPartPayloadProperties
    },
    vendorBucket: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/partPayload"
      }
    },
    flashIdPayload: {
      type: "object",
      additionalProperties: false,
      properties: {
        s: {
          type: "integer",
          minimum: 0
        },
        p: {
          type: "integer",
          minimum: 0
        },
        b: {
          type: "integer",
          minimum: 0
        },
        t: {
          type: "array",
          items: {
            type: "string",
            minLength: 1
          },
          uniqueItems: true
        },
        n: {
          type: "array",
          items: {
            type: "string",
            minLength: 1
          },
          uniqueItems: true
        }
      }
    }
  }
} as const satisfies JsonSchema;

export const fdnextFdbExtraV1Schema = extraJsonSchema;
export const fdnextFdbV1Schema = fdbJsonSchema;
