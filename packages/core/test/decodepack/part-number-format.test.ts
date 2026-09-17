import assert from "node:assert/strict";
import { test } from "node:test";
import { compileDecodePack, defaultDecodePack, explainPartDecode, validateDecodePack, type DecodePack } from "../../src/decodepack";
import { createEngine } from "../../src/index";
import { normalizePartNumber } from "../../src/utils/normalize";
import { buildFdb, findPartNumberAcrossVendors, getPartNumberRecord } from "../../src/fdb";
import dramParts from "../../resources/dram-pn.json" with { type: "json" };
import managedParts from "../../resources/managed-nand-pn.json" with { type: "json" };

const compiled = compileDecodePack(defaultDecodePack);
const engine = createEngine();
function decode(pn: string) {
  const decoder = compiled.partDecoders.find((decoder) => decoder.match(pn));
  const match = decoder?.match(pn);
  assert.ok(decoder && match, pn);
  return { decoder, match, draft: decoder.decode(match) };
}

const canonicalSamples = [
  "KLUEG8UHDB-C2E1", "KLMAG2GEND-B031", "K9XVGY8J5M-CCK0",
  "KMS5U000KM-B308", "KMGD6001BM-B421", "H27UCG8T2ETR-BC",
  "H9HP27ADAMADAR-KMM", "H9TQ27ADFTMCUR-KUM", "H9HQ15ACPMADAR-KEM",
  "M14D5121632A-15BG2A", "M12L128168A-5TIG2S",
  "SM662GXC-BFS", "SM671PXC-BFS", "SM671PXC-L-BFS",
  "EMMC04G-CT32", "UFS64G-CY14", "08EM08-N3GMV36", "64EP16-M4MTB9W",
  "FEMDNN032G-A3A56", "FEUDME064G-B8A19", "FEPRF6432-58A1930", "FUPRFA832-C2A56N1",
  "F35SQA002G-WWT", "FS35ND01G-S1Y2QWFI000",
  "BWCE24NL-04G", "BWCA2EZA-32G", "BW2A2KZC02-64G", "BWCD24NL-04G",
  "BWCK1EZH-32G-X", "BWCK1EZC05-64G", "BWCSAEYA02-64G",
  "BWMZCX32H2A-64G-X", "BWMZCX32H2A-32GI-X", "BWMYAX32P8A-128G"
];

test("ordering boundaries produce the same PN and fields with or without dashes", () => {
  for (const expected of canonicalSamples) {
    const full = decode(expected);
    const compact = decode(expected.replaceAll("-", ""));
    assert.equal(full.draft.device.partNumber, expected);
    assert.equal(compact.draft.device.partNumber, expected);
    assert.deepEqual(compact.draft.fields, full.draft.fields, expected);
    assert.equal(compact.decoder.project?.(compact.match, ["fields.density"]).device.partNumber, expected);
    assert.equal(explainPartDecode(defaultDecodePack, compact.match.input).draft?.device.partNumber, expected);
    assert.equal(decode(compact.draft.device.partNumber).draft.device.partNumber, expected, "idempotence");
  }
});

test("existing resource separators survive rule decoding", () => {
  for (const { pn } of [...dramParts, ...managedParts]) {
    if (!pn.includes("-")) continue;
    const input = normalizePartNumber(pn);
    const { draft } = decode(input);
    assert.ok(draft.device.partNumber.includes("-"), input);
    assert.equal(draft.device.partNumber.replaceAll(/[-:]/g, ""), input.replaceAll(/[-:]/g, ""), input);
  }
});

test("formatting preserves short bodies, unknown suffixes and unparsed tail punctuation", () => {
  assert.equal(decode("KLUEG8UHDB").draft.device.partNumber, "KLUEG8UHDB");
  assert.equal(decode("KLMAG2GEND").draft.device.partNumber, "KLMAG2GEND");
  assert.equal(decode("K9XVGY8J5M").draft.device.partNumber, "K9XVGY8J5M");
  assert.equal(decode("K9XVGY8J5MZZZ:UNKNOWN").draft.device.partNumber, "K9XVGY8J5M-ZZZ:UNKNOWN");
  assert.equal(decode("FEMDNN256G-A3A5607-08").draft.device.partNumber, "FEMDNN256G-A3A5607-08");
  assert.equal(decode("KLU-EG8UHDB--C2E1").draft.device.partNumber, "KLUEG8UHDB-C2E1");
  assert.equal(decode("HN8T05BZGK-X015").draft.device.partNumber, "HN8T05BZGK-X015");
  assert.equal(decode("HN8T05BZGKX015").draft.device.partNumber, "HN8T05BZGKX015");
  assert.equal(decode("KLUEG8UHDB-C2").draft.device.partNumber, "KLUEG8UHDB-C2");
});

