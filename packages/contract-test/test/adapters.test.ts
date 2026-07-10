import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { FDNEXT_CORS_ORIGINS_ENV } from "../../core/src/runtime";
import { createCfWorkersAdapter } from "../../cf-workers/src/index";
import { startAliyunFc } from "../../aliyun-fc/src/index";
import { createContractEngine } from "../src/index";
import { closeNodeServer, waitForListening } from "./_helpers";

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

const previousCorsOrigins = process.env[FDNEXT_CORS_ORIGINS_ENV];
process.env[FDNEXT_CORS_ORIGINS_ENV] = "https://fc.example https://admin.example";
const aliyunCorsServer = startAliyunFc({ host: "127.0.0.1", port: 0, runtimeOptions: { engine } });
try {
  await waitForListening(aliyunCorsServer);
  const address = aliyunCorsServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const aliyunCorsResponse = await fetch(`${baseUrl}/`, {
    headers: { origin: "https://admin.example" }
  });
  assert.equal(aliyunCorsResponse.headers.get("access-control-allow-origin"), "https://admin.example");
  assert.equal(aliyunCorsResponse.headers.get("vary"), "Origin");
  const aliyunPreflightResponse = await fetch(`${baseUrl}/parts/search`, {
    method: "OPTIONS",
    headers: {
      origin: "https://fc.example",
      "access-control-request-method": "GET",
      "access-control-request-headers": "x-fdnext-client"
    }
  });
  assert.equal(aliyunPreflightResponse.status, 204);
  assert.equal(aliyunPreflightResponse.headers.get("access-control-allow-origin"), "https://fc.example");
  assert.equal(aliyunPreflightResponse.headers.get("access-control-allow-headers"), "x-fdnext-client");
  assert.equal(await aliyunPreflightResponse.text(), "");
} finally {
  await closeNodeServer(aliyunCorsServer);
  if (previousCorsOrigins === undefined) {
    delete process.env[FDNEXT_CORS_ORIGINS_ENV];
  } else {
    process.env[FDNEXT_CORS_ORIGINS_ENV] = previousCorsOrigins;
  }
}
