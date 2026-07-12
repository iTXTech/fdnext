import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSearchPnIncludes,
  compiledPack,
  detect,
  partNumberPnJson,
  resourceEntries,
  skhynixHn8RuleIds
} from "./_helpers";
import mdbJson from "../../../resources/mdb.json" with { type: "json" };
import { micronMdbCoverage } from "../_micron-mdb-coverage";

const partNumberPn = resourceEntries(partNumberPnJson);
const partNumberPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);
const skhynixExactSearchOnlyPn = new Set(["HN8T039JHQX099N"]);

const micronCatalogSeeds = {
  eMMC: [
    "MTFC32GBCAQTC-AIT",
    "MTFC128GAZAQJP-AAT",
    "MTFC128GAZAQJP-AIT",
    "MTFC32GAZAQDW-AAT",
    "MTFC32GBCAQTC-IT",
    "MTFC32GAZAQHD-WT",
    "MTFC64GAZAQHD-AIT",
    "MTFC128GBCAQTC-WT",
    "MTFC32GAZAQHD-IT",
    "MTFC64GAZAQHD-IT",
    "MTFC32GBCAQDQ-AAT",
    "MTFC32GAZAQHD-AAT",
    "MTFC32GBCAQTC-WT",
    "MTFC32GAZAQHD-AIT",
    "MTFC64GBCAQTC-WT",
    "MTFC64GAZAQHD-AAT",
    "MTFC256GBCAQTC-WT",
    "MTFC128GAZAQJP-IT",
    "MTFC32GAKAEEF-AIT",
    "MTFC64GAZAQHD-WT",
    "MTFC16GAKAEEF-AIT",
    "MTFC64GAJAEDQ-AIT",
    "MTFC32GAKAEDQ-AIT",
    "MTFC8GAMALBH-IT"
  ],
  UFS: [
    "MTFC64GBCAVAL-AAT",
    "MTFC256GBCAVTC-AIT",
    "MTFC128GBCAVTC-AIT",
    "MTFC512GBCAVTC-AAT",
    "MTFC128GBCAVTC-AAT",
    "MTFC512GBCAVTC-AIT",
    "MTFC128GAVATTC-IT",
    "MTFC256GBAAVHF-WT",
    "MTFC256GARATEA-WT",
    "MTFC128GAVAUTC-IT",
    "MTFC128GAVATTC-AIT",
    "MTFC256GAVATTC-IT",
    "MTFC128GARATEA-WT",
    "MTFC512GAVATTC-AAT",
    "MTFC256GAVATTC-AIT",
    "MTFC128GBAAVHF-WT",
    "MTFC512GAVATTC-IT",
    "MTFC256GAZAOTD-AAT"
  ]
} as const;

