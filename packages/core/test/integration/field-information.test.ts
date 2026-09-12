import assert from "node:assert/strict";
import test from "node:test";
import { createEngine } from "../../src/index";
import { defaultDecodePack, explainPartDecode } from "../../src/decodepack";

const engine = createEngine();

test("source fields carry independent technology, voltage, controller and class information", () => {
  for (const [query, present, absent] of [
    ["BWCTAKL11X128G", { cell_level: "TLC", nand_technology: "3D" }, []],
    ["BWEFMA016GN9RE", { cell_level: "MLC", product_class: "Automotive, AEC-Q100 Grade 2" }, ["nand_technology"]],
    ["IS43LD16128C-18BLI", { dram_type: "LPDDR2", dram_speed: "533MHz (DDR-1066)" }, ["dram_voltage"]],
    ["YMEC6A1TC1A2C1", { controller: "EC000", storage_interface: "eMMC 5.1" }, ["product_family"]]
  ] as const) {
    const draft = explainPartDecode(defaultDecodePack, query).draft;
    for (const key of absent) assert.ok(draft?.fields?.[key] == null || draft.fields[key] === "", `${query}: source ${key}`);
    for (const lang of ["eng", "chs"]) {
      const result = engine.decodePart({ query, lang });
      const fields = Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.value])));
      for (const [key, value] of Object.entries(present)) assert.deepEqual(fields[key], value, `${query}: ${key}`);
      for (const key of absent) assert.equal(fields[key], undefined, `${query}: ${key}`);
      assert.deepEqual(result.summary!.full, result.blocks);
    }
  }
});

test("split descriptions preserve component geometry, process, supply rails and read latency", () => {
  for (const [query, expected] of [
    ["MTFDDAC128MAG-1G12AA", { component_density: 32768, component_width: 8, component_voltage: "3.3V", cell_level: "MLC", process_node: "34nm" }],
    ["MTFDHBL064TDP-1AT12AIYY", { component_density: 524288, component_width: 8, component_voltage: "3.3V", cell_level: "TLC", nand_technology: "3D" }],
    ["H9HP52ACPMADAR-KMM", { component_voltage: "3.3V", component_width: 8, voltage: "eMMC Vcc: 3.3V", dram_voltage: "1.8V/1.1V/0.6V", dram_speed: "LPDDR4X-3733", speed_grade: "eMMC 400MHz" }],
    ["NT6AN512T32AV-J1", { dram_speed: "LPDDR4-4267", read_latency: 36, speed_grade: "J1 0.468ns" }],
    ["MT29JZZZ2DWMAFJV-6IES.63m", { storage_interface: "eMMC 4.2/4.3", product_mode: "LPDDR + SLC eMMC" }]
  ] as const) {
    const result = engine.decodePart({ query, lang: "eng" });
    const fields = Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.value])));
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(fields[key], value, `${query}: ${key}`);
    assert.equal(fields.nand_component, undefined, query);
  }
});

test("a die name does not hide distinct generation, series or process information", () => {
  const fields = { die_codename: "test-die", generation_info: "Gen2", series_info: "Low-voltage series", process_node: "25nm" };
  const fixture = createEngine({
    decoders: [{
      id: "test.field-information", dispatchPrefixes: ["TEST"],
      match: (input) => ({ decoderId: "test.field-information", input, normalized: input }),
      decode: (match) => ({ device: { partNumber: match.normalized, vendor: "micron", chipKind: "raw_nand" }, fields })
    }]
  });
  for (const lang of ["eng", "chs"]) {
    const result = fixture.decodePart({ query: "TEST-FIELD-INFORMATION", lang });
    const actual = Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.value])));
    for (const [key, value] of Object.entries(fields)) assert.equal(actual[key], value);
    assert.deepEqual(result.summary!.full, result.blocks);
  }
  const ymtc = engine.decodeIdentifier({ query: "9BD5588D2000", lang: "eng" });
  assert.equal(ymtc.blocks.flatMap((block) => block.fields).find((field) => field.key === "generation_info")?.value, "Gen3 Xtacking 2.0");
});

test("die profiles avoid repeating their named generation while preserving 3D technology", () => {
  const result = engine.decodePart({ query: "H25T0TD18CX655", lang: "eng" });
  const fields = Object.fromEntries(result.blocks.flatMap((block) => block.fields.map((field) => [field.key, field.value])));
  assert.equal(fields.die_codename, "HYV9");
  assert.equal(fields.nand_technology, "3D");
  assert.equal(fields.generation_info, undefined);
});
