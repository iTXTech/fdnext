import assert from "node:assert/strict";
import { test } from "node:test";
import { createEngine } from "../../../src/index";
import { embeddedResourceBundle } from "../../../src/resources";
import { compileDecodePack, defaultDecodePack, explainIdentifierDecode } from "../../../src/decodepack";

const specId = "flashid.esmt.slc.v1";
const compiledPack = compileDecodePack(defaultDecodePack);
const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders,
  identifierDecoders: compiledPack.identifierDecoders,
  profileTables: compiledPack.profileTables
});

interface EsmtExactCase {
  id: string;
  density: number;
  voltage: string;
  width: "x8" | "x16";
  planeCount: number;
  dieCount: number;
  eccLevel: string;
  pageSize: number;
  blockSize: number;
  spareSize: string;
}

const exactCases: EsmtExactCase[] = [
  { id: "C8D1809542", density: 1024, voltage: "Vcc: 2.7V~3.6V", width: "x8", planeCount: 1, dieCount: 1, eccLevel: "1bit/528B", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C8D1809540", density: 1024, voltage: "Vcc: 2.7V~3.6V", width: "x8", planeCount: 1, dieCount: 1, eccLevel: "4bit/528B", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C861801542", density: 1024, voltage: "Vcc: 1.7V~1.95V", width: "x8", planeCount: 1, dieCount: 1, eccLevel: "1bit/512B", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C871805542", density: 1024, voltage: "Vcc: 1.7V~1.95V", width: "x16", planeCount: 1, dieCount: 1, eccLevel: "1bit/256Word", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C861801540", density: 1024, voltage: "Vcc: 1.7V~1.95V", width: "x8", planeCount: 1, dieCount: 1, eccLevel: "4bit/512B", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C871805540", density: 1024, voltage: "Vcc: 1.7V~1.95V", width: "x16", planeCount: 1, dieCount: 1, eccLevel: "4bit/256Word", pageSize: 2048, blockSize: 131072, spareSize: "64B" },
  { id: "C86A900434", density: 2048, voltage: "Vcc: 2.7V~3.6V", width: "x8", planeCount: 2, dieCount: 1, eccLevel: "8bit/512B", pageSize: 2048, blockSize: 131072, spareSize: "128B" },
  { id: "C85A900434", density: 2048, voltage: "Vcc: 1.7V~1.95V", width: "x8", planeCount: 2, dieCount: 1, eccLevel: "8bit/512B", pageSize: 2048, blockSize: 131072, spareSize: "128B" },
  { id: "C8DC801930", density: 4096, voltage: "Vcc: 2.7V~3.6V", width: "x8", planeCount: 1, dieCount: 1, eccLevel: "8bit/512B", pageSize: 4096, blockSize: 262144, spareSize: "256B" },
  { id: "C8AC80E657", density: 4096, voltage: "Vcc: 2.7V~3.6V", width: "x16", planeCount: 1, dieCount: 1, eccLevel: "8bit/256Word", pageSize: 4096, blockSize: 262144, spareSize: "256B" },
  { id: "C8D3811930", density: 8192, voltage: "Vcc: 2.7V~3.6V", width: "x8", planeCount: 1, dieCount: 2, eccLevel: "8bit/512B", pageSize: 4096, blockSize: 262144, spareSize: "256B" },
  { id: "C8A3811930", density: 8192, voltage: "Vcc: 1.7V~1.95V", width: "x8", planeCount: 1, dieCount: 2, eccLevel: "8bit/512B", pageSize: 4096, blockSize: 262144, spareSize: "256B" }
];

test("ESMT C8 parallel SLC IDs match only official complete five-byte tuples", () => {
  for (const expected of exactCases) {
    const explain = explainIdentifierDecode(defaultDecodePack, expected.id);
    assert.equal(explain.status, "matched", expected.id);
    assert.equal(explain.specId, specId, expected.id);
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, expected.density, `${expected.id} density`);
    assert.equal(fields.voltage, expected.voltage, `${expected.id} voltage`);
    assert.equal(fields.device_width, expected.width, `${expected.id} width`);
    assert.equal(fields.cell_level, 1, `${expected.id} cell level`);
    assert.equal(fields.plane_count, expected.planeCount, `${expected.id} plane count`);
    assert.equal(fields.die_count, expected.dieCount, `${expected.id} die count`);
    assert.equal(fields.ecc_level, expected.eccLevel, `${expected.id} ECC`);
    assert.equal(fields.page_size, expected.pageSize, `${expected.id} page size`);
    assert.equal(fields.block_size, expected.blockSize, `${expected.id} block size`);
    assert.equal(fields.redundant_area_size, expected.spareSize, `${expected.id} spare size`);

    const result = engine.decodeIdentifier({ query: expected.id, lang: "eng" });
    assert.equal(result.status, "ok", expected.id);
    assert.equal(result.device?.vendor?.id, "esmt", expected.id);
  }
});

test("ESMT exact IDs allow runtime zero padding but reject adjacent, truncated, and extended tuples", () => {
  const decoder = compiledPack.identifierDecoders.find((candidate) => candidate.id === specId);
  assert.ok(decoder);
  assert.equal(decoder.check("C8D1809542"), true);
  assert.equal(decoder.check("C8D180954200"), true);
  assert.equal(explainIdentifierDecode(defaultDecodePack, "C8D180954200").specId, specId);
  for (const id of ["C8618015427F", "C8718055427F", "C8618015407F", "C8718055407F"]) {
    assert.equal(decoder.check(id), true, `${id} official sixth-cycle continuation`);
    assert.equal(explainIdentifierDecode(defaultDecodePack, id).specId, specId);
  }

  for (const id of [
    "C8D1809543",
    "C8D1809541",
    "C8D18095",
    "C8D180",
    "C8D180954201",
    "C8D1809542FF",
    "C8D18095420000"
  ]) {
    assert.notEqual(explainIdentifierDecode(defaultDecodePack, id).specId, specId, id);
    assert.equal(decoder.check(id.padEnd(12, "0")), false, `${id} padded runtime form`);
  }
});
