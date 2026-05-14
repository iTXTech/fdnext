import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildMicronFbgaCrawlPlan, crawlMdb } from "../src/mdb";
import type { MdbPayload, MdbQueryOptions, MicronFbgaPrefixProfile } from "../src/types";

function jsonResponse(payload: unknown): Awaited<ReturnType<NonNullable<MdbQueryOptions["fetchImpl"]>>> {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
    json: async () => payload
  };
}

function textResponse(text: string): Awaited<ReturnType<NonNullable<MdbQueryOptions["fetchImpl"]>>> {
  return {
    ok: true,
    status: 200,
    text: async () => text,
    json: async () => JSON.parse(text)
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const tinyProfiles: MicronFbgaPrefixProfile[] = [
  {
    name: "letterGrid",
    kind: "letterGrid",
    prefixes: ["D9"],
    letters: ["B", "N"]
  },
  {
    name: "numberedRange",
    kind: "numberedRange",
    prefixes: ["NW"],
    startFrom: { NW: 101 },
    max: 103
  }
];

test("buildMicronFbgaCrawlPlan includes letter-grid and numbered FBGA profiles by default", () => {
  const plan = buildMicronFbgaCrawlPlan({ micronMax: 103 });

  assert.ok(plan.entries.some((entry) => entry.code === "C9BBB" && entry.profile === "letterGrid"));
  assert.ok(plan.entries.some((entry) => entry.code === "NW101" && entry.profile === "numberedRange"));
});

test("buildMicronFbgaCrawlPlan assigns supplemental codes by known prefix", () => {
  const plan = buildMicronFbgaCrawlPlan({
    micronFbgaProfiles: [
      {
        name: "letterGrid",
        kind: "letterGrid",
        prefixes: ["D9"],
        letters: ["A"]
      },
      {
        name: "numberedRange",
        kind: "numberedRange",
        prefixes: ["NW"],
        startFrom: { NW: 101 },
        max: 103
      }
    ],
    supplementalCodes: ["D9BBB", "XX123"]
  });

  assert.deepEqual(
    plan.entries.map((entry) => [entry.code, entry.profile]),
    [
      ["D9AAA", "letterGrid"],
      ["NW101", "numberedRange"],
      ["NW102", "numberedRange"],
      ["D9BBB", "letterGrid"]
    ]
  );
  assert.equal(plan.skipped, 1);
});

test("buildMicronFbgaCrawlPlan applies start-from to the unified FBGA plan", () => {
  const fromLetterGrid = buildMicronFbgaCrawlPlan({
    micronFbgaProfiles: tinyProfiles,
    startFromCode: "D9N"
  });
  assert.equal(fromLetterGrid.entries[0]?.code, "D9NBB");
  assert.ok(fromLetterGrid.entries.some((entry) => entry.code === "NW101"));

  const fromNumberedRange = buildMicronFbgaCrawlPlan({
    micronFbgaProfiles: tinyProfiles,
    startFromCode: "NW101"
  });
  assert.deepEqual(
    fromNumberedRange.entries.map((entry) => entry.code),
    ["NW101", "NW102"]
  );
});

test("crawlMdb writes Micron FBGA hits in plan order and keeps SpecTek enabled", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fdnext-mdb-"));
  const file = join(dir, "mdb.json");
  writeFileSync(file, JSON.stringify({ micron: {}, spectek: {} } satisfies MdbPayload));

  const hits: Record<string, string> = {
    D9NBB: "MT-D9NBB",
    D9NBN: "MT-D9NBN",
    NW101: "MT-NW101"
  };
  const requestedMicron: string[] = [];
  const requestedSpectek: string[] = [];
  let activeMicron = 0;
  let maxActiveMicron = 0;

  const fetchImpl: NonNullable<MdbQueryOptions["fetchImpl"]> = async (input, init) => {
    const url = String(input);
    if (url.includes("fbga-parts-decoder")) {
      const code = url.split("/").pop() ?? "";
      requestedMicron.push(code);
      activeMicron += 1;
      maxActiveMicron = Math.max(maxActiveMicron, activeMicron);
      if (code === "D9NBB") {
        await sleep(10);
      }
      activeMicron -= 1;
      const partNumber = hits[code];
      return jsonResponse({
        details: partNumber ? [{ "part-number": partNumber }] : []
      });
    }

    if (url.includes("spectek.com") && init?.method === "POST") {
      const body = new URLSearchParams(init.body ?? "");
      const code = body.get("ctl00$MainCPH$MarkCodeTextBox") ?? "";
      requestedSpectek.push(code);
      return textResponse(`<table class="bdrBlackTbl"><tr><td>${code}</td><td>MT42<br/>MT43</td><td></td></tr></table>`);
    }

    if (url.includes("spectek.com")) {
      return textResponse(
        '<input name="__VIEWSTATE" value="vs"><input name="__VIEWSTATEGENERATOR" value="vsg"><input name="__EVENTVALIDATION" value="ev">'
      );
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await crawlMdb({
      file,
      micronFbgaProfiles: tinyProfiles,
      startFromCode: "D9N",
      supplementalCodes: ["PB002"],
      spectekHeaders: ["PB"],
      spectekMax: 2,
      concurrency: 2,
      flushHits: 2,
      fetchImpl
    });
    const saved = JSON.parse(readFileSync(file, "utf8")) as MdbPayload;

    assert.deepEqual(requestedMicron, ["D9NBB", "D9NBN", "D9NNB", "D9NNN", "NW101", "NW102"]);
    assert.equal(maxActiveMicron, 2);
    assert.deepEqual(Object.keys(saved.micron), ["D9NBB", "D9NBN", "NW101"]);
    assert.deepEqual(requestedSpectek, ["PB001", "PB002"]);
    assert.deepEqual(saved.spectek.PB001, ["MT42", "MT43"]);
    assert.deepEqual(saved.spectek.PB002, ["MT42", "MT43"]);
    assert.equal(result.stats.micronFbga.requests, 6);
    assert.equal(result.stats.micronFbga.hits, 3);
    assert.equal(result.stats.micronFbga.misses, 3);
    assert.equal(result.stats.micronFbgaProfiles.letterGrid.requests, 4);
    assert.equal(result.stats.micronFbgaProfiles.numberedRange.requests, 2);
    assert.equal(result.stats.spectek.requests, 2);
    assert.equal(result.stats.spectek.hits, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("crawlMdb applies P-prefixed start-from to the SpecTek queue", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fdnext-mdb-"));
  const file = join(dir, "mdb.json");
  writeFileSync(file, JSON.stringify({ micron: {}, spectek: {} } satisfies MdbPayload));

  const requestedMicron: string[] = [];
  const requestedSpectek: string[] = [];
  const fetchImpl: NonNullable<MdbQueryOptions["fetchImpl"]> = async (input, init) => {
    const url = String(input);
    if (url.includes("fbga-parts-decoder")) {
      const code = url.split("/").pop() ?? "";
      requestedMicron.push(code);
      return jsonResponse({ details: [{ "part-number": `MT-${code}` }] });
    }

    if (url.includes("spectek.com") && init?.method === "POST") {
      const body = new URLSearchParams(init.body ?? "");
      const code = body.get("ctl00$MainCPH$MarkCodeTextBox") ?? "";
      requestedSpectek.push(code);
      return textResponse(`<table class="bdrBlackTbl"><tr><td>${code}</td><td>${code}-PN</td><td></td></tr></table>`);
    }

    if (url.includes("spectek.com")) {
      return textResponse(
        '<input name="__VIEWSTATE" value="vs"><input name="__VIEWSTATEGENERATOR" value="vsg"><input name="__EVENTVALIDATION" value="ev">'
      );
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await crawlMdb({
      file,
      micronFbgaProfiles: tinyProfiles,
      startFromCode: "PB002",
      supplementalCodes: ["PB004"],
      spectekHeaders: ["PB"],
      spectekMax: 4,
      fetchImpl
    });
    const saved = JSON.parse(readFileSync(file, "utf8")) as MdbPayload;

    assert.deepEqual(requestedMicron, []);
    assert.deepEqual(requestedSpectek, ["PB002", "PB003", "PB004"]);
    assert.deepEqual(Object.keys(saved.micron), []);
    assert.deepEqual(Object.keys(saved.spectek), ["PB002", "PB003", "PB004"]);
    assert.equal(result.stats.micronFbga.requests, 0);
    assert.equal(result.stats.spectek.requests, 3);
    assert.equal(result.stats.spectek.hits, 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
