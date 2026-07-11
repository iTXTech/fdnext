import assert from "node:assert/strict";
import test from "node:test";
import { createEngine, type PartNumberDecoder } from "../../src/index";

test("search appends future projection requirements without replacing its base contract", () => {
  const targetSets: string[][] = [];
  const decoder = {
    id: "test.search.projection-extension",
    check: (partNumber: string) => partNumber === "MT29F4G08ABAEA",
    decode: (partNumber: string) => partNumber === "MT29F4G08ABAEA" ? {
      device: {
        partNumber,
        domain: "memory",
        vendor: "micron",
        chipKind: "raw_nand"
      },
      fields: { density: 4096 }
    } : null,
    project: (partNumber: string, targets: readonly string[]) => {
      if (partNumber !== "MT29F4G08ABAEA") {
        return null;
      }
      targetSets.push([...targets]);
      return {
        device: {
          partNumber,
          domain: "memory",
          vendor: "micron",
          chipKind: "raw_nand"
        },
        fields: { density: 4096 }
      };
    }
  } satisfies PartNumberDecoder;
  const engine = createEngine({
    decoders: [decoder],
    resources: {
      partIndex: {
        rawNand: {},
        managedNand: [{ vendor: "micron", pn: "MT29F4G08ABAEA" }],
        dram: []
      },
      identifierIndex: { nandFlash: {} },
      markingIndex: { packageMarkings: {} },
      vendorIndex: {},
      controllerIndex: {},
      translationIndex: {}
    },
    partSearchProjection: ["fields.future_search_rank"]
  });

  const result = engine.searchParts({ query: "MT29F4G08ABAEA", partialMatch: false, limit: 1 });
  assert.equal(result.items[0]?.device.partNumber, "MT29F4G08ABAEA");
  assert.ok(targetSets.some((targets) => targets.includes("fields.future_search_rank")));
  assert.ok(targetSets.every((targets) => targets.includes("fields.density")));
  assert.ok(targetSets.every((targets) => targets.includes("device.vendor")));
});
