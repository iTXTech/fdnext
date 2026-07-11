import assert from "node:assert/strict";
import { test } from "node:test";
import { createEngine } from "../../src/index";
import { embeddedResourceBundle } from "../../src/resources";
import { compileDecodePack, defaultDecodePack } from "../../src/decodepack";
import {
  assertIntegratedDecode,
  assertIntegratedMarkingSearch,
  assertIntegratedSearchFirst,
  assertIntegratedSearchIncludes,
  integratedEngine,
  resultField
} from "./_helpers";

test("catalog marking aliases use explicit integrated decoding", () => {
  for (const [query, vendor, chipKind, partNumber, productType] of [
    ["PFE02", "spectek", "raw_nand", "FBML63BNAKDBAAH1"],
    ["PF232", "spectek", "raw_nand", "FBMM60A21K1BAAH4"],
    ["PF285", "spectek", "raw_nand", "FBMM84CNAKDMABH7"],
    ["PF580", "spectek", "raw_nand", "FBMM84C81KDMABH7"],
    ["PFA01", "spectek", "raw_nand", "FXM3B8ANAK3BAAH4"],
    ["PFF21", "spectek", "raw_nand", "FBML74A81KDMAAH8"],
    ["PX001", "spectek", "raw_nand", "FXMM2XANAK3BAAWP"],
    ["NC103", "micron", "raw_nand", "MT29FB16T08GALAAM5-TES:B"],
    ["C9BJZ", "micron", "dram", "CT40A1G8SA-62M:E", "ddr4"],
    ["D9STQ", "micron", "dram", "MT41K512M16HA-125:A", "ddr3"],
    ["D9XLQ", "micron", "dram", "MT41K512M16VRN-107IT:P", "ddr3"],
    ["79JMM", "micron", "dram", "MT47R64M16HR-3ES:E", "ddr2"],
    ["PE010", "spectek", "dram", "PRA128M8V88AG8GQF", "ddr3"],
    ["PE002", "spectek", "dram", "SU512M8V80A11ARH", "ddr3"],
    ["PB001", "spectek", "dram", "SM512M322C0FD4LH6", "ddr3"],
    ["PU001", "spectek", "dram", "SM768M16Y2BMD1FDS", "lpddr"]
  ] as const) {
    assertIntegratedDecode(query, { vendor, chipKind, partNumber, markingCode: query, productType });
  }

  for (const [query, partNumber, productType] of [
    ["JW101", "MT29C1G12MABAAHB-75IT", "emcp"],
    ["JZ018", "MT29VZZZ7D7DQKWL-062W97Y", "umcp"],
    ["JZ101", "MTFC64GAOALEA-WTES", "emmc"]
  ] as const) {
    assertIntegratedDecode(query, {
      vendor: "micron",
      chipKind: "managed_nand",
      partNumber,
      markingCode: query,
      productType
    });
  }
});

test("catalog search and marking relations stay outside DecodePack rule tests", () => {
  for (const [query, expected] of [
    ["BW2A2MZCNY", "BIWIN BW2A2MZCNY-512G"],
    ["FEUDME256G", "Longsys FEUDME256G-C8H09"],
    ["KMGD6001BM", "Samsung KMGD6001BM-B421"],
    ["SDIN7DU2", "Sandisk SDIN7DU2-64G"],
    ["SDIS5BK", "Sandisk SDIS5BK-032G"],
    ["SDIS4BH", "Sandisk SDIS4BH-064G"],
    ["MTFDHBL064TDP", "Micron MTFDHBL064TDP-1AT12AIYY"],
    ["MTFDHBL064TDQ", "Micron MTFDHBL064TDQ-1AT12ATYY"],
    ["MTFDHBK1T0TDQ", "Micron MTFDHBK1T0TDQ-1AT12ATYY"],
    ["SUGNM1126", "SpecTek SUGNM1126A6BPIET-046BT"],
    ["SUJ52A1G", "SpecTek SUJ52A1GCFDI-BT"],
    ["SM662PBC", "Silicon Motion SM662PBC-BFS"],
    ["SM671PEF", "Silicon Motion SM671PEF-BFS"],
    ["THGJFRT1E45", "Kioxia THGJFRT1E45BATV"],
    ["YMUSAB5", "YMTC YMUSAB5TH3A1C1"],
    ["EDY4016", "Micron EDY4016AABG-JD-F-D"],
    ["MT29F2G08ABDHC-ETD", "Micron MT29F2G08ABDHC-ET:D"],
    ["MT29FB16T08GALAAM5TESB", "Micron MT29FB16T08GALAAM5-TES:B"]
  ] as const) {
    assertIntegratedSearchIncludes(query, expected);
  }
  assertIntegratedSearchFirst("EMMC", "Kingston EMMC04G-CT32");

  for (const [markingCode, partNumber, vendor, badge] of [
    ["C9BJZ", "CT40A1G8SA-62M:E", "micron", "Micron FBGA"],
    ["B9DHG", "MT47H32M16BT-3E", "micron", "Micron FBGA"],
    ["PE010", "PRA128M8V88AG8GQF", "spectek", "SpecTek FBGA"],
    ["PEB09", "PRN512M8V70SGDRAF", "spectek", "SpecTek FBGA"],
    ["PE918", "PRN256M8V79DG8GQF", "spectek", "SpecTek FBGA"],
    ["PE027", "PRN512M8V00HG8GQF", "spectek", "SpecTek FBGA"],
    ["PB001", "SM512M322C0FD4LH6", "spectek", "SpecTek FBGA"],
    ["PU001", "SM768M16Y2BMD1FDS", "spectek", "SpecTek FBGA"]
  ] as const) {
    assertIntegratedMarkingSearch(markingCode, partNumber, { vendor, chipKind: "dram", badge });
  }
  assert.deepEqual(
    integratedEngine.searchParts({ query: "FX454", lang: "eng", limit: 20 }).items
      .filter((item) => item.device.markingCode === "FX454"),
    []
  );
});

