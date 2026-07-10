import assert from "node:assert/strict";
import test from "node:test";
import dramJson from "../../resources/dram-pn.json" with { type: "json" };
import fdbJson from "../../resources/fdb.json" with { type: "json" };
import managedNandJson from "../../resources/managed-nand-pn.json" with { type: "json" };
import { createEngine, type PartNumberDecoder } from "../../src/index";
import { compileDecodePack, defaultDecodePack, type DecodePack } from "../../src/decodepack";

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

function decoderSamples(decoders: PartNumberDecoder[]): Map<PartNumberDecoder, string> {
  const samples = new Map<PartNumberDecoder, string>();
  for (const partNumber of knownPartNumbers()) {
    const decoder = decoders.find((candidate) => candidate.check(partNumber));
    if (decoder && decoder.project && !samples.has(decoder)) {
      samples.set(decoder, partNumber);
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
  for (const [decoder, partNumber] of samples) {
    const full = decoder.decode(partNumber);
    assert.ok(full, `${decoder.id} should fully decode ${partNumber}`);

    for (const path of leafPaths(full)) {
      const projected = decoder.project?.(partNumber, [path]);
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
  const decoder = compileDecodePack(defaultDecodePack).partDecoders
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .find((candidate) => candidate.check("MT29F16T08EWLEHD6-36ITRES:E"));
  assert.ok(decoder?.project);

  const full = decoder.decode("MT29F16T08EWLEHD6-36ITRES:E");
  assert.ok(full);

  for (const targets of [
    ["fields.density"],
    ["fields.package", "fields.cell_level"],
    ["fields.die_codename", "meta.nandDieProfileKey"],
    ["device.vendor", "fields.voltage", "fields.device_width"]
  ] as const) {
    const projected = decoder.project("MT29F16T08EWLEHD6-36ITRES:E", targets);
    assert.ok(projected);
    for (const path of targets) {
      assert.deepEqual(readPath(projected, path), readPath(full, path), `dynamic target ${path}`);
    }
  }
});

test("search can append future projection requirements without replacing its base contract", () => {
  const targetSets: string[][] = [];
  const decoder = {
    id: "test.search.projection-extension",
    check: (partNumber: string) => partNumber === "MT29F4G08ABAEA",
    decode: (partNumber: string) => partNumber === "MT29F4G08ABAEA" ? {
      device: {
        partNumber,
        domain: "memory",
        vendor: "micron",
        chipKind: "raw_nand"
      },
      fields: { density: 4096 }
    } : null,
    project: (partNumber: string, targets: readonly string[]) => {
      if (partNumber !== "MT29F4G08ABAEA") {
        return null;
      }
      targetSets.push([...targets]);
      return {
        device: {
          partNumber,
          domain: "memory",
          vendor: "micron",
          chipKind: "raw_nand"
        },
        fields: { density: 4096 }
      };
    }
  } satisfies PartNumberDecoder;
  const engine = createEngine({
    decoders: [decoder],
    resources: {
      partIndex: {
        rawNand: {},
        managedNand: [{ vendor: "micron", pn: "MT29F4G08ABAEA" }],
        dram: []
      },
      identifierIndex: { nandFlash: {} },
      markingIndex: { packageMarkings: {} },
      vendorIndex: {},
      controllerIndex: {},
      translationIndex: {}
    },
    partSearchProjection: ["fields.future_search_rank"]
  });

  const result = engine.searchParts({ query: "MT29F4G08ABAEA", partialMatch: false, limit: 1 });
  assert.equal(result.items[0]?.device.partNumber, "MT29F4G08ABAEA");
  assert.ok(targetSets.some((targets) => targets.includes("fields.future_search_rank")));
  assert.ok(targetSets.every((targets) => targets.includes("fields.density")));
  assert.ok(targetSets.every((targets) => targets.includes("device.vendor")));
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

  const [decoder] = compileDecodePack(pack).partDecoders;
  assert.ok(decoder?.project);
  assert.equal(decoder.project("MT4Z", ["fields.density"])?.fields?.density, 4096);
  assert.equal(lateTableReads, 0, "the unrelated late lookup should not execute for a density projection");

  assert.equal(decoder.decode("MT4Z")?.fields?.special_option, "late");
  assert.ok(lateTableReads > 0, "full decoding should execute the late lookup");
});
