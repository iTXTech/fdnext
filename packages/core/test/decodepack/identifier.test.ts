import assert from "node:assert/strict";
import { createEngine } from "../../src/index";
import { embeddedResourceBundle } from "../../src/resources";
import { compileDecodePack, defaultDecodePack, explainIdentifierDecode } from "../../src/decodepack";

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

function assertExplainFieldAbsent(id: string, key: string): void {
  assert.equal(Object.hasOwn(explainFields(id), key), false, `${id} explain should omit ${key}`);
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
assertExplainField("987384320024", "density", 1397760);
assertResultField("987384320024", "density", 1397760);
assertExplainField("457384320024", "density", 1397760);
assertResultField("457384320024", "density", 1397760);

const kioxiaLegacySlcIds: Array<[string, number]> = [
  ["98F18015F216", 1024],
  ["98DA9015F600", 2048],
  ["98DC84A50480", 4096]
];

for (const [id, density] of kioxiaLegacySlcIds) {
  assertExplainField(id, "density", density);
  assertResultField(id, "density", density);
}

const bics4FlashIds: Array<[string, string, string]> = [
  ["983C98B37663", "KBiCS4", "BiCS4"],
  ["983C98B3F663", "KBiCS4.5", "BiCS4.5"],
  ["983E98B37663", "KBiCS4", "BiCS4"],
  ["983E98B3F663", "KBiCS4.5", "BiCS4.5"],
  ["453C98B376E3", "SBiCS4", "BiCS4"],
  ["453C98B3F6E3", "SBiCS4.5", "BiCS4.5"]
];

for (const [id, profileKey, display] of bics4FlashIds) {
  assertExplainField(id, "die_codename", profileKey);
  assertResultField(id, "die_codename", display);
  assertExplainField(id, "plane_count", 2);
  assertResultField(id, "plane_count", 2);
}

assertExplainField("983AA0B17EE3", "density", 131072);
assertExplainField("983AA0B17EE3", "die_count", 1);
assertExplainField("983AA0B17EE3", "cell_level", 1);
assertExplainField("983AA0B17EE3", "page_size", 4096);
assertExplainField("983AA0B17EE3", "plane_count", 8);
assertExplainField("983AA0B17EE3", "interface_type", "Toggle Mode");
assertExplainField("983AA0B17EE3", "die_codename", "KBiCS4");
assertResultField("983AA0B17EE3", "plane_count", 8);
assertResultField("983AA0B17EE3", "interface_type", "Toggle Mode");

assertExplainField("983CA1B17EE3", "density", 262144);
assertExplainField("983CA1B17EE3", "die_count", 2);
assertExplainField("983CA1B17EE3", "cell_level", 1);
assertExplainField("983CA1B17EE3", "page_size", 4096);
assertExplainField("983CA1B17EE3", "plane_count", 16);
assertExplainField("983CA1B17EE3", "interface_type", "Toggle Mode");
assertExplainField("983CA1B17EE3", "die_codename", "KBiCS4");
assertResultField("983CA1B17EE3", "plane_count", 8);
assertResultField("983CA1B17EE3", "interface_type", "Toggle Mode");

const kioxia2dProcessIds: Array<[string, string, string]> = [
  ["983A94937651", "TSB15", "15nm"],
  ["983A949376D1", "TSB15", "15nm"],
  ["983A95937A50", "TSB1Y", "A19nm"],
  ["983A95937AD0", "TSB1Y", "A19nm"],
  ["983A95937A57", "TSB19", "19nm"],
  ["983A95937AD7", "TSB19", "19nm"],
  ["983A95827A55", "TSB32", "32nm"],
  ["983A95827AD5", "TSB32", "32nm"],
  ["983A95827A56", "TSB24", "24nm"],
  ["983A95827AD6", "TSB24", "24nm"]
];

for (const [id, profileKey, display] of kioxia2dProcessIds) {
  assertExplainField(id, "die_codename", profileKey);
  assertResultField(id, "die_codename", display);
}

assertExplainField("ECC1843200C1", "die_codename", "SSV6");
assertResultField("ECC1843200C1", "die_codename", "SSV6M");
assertResultField("ECC1843200C1", "layer_count", 128);
assertExplainField("ECC1843200CD", "die_codename", "SSV6");
assertResultField("ECC1843200CD", "die_codename", "SSV6M");
assertExplainField("EC1EA88F88C1", "die_codename", "SSV7");
assertResultField("EC1EA88F88C1", "die_codename", "SSV7");
assertResultField("EC1EA88F88C1", "layer_count", 176);
assertExplainField("EC1E981F84C2", "die_codename", "SSV6P");
assertResultField("EC1E981F84C2", "die_codename", "SSV6P");
assertResultField("EC1E981F84C2", "layer_count", 133);
assertExplainField("EC1E981F84C2", "block_size", 16567500.8);
assertResultField("EC1E981F84C2", "block_size", 16567500.8);
assertExplainField("EC1E981F84C2", "redundant_area_size", "2KB");
assertExplainField("EC1E981F84C2", "ecc_level", "LDPC");
assertExplainField("EC5E981F84D2", "die_codename", "SSV6P");
assertResultField("EC5E981F84D2", "die_codename", "SSV6P");
assertExplainField("EC5E98BF84CC", "density", 524288);
assertResultField("EC5E98BF84CC", "density", 524288);
assertExplainField("EC5E98BF84CC", "die_count", 1);
assertExplainField("EC5E98BF84CC", "cell_level", 3);
assertExplainField("EC5E98BF84CC", "simultaneously_programmed_pages", 2);
assertExplainField("EC5E98BF84CC", "interleave", false);
assertExplainField("EC5E98BF84CC", "cache", true);
assertExplainField("EC5E98BF84CC", "page_size", 16384);
assertExplainField("EC5E98BF84CC", "block_size", 18087936);
assertResultField("EC5E98BF84CC", "block_size", 18087936);
assertExplainField("EC5E98BF84CC", "redundant_area_size", "2KB");
assertResultField("EC5E98BF84CC", "redundant_area_size", "2KB");
assertExplainField("EC5E98BF84CC", "plane_count", 2);
assertResultField("EC5E98BF84CC", "plane_count", 2);
assertExplainField("EC5E98BF84CC", "ecc_level", "LDPC");
assertResultField("EC5E98BF84CC", "ecc_level", "LDPC");
assertExplainField("EC5E98BF84CC", "edo", true);
assertExplainField("EC5E98BF84CC", "interface_type", "ToggleDDR");
assertExplainField("EC5E98BF84CC", "die_codename", "SSV5");
assertResultField("EC5E98BF84CC", "die_codename", "SSV5");
assertResultFieldAbsent("EC5E98BF84CC", "revision");
assertExplainField("EC5E98BF8407", "die_codename", "SSV1");
assertExplainField("EC5E98BF8408", "die_codename", "SSV2");
assertExplainField("EC5E98BF8409", "die_codename", "SSV3");
assertExplainField("EC5E98BF840B", "die_codename", "SSV4");
assertExplainField("EC5E98BF840C", "die_codename", "SSV5");
assertResultField("EC51DD1F88CB", "cell_level", "QLC");
assertResultField("EC51DD1F88CB", "die_codename", "SSV4Q");
assertResultField("EC51DD1F88CB", "layer_count", 64);
assertResultField("EC52DE6B8CCC", "cell_level", "QLC");
assertResultField("EC52DE6B8CCC", "die_codename", "SSV5Q");
assertResultField("EC52DE6B8CCC", "layer_count", 92);
assertResultField("EC51ED4B8CC1", "cell_level", "QLC");
assertResultField("EC51ED4B8CC1", "die_codename", "SSV7Q");
assertResultField("EC51ED4B8CC1", "layer_count", 176);
assertResultField("EC5FAC4B88C1", "cell_level", "QLC");
assertResultField("EC5FAC4B88C1", "die_codename", "SSV7Q");
assertResultField("EC5FAC4B88C1", "layer_count", 176);
assertResultField("EC51ED6B8CC3", "cell_level", "QLC");
assertResultField("EC51ED6B8CC3", "die_codename", "SSV9Q");
assertResultField("EC51ED6B8CC3", "layer_count", 280);
assertExplainField("ECD7147654C2", "die_codename", "SS32");
assertResultField("ECD7147654C2", "die_codename", "32nm");
assertExplainField("ECD7147654C2", "block_size", 1048576);
assertResultField("ECD7147654C2", "block_size", 1048576);
assertExplainFieldAbsent("ECD7147654C2", "redundant_area_size");
assertResultFieldAbsent("ECD7147654C2", "redundant_area_size");
assertExplainField("ECD7147654C2", "ecc_level", "24bit/1KB");
assertResultField("ECD7147654C2", "ecc_level", "24bit/1KB");
assertExplainField("ECD5843200C7", "die_codename", "SSV1");
assertResultField("ECD5843200C7", "die_codename", "SSV1M");
assertExplainField("ECD5843200C7", "block_size", 12582912);
assertResultField("ECD5843200C7", "block_size", 12582912);
assertExplainField("ECD5843200C7", "redundant_area_size", "768B");
assertResultField("ECD5843200C7", "redundant_area_size", "768B");
assertExplainField("ECD5843200C7", "ecc_level", "1bit");
assertResultField("ECD5843200C7", "ecc_level", "1bit");
assertResultFieldAbsent("ECD5843200CF", "die_codename");
assertExplainField("ECDE843200C7", "density", 65536);
assertResultField("ECDE843200C7", "density", 65536);
assertExplainField("EC5FA83F88CF", "die_codename", "SSV8");
assertResultField("EC5FA83F88CF", "die_codename", "SSV8");
assertExplainField("EC5FA83F88DF", "die_codename", "SSV8");
assertResultField("EC5FA83F88DF", "die_codename", "SSV8");
assertExplainField("EC52EA3F8ECF", "density", 4194304);
assertResultField("EC52EA3F8ECF", "density", 4194304);
assertExplainField("EC52EA3F8ECF", "die_codename", "SSV8");
assertResultField("EC52EA3F8ECF", "die_codename", "SSV8");
assertExplainField("EC5FA89F88C3", "die_codename", "SSV9");
assertResultField("EC5FA89F88C3", "die_codename", "SSV9");
assertExplainField("EC5FA89F88C3", "block_size", 8388608);
assertResultField("EC5FA89F88C3", "block_size", 8388608);
assertExplainField("EC5FA89F88C3", "redundant_area_size", "2KB");
assertExplainField("EC5FA89F88C3", "plane_count", 4);
assertExplainField("EC5FA89F88C3", "ecc_level", "LDPC");
assertExplainField("ECD798CE74C3", "die_codename", "SS27");
assertResultField("ECD798CE74C3", "die_codename", "27nm");
assertExplainFieldAbsent("ECD798CE74C3", "block_size");
assertResultFieldAbsent("ECD798CE74C3", "block_size");
assertExplainFieldAbsent("ECD798CE74C3", "redundant_area_size");
assertResultFieldAbsent("ECD798CE74C3", "redundant_area_size");
assertExplainFieldAbsent("ECD798CE74C3", "ecc_level");
assertResultFieldAbsent("ECD798CE74C3", "ecc_level");
assertExplainField("EC3A94C3A4CA", "die_codename", "SS14");
assertExplainField("EC3A94C3A4CA", "block_size", 16777216);
assertResultField("EC3A94C3A4CA", "block_size", 16777216);
assertExplainField("EC3A94C3A4CA", "redundant_area_size", "1536B");
assertResultField("EC3A94C3A4CA", "redundant_area_size", "1536B");
assertExplainField("EC3A94C3A4CA", "plane_count", 2);
assertExplainField("EC3A94C3A4CA", "ecc_level", "48bit");
assertResultField("EC3A94C3A4CA", "ecc_level", "48bit");

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
assertExplainField("AD89294B00E0", "die_codename", "HYV9");
assertResultField("AD89294B00E0", "die_codename", "HYV9");
assertResultField("AD89294B00E0", "layer_count", 321);
assertExplainField("AD79284B02E0", "density", 1048576);
assertExplainField("AD79284B02E0", "die_codename", "HYV9H");
assertResultField("AD79284B02E0", "die_codename", "HYV9H");
assertResultField("AD79284B02E0", "layer_count", 321);
assertResultField("AD79284B02E0", "plane_count", 4);
assertResultField("AD79284B02E0", "speed_grade", "Max Speed=3600MT/s");
assertExplainField("AD780C5B30E0", "density", 2097152);
assertExplainField("AD780C5B30E0", "die_codename", "HYV9Q");
assertResultField("AD780C5B30E0", "density", 2097152);
assertResultField("AD780C5B30E0", "die_codename", "HYV9Q");
assertResultField("AD780C5B30E0", "cell_level", "QLC");
assertResultField("AD780C5B30E0", "die_density", "2Tb");
assertResultField("AD780C5B30E0", "layer_count", 321);
assertResultField("AD780C5B30E0", "plane_count", 6);
assertResultField("AD780C5B30E0", "speed_grade", "Max Speed=3200MT/s");
assertResultFieldAbsent("AD780C5B30E0", "die_count");
assertExplainField("AD3A180300E0", "die_codename", "HY14");
assertResultField("AD3A180300E0", "die_codename", "14nm");
assertExplainField("AD7E843200C0", "density", 524288);
assertResultField("AD7E843200C0", "density", 524288);
assertExplainField("ADEE843200E5", "density", 65536);
assertResultField("ADEE843200E5", "density", 65536);
assertExplainField("AD3A0B3200C0", "density", 131072);
assertResultField("AD3A0B3200C0", "density", 1048576);
assertExplainFieldAbsent("AD3A0B3200C0", "die_codename");
assertResultFieldAbsent("AD3A0B3200C0", "die_codename");
assertResultFieldAbsent("AD3A0B3200C0", "layer_count");
assertResultFieldAbsent("AD3A0B3200C0", "die_density");

const skhynixLegacy2GbIds: Array<[string, string, number, string]> = [
  ["ADDA909544", "x8", 8, "Vcc: 3.3V"],
  ["ADCA90D544", "x16", 16, "Vcc: 3.3V"],
  ["ADAA901544", "x8", 8, "Vcc: 1.8V"],
  ["ADBA905544", "x16", 16, "Vcc: 1.8V"]
];

for (const [id, explainWidth, resultWidth, voltage] of skhynixLegacy2GbIds) {
  assertExplainField(id, "density", 2048);
  assertExplainField(id, "device_width", explainWidth);
  assertExplainField(id, "voltage", voltage);
  assertExplainField(id, "page_size", 2048);
  assertExplainField(id, "block_size", 131072);
  assertExplainField(id, "redundant_area_size", "64B");
  assertResultField(id, "density", 2048);
  assertResultField(id, "device_width", resultWidth);
  assertResultField(id, "voltage", voltage);
  assertResultField(id, "page_size", 2048);
  assertResultField(id, "block_size", 131072);
  assertResultField(id, "redundant_area_size", "64B");
}

assertExplainField("2C0506840000", "density", 4194304);
assertResultField("2C0506840000", "density", 4194304);
const micronLegacy2GbIds: Array<[string, string, number, string]> = [
  ["2CDA809550", "x8", 8, "Vcc: 3.3V"],
  ["2CCA80D550", "x16", 16, "Vcc: 3.3V"],
  ["2CAA801550", "x8", 8, "Vcc: 1.8V"],
  ["2CBA805550", "x16", 16, "Vcc: 1.8V"]
];

for (const [id, explainWidth, resultWidth, voltage] of micronLegacy2GbIds) {
  assertExplainField(id, "density", 2048);
  assertExplainField(id, "device_width", explainWidth);
  assertExplainField(id, "voltage", voltage);
  assertExplainField(id, "page_size", 2048);
  assertExplainField(id, "block_size", 131072);
  assertResultField(id, "density", 2048);
  assertResultField(id, "device_width", resultWidth);
  assertResultField(id, "voltage", voltage);
  assertResultField(id, "page_size", 2048);
  assertResultField(id, "block_size", 131072);
}
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
assertResultField("2CD5943E7400", "die_codename", "50nm");
assertResultField("2CD5943E7400", "process_alias", "L52A");
assertExplainField("890906840000", "density", 5591040);
assertExplainField("890906840000", "cell_level", 3);
assertResultField("890906840000", "density", 5591040);
assertResultField("890906840000", "cell_level", "TLC");
assertResultField("89092B32C200", "die_codename", "N4PA");
assertResultField("89050432C200", "die_codename", "N4PA");

const intelGen4Ids: Array<[string, number, number, number]> = [
  ["89D3AC32C600", 1048576, 1, 4],
  ["89E3AD32C600", 2097152, 2, 4],
  ["89F3AE32C600", 4194304, 4, 4],
  ["892BAF32C600", 8388608, 8, 4],
  ["89CB9832C600", 524288, 1, 3],
  ["89DB9932C600", 1048576, 2, 3],
  ["89EB9A32C600", 2097152, 4, 3],
  ["89FB9B32C600", 4194304, 8, 3]
];

for (const [id, density, dieCount, cellLevel] of intelGen4Ids) {
  assertExplainField(id, "density", density);
  assertExplainField(id, "die_count", dieCount);
  assertExplainField(id, "cell_level", cellLevel);
  assertResultField(id, "density", density);
  assertResultField(id, "die_count", dieCount);
  assertResultField(id, "cell_level", cellLevel === 4 ? "QLC" : "TLC");
}

assertExplainField("9BD5588D2000", "density", 1397760);
assertExplainField("9BD5588D2000", "cell_level", 4);
assertExplainField("9BD5588D2000", "generation_info", "3rd Gen Xtacking 2.0");
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

const ymtcGen5FlashIds: Array<[string, "WTS" | "SQS" | "PTS"]> = [
  ["9BC428554000", "WTS"],
  ["9BC458554000", "WTS"],
  ["9BC559554000", "WTS"],
  ["9BC558754000", "SQS"],
  ["9BC558794000", "SQS"],
  ["9BC659754000", "SQS"],
  ["9BC659794000", "SQS"],
  ["9BC65C954000", "PTS"],
  ["9BC65D954000", "PTS"],
  ["9BC65C994000", "PTS"],
  ["9BC75D994000", "PTS"]
];

for (const [id, profileKey] of ymtcGen5FlashIds) {
  assertResultField(id, "die_codename", profileKey);
  assertResultFieldAbsent(id, "generation_info");
}

assertResultField("9BC458554000", "process_alias", "X4-9060");
assertResultField("9BC458554000", "layer_count", 160);
assertResultField("9BC458554000", "die_density", "512Gb");
assertResultField("9BC558754000", "process_alias", "X4-9070");
assertResultField("9BC558754000", "layer_count", 267);
assertResultField("9BC558754000", "die_density", "1Tb");
assertResultField("9BC65C954000", "process_alias", "X4-6080");
assertResultField("9BC65C954000", "layer_count", 267);
assertResultField("9BC65C954000", "die_density", "2Tb");
assertResultField("9BC65C954000", "cell_level", "QLC");
