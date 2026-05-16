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

function assertResultFieldAbsent(id: string, key: string): void {
  assert.equal(Object.hasOwn(resultFields(id), key), false, `${id} result should omit ${key}`);
}

assertExplainField("984C84320024", "density", 131072);
assertExplainField("984C84320024", "die_codename", "KBiCS5");
assertResultField("984C84320024", "density", 131072);
assertResultField("984C84320024", "die_codename", "BiCS5");

assertExplainField("454C84320024", "density", 131072);
assertExplainField("454C84320024", "die_codename", "SBiCS5");
assertResultField("454C84320024", "density", 131072);
assertResultField("454C84320024", "die_codename", "BiCS5");

assertExplainField("ECC1843200C1", "die_codename", "SSV6");
assertResultField("ECC1843200C1", "die_codename", "SSV6");
assertResultField("ECC1843200C1", "layer_count", 128);
assertExplainField("ECC1843200CD", "die_codename", "SSV6");
assertResultField("ECC1843200CD", "die_codename", "SSV6");
assertExplainField("EC1EA88F88C1", "die_codename", "SSV7");
assertResultField("EC1EA88F88C1", "die_codename", "SSV7");
assertResultField("EC1EA88F88C1", "layer_count", 176);
assertExplainField("EC1E981F84C2", "die_codename", "SSV6P");
assertResultField("EC1E981F84C2", "die_codename", "SSV6P");
assertResultField("EC1E981F84C2", "layer_count", 133);
assertExplainField("EC5E981F84D2", "die_codename", "SSV6P");
assertResultField("EC5E981F84D2", "die_codename", "SSV6P");
assertExplainField("ECD7147654C2", "die_codename", "SS32");
assertResultField("ECD7147654C2", "die_codename", "32nm");
assertExplainField("ECD5843200C7", "die_codename", "SSV1");
assertResultField("ECD5843200C7", "die_codename", "SSV1");
assertResultFieldAbsent("ECD5843200CF", "die_codename");
assertExplainField("EC5FA83F88CF", "die_codename", "SSV8");
assertResultField("EC5FA83F88CF", "die_codename", "SSV8");
assertExplainField("EC5FA83F88DF", "die_codename", "SSV8");
assertResultField("EC5FA83F88DF", "die_codename", "SSV8");
assertExplainField("EC5FA89F88C3", "die_codename", "SSV9");
assertResultField("EC5FA89F88C3", "die_codename", "SSV9");
assertExplainField("ECD798CE74C3", "die_codename", "SS27");
assertResultField("ECD798CE74C3", "die_codename", "27nm");

assertExplainField("AD3A08320040", "die_codename", "HY16");
assertResultField("AD3A08320040", "die_codename", "16nm");
assertResultField("AD3A08320040", "cell_level", "TLC");
assertExplainField("AD3A84320040", "die_codename", "HY16");
assertExplainField("AD3A84320040", "cell_level", 2);
assertResultField("AD3A84320040", "die_codename", "16nm");
assertResultField("AD3A84320040", "cell_level", "MLC");
assertExplainField("AD3A843200C3", "die_codename", "HY26");
assertResultField("AD3A843200C3", "die_codename", "26nm");
assertExplainField("AD3A843200D0", "die_codename", "HYV8");
assertResultField("AD3A843200D0", "die_codename", "HYV8");

assertExplainField("2C0506840000", "density", 4194304);
assertResultField("2C0506840000", "density", 4194304);
assertResultField("2CC30832E630", "die_codename", "B57T");
assertResultField("2CC30832EA34", "die_codename", "B47T");
assertResultField("2CC40832A600", "die_codename", "B17A");
assertResultField("2CC40832A600", "layer_count", 64);
assertResultField("2CC41832A200", "die_codename", "B27A");
assertResultField("2CC41832A200", "layer_count", 96);
assertResultField("2CC30832E600", "die_codename", "B27B");
assertResultField("2CC30832E600", "layer_count", 96);
assertResultField("2CD30C42EE30", "die_codename", "N58R");
assertResultField("2CD30832E834", "die_codename", "B68S");
assertResultField("2CD5943E7400", "die_codename", "L52A");
assertExplainField("890906840000", "density", 5591040);
assertExplainField("890906840000", "cell_level", 3);
assertResultField("890906840000", "density", 5591040);
assertResultField("890906840000", "cell_level", "TLC");
assertResultField("89092B32C200", "die_codename", "N4PA");
assertResultField("89050432C200", "die_codename", "N4PA");

assertExplainField("9BD5588D2000", "density", 1397760);
assertExplainField("9BD5588D2000", "cell_level", 4);
assertExplainField("9BD5588D2000", "generation_info", "Gen 3 Xtacking 2.0");
assertResultField("9BD5588D2000", "density", 1397760);
assertResultField("9BD5588D2000", "cell_level", "QLC");
assertResultField("9BD5588D2000", "die_codename", "HUS");
assertResultField("9BD5588D2000", "process_alias", "X2-6070");
assertResultFieldAbsent("9BD5588D2000", "generation_info");
assertResultField("9BD5588D2000", "die_density", "1.33Tb");
assertResultField("9BD5588D2000", "layer_count", 128);
assertResultField("9BD5588D2000", "plane_count", 6);
assertResultField("9BD5588D2000", "speed_grade", "ONFI 4.1; Max Speed=1200MT/s");
assertResultField("9BD5588D2000", "pages_per_block", "3048 pages");
assertResultField("9BC529493000", "die_codename", "WYS");
assertResultField("9BC529493000", "process_alias", "X3-9060");
assertResultField("9BC529493000", "die_density", "512Gb");
assertResultField("9BC529493000", "layer_count", 128);
assertResultField("9BC659713000", "die_codename", "WDS");
assertResultField("9BC659713000", "layer_count", 232);
assertResultField("9BC659713000", "plane_count", 6);
assertResultField("9BC55C553000", "die_codename", "EMS");
assertResultField("9BC55C553000", "layer_count", 232);
assertResultField("9BC55C553000", "redundant_area_size", "2432B");
