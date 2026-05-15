import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  generateFdb,
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
    priority: 50,
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
  assert.equal(parsed.priority, 50);
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

  const invalidPriority = validateExtraPayload({
    priority: "high",
    vendors: {}
  });
  assert.equal(invalidPriority.ok, false);
  assert.ok(invalidPriority.errors.some((issue) => issue.code === "priority.invalid"));
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

test("fdbgen discovers input extra directory and keeps higher-priority extra IDs", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-fdbgen-extra-"));
  try {
    mkdirSync(join(inputDir, "extra"), { recursive: true });
    writeFileSync(
      join(inputDir, "fdb.json"),
      JSON.stringify({
        info: { version: "raw" },
        micron: {
          MT29F256G08CBCBB: {
            id: ["2CA46432AA05"]
          },
          MT29F512G08EBHAF: {
            id: ["2C9999999999"]
          }
        },
        iddb: {
          "2CA46432AA05": {
            t: ["RAWCTRL"],
            n: ["micron MT29F256G08CBCBB"]
          },
          "2C9999999999": {
            t: ["RAWCTRL"],
            n: ["micron MT29F512G08EBHAF"]
          }
        }
      }),
      "utf8"
    );
    writeFileSync(
      join(inputDir, "extra", "z-base.json"),
      JSON.stringify({
        schemaVersion: "fdnext.fdb.extra.v1",
        priority: 100,
        vendors: {
          micron: {
            MT29F256G08CBCBB: {
              id: ["2CA46432AA04"],
              t: ["BASECTRL"]
            }
          }
        },
        iddb: {
          "2CA46432AA04": {
            t: ["BASECTRL"]
          }
        }
      }),
      "utf8"
    );
    writeFileSync(
      join(inputDir, "extra", "a-sky.json"),
      JSON.stringify({
        schemaVersion: "fdnext.fdb.extra.v1",
        priority: 50,
        vendors: {
          micron: {
            MT29F256G08CBCBB: {
              id: ["2CA46432AA05"],
              l: "sky-process"
            },
            MT29F512G08EBHAF: {
              id: ["2C0011223344"],
              l: "sky-process"
            }
          }
        },
        iddb: {
          "2C0011223344": {
            t: ["SKYCTRL"]
          }
        }
      }),
      "utf8"
    );

    const fdb = generateFdb({ inputDir, version: "test" });
    const micron = fdb.micron as Record<string, { id?: string[]; fid?: string[]; l?: string; t?: string[] }>;
    assert.deepEqual(micron.MT29F256G08CBCBB?.id, ["2CA46432AA04"]);
    assert.equal(micron.MT29F256G08CBCBB?.fid, undefined);
    assert.equal(micron.MT29F256G08CBCBB?.l, "sky-process");
    assert.deepEqual(micron.MT29F512G08EBHAF?.id, ["2C0011223344"]);
    assert.equal(micron.MT29F512G08EBHAF?.fid, undefined);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});
