import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { createEngine, fdnextResultJsonSchema, type PartDecodeResult, type IdentifierDecodeResult } from "../../src/index";
import { fdnextFieldProfiles } from "../../src/field-profiles";

const engine = createEngine();
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(fdnextResultJsonSchema);

function field(result: PartDecodeResult | IdentifierDecodeResult, key: string, blockId: string) {
  const locations = result.blocks.filter((block) => block.fields.some((field) => field.key === key));
  assert.deepEqual(locations.map((block) => block.id), [blockId], `${result.input.query}: ${key} placement`);
  return locations[0]!.fields.find((field) => field.key === key)!;
}

test("profiles declare each detail field once and leave device identity outside blocks", () => {
  const identityKeys = new Set(["vendor", "chip_kind", "product_type", "part_number", "identifier", "id_scheme", "marking_code"]);
  for (const profile of Object.values(fdnextFieldProfiles)) {
    const blockIds = profile.blocks.map((block) => block.id);
    assert.equal(new Set(blockIds).size, blockIds.length, `${profile.id}: duplicate blocks`);
    const keys = profile.blocks.flatMap((block) => [...block.fields]);
    assert.equal(new Set(keys).size, keys.length, `${profile.id}: duplicate field declarations`);
    assert.deepEqual(keys.filter((key) => identityKeys.has(key) || key.endsWith("_code")), [], profile.id);
  }
});

test("standalone DRAM groups die capacity with topology and keeps process details together", () => {
  const hbm = engine.decodePart({ query: "KHA843801B-MC12", lang: "eng" });
  assert.equal(field(hbm, "dram_density", "dram").value, 32768);
  assert.equal(field(hbm, "dram_die_density", "geometry").display, "8Gb");
  assert.equal(field(hbm, "dram_die_count", "geometry").value, 4);
  assert.equal(field(hbm, "series_info", "dram").value, "Flarebolt");

  const ddr4 = engine.decodePart({ query: "K4A8G085WB-BCRC", lang: "chs" });
  assert.equal(field(ddr4, "bank_count", "geometry").value, 16);
  assert.equal(field(ddr4, "die_revision", "dram").value, "B-die");
  assert.equal(field(ddr4, "interface_type", "interface").value, "POD (1.2V VDD/VDDQ)");
  assert.equal(field(ddr4, "solder_type", "package").value, "Lead-Free and Halogen-Free");
  assert.equal(ddr4.blocks.find((block) => block.id === "geometry")?.label, "组织结构");

  const lpddr = engine.decodePart({ query: "NT6CL256M32AM-H0", lang: "eng" });
  assert.equal(field(lpddr, "cas_latency", "timing").value, 16);
  assert.equal(field(lpddr, "speed_grade", "timing").value, "H0 2133Mbps @ RL=16");
});

test("managed NAND separates the host interface from the internal NAND interface and geometry", () => {
  const result = engine.decodePart({ query: "YMEC6A1TC1A2C1", lang: "eng" });
  assert.equal(field(result, "storage_interface", "storage").value, "eMMC 5.1");
  assert.deepEqual(field(result, "nand_interface", "components").value, { capability: "ONFI 4.1; Max Speed=1600MT/s" });
  assert.equal(field(result, "die_density", "components").value, 524288);
  assert.equal(field(result, "page_size", "components").value, 16384);
  assert.equal(field(result, "pages_per_block", "components").value, "2304 pages");
  assert.equal(field(result, "redundant_area_size", "components").value, "2048B");
  assert.ok(!result.blocks.flatMap((block) => block.fields).some((field) => field.key === "speed_grade"));
  assert.ok(!result.summary?.brief.some((field) => field.key === "nand_interface"));

  const mcp = engine.decodePart({ query: "BWCA2KZC-64G", lang: "eng" });
  assert.equal(field(mcp, "storage_density", "storage").display, "64GB");
  assert.equal(field(mcp, "dram_density", "dram").display, "32Gb");
  assert.ok(validate(mcp), JSON.stringify(validate.errors));
});

test("Flash ID die capacity and Micron marking metadata use their semantic groups", () => {
  const id = engine.decodeIdentifier({ query: "2C644432A500", lang: "eng" });
  const density = field(id, "die_density", "geometry");
  assert.equal(density.value, 65536);
  assert.equal(density.unit, "Mbit");
  assert.equal(density.display, "8GB");

  const marking = engine.decodePart({ query: "9LC2DNW965", lang: "eng" });
  for (const key of ["marking_year_digit", "marking_week", "marking_die_revision", "diffusion_loc", "encapsulation_loc"]) field(marking, key, "marking");
  assert.ok(!marking.blocks.some((block) => block.id === "additional"));
  assert.ok(validate(marking), JSON.stringify(validate.errors));
});

test("ambiguous component densities remain numeric alternatives instead of a fabricated single capacity", () => {
  const result = engine.decodePart({ query: "SM1B64GAWACNA", lang: "eng" });
  const options = field(result, "component_density_options", "components");
  assert.deepEqual(options.value, [262144, 524288]);
  assert.equal(options.unit, "Mbit");
  assert.equal(options.display, "32GB / 64GB");
  assert.ok(!result.blocks.flatMap((block) => block.fields).some((field) => field.key === "component_density"));
  assert.ok(validate(result), JSON.stringify(validate.errors));
});

test("capacity result contracts reject strings, missing units and nonpositive values", () => {
  const result = engine.decodeIdentifier({ query: "2C644432A500", lang: "eng" });
  assert.ok(validate(result), JSON.stringify(validate.errors));
  for (const badValue of ["64Gb", 0, -1]) {
    const invalid = structuredClone(result);
    field(invalid, "die_density", "geometry").value = badValue;
    assert.equal(validate(invalid), false, `must reject ${badValue}`);
  }
  const invalid = structuredClone(result);
  delete field(invalid, "die_density", "geometry").unit;
  assert.equal(validate(invalid), false, "Mbit unit is mandatory");
});
