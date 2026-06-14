import assert from "node:assert/strict";
import test from "node:test";
import { createEngine, type FdnextResourceBundle } from "../../src/index";
import { checkDecodePack, compileDecodePack, explainPartDecode, type DecodePack } from "../../src/decodepack";

const profileMetaPack = {
  sharedTables: {
    "nand.die_profile": {
      B16A: {
        die_codename: "B16A",
        generation_info: "FG",
        layer_count: 32
      },
      B17A: {
        die_codename: "B17A",
        generation_info: "FG",
        layer_count: 32
      }
    }
  },
  partSpecs: [
    {
      id: "test.part.profile-key",
      match: { kind: "prefix", value: "B16A" },
      tokenDecoder: {
        tables: {
          profile: {
            B16A: { die_codename: "B16A" }
          }
        },
        steps: [
          {
            op: "takeLongest",
            table: "profile",
            to: "profile",
            keyTo: "profileKey"
          }
        ],
        assign: {
          "device.vendor": "micron",
          "device.chipKind": "raw_nand",
          "device.partNumber": { "$var": "partNumber" },
          "fields.die_codename": { "$path": "profile.die_codename" },
          "meta.nandDieProfileKey": { "$var": "profileKey" }
        }
      }
    },
    {
      id: "test.part.profile-map-key",
      match: { kind: "prefix", value: "MAP" },
      tokenDecoder: {
        steps: [
          { op: "take", len: 3, to: "prefix" },
          { op: "take", len: 4, to: "profileCode" },
          {
            op: "map",
            from: "profileCode",
            table: "nand.die_profile",
            to: "profile"
          }
        ],
        assign: {
          "device.vendor": "micron",
          "device.chipKind": "raw_nand",
          "device.partNumber": { "$var": "partNumber" },
          "fields.die_codename": { "$path": "profile.die_codename" },
          "meta.nandDieProfileKey": { "$var": "profileCode" }
        }
      }
    }
  ],
  identifierSpecs: [
    {
      id: "test.identifier.profile-key",
      idScheme: "nand.flash_id",
      match: { kind: "regex", value: "^[0-9A-F]{12}$" },
      vendor: "micron",
      definition: {
        "1": {
          die_codename: {
            dq: [0],
            def: {
              "0": "B16A",
              "1": "B17A"
            }
          },
          "meta.nandDieProfileKey": {
            from: "die_codename"
          }
        }
      }
    }
  ]
} satisfies DecodePack;

const emptyResources = {
  partIndex: {
    rawNand: {},
    managedNand: [],
    dram: []
  },
  identifierIndex: {
    nandFlash: {}
  },
  markingIndex: {
    packageMarkings: {}
  },
  vendorIndex: {},
  controllerIndex: {},
  translationIndex: {}
} satisfies FdnextResourceBundle;

test("part token decoder can assign matched profile table key to draft metadata", () => {
  assert.deepEqual(checkDecodePack(profileMetaPack).findings, []);
  const [decoder] = compileDecodePack(profileMetaPack).partDecoders;
  const draft = decoder?.decode("B16ATEST");
  assert.equal(draft?.fields?.die_codename, "B16A");
  assert.equal(draft?.meta?.nandDieProfileKey, "B16A");

  const explain = explainPartDecode(profileMetaPack, "B16ATEST", { specId: "test.part.profile-key" });
  assert.equal(explain.steps.find((step) => step.op === "takeLongest")?.key, "B16A");
});

test("part map step can reuse a shared profile table key as draft metadata", () => {
  const decoder = compileDecodePack(profileMetaPack).partDecoders.find((item) => item.id === "test.part.profile-map-key");
  const draft = decoder?.decode("MAPB17A");
  assert.equal(draft?.fields?.die_codename, "B17A");
  assert.equal(draft?.meta?.nandDieProfileKey, "B17A");
});

test("identifier decoder can reuse a decoded profile key as metadata", () => {
  const [decoder] = compileDecodePack(profileMetaPack).identifierDecoders;
  const draft = decoder?.decode("000000000000");
  assert.equal(draft?.fields?.die_codename, "B16A");
  assert.equal(draft?.meta?.nandDieProfileKey, "B16A");
});

test("engine draft decode exposes DecodePack profile metadata", () => {
  const engine = createEngine({ resources: emptyResources });
  const part = engine.decodePartDraft({ query: "K9AAGD8U0B", constraints: { vendor: "samsung" } });
  const identifier = engine.decodeIdentifierDraft({ query: "ECD788BF90C5", idScheme: "nand.flash_id" });
  assert.equal(part?.meta?.nandDieProfileKey, "SS19");
  assert.equal(identifier?.meta?.nandDieProfileKey, "SS19");
});

test("engine draft decode canonicalizes explicit identifier profile metadata only", () => {
  const engine = createEngine({ resources: emptyResources });
  for (const [id, expected] of [
    ["ECC1843200C1", "SSV6M"],
    ["EC51DD1F88CB", "SSV4Q"],
    ["AD3A84320040", "HY16M"],
    ["AD892D5330A0", "HYV5Q"],
    ["AD780C5B30E0", "HYV9Q"],
    ["984C84320024", "KBiCS5M"],
    ["983AA0B17EE3", "KBiCS4S"],
    ["454C84320024", "SBiCS5M"]
  ] as const) {
    const identifier = engine.decodeIdentifierDraft({ query: id, idScheme: "nand.flash_id" });
    assert.equal(identifier?.meta?.nandDieProfileKey, expected, `${id} canonical identifier profile metadata`);
  }

  for (const id of ["2CC40832A600", "89092B32C200", "9BD5588D2000"]) {
    const identifier = engine.decodeIdentifierDraft({ query: id, idScheme: "nand.flash_id" });
    assert.equal(identifier?.meta?.nandDieProfileKey, undefined, `${id} should not invent identifier profile metadata`);
  }
});
