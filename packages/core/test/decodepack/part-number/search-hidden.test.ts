import { test } from "node:test";
import {
  assertHiddenComponentRelations,
  assertHiddenPublicField
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