test("public input, display, catalog search and marking actions keep their separate roles", () => {
  for (const query of ["KLUEG8UHDB-C2E1", "KLUEG8UHDBC2E1"]) {
    const result = engine.decodePart({ query });
    assert.equal(result.input.query, query);
    assert.equal(result.input.normalized, query);
    assert.equal(result.device?.partNumber, "KLUEG8UHDB-C2E1");
    const search = engine.searchParts({ query, partialMatch: false });
    assert.equal(search.items[0]?.device.partNumber, result.device?.partNumber);
  }
  assert.equal(engine.decodePart({ query: "H25T0TD18C-X655" }).device?.partNumber, "H25T0TD18CX655");
  assert.equal(engine.decodePart({ query: "MT40A512M16LY075E" }).device?.partNumber, "MT40A512M16LY-075:E");
});

test("search canonicalizes compact catalog entries and deduplicates equivalent PN spellings", () => {
  const local = createEngine({
    resources: {
      partIndex: { rawNand: {}, managedNand: [
        { vendor: "samsung", pn: "KLUEG8UHDBC2E1" },
        { vendor: "samsung", pn: "KLUEG8UHDB-C2E1" }
      ], dram: [] },
      identifierIndex: { nandFlash: {} },
      markingIndex: { packageMarkings: {} },
      vendorIndex: {}, controllerIndex: {}, translationIndex: {}
    }, decoders: compiled.partDecoders
  });
  for (const limit of [1, 5]) {
    const search = local.searchParts({ query: "KLU", limit });
    assert.equal(search.items.length, 1);
    assert.equal(search.items[0]?.label, "KLUEG8UHDB-C2E1");
    assert.equal(local.decodePart({ query: search.items[0]!.device.partNumber! }).device?.partNumber, "KLUEG8UHDB-C2E1");
  }
});

test("separator markers support conditional multiple boundaries without consuming tokens", () => {
  const pack: DecodePack = { identifierSpecs: [], partSpecs: [{
    id: "test.separators", normalize: ["trim", "uppercase", { remove: ["-", ":"] }],
    match: { kind: "prefix", value: "AB" }, tokenDecoder: {
      steps: [
        { op: "take", len: 2, to: "body" },
        { op: "markPartNumberSeparator", separator: "-", if: "body" },
        { op: "take", len: 2, to: "speed" },
        { op: "markPartNumberSeparator", separator: ":", if: "speed" }
      ], assign: { "device.vendor": "samsung", "fields.special_option": { $var: "speed" } }
    }
  }] };
  const decoder = compileDecodePack(validateDecodePack(pack)).partDecoders[0]!;
  for (const [input, expected] of [["AB12C", "AB-12:C"], ["AB-12:C", "AB-12:C"], ["AB", "AB"]]) {
    const matched = decoder.match(input)!;
    assert.equal(decoder.decode(matched).device.partNumber, expected);
    assert.equal(decoder.project?.(matched, []).device.partNumber, expected);
  }
  const invalid = structuredClone(pack);
  invalid.partSpecs[0]!.tokenDecoder!.steps[1] = { op: "markPartNumberSeparator", separator: "-", if: "missing" };
  assert.throws(() => validateDecodePack(invalid), /missing/);
});

test("full PN token matches outrank a shorter FDB body after formatting", () => {
  const fdb = buildFdb({ samsung: {
    K9AHGD8H0M: { id: ["EC1E983F84CB"], l: "SSV4" },
    K9AHGD8H0M1: { id: ["EC5E983F84CB"] }
  } });
  for (const input of ["K9AHGD8H0M1", "K9AHGD8H0M-1"]) {
    assert.equal(getPartNumberRecord(fdb, "samsung", input)?.pn, "K9AHGD8H0M1");
    assert.equal(findPartNumberAcrossVendors(fdb, input)?.record.pn, "K9AHGD8H0M1");
  }
  const plain = engine.decodePart({ query: "K9AHGD8H0M1" });
  const formatted = engine.decodePart({ query: "K9AHGD8H0M-1" });
  assert.deepEqual(formatted.blocks, plain.blocks);
  assert.deepEqual(formatted.relations, plain.relations);
});

test("Flash ID relations and decode actions use the same formatted PN", () => {
  const result = engine.decodeIdentifier({ query: "ECD594765443", idScheme: "nand.flash_id" });
  const relation = result.relations.find((relation) => relation.target.partNumber === "K9GAG08UOF-SCB0");
  assert.ok(relation);
  const query = relation.action?.input.query;
  assert.equal(query, "K9GAG08UOF-SCB0");
  assert.equal(engine.decodePart({ query: String(query) }).device?.partNumber, relation.target.partNumber);
});
