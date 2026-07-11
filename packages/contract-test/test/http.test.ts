import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createHttpServer } from "@itxtech/fdnext-server";
import { createContractEngine } from "../src/index";
import {
  assertCapabilitiesBuildTime,
  closeNodeServer,
  fdnextPackageVersion,
  normalizeCapabilitiesForComparison,
  parseJsonObject
} from "./_helpers";

const engine = createContractEngine();
const sdkCapabilities = engine.getCapabilities();

const http = createHttpServer({ host: "127.0.0.1", port: 0, engine });
await http.listen();
const httpAddress = http.server.address() as AddressInfo;
const httpBaseUrl = `http://127.0.0.1:${httpAddress.port}`;
async function injectJson(method: "GET" | "POST", url: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${httpBaseUrl}${url}`, { method });
  const payload = await response.text();
  assert.equal(response.status, 200, payload);
  return parseJsonObject(payload);
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
const httpCompletePartSearch = await injectJson("GET", "/parts/search?query=MT29&lang=eng");
assert.ok((httpCompletePartSearch.items as unknown[]).length > 100);
const httpDefaultCappedSearch = await injectJson("GET", "/parts/search?query=M&lang=eng");
assert.equal((httpDefaultCappedSearch.items as unknown[]).length, 300);
const httpExplicitOverCapSearch = await injectJson("GET", "/parts/search?query=M&lang=eng&limit=10000");
assert.equal((httpExplicitOverCapSearch.items as unknown[]).length, 300);
const httpExplicitLowerSearch = await injectJson("GET", "/parts/search?query=M&lang=eng&limit=7");
assert.equal((httpExplicitLowerSearch.items as unknown[]).length, 7);
const httpIdentifierDecode = await injectJson("GET", "/identifiers/decode?query=2C64444BA900&lang=eng");
assert.equal(httpIdentifierDecode.operation, "identifier.decode");
assert.equal((httpIdentifierDecode.input as { constraints?: { idScheme?: string } } | undefined)?.constraints?.idScheme, "nand.flash_id");
const httpIdentifierSearch = await injectJson("GET", "/identifiers/search?query=2C64&lang=eng&limit=3");
assert.equal(httpIdentifierSearch.operation, "identifier.search");
assert.ok(Array.isArray(httpIdentifierSearch.items));
const httpCappedIdentifierSearch = await injectJson("GET", "/identifiers/search?query=98&lang=eng&limit=10000");
assert.equal((httpCappedIdentifierSearch.items as unknown[]).length, 300);
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
const httpHeaders = await fetch(httpBaseUrl);
assert.equal(httpHeaders.headers.get("access-control-allow-origin"), "*");
assert.equal(httpHeaders.headers.get("x-powered-by"), `fdnext/${fdnextPackageVersion}`);
assert.equal(httpHeaders.headers.get("cache-control"), "no-cache");
const httpCompressed = await fetch(`${httpBaseUrl}/parts/decode?query=MT29F64G08CBABA&lang=eng`, {
  headers: { "accept-encoding": "gzip" }
});
assert.equal(httpCompressed.headers.get("content-encoding"), "gzip");
assert.match(httpCompressed.headers.get("vary") ?? "", /(?:^|,)\s*accept-encoding\s*(?:,|$)/i);
assert.equal((await httpCompressed.json() as { status?: unknown }).status, "ok");
const httpHead = await fetch(`${httpBaseUrl}/capabilities`, { method: "HEAD" });
assert.equal(httpHead.status, 200);
assert.equal(await httpHead.text(), "");
await closeNodeServer(http.server);
