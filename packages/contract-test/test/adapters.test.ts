import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { FDNEXT_CORS_ORIGINS_ENV, FDNEXT_SEARCH_LIMIT_ENV } from "@itxtech/fdnext-core/runtime";
import { createCfWorkersAdapter } from "@itxtech/fdnext-cf-workers";
import { startAliyunFc } from "@itxtech/fdnext-aliyun-fc";
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

const cappedCfWorker = createCfWorkersAdapter({ engine });
const cappedCfResponse = await cappedCfWorker.fetch(
  new Request("https://fdnext.example/parts/search?query=M&limit=9999"),
  { [FDNEXT_SEARCH_LIMIT_ENV]: "2" }
);
const cappedCfBody = await cappedCfResponse.json() as { items?: unknown[] };
assert.equal(cappedCfBody.items?.length, 2);

const previousCorsOrigins = process.env[FDNEXT_CORS_ORIGINS_ENV];
const previousSearchLimit = process.env[FDNEXT_SEARCH_LIMIT_ENV];
process.env[FDNEXT_CORS_ORIGINS_ENV] = "https://fc.example https://admin.example";
process.env[FDNEXT_SEARCH_LIMIT_ENV] = "3";
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
  const aliyunCappedResponse = await fetch(`${baseUrl}/parts/search?query=M&limit=9999`);
  const aliyunCappedBody = await aliyunCappedResponse.json() as { items?: unknown[] };
  assert.equal(aliyunCappedBody.items?.length, 3);
} finally {
  await closeNodeServer(aliyunCorsServer);
  if (previousCorsOrigins === undefined) {
    delete process.env[FDNEXT_CORS_ORIGINS_ENV];
  } else {
    process.env[FDNEXT_CORS_ORIGINS_ENV] = previousCorsOrigins;
  }
  if (previousSearchLimit === undefined) {
    delete process.env[FDNEXT_SEARCH_LIMIT_ENV];
  } else {
    process.env[FDNEXT_SEARCH_LIMIT_ENV] = previousSearchLimit;
  }
}

const aliyunErrorServer = startAliyunFc({
  host: "127.0.0.1",
  port: 0,
  runtimeOptions: {
    processors: [{
      beforeOperation: () => {
        throw new Error("adapter-test internal failure");
      }
    }]
  }
});
try {
  await waitForListening(aliyunErrorServer);
  const address = aliyunErrorServer.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/parts/search?query=MT29`);
  assert.equal(response.status, 500);
  assert.deepEqual(
    await response.json(),
    { status: "error", message: "Internal Server Error" },
    "Aliyun FC must not expose internal runtime errors"
  );
} finally {
  await closeNodeServer(aliyunErrorServer);
}
