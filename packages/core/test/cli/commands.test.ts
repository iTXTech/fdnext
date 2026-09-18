import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { createEngine } from "../../src/index";
import { FDNEXT_VERSION, type PartDecodeResult } from "../../src/result";
import { runCliCommand, type CliCommandOptions } from "../../src/cli/index";

const engine = createEngine();
function run(args: string[], options: CliCommandOptions = {}) {
  let stdout = "";
  let stderr = "";
  const code = runCliCommand(args, { engine, ...options, stdout: (text) => { stdout += text; }, stderr: (text) => { stderr += text; } });
  return { code, stdout, stderr };
}
const decode = ["part", "decode", "MT62F1G64D4EK-023", "--lang", "eng"];

test("help works at every command depth; version is a single line", () => {
  for (const path of [[], ["part"], ["id"], ["decodepack"], ["decodepack", "explain"], ["part", "decode"], ["part", "search"], ["id", "decode"], ["id", "search"], ["capabilities"], ["decodepack", "check"], ["decodepack", "explain", "part"], ["decodepack", "explain", "id"]]) {
    const result = run([...path, "--help"]);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /Usage: fdnext/);
    assert.match(result.stdout, /Copyright/);
    assert.equal(result.stderr, "");
  }
  assert.equal(run([]).code, 0);
  for (const flag of ["--version", "-V"]) assert.deepEqual(run([flag]), { code: 0, stdout: `${FDNEXT_VERSION}\n`, stderr: "" });
  assert.doesNotMatch(run(["-h", "--no-banner"]).stdout, /Copyright/);
});

test("named and existing positional options produce identical results", () => {
  for (const [legacy, named] of [
    [["part", "decode", "MT62F1G64D4EK-023", "eng"], decode],
    [["part", "search", "MT62", "eng", "2"], ["--limit=2", "part", "search", "MT62", "--lang=eng"]],
    [["id", "decode", "2C64444BA900", "eng", "nand.flash_id"], ["id", "decode", "2C64444BA900", "--lang", "eng", "--id-scheme=nand.flash_id"]],
    [["id", "search", "2C64", "eng", "2", "nand.flash_id"], ["id", "search", "2C64", "--lang", "eng", "--limit", "2", "--id-scheme", "nand.flash_id"]],
    [["capabilities", "eng"], ["capabilities", "--lang=eng"]],
    [["decodepack", "explain", "id", "2C64444BA900", "nand.flash_id"], ["decodepack", "explain", "id", "2C64444BA900", "--id-scheme", "nand.flash_id"]]
  ]) {
    const result = run(named!);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout, run(legacy!).stdout);
  }
  const grouped = run([...decode, "--controller-group", "if:sata,if:nvme"]);
  assert.equal(grouped.code, 0, grouped.stderr);
  assert.equal(grouped.stdout, run([...decode, "--controller-group=if:sata", "--controller-group=if:nvme"]).stdout);
  const literal = run(["part", "search", "--", "--help"]);
  assert.equal(JSON.parse(literal.stdout).input.query, "--help");
});

test("reject invalid arguments without producing a result", () => {
  const badArgs = [
    ["unknown"], ["part", "unknown"], ["part", "decode"], ["part", "decode", " "],
    [...decode, "extra"], [...decode, "--unknown"], [...decode, "--limit", "1"],
    [...decode, "--lang"], [...decode, "--lang=chs"], ["part", "decode", "MT62", "eng", "--lang", "eng"],
    [...decode, "--format=yaml"], [...decode, "--format="], ["--version", "--help"],
    [...decode, "--id-scheme=nand.flash_id"], ["id", "decode", "2C64", "--id-scheme=nope"],
    [...decode, "--controller-group=bad"], [...decode, "--controller-group=all,if:sata"],
    [...decode, "--controller-group=if:sata,"], ["id", "search", "2C64", "--controller-group=if:sata"],
    ["decodepack", "explain", "part", "X", "--lang=eng"], ["capabilities", "--limit=5"],
    ...["0", "-1", "10abc", "1.5", "1e3", "9007199254740992"].map((limit) => ["part", "search", "MT", `--limit=${limit}`])
  ];
  for (const args of badArgs) {
    const result = run(args);
    assert.equal(result.code, 2, args.join(" "));
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Error:.*\nRun 'fdnext.*--help'/);
  }
});

