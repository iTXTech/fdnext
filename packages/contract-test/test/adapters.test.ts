import assert from "node:assert/strict";
import { FDNEXT_CORS_ORIGINS_ENV, FDNEXT_SEARCH_LIMIT_ENV } from "@itxtech/fdnext-core/runtime";
import { createCfWorkersAdapter } from "@itxtech/fdnext-cf-workers";
import { createContractEngine } from "../src/index";

const engine = createContractEngine();
const cfWorker = createCfWorkersAdapter({ engine });
const cfCorsResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=MT29", {
    headers: { origin: "https://app.example" }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "https://app.example,https://admin.example" }
);
assert.equal(cfCorsResponse.headers.get("access-control-allow-origin"), "https://app.example");
assert.equal(cfCorsResponse.headers.get("vary"), "Origin");
const cfDeniedCorsResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=MT29", {
    headers: { origin: "https://blocked.example" }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "https://app.example,https://admin.example" }
);
assert.equal(cfDeniedCorsResponse.headers.get("access-control-allow-origin"), null);
const cfPreflightResponse = await cfWorker.fetch(
  new Request("https://fdnext.example/parts/search", {
    method: "OPTIONS",
    headers: {
      origin: "https://any.example",
      "access-control-request-method": "GET",
      "access-control-request-headers": "x-fdnext-client"
    }
  }),
  { [FDNEXT_CORS_ORIGINS_ENV]: "*" }
);
assert.equal(cfPreflightResponse.status, 204);
assert.equal(cfPreflightResponse.headers.get("access-control-allow-origin"), "*");
assert.equal(cfPreflightResponse.headers.get("access-control-allow-methods"), "GET, HEAD, OPTIONS");
assert.equal(cfPreflightResponse.headers.get("access-control-allow-headers"), "x-fdnext-client");
assert.equal(await cfPreflightResponse.text(), "");

const cappedCfWorker = createCfWorkersAdapter({ engine });
const cappedCfResponse = await cappedCfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=M&limit=9999"),
  { [FDNEXT_SEARCH_LIMIT_ENV]: "2" }
);
const cappedCfBody = await cappedCfResponse.json() as { items?: unknown[] };
assert.equal(cappedCfBody.items?.length, 2);
