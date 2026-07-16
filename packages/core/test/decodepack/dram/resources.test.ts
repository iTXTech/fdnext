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
  engine,
  firstField,
  mdbJson,
  micronDramFbgaEntries,
  micronFbgaCodesJson,
  resourceEntries,
  searchFbgaParts
} from "./_helpers";
import micronDramRules from "../../../src/decodepack/rules/packs/micron-dram-token.json" with { type: "json" };
import { micronMdbCoverage } from "../_micron-mdb-coverage";

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
const micronDramTables = ((micronDramRules as Array<Record<string, unknown>>)[0].tokenDecoder as Record<string, unknown>).tables as Record<string, unknown>;

for (const entry of dramPnJson.filter((item) => item.vendor === "micron")) {
  assert.deepEqual(
    micronMdbCoverage(mdbJson, entry.pn),
    [],
    `${entry.pn} should stay out of dram-pn.json when valid mdb.json data has the same or a more detailed PN`
  );
}

for (const sample of [
  { pn: "MT41K256M16V00HWC1", label: "MT41K256M16V00HWC1", type: "DDR3", densityMbit: 4096 },
  { pn: "MT48LC32M16A2TG-75:C", label: "MT48LC32M16A2TG-75:C", type: "SDR", densityMbit: 512 },
  { pn: "MT46V32M16P-5B XIT:J", label: "MT46V32M16P-5BXIT:J", type: "DDR", densityMbit: 512 },
  { pn: "MT40A512M16Z11BWC1", label: "MT40A512M16Z11BWC1", type: "DDR4", densityMbit: 8192 },
  { pn: "MT53E1G16D1FW-046 AIT:A", label: "MT53E1G16D1FW-046AIT:A", type: "LPDDR4X", densityMbit: 16384 },
  { pn: "MT62F1G64D8EK-031 AIT:A", label: "MT62F1G64D8EK-031AIT:A", type: "LPDDR5", densityMbit: 65536 }
] as const) {
  assert.ok(
    dramPnJson.some((entry) => entry.vendor === "micron" && entry.pn === sample.pn),
    `${sample.pn} should remain in the official Micron catalog search seeds`
  );
  assert.deepEqual(micronMdbCoverage(mdbJson, sample.pn), [], `${sample.pn} should not duplicate valid MDB data`);
  const info = detect(sample.pn);
  assert.equal(info.vendor, "micron", `${sample.pn} should decode as Micron`);
  assert.equal(info.type, sample.type, `${sample.pn} should decode as ${sample.type}`);
  assert.equal(info.densityMbit, sample.densityMbit, `${sample.pn} should decode catalog density`);
  assertSearchPnIncludes(sample.pn, `Micron ${sample.label}`);
}

function tableKeys(table: unknown): string[] {
  if (Array.isArray(table)) {
    return table.flatMap((entry) => {
      if (typeof entry === "string") {
        return [entry];
      }
      if (entry && typeof entry === "object" && !Array.isArray(entry) && Array.isArray((entry as { keys?: unknown }).keys)) {
        return ((entry as { keys: unknown[] }).keys).filter((key): key is string => typeof key === "string");
      }
      return [];
    });
  }
  if (table && typeof table === "object") {
    return Object.keys(table);
  }
  return [];
}

const micronDramSpeedContinuationTokens = [
  ...tableKeys(micronDramTables.productCertificationObj).map((key) => key.includes(":") ? key.split(":").pop() ?? key : key),
  ...tableKeys(micronDramTables.powerSavingObj).map((key) => key.includes(":") ? key.split(":").pop() ?? key : key),
  ...tableKeys(micronDramTables.suffixOptionToken),
  ...tableKeys(micronDramTables.temperatureObj).map((key) => key.includes(":") ? key.split(":").pop() ?? key : key),
  ...tableKeys(micronDramTables.productionStatusObj)
].sort((a, b) => b.length - a.length || a.localeCompare(b));
const micronDramScopedSpeedTokens = new Map<string, string[]>();
const micronDramUnscopedSpeedTokens: string[] = [];
const micronDramPublicSpeedTokens = new Set(tableKeys(micronDramTables.speedObj));
for (const key of tableKeys(micronDramTables.speedToken)) {
  const scoped = /^(\d\d):(.+)$/.exec(key);
  if (scoped) {
    const tokens = micronDramScopedSpeedTokens.get(scoped[1]) ?? [];
    tokens.push(scoped[2]);
    micronDramScopedSpeedTokens.set(scoped[1], tokens);
  } else {
    micronDramUnscopedSpeedTokens.push(key);
  }
}
for (const tokens of [...micronDramScopedSpeedTokens.values(), micronDramUnscopedSpeedTokens]) {
  tokens.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

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

function normalizeMicronDramPartNumber(partNumber: string): string {
  return partNumber.toUpperCase().replace(/[ ,&.|]/g, "");
}

function micronDramFamily(partNumber: string): string {
  return /^(?:MT|CT|ED|EE)(\d\d)/.exec(partNumber)?.[1] ?? "";
}

function isMicronDramSpeedBoundary(rest: string): boolean {
  return rest === "" ||
    rest.startsWith(":") ||
    rest.startsWith("-") ||
    micronDramSpeedContinuationTokens.some((token) => rest.startsWith(token));
}

function expectedMicronDramSpeedToken(partNumber: string): string | undefined {
  const normalized = normalizeMicronDramPartNumber(partNumber);
  const speedStart = normalized.indexOf("-");
  if (speedStart < 0) {
    return undefined;
  }
  const suffix = normalized.slice(speedStart + 1);
  const family = micronDramFamily(normalized);
  for (const token of micronDramScopedSpeedTokens.get(family) ?? []) {
    if (suffix.startsWith(token) && isMicronDramSpeedBoundary(suffix.slice(token.length))) {
      const key = `${family}:${token}`;
      return micronDramPublicSpeedTokens.has(key) ? key : undefined;
    }
  }
  for (const token of micronDramUnscopedSpeedTokens) {
    if (suffix.startsWith(token) && isMicronDramSpeedBoundary(suffix.slice(token.length))) {
      return micronDramPublicSpeedTokens.has(token) ? token : undefined;
    }
  }
  return undefined;
}

function assertMicronDramKnownSpeed(partNumber: string, source: string): void {
  const expectedSpeedToken = expectedMicronDramSpeedToken(partNumber);
  if (!expectedSpeedToken) {
    return;
  }
  const result = engine.decodePart({ query: partNumber, lang: "eng", chipKind: "dram", strict: true });
  assert.equal(result.status, "ok", `${source} ${partNumber} should decode`);
  assert.equal(result.device?.chipKind, "dram", `${source} ${partNumber} should stay classified as DRAM`);
  assert.ok(firstField(result, "dram_speed"), `${source} ${partNumber} should expose dram_speed for token ${expectedSpeedToken}`);
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
  if (record.vendor === "micron") {
    assertMicronDramKnownSpeed(String(record.pn), "dram-pn.json");
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
  assertMicronDramKnownSpeed(String(record.pn), `mdb.json ${String(record.code)}`);
}
