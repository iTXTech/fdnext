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
  assert.equal(explain.status, "matched", `${id} should match the Winbond identifier spec`);
  assert.equal(explain.specId, "identifier.nand_flash_id.winbond.w29n.v1");
  return explain.draft?.fields ?? {};
}

function resultFieldsFor(id: string): Record<string, unknown> {
  const result = engine.decodeIdentifier({ query: id, lang: "eng" });
  assert.equal(result.status, "ok", `${id} should decode through the public identifier API`);
  return Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.raw ?? field.value])));
}

test("Winbond W29N parallel SLC Read IDs preserve the datasheet geometry", () => {
  const cases: Array<[string, number, boolean, string | undefined]> = [
    ["EFF1009500", 1024, false, undefined],
    ["EFDA909504", 2048, true, undefined],
    ["EFDC909554", 4096, true, "x8"],
    ["EFD3919558", 8192, true, "x8"]
  ];

  for (const [id, density, cache, deviceWidth] of cases) {
    const explain = fieldsFor(id);
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, 1);
    assert.equal(explain.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(explain.page_size, 2048);
    assert.equal(explain.block_size, 131072);
    assert.equal(explain.redundant_area_size, "64B");
    assert.equal(explain.cache, cache);
    assert.equal(explain.device_width, deviceWidth);

    const result = resultFieldsFor(id);
    assert.equal(result.density, density);
    assert.equal(result.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(result.page_size, 2048);
    assert.equal(result.block_size, 131072);
    assert.equal(result.redundant_area_size, "64B");
    assert.equal(result.cache, cache);
    assert.equal(result.device_width, deviceWidth === "x8" ? 8 : undefined);
  }
});

test("unknown Winbond EF profiles keep vendor recognition without borrowed geometry", () => {
  const explain = fieldsFor("EFF1801572");
  assert.deepEqual(explain, {});
});
