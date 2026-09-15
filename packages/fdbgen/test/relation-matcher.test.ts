import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { PartDecodeDraft } from "@itxtech/fdnext-core";
import { auditFdb, generateFdbWithTrace } from "../src/index";
import { compareRelationFacts, createRelationMatcher, readRelationFacts } from "../src/relation-matcher";

const matcher = createRelationMatcher();

test("same native density does not merge distinct Micron die revisions", () => {
  for (const [pn, id] of [
    ["MT29F64G08CBCBB", "2C644432A500"],
    ["MT29F128G08CECDB", "2C84643CA504"]
  ]) {
    assert.ok(matcher.evaluate("micron", pn!, id!).conflicts.includes("die_profile"));
  }
  for (const id of ["2C644432A500", "B5644432A500"]) {
    assert.equal(matcher.evaluate("micron", "MT29F64G08CBCGB", id).status, "compatible");
  }
});

test("die density disambiguates a shared generation and compares target capacity per CE", () => {
  const pn = matcher.partFacts("skhynix", "H25G9TD18CX576");
  const id = matcher.identifierFacts("AD89283B00D0");
  assert.deepEqual(pn.profileKeys, id.profileKeys);
  assert.equal(pn.nativeDieDensity, 524288);
  assert.equal(id.nativeDieDensity, 1048576);
  assert.ok(compareRelationFacts(pn, id).conflicts.includes("native_die_density"));
  assert.equal(matcher.evaluate("skhynix", "H25T3TC88CX658", "AD89293B00D0").status, "compatible");
  assert.ok(matcher.evaluate("micron", "MT29F64G08CBCGB", "2C844432AA04").conflicts.includes("native_die_density"));
});

test("coarse Kioxia process families remain unresolved and plane counts do not cross scopes", () => {
  const decision = matcher.evaluate("kioxia", "TC58NVG4D2HTA00", "98D584327656");
  assert.equal(decision.status, "unknown");
  assert.deepEqual(decision.conflicts, []);
  assert.ok(decision.unknowns.includes("die_profile"));
});

test("cell and generation conflicts are checked for Samsung, Kioxia, SanDisk and YMTC", () => {
  for (const [vendor, pn, id] of [
    ["samsung", "K9GCGD8U0A", "ECA7A06A68C4"],
    ["kioxia", "TC58LJG8T24TA0D", "98739CB376EB"],
    ["sndk", "SDUNBIEM4-128G", "45489BB37E71"],
    ["ymtc", "YMN09TC1B1AC6C", "9BD5588D2000"],
    ["ymtc", "YMN0ATF1B1HPAD", "9BC428554000"]
  ]) {
    const decision = matcher.evaluate(vendor!, pn!, id!);
    // Inconsistent legacy geometries are retained pending source correction.
    assert.ok(decision.status === "conflict" || decision.unknowns.some(reason => reason.includes("conflict")), `${vendor} ${pn}: ${JSON.stringify(decision)}`);
  }
});

test("grading and half-page preserve native die checks without comparing effective capacity as native", () => {
  const full = "FBNL06B256G1KDBABJ4-6AL";
  assert.equal(matcher.evaluate("spectek", full, "B5A46432AA04").status, "compatible");
  assert.equal(matcher.evaluate("spectek", full, "2CA46432AA04").status, "compatible");
  assert.equal(matcher.evaluate("spectek", "FNNL85A71MDBABJ4-AL", "B584643B8900").status, "unknown");
  assert.ok(matcher.evaluate("spectek", full, "B5644432A500").conflicts.includes("native_die_density"));
  assert.equal(matcher.partFacts("spectek", full).partialPackage, false, "PFPT A means all CEs are usable");
});

