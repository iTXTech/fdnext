import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compiledPack,
  detect,
  partNumberPnJson,
  resourceEntries,
  skhynixHn8RuleIds
} from "./_helpers";

const partNumberPn = resourceEntries(partNumberPnJson);
const partNumberPnForbiddenKeys = new Set(["source", "status", "reference", "inference_source", "external_confirmed", "external_table_confirmed"]);

test("part-number resource exposes minimal keyed PN entries", () => {
  assert.ok(Array.isArray(partNumberPnJson), "part-number PN resource should be a top-level minimal array");
  const seenPartNumberPn = new Set<string>();
  for (const entry of partNumberPn) {
    assert.equal(typeof entry, "object", "part-number PN entry should be an object");
    assert.ok(entry !== null && !Array.isArray(entry), "part-number PN entry should be keyed");
    const record = entry as Record<string, unknown>;
    assert.equal(typeof record.pn, "string", "part-number PN entry should include pn");
    assert.equal(typeof record.vendor, "string", `${String(record.pn)} should include vendor`);
    assert.deepEqual(Object.keys(record).sort(), ["pn", "vendor"], `${String(record.pn)} should only include vendor and pn`);
    const key = `${String(record.vendor)}\0${String(record.pn)}`;
    assert.ok(!seenPartNumberPn.has(key), `${String(record.pn)} should only appear once for ${String(record.vendor)}`);
    seenPartNumberPn.add(key);

    const keys = Object.keys(record);
    assert.deepEqual(
      keys.filter((key) => partNumberPnForbiddenKeys.has(key)),
      [],
      `part-number PN entry should not expose maintenance keys: ${JSON.stringify(entry)}`
    );
  }
});

test("known SK hynix UFS PN resources decode with a single HN8 datasheet rule", () => {
  const knownSkhynixUfsPn = partNumberPn.flatMap((entry) => {
    const record = entry as Record<string, unknown>;
    const vendor = String(record.vendor);
    const pn = String(record.pn);
    return vendor === "skhynix" && /^(?:H28[SU]|HN8)/.test(pn) ? [pn] : [];
  });
  assert.ok(knownSkhynixUfsPn.length > 0, "known SK hynix UFS PN resource should include H28S/H28U/HN8 entries");
  for (const pn of knownSkhynixUfsPn) {
    const info = detect(pn);
    assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
    assert.equal(info.type, "UFS", `${pn} should decode as SK hynix UFS`);
    assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a UFS density`);
    if (pn.startsWith("HN8")) {
      const hn8Matches = compiledPack.partDecoders.filter((decoder) => skhynixHn8RuleIds.has(decoder.id) && decoder.check(pn));
      assert.equal(hn8Matches.length, 1, `${pn} should match exactly one SK hynix HN8 datasheet rule`);
    }
  }
});

test("known SK hynix lineup PN resources decode storage type and density", () => {
  const knownSkhynixLineupPn = partNumberPn.flatMap((entry) => {
    const record = entry as Record<string, unknown>;
    const vendor = String(record.vendor);
    const pn = String(record.pn);
    return vendor === "skhynix" && /^(?:H23Q|H26M|H2J)/.test(pn) ? [pn] : [];
  });
  assert.ok(knownSkhynixLineupPn.length > 0, "known SK hynix part-number resource should include H23Q/H26M/H2J entries");
  for (const pn of knownSkhynixLineupPn) {
    const info = detect(pn);
    assert.equal(info.vendor, "skhynix", `${pn} should decode as SK hynix`);
    assert.ok((info.densityMbit ?? 0) > 0, `${pn} should decode a storage density`);
    if (pn.startsWith("H23Q")) {
      assert.equal(info.type, "E3NAND", `${pn} should decode as SK hynix E3NAND`);
    } else if (pn.startsWith("H26M")) {
      assert.equal(info.type, "eMMC", `${pn} should decode as SK hynix eMMC`);
    } else {
      assert.equal(info.type, "E2NAND", `${pn} should decode as SK hynix E2NAND`);
    }
  }
});
