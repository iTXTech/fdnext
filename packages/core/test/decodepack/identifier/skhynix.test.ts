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

function explainFields(id: string): Record<string, unknown> {
  const explain = explainIdentifierDecode(defaultDecodePack, id);
  assert.equal(explain.status, "matched", `${id} should match an identifier DecodePack spec`);
  return explain.draft?.fields ?? {};
}

function resultFields(id: string): Record<string, unknown> {
  const result = engine.decodeIdentifier({ query: id, lang: "eng" });
  assert.equal(result.status, "ok", `${id} should decode through the public identifier API`);
  return Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.raw ?? field.value])));
}

function assertLegacyGeometry(id: string, density: number, width: "x8" | "x16", voltage: "Vcc: 1.8V" | "Vcc: 3.3V"): void {
  const explain = explainFields(id);
  assert.equal(explain.density, density);
  assert.equal(explain.device_width, width);
  assert.equal(explain.voltage, voltage);
  assert.equal(explain.page_size, 2048);
  assert.equal(explain.block_size, 131072);
  assert.equal(explain.redundant_area_size, "64B");

  const result = resultFields(id);
  assert.equal(result.density, density);
  assert.equal(result.device_width, width === "x8" ? 8 : 16);
  assert.equal(result.voltage, voltage);
  assert.equal(result.page_size, 2048);
  assert.equal(result.block_size, 131072);
  assert.equal(result.redundant_area_size, "64B");
}

test("SK hynix legacy SLC Read ID decodes 1Gb and 4Gb voltage/width variants", () => {
  assertLegacyGeometry("ADF1801D", 1024, "x8", "Vcc: 3.3V");
  assertLegacyGeometry("ADC1805D", 1024, "x16", "Vcc: 3.3V");
  assertLegacyGeometry("ADAC901554", 4096, "x8", "Vcc: 1.8V");
  assertLegacyGeometry("ADBC905554", 4096, "x16", "Vcc: 1.8V");
  assertLegacyGeometry("ADCC90D554", 4096, "x16", "Vcc: 3.3V");
  assertLegacyGeometry("ADDC909554", 4096, "x8", "Vcc: 3.3V");
});

test("SK hynix H27U2G/H27S2G datasheet Read IDs decode all 2Gb voltage and width variants", () => {
  assertLegacyGeometry("ADDA909544", 2048, "x8", "Vcc: 3.3V");
  assertLegacyGeometry("ADCA90D544", 2048, "x16", "Vcc: 3.3V");
  assertLegacyGeometry("ADAA901544", 2048, "x8", "Vcc: 1.8V");
  assertLegacyGeometry("ADBA905544", 2048, "x16", "Vcc: 1.8V");
});

test("SK hynix legacy small-page device IDs add density, voltage, and width without rewriting geometry", () => {
  const variants: Array<[string, number, number, "Vcc: 1.8V" | "Vcc: 3.3V"]> = [
    ["AD73", 128, 8, "Vcc: 3.3V"],
    ["AD53", 128, 16, "Vcc: 3.3V"],
    ["AD75", 256, 8, "Vcc: 3.3V"],
    ["AD55", 256, 16, "Vcc: 3.3V"],
    ["AD35", 256, 8, "Vcc: 1.8V"],
    ["AD45", 256, 16, "Vcc: 1.8V"],
    ["AD76", 512, 8, "Vcc: 3.3V"],
    ["AD56", 512, 16, "Vcc: 3.3V"],
    ["AD36", 512, 8, "Vcc: 1.8V"],
    ["AD46", 512, 16, "Vcc: 1.8V"]
  ];

  for (const [id, density, width, voltage] of variants) {
    const fields = resultFields(id);
    assert.equal(fields.density, density, `${id} density`);
    assert.equal(fields.device_width, width, `${id} width`);
    assert.equal(fields.voltage, voltage, `${id} voltage`);

    // The two-byte legacy IDs are padded by the generic identifier path. Keep the
    // existing generic geometry untouched until a dedicated compatibility decision.
    assert.equal(fields.page_size, 2048, `${id} preserved page size`);
    assert.equal(fields.block_size, 131072, `${id} preserved block size`);
    assert.equal(fields.redundant_area_size, "128B", `${id} preserved spare size`);
  }
});

test("SK hynix legacy stacked SLC geometry is conditioned on byte 3", () => {
  assertLegacyGeometry("ADD3D19558", 8192, "x8", "Vcc: 3.3V");
  assertLegacyGeometry("ADD5D2955C", 16384, "x8", "Vcc: 3.3V");

  const modernMlc = resultFields("ADD5949A7442");
  assert.equal(modernMlc.density, 16384);
  assert.equal(modernMlc.cell_level, "MLC");
  assert.equal(modernMlc.page_size, 8192);
  assert.equal(modernMlc.block_size, 2097152);
  assert.equal(modernMlc.redundant_area_size, "448B");
});
