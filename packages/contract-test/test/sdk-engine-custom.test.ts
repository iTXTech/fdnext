import assert from "node:assert/strict";
import { createEngine, prepareCatalog } from "@itxtech/fdnext-core";

const ambiguousEngine = createEngine({
  resources: {
    partIndex: {
      rawNand: {},
      managedNand: [{ vendor: "micron", pn: "TESTPART" }],
      dram: [{ vendor: "micron", pn: "TESTPART" }]
    },
    identifierIndex: {
      nandFlash: {}
    },
    markingIndex: {
      packageMarkings: {}
    },
    vendorIndex: {},
    translationIndex: {}
  },
  decoders: [{
    id: "test-dram",
    priority: 100,
    dispatchPrefixes: ["TESTPART"],
    match: (partNumber) => partNumber === "TESTPART"
      ? { decoderId: "test-dram", input: partNumber, normalized: partNumber }
      : null,
    decode: (matched) => ({
      device: {
        domain: "memory",
        chipKind: "dram",
        vendor: "micron",
        partNumber: matched.normalized
      },
      fields: {
        dram_type: "DRAM",
        dram_density: 1024
      }
    })
  }]
});
const ambiguous = ambiguousEngine.decodePart({ query: "TESTPART", lang: "eng" });
assert.equal(ambiguous.status, "ambiguous");
assert.ok((ambiguous.candidates?.length ?? 0) >= 2);
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "dram"));
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "managed_nand"));

const hookEvents: string[] = [];
const hookEngine = createEngine({
  resources: {
    partIndex: { rawNand: {}, managedNand: [], dram: [] },
    identifierIndex: { nandFlash: {} },
    markingIndex: { packageMarkings: {} },
    vendorIndex: {},
    translationIndex: {}
  },
  processors: [{
    beforeOperation: (context) => {
      hookEvents.push(`before:${context.operation}`);
    },
    afterOperation: (context, result) => {
      hookEvents.push(`after:${context.operation}`);
      return result;
    }
  }]
});
hookEngine.decodePart({ query: "", lang: "eng" });
hookEngine.searchParts({ query: "TEST", lang: "eng" });
hookEngine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
hookEngine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
hookEngine.getCapabilities();
assert.deepEqual(hookEvents, [
  "before:part.decode",
  "after:part.decode",
  "before:part.search",
  "after:part.search",
  "before:identifier.decode",
  "after:identifier.decode",
  "before:identifier.search",
  "after:identifier.search",
  "before:capabilities",
  "after:capabilities"
]);
const removedHookNames = ["search" + "Pn", "decode" + "Id", "summary" + "Id"];
assert.ok(!hookEvents.some((event) => removedHookNames.some((name) => event.includes(name))));

const sharedResources = {
  partIndex: { rawNand: {}, managedNand: [], dram: [] },
  identifierIndex: { nandFlash: {} },
  markingIndex: { packageMarkings: {} },
  vendorIndex: {},
  translationIndex: {}
};
const prepared = prepareCatalog(sharedResources);
assert.strictEqual(prepared, prepareCatalog(sharedResources));
assert.equal(createEngine({ catalog: prepared }).getVersion(), "0");
