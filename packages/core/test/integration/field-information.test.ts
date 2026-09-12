import assert from "node:assert/strict";
import test from "node:test";
import { createEngine } from "../../src/index";
import { checkDecodePack, defaultDecodePack, explainPartDecode } from "../../src/decodepack";

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

test("source checks reject cell/type echoes but allow meaningful NAND mode qualifiers", () => {
  for (const fields of [{ nand_technology: "MLC" }, { nand_technology: "3D TLC NAND" }, { dram_voltage: "LPDDR2" }]) {
    const pack = structuredClone(defaultDecodePack);
    pack.sharedTables!["test.information"] = { sample: fields };
    assert.ok(checkDecodePack(pack).findings.some((finding) => finding.code === "field_information_overlap"));
  }
  const pack = structuredClone(defaultDecodePack);
  pack.sharedTables!["test.information"] = { sample: { nand_technology: "Win-pSLC (TLC NAND)" } };
  assert.equal(checkDecodePack(pack).ok, true);
});