test("catalog normalization resolves canonical part numbers", () => {
  for (const [query, partNumber, chipKind] of [
    ["MT29F2G08ABDHC-ETD", "MT29F2G08ABDHC-ET:D", "raw_nand"],
    ["MT29FB16T08GALAAM5-TESB", "MT29FB16T08GALAAM5-TES:B", "raw_nand"],
    ["MT29FB16T08GALAAM5TESB", "MT29FB16T08GALAAM5-TES:B", "raw_nand"],
    ["MT29FB64T08GDLBBN2QJESB", "MT29FB64T08GDLBBN2-QJES:B", "raw_nand"],
    ["EDY4016AABG-JD-F-R TR", "EDY4016AABG-JD-F-R", "dram"]
  ] as const) {
    assertIntegratedDecode(query, { vendor: "micron", chipKind, partNumber });
  }
});

test("FDB enrichment and DecodePack precedence are explicit integration checks", () => {
  for (const [partNumber, dieCodename, layerCount, processAlias] of [
    ["SDTNMMAHSM-001G", "43nm"],
    ["29F02T08SCMFP", "20nm", undefined, "L85C"],
    ["FNNL29F256G08EBHAFES", "B16A"],
    ["FBMB17A4T1KDUAN", "B17A", 64]
  ] as const) {
    const result = integratedEngine.decodePart({ query: partNumber, lang: "eng" });
    assert.equal(result.status, "ok", `${partNumber} should decode through FDB`);
    assert.equal(resultField(result, "die_codename"), dieCodename, `${partNumber} die profile`);
    if (layerCount !== undefined) assert.equal(resultField(result, "layer_count"), layerCount, `${partNumber} layer count`);
    if (processAlias !== undefined) assert.equal(resultField(result, "process_alias"), processAlias, `${partNumber} process alias`);
  }

  const compiledPack = compileDecodePack(defaultDecodePack);
  const precedenceEngine = createEngine({
    resources: {
      ...embeddedResourceBundle,
      partIndex: {
        ...embeddedResourceBundle.partIndex,
        rawNand: {
          info: { version: "test", controllers: ["FDB_ONLY_CTRL"] },
          micron: {
            MT29F2T08GBLBH: {
              id: ["2C00"], l: "B47R", c: "MLC", d: 16, e: 8, r: 4, n: 2, t: ["FDB_ONLY_CTRL"]
            }
          }
        }
      }
    },
    decoders: compiledPack.partDecoders
  });
  const result = precedenceEngine.decodePart({ query: "MT29F2T08GBLBH", lang: "eng" });
  assert.equal(resultField(result, "die_codename"), "N69R");
  assert.equal(resultField(result, "cell_level"), "QLC");
  assert.equal(resultField(result, "die_count"), 1);
  assert.equal(resultField(result, "ce_count"), 1);
  assert.equal(resultField(result, "rb_count"), 1);
  assert.equal(resultField(result, "channel_count"), 1);
});

test("FDB-only SK hynix package metadata is not asserted by rule tests", () => {
  for (const [partNumber, speedGrade, productClass, specialOption] of [
    ["H25T0TD18CX655", "DQ Speed=2400Mbps", "Client"],
    ["H25T0TG18GX807", "Max Speed=3600MT/s", "Client"],
    ["H25T5QMG8GX830", "Max Speed=2280MT/s", "Enterprise", "IF-Chip"]
  ] as const) {
    const result = integratedEngine.decodePart({ query: partNumber, lang: "eng" });
    assert.equal(resultField(result, "speed_grade"), speedGrade, `${partNumber} FDB speed grade`);
    assert.equal(resultField(result, "product_class"), productClass, `${partNumber} FDB product class`);
    if (specialOption !== undefined) {
      assert.equal(resultField(result, "special_option"), specialOption, `${partNumber} FDB special option`);
    }
  }
});

test("FDB identifier relations are explicit integration checks", () => {
  const result = integratedEngine.decodePart({ query: "T27HGA5A1V", lang: "eng" });
  assert.ok(result.relations.some((relation) => (
    relation.kind === "identifier_for" &&
    relation.target.identifier === "9848A8037AE5" &&
    relation.action?.operation === "identifier.decode"
  )));
});
