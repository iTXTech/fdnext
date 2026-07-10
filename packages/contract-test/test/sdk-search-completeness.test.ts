import assert from "node:assert/strict";
import test from "node:test";
import { createContractEngine } from "../src/index";

const engine = createContractEngine();

function partKeys(result: ReturnType<typeof engine.searchParts>): string[] {
  return result.items.map((item) => [
    item.device.vendor.id,
    item.device.chipKind,
    item.device.partNumber,
    item.device.markingCode ?? ""
  ].join("\0"));
}

function identifierKeys(result: ReturnType<typeof engine.searchIdentifiers>): string[] {
  return result.items.map((item) => item.device.identifier ?? item.label);
}

test("omitting limit returns the complete part-search result set", () => {
  const complete = engine.searchParts({ query: "MT29", lang: "eng" });
  const explicitHighLimit = engine.searchParts({ query: "MT29", lang: "eng", limit: 10_000 });

  assert.ok(complete.items.length > 100, "MT29 should not be silently capped to a server-page size");
  assert.deepEqual(partKeys(complete), partKeys(explicitHighLimit));

  const firstPage = engine.searchParts({ query: "MT29", lang: "eng", limit: 50 });
  assert.deepEqual(partKeys(firstPage), partKeys(complete).slice(0, 50));
});

test("part search retains substring matches outside the prefix path", () => {
  const result = engine.searchParts({ query: "HBL064", lang: "eng" });
  assert.ok(
    result.items.some((item) => item.device.partNumber === "MTFDHBL064TDP-1AT12AIYY"),
    "an infix query should find the Micron SSD part number"
  );
});

test("omitting limit returns the complete identifier-search result set", () => {
  const complete = engine.searchIdentifiers({ query: "98", lang: "eng" });
  const explicitHighLimit = engine.searchIdentifiers({ query: "98", lang: "eng", limit: 10_000 });

  assert.ok(complete.items.length > 100, "98 should not be silently capped to a server-page size");
  assert.deepEqual(identifierKeys(complete), identifierKeys(explicitHighLimit));
});