test("documented pSLC native profiles and ambiguous candidate sets keep their semantics", () => {
  const part: PartDecodeDraft = {
    device: { vendor: "spectek", chipKind: "raw_nand", partNumber: "synthetic" },
    fields: { cell_level: 1, density: 262144, die_density: 262144, die_count: 1, ce_count: 1 },
    meta: { nandDieProfileKey: "M16A" }
  };
  const id = readRelationFacts({
    device: { vendor: "micron", chipKind: "raw_nand", identifier: "2C0000000000", idScheme: "nand.flash_id" },
    fields: { cell_level: 4, density: 1048576, die_density: 1048576, die_count: 1 },
    meta: { nandDieProfileKey: "N18A" }
  }, "identifier");
  assert.equal(compareRelationFacts(readRelationFacts(part, "part"), id).status, "compatible");
  const ambiguous = readRelationFacts({ ...part, meta: { nandDieProfileKeys: ["M16A", "M26A"] } }, "part");
  assert.equal(compareRelationFacts(ambiguous, id).status, "unknown");
});

test("placeholder, legacy ambiguous, undecoded and self-inconsistent records cannot prove conflicts", () => {
  for (const [vendor, pn, id] of [
    ["kioxia", "TC58LJG9T23TA0D", "980000000000"],
    ["intel", "29F08G08AANC1", "89D3902E6400"],
    ["skhynix", "HY27UA081G1M", "AD79A5001000"],
    ["spectek", "FBNL06B256G1KDBAB", "B5644432A500"],
    ["skhynix", "H25T3TC88CX658", "AD79294B02E0"]
  ]) {
    assert.equal(matcher.evaluate(vendor!, pn!, id!).status, "unknown", `${pn} ${id}`);
  }
});

test("generation and audit share relation decisions, retain controllers and expose both native densities", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-relations-"));
  try {
    writeFileSync(join(inputDir, "fdb.json"), JSON.stringify({
      info: { version: "raw" },
      micron: {
        MT29F64G08CBCBB: { id: ["2C644432A500"], t: ["CTRL"] },
        MT29F64G08CBCGB: { id: ["2C644432A500", "B5644432A500"], t: ["CTRL"], a: ["micron MT29F64G08CBCBB"] }
      },
      iddb: { "2C644432A500": { t: ["CTRL"] }, B5644432A500: { t: ["CTRL"] } }
    }));
    const { fdb, trace } = generateFdbWithTrace({ inputDir, version: "test" });
    const report = auditFdb(fdb, { trace });
    assert.equal(report.ok, true);
    assert.equal(report.relations.removed, 1);
    assert.ok((fdb.micron as Record<string, unknown>).MT29F64G08CBCBB, "retain an existing alias target after its conflicting ID is removed");
    assert.ok(!report.issues.some(issue => issue.code === "reference.missing_alias"));
    const rejected = trace.records.find(record => record.decision === "relation.conflict");
    assert.equal((rejected?.normalized?.part as { nativeDieDensity?: number }).nativeDieDensity, 65536);
    assert.equal((rejected?.normalized?.identifier as { nativeDieDensity?: number }).nativeDieDensity, 65536);
    assert.ok(rejected?.source);
    const iddb = fdb.iddb as Record<string, { n: string[]; t: string[] }>;
    assert.deepEqual(iddb["2C644432A500"]?.n, ["micron MT29F64G08CBCGB"]);
    assert.deepEqual(iddb["2C644432A500"]?.t, ["CTRL"]);
    iddb["2C644432A500"]!.n = [];
    assert.ok(auditFdb(fdb).issues.some(issue => issue.code === "relation.missing_reverse"));
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});

test("source geometry disagreements remain auditable without deciding die compatibility", () => {
  const inputDir = mkdtempSync(join(tmpdir(), "fdnext-relation-geometry-"));
  try {
    writeFileSync(join(inputDir, "fdb.json"), JSON.stringify({
      micron: { MT29F64G08CBCGB: { id: ["2C644432A500"], t: ["CTRL"] } },
      iddb: { "2C644432A500": { s: 8, t: ["CTRL"] } }
    }));
    mkdirSync(join(inputDir, "iddb"));
    writeFileSync(join(inputDir, "iddb", "b.json"), JSON.stringify({ "2C644432A500": { s: 16, t: ["CTRL"] } }));
    const { fdb, trace } = generateFdbWithTrace({ inputDir, version: "test" });
    const audit = auditFdb(fdb, { trace });
    assert.equal(audit.ok, true);
    assert.equal(audit.relations.compatible, 1);
    assert.equal(audit.issues.find(issue => issue.code === "source.geometry_conflict")?.count, 1);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});
