import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createEngine } from "../../core/src/index";
import { createContractEngine, runContractChecks } from "../src/index";
import * as resourceModule from "../../resources/index";
import { createHttpServer } from "../../server/src/index";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function parseJsonObject(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as unknown;
  assert.ok(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as Record<string, unknown>;
}

function runCli(args: string[]): Record<string, unknown> {
  const result = spawnSync(process.execPath, ["--import", "tsx", "./packages/cli/src/index.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.trim(), result.stderr);
  return parseJsonObject(result.stdout);
}

const summary = runContractChecks();

assert.equal(summary.checked, 5);
assert.deepEqual(summary.operations, ["part.decode", "part.search", "identifier.decode", "identifier.search", "capabilities"]);

const engine = createContractEngine();

assert.ok(resourceModule.embeddedResourceBundle.partIndex.rawNand);
assert.ok(resourceModule.embeddedResourceBundle.identifierIndex.nandFlash);
assert.ok(resourceModule.embeddedResourceBundle.markingIndex.packageMarkings);
assert.ok(resourceModule.embeddedResourceBundle.translationIndex.eng);
assert.equal("embeddedResources" in resourceModule, false);
assert.equal("fdbRaw" in resourceModule, false);

assert.equal(engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" }).device?.chipKind, "raw_nand");
assert.equal(engine.decodePart({ query: "EMMC04G-WT32", lang: "eng" }).device?.chipKind, "managed_nand");
assert.equal(engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" }).device?.chipKind, "dram");

const inferredIdentifier = engine.decodeIdentifier({ query: "2C64444BA900", lang: "eng" });
assert.equal(inferredIdentifier.status, "ok");
assert.equal(inferredIdentifier.input.constraints.idScheme, "nand.flash_id");
assert.equal(inferredIdentifier.device?.idScheme, "nand.flash_id");
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "identity"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "geometry"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "timing"));
assert.ok(inferredIdentifier.blocks.some((block) => block.id === "controllers"));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "blocks_per_lun")));
assert.ok(inferredIdentifier.blocks.some((block) => block.fields.some((field) => field.key === "timing_mode_async")));
assert.ok(inferredIdentifier.relations.some((relation) => relation.kind === "identifier_for" && relation.source?.idScheme === "nand.flash_id"));

const inferredIdentifierSearch = engine.searchIdentifiers({ query: "2C64", lang: "eng", limit: 2 });
assert.equal(inferredIdentifierSearch.status, "ok");
assert.equal(inferredIdentifierSearch.input.constraints.idScheme, "nand.flash_id");
assert.ok(inferredIdentifierSearch.items.every((item) => item.device.idScheme === "nand.flash_id"));

assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "dram", strict: true } }).status,
  "ok"
);
const rejected = engine.decodePart({
  query: "MT62F1G64D4EK-023 WT:B",
  lang: "eng",
  constraints: { chipKind: "managed_nand", strict: true }
});
assert.equal(rejected.status, "not_found");
assert.ok(rejected.warnings.some((warning) => warning.code === "constraint_mismatch"));
assert.equal(
  engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng", constraints: { chipKind: "managed_nand" } }).device?.chipKind,
  "managed_nand"
);

const marking = engine.searchParts({ query: "C9BJZ", lang: "eng", limit: 5 });
const markingItem = marking.items.find((item) => item.device.markingCode === "C9BJZ" && item.device.partNumber === "CT40A1G8SA-62M:E");
assert.ok(markingItem, "Micron FBGA marking search should return a structured part candidate");
assert.equal(markingItem.device.chipKind, "dram");
assert.ok(markingItem.fields?.some((field) => field.key === "marking_code" && field.value === "C9BJZ"));
assert.ok(marking.relations?.some((relation) => relation.kind === "marking_for" && relation.source?.markingCode === "C9BJZ"));
assert.ok(markingItem.actions?.some((action) => action.operation === "part.decode" && action.input.constraints?.chipKind === "dram"));

