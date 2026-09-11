import assert from "node:assert/strict";
import test from "node:test";
import { defaultDecodePack, explainPartDecode, type DecodePack } from "../../src/decodepack";
import { fdnextFieldRegistry } from "../../src/field-registry";

function deriveDieDensity(density: number | string, dieCount: number | string) {
  const pack = {
    partSpecs: [{
      id: "test.capacity",
      match: { kind: "prefix", value: "CAP" },
      tokenDecoder: {
        steps: [
          { op: "set", to: "density", value: density },
          { op: "set", to: "count", value: dieCount },
          { op: "dieDensity", to: "perDie", density: "density", dieCount: "count" }
        ],
        assign: { "fields.die_density": { $var: "perDie" } }
      }
    }]
  } satisfies DecodePack;
  return explainPartDecode(pack, "CAP").steps.find((step) => step.op === "dieDensity");
}

test("dieDensity keeps Mbit precision and rejects invalid or string operands", () => {
  for (const [density, count, expected] of [[65536, 8, 8192], [1, 8, 0.125], [4096, 3, 4096 / 3]]) {
    const result = deriveDieDensity(density!, count!);
    assert.equal(result?.matched, true);
    assert.equal(result?.value, expected);
  }
  for (const [density, count] of [[0, 1], [-1, 1], [1024, 0], [1024, -1], [1024, 1.5], ["64Gb", 1], [1024, "2"], [Infinity, 1]]) {
    const result = deriveDieDensity(density!, count!);
    assert.equal(result?.matched, false);
    assert.equal(result?.value, 0);
  }
});

test("built-in capacity literals and NAND profile interfaces use canonical fields", () => {
  const capacityKeys = new Set(Object.values(fdnextFieldRegistry)
    .filter((field) => "defaultUnit" in field && field.defaultUnit === "Mbit")
    .map((field) => field.key as string));
  const findings: string[] = [];
  function walk(value: unknown, path: string): void {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      const fieldKey = key.replace(/^fields\./, "");
      if (capacityKeys.has(fieldKey) && typeof child === "string" &&
        !(key === "density" && "op" in value && value.op === "dieDensity")) {
        findings.push(`${path}.${key}=${child}`);
      }
      walk(child, `${path}.${key}`);
    }
  }
  walk(defaultDecodePack, "defaultDecodePack");
  assert.deepEqual(findings, [], "capacity fields must not contain formatted strings");
  const profiles = defaultDecodePack.sharedTables?.["nand.die_profile"] ?? {};
  for (const [key, profile] of Object.entries(profiles)) {
    assert.ok(profile && typeof profile === "object");
    assert.ok(!Object.hasOwn(profile, "speed_grade"), `${key}: NAND profile capabilities belong to nand_interface`);
  }
});
