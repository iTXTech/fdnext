import assert from "node:assert/strict";
import { createEngine, getEmbeddedRuntimeData, type FdnextRuntimeData } from "../../core/src/index";

const embeddedRuntimeData = getEmbeddedRuntimeData();

function testRuntimeData(rows: FdnextRuntimeData["d"]["s"]["p"] = []): FdnextRuntimeData {
  const pe: Record<string, number | number[]> = {};
  rows.forEach((row, index) => {
    const key = row[1];
    const existing = pe[key];
    if (existing === undefined) {
      pe[key] = index;
    } else if (typeof existing === "number") {
      pe[key] = [existing, index];
    } else {
      existing.push(index);
    }
  });
  return {
    ...embeddedRuntimeData,
    src: "00000000",
    d: {
      ...embeddedRuntimeData.d,
      f: { i: ["test", "test", "", ""], p: {}, id: {}, tk: {}, ct: [] },
      m: { mi: {}, sp: {}, dc: {}, mk: [] },
      s: { p: rows, m: [], id: [], pe, pp: {}, me: {}, mp: {} },
      c: {
        n: { fid: 0, pn: rows.length, fbga: 0 },
        ct: [],
        dg: "all",
        g: embeddedRuntimeData.d.c.g.map(([id, _count, _items, exclusive]) => [id, 0, [], exclusive])
      }
    }
  };
}

const ambiguousEngine = await createEngine({
  runtimeData: testRuntimeData([
    ["TESTPART", "TESTPART", "micron", "managed_nand", null, null, "managed_nand"],
    ["TESTPART", "TESTPART", "micron", "dram", null, null, "dram"]
  ]),
  decoders: [{
    id: "test-dram",
    priority: 100,
    check: (partNumber) => partNumber === "TESTPART",
    decode: (partNumber) => ({
      device: {
        domain: "memory",
        chipKind: "dram",
        vendor: "micron",
        partNumber
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
const hookEngine = await createEngine({
  runtimeData: testRuntimeData(),
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