const markingDecode = engine.decodePart({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecode.status, "ok");
assert.equal(markingDecode.device?.partNumber, "CT40A1G8SA-62M:E");
assert.equal(markingDecode.device?.markingCode, "C9BJZ");
assert.ok(markingDecode.blocks.some((block) => block.fields.some((field) => field.key === "marking_code" && field.value === "C9BJZ")));
assert.ok(markingDecode.relations.some((relation) => relation.kind === "marking_for" && relation.source?.markingCode === "C9BJZ"));

const markingDecodeAsIdentifier = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng" });
assert.equal(markingDecodeAsIdentifier.status, "invalid_input");
assert.ok(markingDecodeAsIdentifier.warnings.some((warning) => warning.code === "missing_id_scheme"));
const markingDecodeAsNandFlashId = engine.decodeIdentifier({ query: "C9BJZ", lang: "eng", idScheme: "nand.flash_id" });
assert.equal(markingDecodeAsNandFlashId.status, "invalid_input");
assert.ok(markingDecodeAsNandFlashId.warnings.some((warning) => warning.code === "invalid_nand_flash_id"));
const markingSearchAsIdentifier = engine.searchIdentifiers({ query: "C9BJZ", lang: "eng" });
assert.equal(markingSearchAsIdentifier.status, "invalid_input");
assert.ok(markingSearchAsIdentifier.warnings.some((warning) => warning.code === "missing_id_scheme"));

const dramDecode = engine.decodePart({ query: "MT62F1G64D4EK-023 WT:B", lang: "eng" });
assert.ok(!dramDecode.relations.some((relation) => relation.kind === "identifier_for"));
assert.ok(!dramDecode.actions.some((action) => action.operation === "identifier.search" || action.operation === "identifier.decode"));
const nandDecode = engine.decodePart({ query: "MT29F64G08CBABA", lang: "eng" });
assert.ok(nandDecode.relations.some((relation) => relation.kind === "identifier_for" && relation.target.idScheme === "nand.flash_id"));
assert.ok(nandDecode.actions.some((action) => (
  action.operation === "identifier.decode" &&
  action.input.constraints?.idScheme === "nand.flash_id" &&
  /^[0-9A-F]+$/.test(action.input.query)
)));

const ambiguousEngine = createEngine({
  resources: {
    partIndex: {
      rawNand: {},
      managedNand: [{ vendor: "micron", pn: "TESTPART" }],
      dram: [{ vendor: "micron", pn: "TESTPART" }]
    },
    identifierIndex: {
      nandFlash: {}
    },
    markingIndex: {
      packageMarkings: {}
    },
    vendorIndex: {},
    translationIndex: {}
  },
  decoders: [{
    id: "test-dram",
    priority: 100,
    check: (partNumber) => partNumber === "TESTPART",
    decode: () => ({ vendor: "micron", type: "DRAM", density: 1024 })
  }]
});
const ambiguous = ambiguousEngine.decodePart({ query: "TESTPART", lang: "eng" });
assert.equal(ambiguous.status, "ambiguous");
assert.ok((ambiguous.candidates?.length ?? 0) >= 2);
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "dram"));
assert.ok(ambiguous.candidates?.some((candidate) => candidate.device.chipKind === "managed_nand"));

const cliPartDecode = runCli(["part", "decode", "MT62F1G64D4EK-023", "eng"]);
assert.equal(cliPartDecode.operation, "part.decode");
assert.equal((cliPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const cliIdentifierDecode = runCli(["id", "decode", "2C64444BA900", "eng", "nand.flash_id"]);
assert.equal(cliIdentifierDecode.operation, "identifier.decode");
assert.equal((cliIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const cliCapabilities = runCli(["capabilities"]);
assert.equal(cliCapabilities.schemaVersion, "fdnext.capabilities.v1");

const http = createHttpServer({ host: "127.0.0.1", port: 8080 });
async function injectJson(method: "GET" | "POST", url: string, payload?: object): Promise<Record<string, unknown>> {
  const response = await http.server.inject({ method, url, ...(payload ? { payload } : {}) });
  assert.equal(response.statusCode, 200, response.payload);
  return parseJsonObject(response.payload);
}
const httpPartDecode = await injectJson("POST", "/parts/decode", { query: "MT62F1G64D4EK-023", lang: "eng" });
assert.equal(httpPartDecode.operation, "part.decode");
assert.equal((httpPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const httpIdentifierDecode = await injectJson("POST", "/identifiers/decode", { query: "2C64444BA900", lang: "eng", idScheme: "nand.flash_id" });
assert.equal(httpIdentifierDecode.operation, "identifier.decode");
assert.equal((httpIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const httpCapabilities = await injectJson("GET", "/capabilities");
assert.equal(httpCapabilities.schemaVersion, "fdnext.capabilities.v1");
const removedEndpoint = await injectJson("GET", "/decode?pn=MT29F64G08CBABA");
assert.equal(removedEndpoint.status, "not_found");
await http.server.stop();

process.stdout.write(`Contract confirmed: ${summary.checked} fixtures\n`);
