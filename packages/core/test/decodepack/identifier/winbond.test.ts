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
  const cases: Array<{
    id: string;
    density: number;
    voltage: string;
    pageSize: number;
    blockSize: number;
    spareSize: string;
    deviceWidth?: "x8" | "x16";
    cache?: boolean;
  }> = [
    { id: "EFF1009500", density: 1024, voltage: "Vcc: 2.7V~3.6V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8", cache: false },
    { id: "EFDA909504", density: 2048, voltage: "Vcc: 2.7V~3.6V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8", cache: true },
    { id: "EFDC909554", density: 4096, voltage: "Vcc: 2.7V~3.6V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8", cache: true },
    { id: "EFD3919558", density: 8192, voltage: "Vcc: 2.7V~3.6V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8", cache: true },
    { id: "EFA1009500", density: 1024, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8", cache: false },
    { id: "EFB100D500", density: 1024, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x16", cache: false },
    { id: "EFAA901504", density: 2048, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8" },
    { id: "EFBA905504", density: 2048, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x16" },
    { id: "EFAC901554", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8" },
    { id: "EFBC905554", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x16" },
    { id: "EFA3911558", density: 8192, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x8" },
    { id: "EFB3915558", density: 8192, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "64B", deviceWidth: "x16" },
    { id: "EFAA101507", density: 2048, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "128B", deviceWidth: "x8" },
    { id: "EFBA105507", density: 2048, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "128B", deviceWidth: "x16" },
    { id: "EFDA109507", density: 2048, voltage: "Vcc: 2.7V~3.6V", pageSize: 2048, blockSize: 131072, spareSize: "128B", deviceWidth: "x8" },
    { id: "EFAC101556", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "128B", deviceWidth: "x8" },
    { id: "EFBC105556", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 2048, blockSize: 131072, spareSize: "128B", deviceWidth: "x16" },
    { id: "EFAC002663", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x8" },
    { id: "EFBC006663", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x16" },
    { id: "EFAC00A663", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x8" },
    { id: "EFBC00E663", density: 4096, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x16" },
    { id: "EFA301A663", density: 8192, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x8" },
    { id: "EFB301E663", density: 8192, voltage: "Vcc: 1.7V~1.95V", pageSize: 4096, blockSize: 262144, spareSize: "256B", deviceWidth: "x16" }
  ];

  for (const { id, density, voltage, pageSize, blockSize, spareSize, deviceWidth, cache } of cases) {
    const explain = fieldsFor(id);
    assert.equal(explain.density, density);
    assert.equal(explain.cell_level, 1);
    assert.equal(explain.voltage, voltage);
    assert.equal(explain.page_size, pageSize);
    assert.equal(explain.block_size, blockSize);
    assert.equal(explain.redundant_area_size, spareSize);
    assert.equal(explain.cache, cache);
    assert.equal(explain.device_width, deviceWidth);

    const result = resultFieldsFor(id);
    assert.equal(result.density, density);
    assert.equal(result.voltage, voltage);
    assert.equal(result.page_size, pageSize);
    assert.equal(result.block_size, blockSize);
    assert.equal(result.redundant_area_size, spareSize);
    assert.equal(result.cache, cache);
    assert.equal(result.device_width, deviceWidth === "x8" ? 8 : deviceWidth === "x16" ? 16 : undefined);
  }
});

test("unknown Winbond EF profiles keep vendor recognition without borrowed geometry", () => {
  const explain = fieldsFor("EFF1801572");
  assert.deepEqual(explain, {});
});
