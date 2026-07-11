import assert from "node:assert/strict";
import test from "node:test";
import dramJson from "../../resources/dram-pn.json" with { type: "json" };
import fdbJson from "../../resources/fdb.json" with { type: "json" };
import managedNandJson from "../../resources/managed-nand-pn.json" with { type: "json" };
import type { PartNumberDecoder, PartNumberMatch } from "../../src/index";
import { compileDecodePack, defaultDecodePack, type DecodePack, validateDecodePack } from "../../src/decodepack";

interface PartResourceEntry {
  pn: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function knownPartNumbers(): string[] {
  const partNumbers = [
    ...(managedNandJson as PartResourceEntry[]).map((entry) => entry.pn),
    ...(dramJson as PartResourceEntry[]).map((entry) => entry.pn)
  ];
  for (const [key, value] of Object.entries(fdbJson as Record<string, unknown>)) {
    if (key === "schemaVersion" || key === "info" || key === "iddb" || !isRecord(value)) {
      continue;
    }
    partNumbers.push(...Object.keys(value));
  }
  return partNumbers;
}

function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) {
    return prefix ? [prefix] : [];
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return prefix ? [prefix] : [];
  }
  return entries.flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function decoderSamples(decoders: PartNumberDecoder[]): Map<PartNumberDecoder, PartNumberMatch> {
  const samples = new Map<PartNumberDecoder, PartNumberMatch>();
  for (const partNumber of knownPartNumbers()) {
    for (const decoder of decoders) {
      const matched = decoder.match(partNumber);
      if (matched) {
        if (decoder.project && !samples.has(decoder)) {
          samples.set(decoder, matched);
        }
        break;
      }
    }
  }
  return samples;
}

test("DecodePack projection matches full decoding for arbitrary requested paths", () => {
  const decoders = compileDecodePack(defaultDecodePack).partDecoders
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const samples = decoderSamples(decoders);

  assert.ok(samples.size >= 110, `expected broad rule coverage, got ${samples.size}/${decoders.length}`);

  let checkedPaths = 0;
  for (const [decoder, matched] of samples) {
    const partNumber = matched.input;
    const full = decoder.decode(matched);

    for (const path of leafPaths(full)) {
      const projected = decoder.project?.(matched, [path]);
      assert.ok(projected, `${decoder.id} should project ${path} for ${partNumber}`);
      assert.equal(projected.device.partNumber, full.device.partNumber, `${decoder.id} projected identity`);
      assert.deepEqual(
        readPath(projected, path),
        readPath(full, path),
        `${decoder.id} projection mismatch at ${path} for ${partNumber}`
      );
      checkedPaths += 1;
    }
  }

  assert.ok(checkedPaths >= 1_500, `expected broad field coverage, got ${checkedPaths} paths`);
});

test("projection target sets are runtime data rather than a fixed search profile", () => {
  const partNumber = "MT29F16T08EWLEHD6-36ITRES:E";
  const decoder = compileDecodePack(defaultDecodePack).partDecoders
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .find((candidate) => candidate.match(partNumber));
  assert.ok(decoder?.project);
  const matched = decoder.match(partNumber);
  assert.ok(matched);

  const full = decoder.decode(matched);

  for (const targets of [
    ["fields.density"],
    ["fields.package", "fields.cell_level"],
    ["fields.die_codename", "meta.nandDieProfileKey"],
    ["device.vendor", "fields.voltage", "fields.device_width"]
  ] as const) {
    const projected = decoder.project(matched, targets);
    for (const path of targets) {
      assert.deepEqual(readPath(projected, path), readPath(full, path), `dynamic target ${path}`);
    }
  }
});

test("projection stops before unrelated later DecodePack steps", () => {
  let lateTableReads = 0;
  const lateTable = new Proxy<Record<string, string>>({ Z: "late" }, {
    ownKeys(target) {
      lateTableReads += 1;
      return Reflect.ownKeys(target);
    }
  });
  const pack = {
    partSpecs: [{
      id: "test.projection.early-stop",
      match: { kind: "prefix", value: "MT" },
      tokenDecoder: {
        tables: {
          density: { "4": 4096 },
          late: lateTable
        },
        steps: [
          { op: "take", len: 2, to: "prefix" },
          { op: "take", len: 1, to: "densityCode" },
          { op: "map", from: "densityCode", table: "density", to: "density" },
          { op: "takeLongest", table: "late", to: "lateValue" }
        ],
        assign: {
          "device.partNumber": { "$var": "partNumber" },
          "device.vendor": "test",
          "device.chipKind": "raw_nand",
          "fields.density": { "$var": "density" },
          "fields.special_option": { "$var": "lateValue" }
        }
      }
    }],
    identifierSpecs: []
  } satisfies DecodePack;

  const [decoder] = compileDecodePack(validateDecodePack(pack)).partDecoders;
  assert.ok(decoder?.project);
  lateTableReads = 0;
  const matched = decoder.match("MT4Z");
  assert.ok(matched);
  assert.equal(decoder.project(matched, ["fields.density"]).fields?.density, 4096);
  assert.equal(lateTableReads, 0, "the unrelated late lookup should not execute for a density projection");

  assert.equal(decoder.decode(matched).fields?.special_option, "late");
  assert.equal(lateTableReads, 0, "compiled table access should not enumerate source data during decoding");
});
