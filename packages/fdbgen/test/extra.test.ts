import assert from "node:assert/strict";
import { test } from "node:test";
import {
  auditExtra,
  buildFdnextFdbgenV1SupportList,
  extraJsonSchema,
  FDNEXT_FDB_EXTRA_SCHEMA_VERSION,
  FDNEXT_FDB_SCHEMA_VERSION,
  fdbJsonSchema,
  fdnextFdbExtraV1Schema,
  fdnextFdbgenV1Schema,
  fdnextFdbV1Schema,
  parseExtraPayload,
  validateExtraPayload,
  validateFdbPayload
} from "../src/index";

test("fdbgen exports schema helpers and builds v1 full support lists", () => {
  assert.equal(fdnextFdbgenV1Schema.$id, "https://itxtech.org/fdnext/schemas/fdnext-fdbgen-v1.schema.json");
  assert.equal(FDNEXT_FDB_EXTRA_SCHEMA_VERSION, "fdnext.fdb.extra.v1");
  assert.equal(FDNEXT_FDB_SCHEMA_VERSION, "fdnext.fdb.v1");
  assert.equal(extraJsonSchema.$id, "https://itxtech.org/fdnext/schemas/fdnext.fdb.extra.v1.schema.json");
  assert.equal(fdbJsonSchema.$id, "https://itxtech.org/fdnext/schemas/fdnext.fdb.v1.schema.json");
  assert.equal(fdnextFdbExtraV1Schema, extraJsonSchema);
  assert.equal(fdnextFdbV1Schema, fdbJsonSchema);

  const support = buildFdnextFdbgenV1SupportList(
    [
      {
        FlashName: " SDTNQGAMA-008G ",
        FlashID: "45 DE 94 93 76 57 00 00",
        SupportedControllers: ["SM3281", "SM3281"],
        Vendor: "Western Digital"
      }
    ],
    {
      full: true,
      metadata: { source: "unit-test" }
    }
  );

  assert.equal(support.v, "fdnext.fdbgen.v1f");
  assert.deepEqual(support.e, [
    {
      pn: "SDTNQGAMA-008G",
      id: "45DE949376570000",
      t: ["SM3281"],
      vd: "sndk"
    }
  ]);
  assert.deepEqual(support.cl, [{ n: "SM3281" }]);
  assert.deepEqual(support.m, { source: "unit-test" });
});

test("extra parser normalizes wrapper/direct vendors and rejects id/fid conflicts", () => {
  const parsed = parseExtraPayload({
    schemaVersion: "fdnext.fdb.extra.v1",
    sandisk: {
      "SDTNQGAMA-008G": {
        fid: ["45DE949376570000"],
        l: "BiCS3",
        c: "TLC"
      }
    },
    vendors: {
      Samsung: {
        K9ABG08U0M: {
          id: ["EC0011223344"],
          m: "CER"
        }
      },
      skhynix: {
        H27QFG8YHE: {
          id: ["AD0011223344"]
        }
      }
    }
  });

  assert.equal(parsed.schemaVersion, "fdnext.fdb.extra.v1");
  assert.deepEqual(Object.keys(parsed.vendors ?? {}).sort(), ["samsung", "skhynix", "sndk"]);
  assert.deepEqual(parsed.vendors?.sndk?.["SDTNQGAMA-008G"]?.fid, ["45DE94937657"]);
  assert.equal(parsed.vendors?.samsung?.K9ABG08U0M?.m, "CER");
  assert.deepEqual(parsed.vendors?.skhynix?.H27QFG8YHE?.id, ["AD0011223344"]);

  const conflict = validateExtraPayload({
    vendors: {
      samsung: {
        K9ABG08U0M: {
          id: ["EC0011223344"],
          fid: ["EC5566778899"]
        }
      }
    }
  });
  assert.equal(conflict.ok, false);
  assert.ok(conflict.errors.some((issue) => issue.code === "part.id_fid_conflict"));

  const invalidVersion = validateExtraPayload({
    schemaVersion: "fdnext.fdb.v1",
    vendors: {}
  });
  assert.equal(invalidVersion.ok, false);
  assert.ok(invalidVersion.errors.some((issue) => issue.code === "schema_version.invalid"));
});

test("generated fdb validator forbids fid and checks iddb reverse references", () => {
  const validation = validateFdbPayload({
    schemaVersion: "fdnext.fdb.v1",
    info: { version: "test" },
    samsung: {
      K9ABG08U0M: {
        fid: ["EC0011223344"]
      }
    },
    iddb: {
      EC0011223344: {
        n: ["samsung K9MISSING"]
      }
    }
  });

  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((issue) => issue.code === "part.fid_forbidden"));
  assert.ok(validation.errors.some((issue) => issue.code === "reference.missing_iddb_n"));

  const invalidVersion = validateFdbPayload({
    schemaVersion: "fdnext.fdb.extra.v1",
    info: { version: "test" },
    iddb: {}
  });
  assert.equal(invalidVersion.ok, false);
  assert.ok(invalidVersion.errors.some((issue) => issue.code === "schema_version.invalid"));
});

test("extra audit reports base extra, fdb, and decodepack conflicts", () => {
  const result = auditExtra(
    {
      vendors: {
        samsung: {
          K9ABG08U0M: {
            fid: ["EC0011223344"],
            l: "V6",
            c: "TLC",
            d: 2
          }
        }
      }
    },
    {
      baseExtra: {
        vendors: {
          samsung: {
            K9ABG08U0M: {
              id: ["ECFFFFFFFFFF"],
              t: ["SM3281"]
            }
          }
        }
      },
      baseFdb: {
        info: { version: "test" },
        samsung: {
          K9ABG08U0M: {
            id: ["EC123456789A"]
          },
          K9OTHER08U0M: {
            id: ["EC0011223344"]
          }
        },
        iddb: {
          EC123456789A: {
            t: ["SM3281"],
            n: ["samsung K9ABG08U0M"]
          },
          EC0011223344: {
            n: ["samsung K9OTHER08U0M"]
          }
        }
      },
      decodePart: () => ({
        status: "ok",
        vendor: "skhynix",
        fields: {
          process_node: "V5",
          cell_level: "MLC",
          die_count: 1
        }
      })
    }
  );

  const codes = new Set(result.issues.map((issue) => issue.code));
  assert.ok(codes.has("extra.fid_overrides_base"));
  assert.ok(codes.has("fdb.id_override"));
  assert.ok(codes.has("fdb.override_controller_support"));
  assert.ok(codes.has("fdb.id_fanout"));
  assert.ok(codes.has("decodepack.vendor_conflict"));
  assert.ok(codes.has("decodepack.process_conflict"));
  assert.ok(codes.has("decodepack.cell_conflict"));
  assert.ok(codes.has("decodepack.topology_conflict"));
});
