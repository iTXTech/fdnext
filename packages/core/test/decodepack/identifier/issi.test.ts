import assert from "node:assert/strict";
import { test } from "node:test";
import { createEngine } from "../../../src/index";
import { embeddedResourceBundle } from "../../../src/resources";
import { compileDecodePack, defaultDecodePack, explainIdentifierDecode } from "../../../src/decodepack";

const compiledPack = compileDecodePack(defaultDecodePack);
const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compiledPack.partDecoders,
  identifierDecoders: compiledPack.identifierDecoders,
  profileTables: compiledPack.profileTables
});

test("ISSI 9D parallel SLC IDs preserve official geometry and voltage", () => {
  const cases: Array<[string, number, string, string, number]> = [
    ["9D6C80193040", 4096, "x8", "Vcc: 2.7V~3.6V", 1],
    ["9DAC80193040", 4096, "x16", "Vcc: 2.7V~3.6V", 1],
    ["9D6380193040", 8192, "x8", "Vcc: 2.7V~3.6V", 2],
    ["9D5380193040", 8192, "x8", "Vcc: 1.7V~1.95V", 2],
    ["9DA380193040", 8192, "x16", "Vcc: 2.7V~3.6V", 2],
    ["9D9380193040", 8192, "x16", "Vcc: 1.7V~1.95V", 2]
  ];

  for (const [id, density, width, voltage, dieCount] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.issi.slc.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.device_width, width);
    assert.equal(fields.voltage, voltage);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, 1);
    assert.equal(fields.page_size, 4096);
    assert.equal(fields.redundant_area_size, "256B");
    assert.equal(fields.block_size, 262144);
    assert.equal(fields.ecc_level, "8bit/512B");

    const result = engine.decodeIdentifier({ query: id, lang: "eng" });
    assert.equal(result.status, "ok");
  }
});

test("ambiguous C8 legacy IDs are not attributed to ISSI", () => {
  const explain = explainIdentifierDecode(defaultDecodePack, "C8D1809542");
  assert.notEqual(explain.specId, "flashid.issi.slc.v1");
});
