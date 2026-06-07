import assert from "node:assert/strict";
import {
  assertDecodedField,
  assertDecodedFieldAbsent,
  assertDecodedPartNumber,
  assertDram,
  assertFieldBlock,
  assertSearchMarkingRelation,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSpectekSearchMarkingRelation,
  assertStackedDram,
  assertUnknown,
  detect,
  dramPnJson,
  mdbJson,
  micronDramFbgaEntries,
  micronFbgaCodesJson,
  resourceEntries,
  searchFbgaParts
} from "./_helpers";

for (const entry of dramPnJson.filter((item) => item.vendor === "esmt")) {
  assert.doesNotMatch(entry.pn, /[()]/, `ESMT known PN should use ordering Product ID form: ${entry.pn}`);
}

assert.ok(Array.isArray(dramPnJson), "DRAM PN resource should be a top-level minimal array");
assert.ok(Array.isArray(micronFbgaCodesJson), "Micron FBGA code resource should be a top-level array");
const dramPn = resourceEntries(dramPnJson);
const micronDramFbga = micronDramFbgaEntries(mdbJson);
const micronDramFbgaCodes = micronFbgaCodesJson as unknown[];
assert.ok(micronDramFbga.length > 0, "mdb.json should include Micron DRAM FBGA mappings");
const dramPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);
const micronNandFbgaHeaders = ["NC", "NW", "NY", "NX", "NQ", "NV"];
const seenDramPn = new Set<string>();
const seenCanonicalWinbondDramPn = new Set<string>();
function canonicalWinbondDramPn(partNumber: string): string {
  const ddrMatch = /^(W94(?:12|25)G6KH)([56][A-Z]?)$/.exec(partNumber);
  if (ddrMatch) {
    return `${ddrMatch[1]}-${ddrMatch[2]}`;
  }
  const ddr2Match = /^(W97(?:12G6KB|25G[68]KB|1GG[68]NB|2GG6KB|2GG8KS))((?:18|25|3)[A-Z]?)$/.exec(partNumber);
  if (ddr2Match) {
    return `${ddr2Match[1]}-${ddr2Match[2]}`;
  }
  const ddr3Match = /^(W63[1248]G[GU][68][A-Z]{2})((?:09|11|12|15)[A-Z]?)$/.exec(partNumber);
  if (ddr3Match) {
    return `${ddr3Match[1]}-${ddr3Match[2]}`;
  }
  const ddr4Match = /^(W66[48]GG[68][A-Z]{2})((?:06|07|08)[A-Z]?)$/.exec(partNumber);
  if (ddr4Match) {
    return `${ddr4Match[1]}-${ddr4Match[2]}`;
  }
  return partNumber;
}
for (const entry of dramPn) {
  assert.equal(typeof entry, "object", "DRAM PN entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "DRAM PN entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.pn, "string", "DRAM PN entry should include pn");
  assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
  assert.deepEqual(Object.keys(record).sort(), ["pn", "vendor"], `${String(record.pn)} should only include vendor and pn`);
  const dedupeKey = `${String(record.vendor)}\0${String(record.pn)}`;
  assert.ok(!seenDramPn.has(dedupeKey), `${String(record.pn)} should only appear once for ${String(record.vendor)}`);
  seenDramPn.add(dedupeKey);
  if (record.vendor === "winbond") {
    const canonicalPn = canonicalWinbondDramPn(String(record.pn));
    assert.equal(String(record.pn), canonicalPn, `${String(record.pn)} should use dashed Winbond suffix form in dram-pn.json`);
    assert.ok(!seenCanonicalWinbondDramPn.has(canonicalPn), `${canonicalPn} should not duplicate a dashless Winbond equivalent`);
    seenCanonicalWinbondDramPn.add(canonicalPn);
  }
  if (record.vendor === "esmt") {
    assert.equal(/[()]/.test(String(record.pn)), false, `${String(record.pn)} should use ESMT ordering PN form without parenthesized page-header suffixes`);
  }

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((key) => dramPnForbiddenKeys.has(key)),
    [],
    `DRAM PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}

const seenMicronDramFbga = new Set<string>();
const seenMicronDramFbgaCodes = new Set<string>();
for (const code of micronDramFbgaCodes) {
  assert.equal(typeof code, "string", "Micron FBGA code entry should be a string");
  assert.match(String(code), /^[0-9A-Z]{5}$/, `${String(code)} should be a five-character FBGA code`);
  assert.equal(
    micronNandFbgaHeaders.some((header) => String(code).startsWith(header)),
    false,
    `${String(code)} should not duplicate Micron NAND MDB crawl segments`
  );
  assert.ok(!seenMicronDramFbgaCodes.has(String(code)), `${String(code)} should only appear once`);
  seenMicronDramFbgaCodes.add(String(code));
}

for (const entry of micronDramFbga) {
  assert.equal(typeof entry, "object", "Micron DRAM FBGA entry should be an object");
  assert.ok(entry !== null && !Array.isArray(entry), "Micron DRAM FBGA entry should be keyed");

  const record = entry as Record<string, unknown>;
  assert.equal(typeof record.code, "string", "Micron DRAM FBGA entry should include code");
  assert.match(String(record.code), /^[0-9A-Z]{5}$/, `${String(record.code)} should be a five-character FBGA code`);
  assert.equal(typeof record.pn, "string", `${String(record.code)} should include pn`);
  assert.deepEqual(Object.keys(record).sort(), ["code", "pn"], `${String(record.code)} should only include code and pn`);
  assert.match(
    String(record.pn),
    /^(?:MT|CT|ED|EE)/,
    `${String(record.code)} should map only to Micron MT/Crucial CT or Micron legacy Elpida DRAM PN`
  );

  const key = `${String(record.code)}\0${String(record.pn)}`;
  assert.ok(!seenMicronDramFbga.has(key), `${String(record.code)} ${String(record.pn)} should only appear once`);
  seenMicronDramFbga.add(key);

  const keys = Object.keys(record);
  assert.deepEqual(
    keys.filter((keyName) => dramPnForbiddenKeys.has(keyName)),
    [],
    `Micron DRAM FBGA entry should not expose maintenance keys: ${JSON.stringify(entry)}`
  );
}
