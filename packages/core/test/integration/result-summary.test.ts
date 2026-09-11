import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { fdnextResultJsonSchema, type PartDecodeResult, type PartSearchResult, type ExternalLink } from "../../src/index";
import { fdnextExternalLinkCategories } from "../../src/result";
import { createRuntime } from "../../src/runtime";
import { integratedEngine as engine } from "./_helpers";

const validate = new Ajv2020({ strict: true }).compile(fdnextResultJsonSchema);
const values = (result: PartDecodeResult) => new Map(result.summary?.brief.map((field) => [field.key, field.display ?? field.value]));

test("DRAM summaries include speed and voltage with localized, scoped fields", () => {
  for (const lang of ["eng", "chs"]) {
    const result = engine.decodePart({ query: "CT40A1G16TB-075E:F", lang });
    assert.equal(values(result).get("dram_type"), "DDR4");
    assert.equal(values(result).get("dram_density"), "16Gb");
    assert.equal(values(result).get("dram_speed"), "DDR4-2666 CL18");
    assert.equal(values(result).get("dram_voltage"), "1.2V VDD");
    assert.match(result.subtitle ?? "", /DDR4-2666 CL18/);
    assert.match(result.summary?.brief.find((field) => field.key === "dram_voltage")?.label ?? "", lang === "eng" ? /Voltage/ : /电压/);
    assert.ok(!result.summary?.brief.some((field) => ["cell_level", "page_size"].includes(field.key)));
    assert.ok(validate(result), JSON.stringify(validate.errors));
  }
});

test("managed summaries retain marking identity and distinct device and component capacities", () => {
  const ssd = engine.decodePart({ query: "JZ215", lang: "eng" });
  assert.equal(ssd.input.query, "JZ215");
  assert.equal(ssd.device?.markingCode, "JZ215");
  assert.equal(ssd.device?.partNumber, "MTFDHBL256TDQ-1AT12ATYY");
  assert.equal(values(ssd).get("density"), "256GB");
  assert.equal(values(ssd).get("component_density"), "64GB");
  assert.equal(values(ssd).get("storage_interface"), "PCIe Gen3 x4");
  assert.equal(values(ssd).get("product_version"), "NVMe 1.3c");
  assert.ok(!values(ssd).has("voltage"));
  assert.equal(ssd.blocks.find((block) => block.id === "components")?.fields.find((field) => field.key === "component_voltage")?.value, "3.3V");

  const mcp = engine.decodePart({ query: "BWCA2KZC-64G", lang: "eng" });
  assert.equal(values(mcp).get("storage_density"), "64GB");
  assert.equal(values(mcp).get("dram_density"), "32Gb");
  assert.equal(values(mcp).get("dram_type"), "LPDDR4X");
  assert.ok(mcp.blocks.find((block) => block.id === "dram"));
  assert.ok(!mcp.blocks.find((block) => block.id === "components")?.fields.some((field) => field.key.startsWith("dram_")));
  const allInOne = engine.decodePart({ query: "MT29D26A22B41BABHS-5 IT", lang: "eng" });
  assert.ok(values(allInOne).has("product_mode"));
  assert.ok(!allInOne.summary?.brief.some((field) => field.key.endsWith("density")));
});

test("NAND, identifier and unusual types select actual fields without losing full specifications", () => {
  for (const query of ["MT29F4G08ABAEA", "W25N01GVZEIG", "MT29FCA8GDACABXC5:A", "PF29P64G2ALDNF1", "JZ215"]) {
    const result = engine.decodePart({ query, lang: "eng" });
    const fields = new Map(result.blocks.flatMap((block) => block.fields).map((field) => [field.key, field]));
    assert.ok(result.summary?.brief.length);
    assert.deepEqual(result.summary.full, result.blocks);
    for (const field of result.summary?.brief ?? []) assert.deepEqual(field, fields.get(field.key));
    assert.equal(new Set(result.summary?.brief.map((field) => field.key)).size, result.summary?.brief.length);
    assert.ok(validate(result), JSON.stringify(validate.errors));
  }
  const xpoint = engine.decodePart({ query: "PF29P64G2ALDNF1", lang: "eng" });
  assert.equal(values(xpoint).get("die_stack"), "2-Deck");
  assert.ok(!values(xpoint).has("cell_level"));
  const id = engine.decodeIdentifier({ query: "2CDC90A65400", lang: "eng" });
  assert.ok(id.summary?.brief.some((field) => field.key === "page_size"));
  assert.ok(id.summary?.brief.some((field) => field.key === "plane_count"));
  assert.ok(validate(id), JSON.stringify(validate.errors));
  const missing = engine.decodePart({ query: "NOT-A-REAL-PART" });
  assert.equal(missing.status, "not_found");
  assert.equal(missing.summary, undefined);
  assert.ok(validate(missing), JSON.stringify(validate.errors));
});

test("runtime and schema preserve abbreviated categories including ads on decode and search items", async () => {
  const runtime = createRuntime({
    externalLinkProviders: [{
      id: "test.categories",
      resolveLinks: () => fdnextExternalLinkCategories.map((category) => ({
        id: category, label: category, category, url: `https://example.com/${category}`
      }))
    }]
  });
  const decoded = await runtime.dispatch({ operation: "part.decode", input: { query: "JZ215" } });
  const searched = await runtime.dispatch({ operation: "part.search", input: { query: "MT29F4G08", limit: 1 } });
  const result = decoded.body as PartDecodeResult;
  const search = searched.body as PartSearchResult;
  assert.ok(search.items.length);
  for (const links of [result.links, search.links, search.items[0]?.links]) {
    assert.deepEqual(links?.map((link) => link.category).sort(), [...fdnextExternalLinkCategories].sort());
  }
  assert.ok(validate(result), JSON.stringify(validate.errors));
  assert.ok(validate(search), JSON.stringify(validate.errors));
  const incomplete = structuredClone(result);
  delete incomplete.summary;
  assert.equal(validate(incomplete), false, "successful v2 decode requires both summary variants");
  const missingFull = { ...result, summary: { brief: result.summary?.brief } };
  assert.equal(validate(missingFull), false);
  const legacy = structuredClone(result);
  legacy.links = [{ id: "legacy", label: "Legacy", url: "https://example.com", category: "reference" as ExternalLink["category"] }];
  assert.equal(validate(legacy), false, "v2 must reject the old category spelling");
});