test("part-number resource exposes minimal keyed PN entries", () => {
  assert.ok(Array.isArray(partNumberPnJson), "part-number PN resource should be a top-level minimal array");
  const seenPartNumberPn = new Set<string>();
  for (const entry of partNumberPn) {
    assert.equal(typeof entry, "object", "part-number PN entry should be an object");
    assert.ok(entry !== null && !Array.isArray(entry), "part-number PN entry should be keyed");
    const record = entry as Record<string, unknown>;
    assert.equal(typeof record.pn, "string", "part-number PN entry should include pn");
    assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
    assert.deepEqual(Object.keys(record).sort(), ["pn", "vendor"], `${String(record.pn)} should only include vendor and pn`);
    const key = `${String(record.vendor)}\0${String(record.pn)}`;
    assert.ok(!seenPartNumberPn.has(key), `${String(record.pn)} should only appear once for ${String(record.vendor)}`);
    seenPartNumberPn.add(key);

    const keys = Object.keys(record);
    assert.deepEqual(
      keys.filter((key) => partNumberPnForbiddenKeys.has(key)),
      [],
      `part-number PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
    );
  }
});

test("Micron managed NAND PN seeds do not duplicate valid MDB mappings", () => {
  for (const entry of partNumberPnJson.filter((item) => item.vendor === "micron")) {
    assert.deepEqual(
      micronMdbCoverage(mdbJson, entry.pn),
      [],
      `${entry.pn} should stay out of managed-nand-pn.json when valid mdb.json data has the same or a more detailed PN`
    );
  }
});

test("Micron official catalog seeds are searchable and decode their product line and density", () => {
  const resourcePn = new Set(partNumberPn.flatMap((entry) => {
    const record = entry as Record<string, unknown>;
    return record.vendor === "micron" && typeof record.pn === "string" ? [record.pn] : [];
  }));

  for (const [expectedType, partNumbers] of Object.entries(micronCatalogSeeds)) {
    for (const pn of partNumbers) {
      assert.ok(resourcePn.has(pn), `${pn} should be present in the managed NAND search resource`);
      assert.deepEqual(micronMdbCoverage(mdbJson, pn), [], `${pn} should not duplicate a valid MDB mapping`);
      assert.doesNotMatch(pn, /\bES\b|^MTFC(?:513|51G)/, `${pn} should not be an ES or malformed catalog PN`);

      const info = detect(pn);
      const densityGb = Number(/^MTFC(\d+)G/.exec(pn)?.[1]);
      assert.equal(info.vendor, "micron", `${pn} should decode as Micron`);
      assert.equal(info.type, expectedType, `${pn} should decode as ${expectedType}`);
      assert.equal(info.densityMbit, densityGb * 8192, `${pn} should decode its catalog density`);
      assertSearchPnIncludes(pn, `Micron ${pn}`);
    }
  }
});

test("Micron MDB coverage requires a valid exact PN or suffix boundary", () => {
  const fixture = {
    micron: {
      AAAAA: "MT62F1G32D4DS-031 WT:B",
      AAAAB: "MTFC64GBCAQTC-AAT",
      AAAAC: "MTFC128GAXATEA-WT DO NOT USE"
    }
  };
  assert.deepEqual(
    micronMdbCoverage(fixture, "MT62F1G32D4DS"),
    ["MT62F1G32D4DS-031 WT:B"],
    "a valid MDB PN with a suffix boundary should cover its shorter seed"
  );
  assert.deepEqual(
    micronMdbCoverage(fixture, "MTFC64G"),
    [],
    "a body-token prefix without a suffix boundary should not count as MDB coverage"
  );
  assert.deepEqual(
    micronMdbCoverage(fixture, "MTFC128GAXATEA-WT"),
    [],
    "DO NOT USE MDB values should not cover a PN seed"
  );
});

test("known SK hynix UFS PN resources decode with a single HN8 datasheet rule", () => {
  const knownSkhynixUfsPn = partNumberPn.flatMap((entry) => {
    const record = entry as Record<string, unknown>;
    const vendor = String(record.vendor);
    const pn = String(record.pn);
    return vendor === "skhynix" && /^(?:H28[SU]|HN8)/.test(pn) && !skhynixExactSearchOnlyPn.has(pn) ? [pn] : [];
  });
  assert.ok(knownSkhynixUfsPn.length > 0, "known SK hynix UFS PN resource should include H28S/H28U/HN8 entries");
  for (const pn of knownSkhynixUfsPn) {
    const info = detect(pn);
    assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
    assert.equal(info.type, "UFS", `${pn} should decode as SK hynix UFS`);
    assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a UFS density`);
    if (pn.startsWith("HN8")) {
      const hn8Matches = compiledPack.partDecoders.filter((decoder) => skhynixHn8RuleIds.has(decoder.id) && decoder.match(pn));
      assert.equal(hn8Matches.length, 1, `${pn} should match exactly one SK hynix HN8 datasheet rule`);
    }
  }
});

test("single-body SK hynix UFS evidence stays search-only instead of creating a one-off decoder", () => {
  for (const pn of skhynixExactSearchOnlyPn) {
    assert.ok(
      partNumberPnJson.some((entry) => entry.vendor === "skhynix" && entry.pn === pn),
      `${pn} should remain in the exact PN search resource`
    );
    assertSearchPnIncludes(pn, `SKhynix ${pn}`);
    const info = detect(pn);
    assert.equal(info.vendor, "skhynix", `${pn} should retain its externally confirmed vendor`);
    assert.equal(info.type, "unknown", `${pn} should not gain a full-body decoder from one external sample`);
    assert.equal(info.densityMbit, undefined, `${pn} should not guess density from one external sample`);
  }
});

test("known SK hynix lineup PN resources decode storage type and density", () => {
  const knownSkhynixLineupPn = partNumberPn.flatMap((entry) => {
    const record = entry as Record<string, unknown>;
    const vendor = String(record.vendor);
    const pn = String(record.pn);
    return vendor === "skhynix" && /^(?:H23Q|H26M|H2J)/.test(pn) ? [pn] : [];
  });
  assert.ok(knownSkhynixLineupPn.length > 0, "known SK hynix part-number resource should include H23Q/H26M/H2J entries");
  for (const pn of knownSkhynixLineupPn) {
    const info = detect(pn);
    assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
    assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a storage density`);
    if (pn.startsWith("H23Q")) {
      assert.equal(info.type, "E3NAND", `${pn} should decode as SK hynix E3NAND`);
    } else if (pn.startsWith("H26M")) {
      assert.equal(info.type, "eMMC", `${pn} should decode as SK hynix eMMC`);
    } else {
      assert.equal(info.type, "E2NAND", `${pn} should decode as SK hynix E2NAND`);
    }
  }
});
