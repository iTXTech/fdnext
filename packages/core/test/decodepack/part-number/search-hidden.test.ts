import { test } from "node:test";
import {
  assertHiddenComponentRelations,
  assertHiddenPublicField,
  assertSearchPnFirst,
  assertSearchPnIncludes
} from "./_helpers";

test("cross-vendor composite parts hide public duplicate density fields", () => {
  for (const [partNumber, density] of [
    ["KMGD6001BM-B421", 262144],
    ["64EM32-M4GTY9B", 524288],
    ["FEPRF6432-58A1930", 524288],
    ["BWCA2KZC-64G", 524288]
  ] as const) {
    assertHiddenPublicField(partNumber, "density", density);
  }
  assertHiddenComponentRelations("BWCA2KZC-64G");
});

test("part-number search suggestions include cross-vendor PN matches", () => {
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
    ["YMUSAB5", "YMTC YMUSAB5TH3A1C1"]
  ] as const) {
    assertSearchPnIncludes(query, expected);
  }
  assertSearchPnFirst("EMMC", "Kingston EMMC04G-WT32");
});
