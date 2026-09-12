import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { createEngine, fdnextResultJsonSchema, type PartDecodeResult, type PartNumberDecoder } from "../../src/index";
import { integratedEngine } from "./_helpers";

const defaultEngine = createEngine();
const validate = new Ajv2020({ strict: true }).compile(fdnextResultJsonSchema);
const field = (result: PartDecodeResult, key: string) => result.blocks.flatMap((block) => block.fields).find((value) => value.key === key);
const specs = (result: PartDecodeResult) => result.summary?.full.filter((block) => block.id !== "marking");
const pairs = [
  ["JZ215", "1CB2DJZ215", "MTFDHBL256TDQ-1AT12ATYY"],
  ["NW965", "9LC2DNW965", "MT29F4T08EULCEM4-R:C"],
  ["D9WFL", "1CB2DD9WFL", "MT40A1G8SA-062E:E"]
] as const;

test("short and full Micron markings share canonical identity, specifications and associations", () => {
  for (const engine of [defaultEngine, integratedEngine]) {
    for (const lang of ["chs", "eng"]) {
      for (const [short, full, pn] of pairs) {
        const a = engine.decodePart({ query: short, lang });
        const b = engine.decodePart({ query: full, lang });
        assert.equal(a.status, "ok");
        assert.equal(b.status, "ok");
        assert.equal(b.device?.partNumber, pn);
        assert.deepEqual(b.device, a.device);
        assert.deepEqual(specs(b), specs(a));
        assert.deepEqual(b.summary?.brief, a.summary?.brief);
        assert.deepEqual(b.relations, a.relations);
        assert.equal(b.input.query, full);
        assert.equal(b.input.normalized, full);
        assert.ok(!a.blocks.some((block) => block.id === "marking"));
        assert.deepEqual(b.blocks.find((block) => block.id === "marking")?.fields.map((value) => value.key),
          ["marking_year_digit", "marking_week", "marking_die_revision", "diffusion_loc", "encapsulation_loc"]);
        assert.ok(validate(b), JSON.stringify(validate.errors));
        assert.equal(engine.decodePartDraft({ query: full })?.device.partNumber, pn);
        assert.deepEqual(engine.decodePart({ query: short, lang }), a, "full marking metadata must not mutate later short-code results");
      }
    }
  }
});

test("marking dates retain year digit zero, two-digit weeks and independent die revisions", () => {
  const result = defaultEngine.decodePart({ query: "1CB2DD9WFL", lang: "chs" });
  assert.equal(field(result, "marking_year_digit")?.value, "1");
  assert.equal(field(result, "marking_week")?.value, 6);
  assert.equal(field(result, "marking_week")?.display, "06");
  assert.equal(field(result, "marking_die_revision")?.value, "B");
  assert.equal(field(result, "die_revision")?.value, "Rev E");
  assert.equal(field(result, "diffusion_loc")?.display, "新加坡");
  assert.equal(field(result, "encapsulation_loc")?.display, "马来西亚");
  const zero = defaultEngine.decodePart({ query: "0ABGDJZ215", lang: "eng" });
  assert.equal(field(zero, "marking_year_digit")?.value, "0");
  assert.equal(field(zero, "marking_week")?.display, "02");
  assert.equal(field(zero, "diffusion_loc")?.display, "India");
  const last = defaultEngine.decodePart({ query: "9ZB2DJZ215" });
  assert.equal(field(last, "marking_week")?.value, 52);
});

test("full marking searches resolve and deduplicate the same actual devices", () => {
  for (const engine of [defaultEngine, integratedEngine]) {
    for (const [short, full, pn] of pairs) {
      const a = engine.searchParts({ query: short, lang: "eng", limit: 5 });
      const b = engine.searchParts({ query: full, lang: "eng", limit: 5 });
      assert.equal(b.status, "ok");
      assert.equal(b.input.normalized, full);
      assert.deepEqual(b.items.map((item) => item.device), a.items.map((item) => item.device));
      assert.equal(b.items.length, 1);
      assert.equal(b.items[0]?.device.partNumber, pn);
      assert.equal(b.items[0]?.device.markingCode, short);
      assert.equal(b.relations?.[0]?.target.partNumber, pn);
      assert.ok(validate(b), JSON.stringify(validate.errors));
    }
  }
});

test("full marking normalization preserves original input and respects constraints", () => {
  const query = " 1cb2d\njz215 ";
  const result = defaultEngine.decodePart({ query, constraints: { vendor: "micron", chipKind: "managed_nand", strict: true } });
  assert.equal(result.status, "ok");
  assert.equal(result.input.query, query);
  assert.equal(result.input.normalized, "1CB2DJZ215");
  assert.equal(defaultEngine.searchParts({ query }).items[0]?.device.markingCode, "JZ215");
  for (const code of ["JZ215", "1CB2DJZ215"]) {
    assert.equal(defaultEngine.decodePart({ query: code, constraints: { vendor: "samsung", strict: true } }).status, "not_found");
    assert.equal(defaultEngine.searchParts({ query: code, constraints: { chipKind: "dram", strict: true } }).status, "not_found");
  }
});

test("invalid tracing characters never fabricate dates or locations", () => {
  for (const lang of ["chs", "eng"]) {
    const invalid = defaultEngine.decodePart({ query: "Z0B00JZ215", lang });
    assert.equal(invalid.status, "ok");
    for (const key of ["marking_year_digit", "marking_week", "diffusion_loc", "encapsulation_loc", "prod_date", "micron_part_number"]) {
      assert.equal(field(invalid, key), undefined);
    }
    assert.deepEqual(invalid.warnings.map((warning) => warning.code), ["invalid_marking_date", "unknown_marking_location"]);
    assert.match(invalid.warnings[0]?.message ?? "", lang === "chs" ? /丝印日期/ : /Invalid marking date/);
    const searched = defaultEngine.searchParts({ query: "Z0B00JZ215", lang });
    assert.equal(searched.warnings.length, 2);
    assert.equal(searched.warnings[0]?.message, invalid.warnings[0]?.message);
    assert.ok(validate(invalid), JSON.stringify(validate.errors));
  }
  for (const query of ["1CB2DZZZZZ", "NOTAPARTJZ215", "1CB2D/JZ215"]) {
    assert.equal(defaultEngine.decodePart({ query }).status, "not_found", query);
  }
});

test("a directly supported part number is not replaced by a coincidental marking suffix", () => {
  const pn = "ABCDEJZ215";
  const decoder = {
    id: "test.marking-collision",
    dispatchPrefixes: [pn],
    match: (input: string) => input === pn ? { decoderId: "test.marking-collision", input, normalized: input } : null,
    decode: () => ({ device: { partNumber: pn, vendor: "samsung", chipKind: "dram" }, fields: { dram_type: "DDR4" } })
  } satisfies PartNumberDecoder;
  const result = createEngine({ decoders: [decoder] }).decodePart({ query: pn });
  assert.equal(result.device?.partNumber, pn);
  assert.equal(result.device?.vendor.id, "samsung");
  assert.equal(result.device?.markingCode, undefined);
});
