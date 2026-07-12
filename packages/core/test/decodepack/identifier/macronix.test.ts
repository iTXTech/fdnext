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

function publicFields(id: string): Record<string, unknown> {
  const result = engine.decodeIdentifier({ query: id, lang: "eng" });
  assert.equal(result.status, "ok", `${id} should decode through the public identifier API`);
  return Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.raw ?? field.value])));
}

test("Macronix 18AC parallel SLC IDs follow the official extended ID bit definitions", () => {
  const cases: Array<[string, number, number, number, boolean]> = [
    ["C2F1809502", 1024, 1, 1, false],
    ["C2DA90950600", 2048, 1, 2, false],
    ["C2DC909556", 4096, 1, 2, false],
    ["C2D3D1955A00", 8192, 2, 4, true]
  ];

  for (const [id, density, dieCount, planeCount, interleave] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "identifier.nand_flash_id.macronix.mx30lf_mx60lf.18ac.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
    assert.equal(fields.ecc_level, "4bit/528B");
    assert.equal(fields.cache, true);
    assert.equal(fields.interleave, interleave);
  }
});

test("Macronix 28AD parallel SLC IDs preserve their official geometry", () => {
  const cases: Array<[string, number, number, number, number, number, string]> = [
    ["C2F180910303", 1024, 1, 1, 2048, 131072, "128B"],
    ["C2DA90910703", 2048, 1, 2, 2048, 131072, "128B"],
    ["C2DC90A2570300", 4096, 1, 2, 4096, 262144, "256B"],
    ["C2D3D1A25B03", 8192, 2, 4, 4096, 262144, "256B"]
  ];

  for (const [id, density, dieCount, planeCount, pageSize, blockSize, spareSize] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "identifier.nand_flash_id.macronix.mx30lf_mx60lf.28ad.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(fields.page_size, pageSize);
    assert.equal(fields.block_size, blockSize);
    assert.equal(fields.redundant_area_size, spareSize);
    assert.equal(fields.ecc_level, "8bit/544B");
  }
});

test("unconfirmed Macronix IDs retain the pre-existing vendor-only fallback", () => {
  const explain = explainIdentifierDecode(defaultDecodePack, "C2AC90155700");
  assert.equal(explain.status, "not_matched");

  const fields = publicFields("C2AC90155700");
  assert.equal(fields.density, undefined);
  assert.equal(fields.page_size, undefined);
  assert.equal(fields.block_size, undefined);
});