test("format selection separates terminal presentation from JSON and embedded callers", () => {
  const embedded = run(decode);
  assert.equal(JSON.parse(embedded.stdout).operation, "part.decode");
  assert.equal(embedded.stderr, "");
  const terminal = run(decode, { stdoutIsTTY: true, stderrIsTTY: true });
  assert.match(terminal.stdout, /Status: ok/);
  assert.match(terminal.stdout, /DRAM Density.*64Gb.*65536 Mbit/);
  assert.doesNotMatch(terminal.stdout, /Copyright|Summary:/);
  assert.match(terminal.stderr, /Copyright/);
  for (const options of [{ stdoutIsTTY: false, stderrIsTTY: true }, { stdoutIsTTY: false, stderrIsTTY: false }]) {
    assert.deepEqual(run(decode, options), embedded);
  }
  assert.equal(run([...decode, "--no-banner"], { stdoutIsTTY: true, stderrIsTTY: true }).stderr, "");
  assert.equal(run(decode, { stdoutIsTTY: true, stderrIsTTY: false }).stderr, "");
  const explicit = run([...decode, "--format=json"], { stdoutIsTTY: true, stderrIsTTY: true, format: "text" });
  assert.deepEqual(explicit, embedded);
  const text = run([...decode, "--format=text"]);
  assert.match(text.stdout, /Operation: part.decode/);
  assert.equal(text.stderr, "");
  assert.equal(run(decode, { format: "text" }).stdout, text.stdout);
  assert.deepEqual(run([...decode, "--format=auto"], { format: "text" }), embedded);
});

test("text retains nested values, candidates, relations, warnings and unknown result keys", () => {
  const result: PartDecodeResult & { future: unknown } = {
    schemaVersion: "fdnext.result.v2", operation: "part.decode", status: "ambiguous",
    input: { query: "X", normalized: "X", constraints: {} }, blocks: [],
    candidates: [{ device: { domain: "memory", chipKind: "dram", vendor: { id: "example", name: "Example" } }, fields: [
      { key: "sample", label: "Sample", value: { count: 0, valid: false, missing: null, names: ["a", "b"] }, importance: "detail" }
    ] }],
    relations: [{ kind: "component", target: { role: "dram", partNumber: "RELATED-PART" } }],
    warnings: [{ code: "uncertain", message: "Needs verification", details: { reason: "multiple candidates" } }],
    links: [{ id: "source", label: "Evidence", url: "https://example.com/data" }],
    future: { nested: [false, 0, null, "line\nnext", "\u001b[31m"] }
  };
  const output = run(["part", "decode", "X", "--format=text"], { engine: { ...engine, decodePart: () => result } });
  assert.equal(output.code, 0);
  for (const expected of ["Status: ambiguous", "Candidates (1)", "Sample [sample]", "Count: 0", "Valid: false", "Missing: null", "RELATED-PART", "Needs verification", "multiple candidates", "https://example.com/data", "Future:", "false", "null", "line\\u000anext", "\\u001b[31m"]) assert.ok(output.stdout.includes(expected), expected);
  assert.doesNotMatch(output.stdout, /\u001b/);
});

test("a distinct summary is retained and runtime failures use stderr with code 1", () => {
  const original = engine.decodePart({ query: decode[2]! });
  const result: PartDecodeResult = { ...original, summary: { full: [], brief: [{ key: "unique", label: "Unique", value: "summary-only", importance: "primary" }] } };
  assert.match(run([...decode, "--format=text"], { engine: { ...engine, decodePart: () => result } }).stdout, /summary-only/);
  const failed = run(decode, { engine: { ...engine, decodePart: () => { throw new Error("Fixture engine failure"); } } });
  assert.deepEqual(failed, { code: 1, stdout: "", stderr: "Error: Fixture engine failure\n" });
  const missing = run(["part", "decode", "not-a-real-part"]);
  assert.equal(missing.code, 0);
  assert.equal(JSON.parse(missing.stdout).status, "not_found");
});

test("source executable provides clean redirected output and errors", () => {
  const entry = new URL("../../src/cli/bin.ts", import.meta.url);
  for (const args of [["--version"], ["--help"], [...decode, "--format=text"], decode, ["part", "decode"]]) {
    const child = spawnSync(process.execPath, ["--import", "tsx", entry.pathname, ...args], { encoding: "utf8" });
    const expected = run(args);
    assert.equal(child.status, expected.code, child.stderr);
    assert.equal(child.stdout, expected.stdout);
    assert.equal(child.stderr, expected.stderr);
  }
});
