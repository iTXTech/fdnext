import assert from "node:assert/strict";
import { createEngine } from "../../core/src/index";
import { embeddedResourceBundle } from "../../resources/index";
import { compileDecodePack, defaultDecodePack, explainIdentifierDecode } from "../src/index";

const engine = createEngine({
  resources: embeddedResourceBundle,
  decoders: compileDecodePack(defaultDecodePack).partDecoders,
  identifierDecoders: compileDecodePack(defaultDecodePack).identifierDecoders
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

function assertExplainField(id: string, key: string, expected: unknown): void {
  assert.equal(explainFields(id)[key], expected, `${id} explain ${key}`);
}

function assertResultField(id: string, key: string, expected: unknown): void {
  assert.equal(resultFields(id)[key], expected, `${id} result ${key}`);
}

assertExplainField("984C84320024", "density", 131072);
assertExplainField("984C84320024", "process_node", "BiCS5 112L");
assertResultField("984C84320024", "density", 131072);
assertResultField("984C84320024", "process_node", "BiCS5 112L");

assertExplainField("454C84320024", "density", 131072);
assertExplainField("454C84320024", "process_node", "BiCS5 112L");
assertResultField("454C84320024", "density", 131072);
assertResultField("454C84320024", "process_node", "BiCS5 112L");

assertExplainField("ECC1843200C1", "process_node", "136L 3DV6e");
assertResultField("ECC1843200C1", "process_node", "136L 3DV6e");
assertExplainField("ECD5843200C7", "process_node", "24L 3DV1");
assertResultField("ECD5843200C7", "process_node", "24L 3DV1");
assertExplainField("ECD5843200CF", "process_node", "236L 3DV8");
assertResultField("ECD5843200CF", "process_node", "236L 3DV8");

assertExplainField("AD3A843200C3", "process_node", "26nm");
assertResultField("AD3A843200C3", "process_node", "26nm");
assertExplainField("AD3A843200D0", "process_node", "238L 3DV8");
assertResultField("AD3A843200D0", "process_node", "238L 3DV8");

assertExplainField("2C0506840000", "density", 4194304);
assertResultField("2C0506840000", "density", 4194304);
assertExplainField("890906840000", "density", 5591040);
assertExplainField("890906840000", "cell_level", 3);
assertResultField("890906840000", "density", 5591040);
assertResultField("890906840000", "cell_level", "TLC");

assertExplainField("9BD5588D2000", "density", 1397760);
assertExplainField("9BD5588D2000", "cell_level", 4);
assertExplainField("9BD5588D2000", "process_node", "128L 3DV3");
assertResultField("9BD5588D2000", "density", 1397760);
assertResultField("9BD5588D2000", "cell_level", "QLC");
assertResultField("9BD5588D2000", "process_node", "128L 3DV3 (x2-6070)");
