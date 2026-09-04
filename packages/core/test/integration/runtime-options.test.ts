import assert from "node:assert/strict";
import test from "node:test";
import { prepareCatalog, type PartDecodeResult, type PartNumberDecoder, type PartSearchResult } from "../../src/index";
import { createRuntime } from "../../src/runtime";

test("runtime uses the supplied catalog and enforces resource exclusivity", async () => {
  const partNumber = "MTFC64GAOALEA-WTES";
  const resources = {
    partIndex: {
      rawNand: { info: { version: "runtime-test" } },
      managedNand: [{ vendor: "micron", pn: partNumber }]
    }
  };
  const catalog = prepareCatalog(resources);
  const runtime = createRuntime({ catalog });

  assert.equal(runtime.engine.getVersion(), "runtime-test");
  const response = await runtime.dispatch({ operation: "part.search", input: { query: "MTFC" } });
  assert.deepEqual((response.body as PartSearchResult).items.map((item) => item.device.partNumber), [partNumber]);
  assert.throws(() => createRuntime({ catalog, resources }), /mutually exclusive/);
});

test("runtime preserves explicit profiles and additional search projections", async () => {
  const targetSets: string[][] = [];
  const decoder: PartNumberDecoder = {
    id: "test.runtime-options",
    dispatchPrefixes: ["MT29"],
    match: (partNumber) => partNumber.startsWith("MT29")
      ? { decoderId: "test.runtime-options", input: partNumber, normalized: partNumber }
      : null,
    decode: (matched) => ({
      device: { partNumber: matched.normalized, vendor: "micron", chipKind: "raw_nand" },
      fields: { density: 4096, die_codename: "test-profile" }
    }),
    project(matched, targets) {
      targetSets.push([...targets]);
      return this.decode(matched);
    }
  };
  const runtime = createRuntime({
    resources: { partIndex: { rawNand: { micron: { MT29F4G08ABAEA: {} } } } },
    decoders: [decoder],
    identifierDecoders: [],
    profileTables: { "nand.die_profile": { "test-profile": { layer_count: 128 } } },
    partSearchProjection: ["fields.layer_count"]
  });

  const decoded = await runtime.dispatch({ operation: "part.decode", input: { query: "MT29F4G08ABAEA" } });
  const fields = (decoded.body as PartDecodeResult).blocks.flatMap((block) => block.fields);
  assert.equal(fields.find((field) => field.key === "layer_count")?.value, 128);

  const searched = await runtime.dispatch({ operation: "part.search", input: { query: "MT29", limit: 1 } });
  assert.equal((searched.body as PartSearchResult).items.length, 1);
  assert.ok(targetSets.length > 0);
  assert.ok(targetSets.every((targets) => targets.includes("fields.layer_count") && targets.includes("fields.density")));
});
