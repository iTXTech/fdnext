import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { createEngine, fdnextResultJsonSchema } from "../../src/index";
import { checkDecodePack, defaultDecodePack, explainPartDecode } from "../../src/decodepack";

const engine = createEngine();
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(fdnextResultJsonSchema);

test("NAND interface preserves both device rating and die capability in one field", () => {
  for (const [query, rating, capability] of [
    ["YMN0WQA2B1CC4C", "ONFI 4.1; Max Speed=1200MT/s", "ONFI 4.1; Max Speed=1200MT/s"],
    ["YMN08TB1B1AU1B", "ONFI 3.2; Max Speed=533MT/s", "ONFI 4.0; Max Speed=800MT/s"],
    ["YMN09TC1B1AC6C", "ONFI 4.2; Max Speed=1600MT/s", "ONFI 4.1; Max Speed=1600MT/s"],
    ["YMN0WQC1B1AC6C", "ONFI 4.2; Max Speed=1600MT/s", "ONFI 4.1; Max Speed=1200MT/s"],
    ["H25T0TG18GX807", "Max Speed=3600MT/s", "Max Speed=3600MT/s"]
  ]) {
    for (const lang of ["eng", "chs"]) {
      const result = engine.decodePart({ query: query!, lang });
      const fields = result.blocks.flatMap((block) => block.fields);
      const interfaces = fields.filter((field) => field.key === "nand_interface");
      assert.equal(interfaces.length, 1, query);
      assert.deepEqual(interfaces[0]!.value, { rating, capability }, query);
      assert.ok(!fields.some((field) => field.key === "speed_grade"), query);
      assert.equal(interfaces[0]!.display, rating === capability
        ? `Grade / Die: ${rating}` : `Grade: ${rating}; Die: ${capability}`);
      assert.deepEqual(result.summary!.full, result.blocks);
      assert.ok(validate(result), JSON.stringify(validate.errors));
    }
  }
});

test("YMTC source drafts already contain both scopes before result generation", () => {
  const draft = explainPartDecode(defaultDecodePack, "YMN09TC1B1AC6C").draft;
  assert.deepEqual(draft?.fields?.nand_interface, {
    rating: "ONFI 4.2; Max Speed=1600MT/s", capability: "ONFI 4.1; Max Speed=1600MT/s"
  });
  assert.equal(draft?.fields?.speed_grade, undefined);
});

test("unknown ratings retain known die capability and reject ambiguous interface shapes", () => {
  const result = engine.decodePart({ query: "KRN09TC1W03MXD", lang: "eng" });
  const field = result.blocks.flatMap((block) => block.fields).find((field) => field.key === "nand_interface")!;
  assert.deepEqual(field.value, { capability: "ONFI 5.0; Max Speed=2400MT/s" });
  assert.ok(validate(result), JSON.stringify(validate.errors));
  for (const invalid of ["ONFI 5.0", {}, { rating: "" }, { capability: "ONFI 5.0", extra: "lost scope" }]) {
    field.value = invalid;
    assert.equal(validate(result), false, JSON.stringify(invalid));
  }
});

test("DecodePack source checks reject unscoped or unknown NAND interface literals", () => {
  for (const invalid of ["ONFI 5.0", {}, { capability: "Undefined" }, { speed: "2400MT/s" }]) {
    const pack = structuredClone(defaultDecodePack);
    pack.sharedTables!["test.interface"] = { sample: { nand_interface: invalid } };
    assert.ok(checkDecodePack(pack).findings.some((finding) => finding.code === "invalid_nand_interface"));
  }
  assert.equal(checkDecodePack(defaultDecodePack).ok, true);
});
