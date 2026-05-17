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
  normalizeGeneratedFdbDieProfile,
  normalizeFdbPartNumber,
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
        fid: ["EC0011223344"],
        l: "sky-process"
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
  assert.ok(validation.errors.some((issue) => issue.code === "part.invalid_die_profile"));
  assert.ok(validation.errors.some((issue) => issue.code === "reference.missing_iddb_n"));

  const vendorMismatch = validateFdbPayload({
    schemaVersion: "fdnext.fdb.v1",
    info: { version: "test" },
    micron: {
      MT29F128G08EBEBB: {
        id: ["89844432AA04"]
      }
    },
    intel: {
      PF29F32B2ALCMG2: {
        id: ["89844432AA04"]
      }
    },
    iddb: {
      "89844432AA04": {
        n: ["micron MT29F128G08EBEBB", "intel PF29F32B2ALCMG2"]
      }
    }
  });
  assert.equal(vendorMismatch.ok, false);
  assert.ok(vendorMismatch.errors.some((issue) => issue.code === "part.flash_id_vendor_mismatch"));
  assert.ok(vendorMismatch.errors.some((issue) => issue.code === "iddb.flash_id_vendor_mismatch"));

  const specTekMicronException = validateFdbPayload({
    schemaVersion: "fdnext.fdb.v1",
    info: { version: "test" },
    micron: {
      MT29F128G08EBEBB: {
        id: ["B5844432AA04"]
      }
    },
    spectek: {
      FBNL06B256G1KDBAB: {
        id: ["2C844863A904"]
      }
    },
    iddb: {
      B5844432AA04: {
        n: ["micron MT29F128G08EBEBB", "spectek FBNL06B256G1KDBAB"]
      },
      "2C844863A904": {
        n: ["micron MT29F128G08EBEBB", "spectek FBNL06B256G1KDBAB"]
      }
    }
  });
  assert.equal(specTekMicronException.ok, true);

  const validProfile = validateFdbPayload({
    schemaVersion: "fdnext.fdb.v1",
    info: { version: "test" },
    micron: {
      MT29F256G08CBCBB: {
        id: ["2CA46432AA04"],
        l: "B16A"
      }
    },
    iddb: {
      "2CA46432AA04": {
        n: ["micron MT29F256G08CBCBB"]
      }
    }
  });
  assert.equal(validProfile.ok, true);

  const invalidVersion = validateFdbPayload({
    schemaVersion: "fdnext.fdb.extra.v1",
    info: { version: "test" },
    iddb: {}
  });
  assert.equal(invalidVersion.ok, false);
  assert.ok(invalidVersion.errors.some((issue) => issue.code === "schema_version.invalid"));
});

