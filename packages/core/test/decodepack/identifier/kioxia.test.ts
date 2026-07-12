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

function fieldsFor(id: string): Record<string, unknown> {
  const explain = explainIdentifierDecode(defaultDecodePack, id);
  assert.equal(explain.status, "matched", `${id} should match the KIOXIA identifier spec`);
  assert.equal(explain.specId, "identifier.nand_flash_id.kioxia.v1");
  return explain.draft?.fields ?? {};
}

function resultFieldsFor(id: string): Record<string, unknown> {
  const result = engine.decodeIdentifier({ query: id, lang: "eng" });
  assert.equal(result.status, "ok", `${id} should decode through the public identifier API`);
  return Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.raw ?? field.value])));
}

test("KIOXIA current SLC Read IDs preserve the datasheet page, block, and spare geometry", () => {
  const cases: Array<[string, number, number, number, string, number]> = [
    ["98F1801572", 1024, 2048, 131072, "128B", 1],
    ["98DA901576", 2048, 2048, 131072, "128B", 2],
    ["98DC902676", 4096, 4096, 262144, "256B", 2]
  ];

  for (const [id, density, pageSize, blockSize, spareSize, planes] of cases) {
    const explain = fieldsFor(id);
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, 1);
    assert.equal(explain.device_width, "x8");
    assert.equal(explain.voltage, "Vcc: 3.3V");
    assert.equal(explain.page_size, pageSize);
    assert.equal(explain.block_size, blockSize);
    assert.equal(explain.redundant_area_size, spareSize);
    assert.equal(explain.plane_count, planes);

    const result = resultFieldsFor(id);
    assert.equal(result.density, density);
    assert.equal(result.device_width, 8);
    assert.equal(result.voltage, "Vcc: 3.3V");
    assert.equal(result.page_size, pageSize);
    assert.equal(result.block_size, blockSize);
    assert.equal(result.redundant_area_size, spareSize);
    assert.equal(result.plane_count, planes);
  }
});

test("KIOXIA legacy IDs outside the confirmed current configurations keep the existing fallback", () => {
  const explain = fieldsFor("98DA9015F600");
  assert.equal(explain.page_size, 4096);
  assert.equal(explain.block_size, 262144);
  assert.equal(explain.redundant_area_size, undefined);
});
