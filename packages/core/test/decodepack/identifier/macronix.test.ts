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
    assert.equal(explain.specId, "flashid.mxic.lf.18ac.v1");
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
    assert.equal(explain.specId, "flashid.mxic.lf.28ad.v1");
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

test("Macronix 1.8V 28AD IDs preserve each official density profile", () => {
  const cases: Array<[string, number, number, number, number, number, string]> = [
    ["C2A180110303", 1024, 1, 1, 2048, 131072, "128B"],
    ["C2AA90110703", 2048, 1, 2, 2048, 131072, "128B"],
    ["C2AC9022570300", 4096, 1, 2, 4096, 262144, "256B"],
    ["C2A3D1225B03", 8192, 2, 4, 4096, 262144, "256B"]
  ];

  for (const [id, density, dieCount, planeCount, pageSize, blockSize, spareSize] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.uf.28ad.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.voltage, "Vcc: 1.7V~1.95V");
    assert.equal(fields.page_size, pageSize);
    assert.equal(fields.block_size, blockSize);
    assert.equal(fields.redundant_area_size, spareSize);
    assert.equal(fields.ecc_level, "8bit/544B");
  }
});

test("Macronix 1.8V 16/18AC and same-ID legacy profiles preserve width and geometry", () => {
  const cases: Array<[string, number, string, number, number, boolean]> = [
    ["C2A1801502", 1024, "x8", 1, 1, false],
    ["C2B1805502", 1024, "x16", 1, 1, false],
    ["C2AA901506", 2048, "x8", 1, 2, false],
    ["C2BA905506", 2048, "x16", 1, 2, false],
    ["C2AC901556", 4096, "x8", 1, 2, false],
    ["C2BC90555600", 4096, "x16", 1, 2, false],
    ["C2A3D1155A", 8192, "x8", 2, 4, true]
  ];

  for (const [id, density, width, dieCount, planeCount, interleave] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.uf.16-18ac-ab.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.device_width, width);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.voltage, "Vcc: 1.7V~1.95V");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
    assert.equal(fields.ecc_level, "4bit/512B");
    assert.equal(fields.interleave, interleave);
  }
});

test("Macronix MX30UF4G28AC uses its confirmed 2KB 8-bit profile", () => {
  const explain = explainIdentifierDecode(defaultDecodePack, "C2AC901157");
  assert.equal(explain.status, "matched");
  assert.equal(explain.specId, "flashid.mxic.uf4g.28ac.v1");
  const fields = explain.draft?.fields ?? {};
  assert.equal(fields.density, 4096);
  assert.equal(fields.voltage, "Vcc: 1.7V~1.95V");
  assert.equal(fields.device_width, "x8");
  assert.equal(fields.page_size, 2048);
  assert.equal(fields.block_size, 131072);
  assert.equal(fields.redundant_area_size, "128B");
  assert.equal(fields.ecc_level, "8bit/512B");
  assert.equal(fields.plane_count, 2);
});

test("Macronix MX30LF GE8AB IDs expose the internal-ECC SLC profiles", () => {
  const cases: Array<[string, number, number]> = [
    ["C2F1809582", 1024, 1],
    ["C2DA909586", 2048, 2],
    ["C2DC9095D600", 4096, 2]
  ];

  for (const [id, density, planeCount] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.lf.ge8ab.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
    assert.equal(fields.ecc_level, "Internal 4bit ECC");
    assert.equal(fields.plane_count, planeCount);
  }
});

test("Macronix legacy 08AA IDs preserve their four-byte 1-bit ECC profiles", () => {
  const cases: Array<[string, number]> = [
    ["C2F0801D", 512],
    ["C2F1801D00", 1024]
  ];

  for (const [id, density] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.lf.08aa.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, 1);
    assert.equal(fields.plane_count, undefined);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
    assert.equal(fields.ecc_level, "1bit/528B");
  }
});

test("Macronix 3V 28AB and 28AC IDs preserve the 112-byte spare profiles", () => {
  const cases: Array<[string, number, number, number, boolean]> = [
    ["C2F1809503", 1024, 1, 1, false],
    ["C2DA90950700", 2048, 1, 2, false],
    ["C2DC909557", 4096, 1, 2, false],
    ["C2D3D1955B", 8192, 2, 4, true]
  ];

  for (const [id, density, dieCount, planeCount, interleave] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.lf.28ab-ac.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, dieCount);
    assert.equal(fields.plane_count, planeCount);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.voltage, "Vcc: 2.7V~3.6V");
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "112B");
    assert.equal(fields.ecc_level, "8bit/540B");
    assert.equal(fields.interleave, interleave);
  }
});

test("Macronix 1.8V 28AB IDs preserve x8 and x16 organizations", () => {
  const cases: Array<[string, number, string]> = [
    ["C2AA901507", 2048, "x8"],
    ["C2BA90550700", 2048, "x16"],
    ["C2AC901557", 4096, "x8"],
    ["C2BC905557", 4096, "x16"]
  ];

  for (const [id, density, width] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.uf.28ab.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, 1);
    assert.equal(fields.plane_count, 2);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.voltage, "Vcc: 1.7V~1.95V");
    assert.equal(fields.device_width, width);
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "112B");
    assert.equal(fields.ecc_level, "8bit/540B");
  }
});

test("Macronix MX30UF GE8AB IDs expose always-enabled internal ECC", () => {
  const cases: Array<[string, number]> = [
    ["C2AA901586", 2048],
    ["C2AC9015D600", 4096]
  ];

  for (const [id, density] of cases) {
    const explain = explainIdentifierDecode(defaultDecodePack, id);
    assert.equal(explain.status, "matched");
    assert.equal(explain.specId, "flashid.mxic.uf.ge8ab.v1");
    const fields = explain.draft?.fields ?? {};
    assert.equal(fields.density, density);
    assert.equal(fields.die_count, 1);
    assert.equal(fields.plane_count, 2);
    assert.equal(fields.cell_level, 1);
    assert.equal(fields.voltage, "Vcc: 1.7V~1.95V");
    assert.equal(fields.device_width, "x8");
    assert.equal(fields.page_size, 2048);
    assert.equal(fields.block_size, 131072);
    assert.equal(fields.redundant_area_size, "64B");
    assert.equal(fields.ecc_level, "Internal 4bit ECC/524B");
  }
});

test("unconfirmed Macronix IDs retain the pre-existing vendor-only fallback", () => {
  const explain = explainIdentifierDecode(defaultDecodePack, "C2AC90155800");
  assert.equal(explain.status, "not_matched");

  const fields = publicFields("C2AC90155800");
  assert.equal(fields.density, undefined);
  assert.equal(fields.page_size, undefined);
  assert.equal(fields.block_size, undefined);
});