test("normalizes generated FDB l fields to NAND die profile keys", () => {
  assert.equal(normalizeGeneratedFdbDieProfile("ymtc", "3Dv3-TAS-128L(x2-9060)", "TLC"), "TAS");
  assert.equal(normalizeGeneratedFdbDieProfile("ymtc", "128L(X2-9060)", "TLC"), "TAS");
  assert.equal(normalizeGeneratedFdbDieProfile("ymtc", "YMTC WTS(X4-9060)", "TLC"), "WTS");
  assert.equal(normalizeGeneratedFdbDieProfile("sndk", "96L BiCS4", "TLC"), "SBiCS4");
  assert.equal(normalizeGeneratedFdbDieProfile("skhynix", "128L 3Dv6", "TLC"), "HYV6");
  assert.equal(normalizeGeneratedFdbDieProfile("skhynix", "H25FTB0", "TLC"), "HYV6");
  assert.equal(normalizeGeneratedFdbDieProfile("skhynix", "H25GQM0", "QLC"), "HYV5Q");
  assert.equal(normalizeGeneratedFdbDieProfile("skhynix", "H27DGS8", "MLC"), "HYV2");
  assert.equal(normalizeGeneratedFdbDieProfile("skhynix", "238L 3DV8", "QLC"), "HYV8Q");
  assert.equal(normalizeGeneratedFdbDieProfile("unknown", "3DV4", "TLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("unknown", "3DV4P5", "TLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("unknown", "1ynm", "TLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("unknown", "1znm", "MLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("unknown", "A19nm", "MLC"), "A19nm");
  assert.equal(normalizeGeneratedFdbDieProfile("micron", "B74", "TLC"), "B74A");
  assert.equal(normalizeGeneratedFdbDieProfile("micron", "B95", "TLC"), "B95A");
  assert.equal(normalizeGeneratedFdbDieProfile("micron", "L62", "MLC"), "L62A");
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L74", "MLC"), "L74A");
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "25nm", "MLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "34nm", "MLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L84", "MLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L84A", "MLC"), "L84A");
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L84C", "MLC"), "L84C");
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L85", "MLC"), undefined);
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L85A", "MLC"), "L85A");
  assert.equal(normalizeGeneratedFdbDieProfile("intel", "L85C", "MLC"), "L85C");
  assert.equal(normalizeGeneratedFdbDieProfile("spectek", "L06", "MLC"), "L06B");
  assert.equal(normalizeGeneratedFdbDieProfile("micron", "M70", "SLC"), "M70M");

  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-fdbgen-profile-"));
  try {
    mkdirSync(join(inputDir, "extra"), { recursive: true });
    writeFileSync(
      join(inputDir, "extra", "sky.json"),
      JSON.stringify({
        schemaVersion: "fdnext.fdb.extra.v1",
        vendors: {
          ymtc: {
            YMN09TC1B1DC6C: {
              fid: ["9BC529492000"],
              l: "3Dv3-TAS-128L(x2-9060)",
              c: "TLC"
            }
          }
        }
      }),
      "utf8"
    );

    const fdb = generateFdb({ inputDir, version: "test" });
    const ymtc = fdb.ymtc as Record<string, { l?: string }>;
    assert.equal(ymtc.YMN09TC1B1DC6C?.l, "TAS");
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});

test("fdbgen keeps specific die profiles and drops Intel fallback litho", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-fdbgen-litho-"));
  try {
    mkdirSync(join(inputDir, "vendors"), { recursive: true });
    writeFileSync(
      join(inputDir, "fdb.json"),
      JSON.stringify({
        info: { version: "raw" },
        micron: {
          MT29F64G08EBAAA: {
            id: ["2C88085F2800"],
            l: "B74A",
            c: "TLC",
            t: ["RAWCTRL"]
          }
        },
        intel: {
          PF29F64B2AMCTH2: {
            id: ["89A46432AA04"],
            l: "25nm",
            c: "MLC",
            t: ["RAWCTRL"]
          }
        },
        iddb: {
          "2C88085F2800": {
            t: ["RAWCTRL"]
          },
          "89A46432AA04": {
            t: ["RAWCTRL"]
          }
        }
      }),
      "utf8"
    );
    writeFileSync(
      join(inputDir, "vendors", "micron.json"),
      JSON.stringify({
        MT29F64G08EBAAA: {
          id: ["2C88085F2800"],
          l: "25nm",
          c: "TLC",
          t: ["NEWCTRL"]
        }
      }),
      "utf8"
    );

    const fdb = generateFdb({ inputDir, version: "test" });
    const micron = fdb.micron as Record<string, { l?: string }>;
    const intel = fdb.intel as Record<string, { l?: string }>;
    assert.equal(micron.MT29F64G08EBAAA?.l, "B74A");
    assert.equal(intel.PF29F64B2AMCTH2?.l, undefined);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});

test("fdbgen prunes cross-vendor PN ids and iddb references", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-fdbgen-id-owner-"));
  try {
    writeFileSync(
      join(inputDir, "fdb.json"),
      JSON.stringify({
        info: { version: "raw" },
        micron: {
          MT29F128G08EBEBB: {
            id: ["2C844863A904", "89844432AA04", "B5844432AA04"],
            t: ["RAWCTRL"]
          }
        },
        intel: {
          PF29F32B2ALCMG2: {
            id: ["2C844863A904", "89844432AA04", "B5844432AA04"],
            t: ["RAWCTRL"]
          }
        },
        spectek: {
          FBNL06B256G1KDBAB: {
            id: ["2C844863A904", "89844432AA04", "B5844432AA04"],
            t: ["RAWCTRL"]
          }
        },
        iddb: {
          "2C844863A904": {
            t: ["RAWCTRL"],
            n: ["micron MT29F128G08EBEBB", "intel PF29F32B2ALCMG2", "spectek FBNL06B256G1KDBAB"]
          },
          "89844432AA04": {
            t: ["RAWCTRL"],
            n: ["micron MT29F128G08EBEBB", "intel PF29F32B2ALCMG2", "spectek FBNL06B256G1KDBAB"]
          },
          B5844432AA04: {
            t: ["RAWCTRL"],
            n: ["micron MT29F128G08EBEBB", "intel PF29F32B2ALCMG2", "spectek FBNL06B256G1KDBAB"]
          }
        }
      }),
      "utf8"
    );

    const fdb = generateFdb({ inputDir, version: "test" });
    const micron = fdb.micron as Record<string, { id?: string[] }>;
    const intel = fdb.intel as Record<string, { id?: string[] }>;
    const spectek = fdb.spectek as Record<string, { id?: string[] }>;
    const iddb = fdb.iddb as Record<string, { n?: string[] }>;
    assert.deepEqual(micron.MT29F128G08EBEBB?.id, ["2C844863A904", "B5844432AA04"]);
    assert.deepEqual(intel.PF29F32B2ALCMG2?.id, ["89844432AA04"]);
    assert.deepEqual(spectek.FBNL06B256G1KDBAB?.id, ["2C844863A904", "B5844432AA04"]);
    assert.deepEqual(iddb["2C844863A904"]?.n, ["micron MT29F128G08EBEBB", "spectek FBNL06B256G1KDBAB"]);
    assert.deepEqual(iddb["89844432AA04"]?.n, ["intel PF29F32B2ALCMG2"]);
    assert.deepEqual(iddb.B5844432AA04?.n, ["micron MT29F128G08EBEBB", "spectek FBNL06B256G1KDBAB"]);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});

test("normalizes SK hynix H25T package suffixes before FDB ingestion", () => {
  assert.equal(normalizeFdbPartNumber("H25T2TB88E-X321-N"), "H25T2TB88E");
  assert.equal(normalizeFdbPartNumber("H25T1TD48C-X630"), "H25T1TD48C");
  assert.equal(normalizeFdbPartNumber("GEN2-X321"), "");

  const parsed = parseExtraPayload({
    vendors: {
      skhynix: {
        "H25T2TB88E-X321-N": {
          id: ["AD5E28011000"],
          l: "HYV6",
          c: "TLC"
        }
      }
    }
  });

  assert.ok(parsed.vendors?.skhynix?.H25T2TB88E);
  assert.equal(parsed.vendors?.skhynix?.["H25T2TB88E-X321-N"], undefined);
});

test("trims overlong structured YMTC, Samsung, and Intel part numbers", () => {
  assert.equal(normalizeFdbPartNumber("YMN09TC1B1DC6CHUS"), "YMN09TC1B1DC6C");
  assert.equal(normalizeFdbPartNumber("YMN09TC1B1DCADWYS"), "YMN09TC1B1DCAD");
  assert.equal(normalizeFdbPartNumber("YMN09TC1B1DC6C_64GB(TAS)"), "YMN09TC1B1DC6C");
  assert.equal(normalizeFdbPartNumber("K9OKGY8S7C2"), "K9OKGY8S7C");
  assert.equal(normalizeFdbPartNumber("K9OKG8S7C"), "K9OKG8S7C");
  assert.equal(normalizeFdbPartNumber("PF29F04T2AOCTH13"), "PF29F04T2AOCTH1");
  assert.equal(normalizeFdbPartNumber("PF29F16T2AWCQH1MICRON"), "PF29F16T2AWCQH1");
  assert.equal(normalizeFdbPartNumber("PF29F16B08LCMF3-016G"), "PF29F16B08LCMF3");
  assert.equal(normalizeFdbPartNumber("29F01T2ALCQH1"), "PF29F01T2ALCQH1");
  assert.equal(normalizeFdbPartNumber("29F04T2AOCTH1"), "PF29F04T2AOCTH1");
  assert.equal(normalizeFdbPartNumber("29F16B08LCMF3"), "29F16B08LCMF3");
  assert.equal(normalizeFdbPartNumber("29F4T08GBCAG"), "");
  assert.equal(normalizeFdbPartNumber("PF29F4T08GBCAG"), "");
  assert.equal(normalizeFdbPartNumber("29F512G08EBHAF"), "");
  assert.equal(normalizeFdbPartNumber("29F1T08GBLBE"), "");
  assert.equal(normalizeFdbPartNumber("29F2T08CUCBB"), "");
  assert.equal(normalizeFdbPartNumber("PF29F2T08CUCBB"), "");
  assert.equal(normalizeFdbPartNumber("MT29F01T2ALCQK1"), "");
  assert.equal(normalizeFdbPartNumber("MT29F512G08EBHAF"), "MT29F512G08EBHAF");
});

test("fdbgen drops malformed and cross-vendor raw NAND PN pollution", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-fdbgen-cross-vendor-"));
  try {
    writeFileSync(
      join(inputDir, "fdb.json"),
      JSON.stringify({
        info: { version: "raw" },
        samsung: {
          K9OKGY8S7C2: {
            id: ["EC1A881F70C8"],
            t: ["SM2259XT"]
          },
          K9OKG8S7C: {
            id: ["EC1A881F70C8"],
            t: ["SM2259XT"]
          },
          K9AFGD8HXX: {
            id: ["EC1A882172C8"],
            t: ["SM2259XT"]
          }
        },
        intel: {
          MT29F01T2ALCQJ1: {
            id: ["89D31C32C600"],
            t: ["SM2259XT"]
          },
          "29F01T2ALCQH1": {
            id: ["89D40C32AA00"],
            t: ["SM2259XT"]
          },
          "29F4T08GBCAG": {
            id: ["89D31C32C600"],
            t: ["SM2259XT"]
          },
          PF29F4T08GBCAG: {
            id: ["89CB9832C600"],
            t: ["SM2259XT"]
          },
          "29F512G08EBHAF": {
            id: ["89C40832A600"],
            t: ["SM2259XT"]
          },
          "29F1T08GBLBE": {
            id: ["89D31C32C600"],
            t: ["SM2259XT"]
          },
          "29F2T08CUCBB": {
            id: ["89C4E532AA01"],
            t: ["SM2259XT"]
          },
          PF29F2T08CUCBB: {
            id: ["89C4E532AA01"],
            t: ["SM2259XT"]
          }
        },
        micron: {
          MT29F01T2ALCQK1: {
            id: ["2CD31C32C600"],
            t: ["SM2259XT"]
          },
          "29F512G08EBHAF": {
            id: ["2CC40832A600"],
            t: ["SM2259XT"]
          }
        },
        iddb: {
          EC1A881F70C8: {
            t: ["SM2259XT"]
          },
          "89D31C32C600": {
            t: ["SM2259XT"]
          },
          "89D40C32AA00": {
            t: ["SM2259XT"]
          },
          "2CC40832A600": {
            t: ["SM2259XT"]
          },
          "89C4E532AA01": {
            t: ["SM2259XT"]
          }
        }
      }),
      "utf8"
    );

    const fdb = generateFdb({ inputDir, version: "test" });
    const samsung = fdb.samsung as Record<string, unknown> | undefined;
    const intel = fdb.intel as Record<string, unknown> | undefined;
    const micron = fdb.micron as Record<string, unknown> | undefined;
    const flash = (fdb.iddb as Record<string, { n?: string[] }> | undefined)?.EC1A881F70C8;
    assert.ok(samsung?.K9OKGY8S7C);
    assert.equal(samsung?.K9OKGY8S7C2, undefined);
    assert.equal(samsung?.K9OKG8S7C, undefined);
    assert.equal(samsung?.K9AFGD8HXX, undefined);
    assert.ok(flash?.n?.includes("samsung K9OKGY8S7C"));
    assert.equal(flash?.n?.includes("samsung K9OKG8S7C"), false);
    assert.equal(flash?.n?.includes("samsung K9AFGD8HXX"), false);
    assert.equal(intel?.MT29F01T2ALCQJ1, undefined);
    assert.equal(intel?.["29F01T2ALCQH1"], undefined);
    assert.ok(intel?.PF29F01T2ALCQH1);
    assert.equal(intel?.["29F4T08GBCAG"], undefined);
    assert.equal(intel?.PF29F4T08GBCAG, undefined);
    assert.equal(intel?.["29F1T08GBLBE"], undefined);
    assert.equal(intel?.["29F2T08CUCBB"], undefined);
    assert.equal(intel?.PF29F2T08CUCBB, undefined);
    assert.equal(micron?.MT29F01T2ALCQJ1, undefined);
    assert.equal(micron?.MT29F01T2ALCQK1, undefined);
    assert.equal(micron?.["29F512G08EBHAF"], undefined);
    assert.equal(intel?.["29F512G08EBHAF"], undefined);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
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

test("extra audit ignores ID overrides protected by higher-priority base extra", () => {
  const result = auditExtra(
    {
      schemaVersion: "fdnext.fdb.extra.v1",
      priority: 50,
      vendors: {
        micron: {
          MT29F256G08CBCBB: {
            id: ["2CA46432AA05"],
            l: "32L(L06B)"
          }
        }
      }
    },
    {
      baseExtra: {
        schemaVersion: "fdnext.fdb.extra.v1",
        priority: 100,
        vendors: {
          micron: {
            MT29F256G08CBCBB: {
              id: ["2CA46432AA04"],
              l: "L06B"
            }
          }
        }
      },
      baseFdb: {
        info: { version: "test" },
        micron: {
          MT29F256G08CBCBB: {
            id: ["2CA46432AA04"]
          }
        },
        iddb: {
          "2CA46432AA04": {
            t: ["SM3281"],
            n: ["micron MT29F256G08CBCBB"]
          }
        }
      }
    }
  );

  const codes = new Set(result.issues.map((issue) => issue.code));
  assert.equal(codes.has("extra.base_id_conflict"), false);
  assert.equal(codes.has("extra.base_field_conflict"), false);
  assert.equal(codes.has("fdb.id_override"), false);
  assert.equal(codes.has("fdb.override_controller_support"), false);
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
              l: "3D B16A"
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
    assert.equal(micron.MT29F256G08CBCBB?.l, "B16A");
    assert.deepEqual(micron.MT29F512G08EBHAF?.id, ["2C0011223344"]);
    assert.equal(micron.MT29F512G08EBHAF?.fid, undefined);
    assert.equal(micron.MT29F512G08EBHAF?.l, undefined);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});
