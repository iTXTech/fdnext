import assert from "node:assert/strict";
import { createHttpServer } from "../../server/src/index";
import { createContractEngine } from "../src/index";
import {
  assertCapabilitiesBuildTime,
  fdnextPackageVersion,
  normalizeCapabilitiesForComparison,
  parseJsonObject
} from "./_helpers";

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();

const http = createHttpServer({ host: "127.0.0.1", port: 8080 });
async function injectJson(method: "GET" | "POST", url: string): Promise<Record<string, unknown>> {
  const response = await http.server.inject({ method, url });
  assert.equal(response.statusCode, 200, response.payload);
  return parseJsonObject(response.payload);
}
const httpIndex = await injectJson("GET", "/");
assert.equal(httpIndex.status, "ok");
assert.equal(httpIndex.name, "fdnext-server");
assert.equal(httpIndex.version, fdnextPackageVersion);
const httpPartDecode = await injectJson("GET", "/parts/decode?query=MT62F1G64D4EK-023&lang=eng");
assert.equal(httpPartDecode.operation, "part.decode");
assert.equal((httpPartDecode.device as { chipKind?: string } | undefined)?.chipKind, "dram");
const httpPartSearch = await injectJson("GET", "/parts/search?query=MTFC&lang=eng&limit=3&productType=ufs");
assert.equal(httpPartSearch.operation, "part.search");
assert.ok(Array.isArray(httpPartSearch.items));
const httpIdentifierDecode = await injectJson("GET", "/identifiers/decode?query=2C64444BA900&lang=eng");
assert.equal(httpIdentifierDecode.operation, "identifier.decode");
assert.equal((httpIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const httpIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C64&lang=eng&limit=3");
assert.equal(httpIdentifierSearch.operation, "identifier.search");
assert.ok(Array.isArray(httpIdentifierSearch.items));
const httpGroupedIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C64&lang=eng&limit=3&controllerGroup=if:sata,if:nvme");
assert.equal(httpGroupedIdentifierSearch.operation, "identifier.search");
assert.deepEqual(httpGroupedIdentifierSearch, httpIdentifierSearch);
const httpRepeatedGroupedIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C64&lang=eng&limit=3&controllerGroup=if:sata&controllerGroup=if:nvme");
assert.deepEqual(httpRepeatedGroupedIdentifierSearch, httpGroupedIdentifierSearch);
const httpCapabilities = await injectJson("GET", "/capabilities");
assert.equal(httpCapabilities.schemaVersion, "fdnext.capabilities.v2");
assertCapabilitiesBuildTime(httpCapabilities);
assert.deepEqual(normalizeCapabilitiesForComparison(httpCapabilities), normalizeCapabilitiesForComparison(sdkCapabilities));
const httpEngCapabilities = await injectJson("GET", "/capabilities?lang=eng");
assert.equal((httpEngCapabilities.inventory as typeof sdkCapabilities.inventory).controllers.groups[0]?.title, "All controllers");
const removedPostEndpoint = await injectJson("POST", "/parts/decode");
assert.equal(removedPostEndpoint.status, "not_found");
for (const removedEndpoint of [
  "/health",
  "/info",
  "/decode?pn=MT29F64G08CBABA",
  "/summary?pn=MT29F64G08CBABA",
  "/searchPn?pn=MT29",
  "/decodeId?id=2C64444BA900",
  "/summaryId?id=2C64444BA900",
  "/searchId?id=2C64"
]) {
  const removed = await injectJson("GET", removedEndpoint);
  assert.equal(removed.status, "not_found", `${removedEndpoint} should not be exposed`);
}
await http.server.stop();
