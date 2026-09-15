import assert from "node:assert/strict";
import test from "node:test";
import { createEngine } from "../../src/index";

test("Flash ID maker identity survives opposite-brand PN references in decode and search", () => {
  const fdb = {
    micron: { MT29F64G08CBCGB: { id: ["B5644432A500"] } },
    spectek: { "FBNL06B256G1KDBABJ4-6AL": { id: ["2CA46432AA04"], c: "QLC", d: 16, e: 8 } },
    iddb: {
      B5644432A500: { n: ["micron MT29F64G08CBCGB"], t: ["CTRL"] },
      "2CA46432AA04": { n: ["spectek FBNL06B256G1KDBABJ4-6AL"], t: ["CTRL"] }
    }
  };
  const engine = createEngine({ resources: {
    partIndex: { rawNand: fdb, managedNand: [], dram: [] },
    identifierIndex: { nandFlash: fdb },
    markingIndex: { packageMarkings: {} }, vendorIndex: {}, controllerIndex: {}, translationIndex: {}
  } });
  for (const [id, vendor, die] of [["B5644432A500", "spectek", "L04A"], ["2CA46432AA04", "micron", "L06B"]]) {
    const draft = engine.decodeIdentifierDraft({ query: id! });
    assert.equal(draft?.device.vendor, vendor);
    assert.equal(draft?.meta?.nandDieProfileKey, die);
    assert.equal(draft?.identifiers?.partNumbers?.length, 1);
    assert.equal(engine.decodeIdentifier({ query: id! }).device?.vendor.id, vendor);
    assert.equal(engine.searchIdentifiers({ query: id!, limit: 1 }).items[0]?.device.vendor.id, vendor);
  }
  const spectek = engine.decodePartDraft({ query: "FBNL06B256G1KDBABJ4-6AL" });
  assert.deepEqual(spectek?.identifiers?.flashIds, ["2CA46432AA04"]);
  assert.equal(spectek?.fields?.cell_level, 2);
  assert.equal(spectek?.fields?.die_count, 1);
  assert.equal(spectek?.fields?.ce_count, 1);
});

test("PN enrichment keeps concrete ID profiles and does not merge equal process labels", () => {
  const makeEngine = (ids: string[]) => {
    const fdb = {
      micron: { MT29F128G08XXXXX: { id: ids, t: ["CTRL"] } },
      iddb: Object.fromEntries(ids.map(id => [id, { n: ["micron MT29F128G08XXXXX"], t: ["CTRL"] }]))
    };
    return createEngine({ resources: {
      partIndex: { rawNand: fdb, managedNand: [], dram: [] }, identifierIndex: { nandFlash: fdb },
      markingIndex: { packageMarkings: {} }, vendorIndex: {}, controllerIndex: {}, translationIndex: {}
    } });
  };
  const exact = makeEngine(["2C84643CA504"]).decodePartDraft({ query: "MT29F128G08XXXXX" });
  assert.equal(exact?.meta?.nandDieProfileKey, "L85A");
  const ambiguous = makeEngine(["2C84643CA504", "2C84643CA904"]).decodePartDraft({ query: "MT29F128G08XXXXX" });
  assert.equal(ambiguous?.meta?.nandDieProfileKey, undefined);
});

test("ID postprocessing preserves concrete 2D die keys across display enrichment", () => {
  const engine = createEngine();
  const draft = engine.decodeIdentifierDraft({ query: "8984643CA50C" });
  assert.equal(draft?.meta?.nandDieProfileKey, "L85A");
  assert.equal(draft?.fields?.die_codename, "20nm");
});

test("HYV8 PN and ID expose their own native die density", () => {
  const engine = createEngine();
  const part = engine.decodePartDraft({ query: "H25G9TD18CX576" });
  const id = engine.decodeIdentifierDraft({ query: "AD89293B00D0" });
  assert.equal(part?.fields?.die_density, 524288);
  assert.equal(id?.fields?.die_density, 1048576);
  assert.equal(id?.fields?.density, 2097152);
  assert.equal(id?.fields?.die_count, 2);
});
