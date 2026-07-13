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

function explainFields(id: string, specId: string): Record<string, unknown> {
  const explain = explainIdentifierDecode(defaultDecodePack, id);
  assert.equal(explain.status, "matched", `${id} should match an identifier DecodePack spec`);
  assert.equal(explain.specId, specId, `${id} should use the expected identifier profile`);
  return explain.draft?.fields ?? {};
}

function resultFields(id: string): Record<string, unknown> {
  const result = engine.decodeIdentifier({ query: id, lang: "eng" });
  assert.equal(result.status, "ok", `${id} should decode through the public identifier API`);
  return Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.raw ?? field.value])));
}

function assertLegacyGeometry(fields: Record<string, unknown>): void {
  assert.equal(fields.cell_level, "SLC");
  assert.equal(fields.device_width, 8);
  assert.equal(fields.page_size, 2048);
  assert.equal(fields.block_size, 131072);
  assert.equal(fields.redundant_area_size, "64B");
}

test("Samsung legacy 1Gb, 2Gb, and 4Gb SLC Read IDs use the legacy geometry profile", () => {
  const cases: Array<[string, number, string, number | undefined]> = [
    ["ECA10015", 1024, "Vcc: 1.8V", undefined],
    ["ECF1801540", 1024, "Vcc: 3.3V", undefined],
    ["ECDA109546", 2048, "Vcc: 3.3V", 2],
    ["ECDC109554", 4096, "Vcc: 3.3V", 2]
  ];

  for (const [id, density, voltage, planeCount] of cases) {
    const explain = explainFields(id, "identifier.nand_flash_id.samsung.legacy_slc.v1");
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, 1);
    assert.equal(explain.device_width, "x8");
    assert.equal(explain.voltage, voltage);
    assert.equal(explain.page_size, 2048);
    assert.equal(explain.block_size, 131072);
    assert.equal(explain.redundant_area_size, "64B");
    assert.equal(explain.plane_count, planeCount);

    const fields = resultFields(id);
    assert.equal(fields.density, density);
    assert.equal(fields.voltage, voltage);
    assert.equal(fields.plane_count, planeCount);
    assertLegacyGeometry(fields);
  }
});

test("Samsung legacy 8Gb and 16Gb large-page Read IDs use datasheet geometry", () => {
  const cases: Array<[string, number, number, number, number, string]> = [
    ["ECD310A664", 8192, 1, 4096, 262144, "128B"],
    ["ECD314A564", 8192, 2, 2048, 262144, "64B"],
    ["ECD514B674", 16384, 2, 4096, 524288, "128B"]
  ];

  for (const [id, density, cellLevel, pageSize, blockSize, spareSize] of cases) {
    const explain = explainFields(id, "identifier.nand_flash_id.samsung.legacy_large_page.v1");
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, cellLevel);
    assert.equal(explain.die_count, 1);
    assert.equal(explain.device_width, "x8");
    assert.equal(explain.page_size, pageSize);
    assert.equal(explain.block_size, blockSize);
    assert.equal(explain.redundant_area_size, spareSize);
    assert.equal(explain.plane_count, 2);
    assert.equal(explain.voltage, undefined);

    const fields = resultFields(id);
    assert.equal(fields.density, density);
    assert.equal(fields.cell_level, cellLevel === 1 ? "SLC" : "MLC");
    assert.equal(fields.die_count, 1);
    assert.equal(fields.device_width, 8);
    assert.equal(fields.page_size, pageSize);
    assert.equal(fields.block_size, blockSize);
    assert.equal(fields.redundant_area_size, spareSize);
    assert.equal(fields.plane_count, 2);
    assert.equal(fields.voltage, undefined);
  }
});

test("Micron legacy 1Gb and 4Gb/8Gb-section SLC IDs use datasheet byte geometry", () => {
  const cases: Array<[string, number, number, number, number, boolean, string, number]> = [
    ["2CF1809502", 1024, 1, 1, 1, false, "Vcc: 3.3V", 8],
    ["2CA1801502", 1024, 1, 1, 1, false, "Vcc: 1.8V", 8],
    ["2CB1805502", 1024, 1, 1, 1, false, "Vcc: 1.8V", 16],
    ["2CDC909554", 4096, 1, 2, 2, false, "Vcc: 3.3V", 8],
    ["2CD3D19558", 8192, 2, 4, 2, true, "Vcc: 3.3V", 8]
  ];

  for (const [id, density, dieCount, planeCount, programmedPages, interleave, voltage, width] of cases) {
    const explain = explainFields(id, "identifier.nand_flash_id.micron.legacy_slc.v1");
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, 1);
    assert.equal(explain.device_width, `x${width}`);
    assert.equal(explain.voltage, voltage);
    assert.equal(explain.die_count, dieCount);
    assert.equal(explain.plane_count, planeCount);
    assert.equal(explain.page_size, 2048);
    assert.equal(explain.block_size, 131072);
    assert.equal(explain.redundant_area_size, "64B");
    assert.equal(explain.simultaneously_programmed_pages, programmedPages);
    assert.equal(explain.interleave, interleave);
    assert.equal(explain.cache, true);

    const fields = resultFields(id);
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.simultaneously_programmed_pages, programmedPages);
    assert.equal(fields.interleave, interleave);
    assert.equal(fields.cache, true);
    assert.equal(fields.voltage, voltage);
    assert.equal(fields.cell_level, "SLC");
    assert.equal(fields.device_width, width);
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
  }
});

test("modern Samsung and Micron IDs remain on their existing generic specs", () => {
  assert.equal(explainIdentifierDecode(defaultDecodePack, "EC5E98BF84CC").specId, "identifier.nand_flash_id.samsung.v1");
  assert.equal(explainIdentifierDecode(defaultDecodePack, "ECD314A664").specId, "identifier.nand_flash_id.samsung.v1");
  assert.equal(explainIdentifierDecode(defaultDecodePack, "2CC30832EA34").specId, "identifier.nand_flash_id.micron.inteldef.v1");
});
