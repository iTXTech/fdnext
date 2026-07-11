import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import test, { after } from "node:test";
import { createEngine } from "@itxtech/fdnext-core";
import { createFdServer, createFdServerHandler, FD_SERVER_NAME } from "../src/index";

const flashInfoKeys = new Set([
  "partNumber",
  "vendor",
  "type",
  "density",
  "deviceWidth",
  "processNode",
  "cellLevel",
  "classification",
  "voltage",
  "generation",
  "interface",
  "package",
  "extraInfo",
  "flashId",
  "controller",
  "remark",
  "url",
  "urls",
  "rawDensity",
  "rawVendor"
]);

const flashIdInfoKeys = new Set([
  "id",
  "vendor",
  "density",
  "die",
  "plane",
  "pageSize",
  "blockSize",
  "processNode",
  "cellLevel",
  "voltage",
  "ext",
  "controllers",
  "partNumbers",
  "url",
  "urls",
  "rawVendor"
]);

const sharedEngine = createEngine();
const sharedApp = createFdServer({
  host: "127.0.0.1",
  port: 0,
  engine: sharedEngine,
  extraUrls: {
    "FlashMaster Web": "https://fm.itxtech.org"
  },
  warn: () => undefined
});
await sharedApp.listen();
const sharedAddress = sharedApp.server.address() as AddressInfo;
const sharedBaseUrl = `http://127.0.0.1:${sharedAddress.port}`;

function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

after(() => closeServer(sharedApp.server));

async function inject(path: string) {
  const rawResponse = await fetch(`${sharedBaseUrl}${path}`);
  const payload = await rawResponse.text();
  return {
    response: {
      statusCode: rawResponse.status,
      payload,
      headers: rawResponse.headers
    },
    body: JSON.parse(payload) as Record<string, unknown>
  };
}

async function fetchJson(path: string, env: Record<string, string | undefined> = {}) {
  const handler = createFdServerHandler({
    engine: sharedEngine,
    env,
    warn: () => undefined
  });
  const response = handler.handleRequest(new Request(`https://fd.example.test${path}`));
  return {
    response,
    body: JSON.parse(await response.text()) as Record<string, unknown>
  };
}

test("/ returns fd-server identity", async () => {
  const { response, body } = await inject("/");
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.match(response.headers.get("Vary") ?? "", /(?:^|,)\s*origin\s*(?:,|$)/i);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("Cache-Control"), "no-cache");
  assert.equal(body.result, true);
  assert.equal(body.server, FD_SERVER_NAME);
  assert.equal(typeof body.time, "number");
});

test("node server replies to OPTIONS preflight", async () => {
  const response = await fetch(`${sharedBaseUrl}/decode`, {
    method: "OPTIONS",
    headers: { origin: "https://legacy.example" }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://legacy.example");
  assert.match(response.headers.get("Vary") ?? "", /(?:^|,)\s*origin\s*(?:,|$)/i);
  assert.equal(await response.text(), "");
});

test("node server preserves the Hapi response for unsupported methods", async () => {
  const response = await fetch(`${sharedBaseUrl}/decode`, { method: "POST", body: "ignored" });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { statusCode: 404, error: "Not Found", message: "Not Found" });
});

test("/info returns FlashDetector-shaped metadata", async () => {
  const { response, body } = await inject("/info");
  assert.equal(response.headers.get("Content-Encoding"), "gzip");
  assert.match(response.headers.get("Vary") ?? "", /(?:^|,)\s*accept-encoding\s*(?:,|$)/i);
  assert.equal(body.result, true);
  assert.ok(body.ver);
  assert.equal(typeof body.info, "object");
  const info = body.info as { fdb?: unknown; flash_cnt?: unknown; id_cnt?: unknown; mdb_cnt?: unknown };
  assert.equal(typeof info.fdb, "object");
  assert.ok(Array.isArray((info.fdb as { controllers?: unknown }).controllers));
  assert.ok(((info.fdb as { controllers?: unknown[] }).controllers ?? []).length > 0);
  assert.equal(typeof info.flash_cnt, "number");
  assert.equal(typeof info.id_cnt, "number");
  assert.equal(typeof info.mdb_cnt, "number");
});

test("/decode reports missing pn as legacy business error", async () => {
  const { response, body } = await inject("/decode");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(body, { result: false, message: "Missing part number" });
});

test("/decode maps known PN to FlashInfo field set", async () => {
  const { body } = await inject("/decode?pn=MT29F4G08ABAEA&lang=eng");
  assert.equal(body.result, true);
  const data = body.data as Record<string, unknown>;
  assert.deepEqual(Object.keys(data).filter((key) => !flashInfoKeys.has(key)), []);
  assert.equal(data.vendor, "Micron");
  assert.equal(data.rawVendor, "micron");
  assert.equal(data.density, "4Gb");
  assert.equal(data.rawDensity, 4096);
  assert.equal((data.url as Record<string, string>)["FlashMaster Web"], "https://fm.itxtech.org");
});

test("/decode maps DRAM die and CS counts into legacy classification", async () => {
  const { body } = await inject("/decode?pn=H9CCNNNBLTBLAR-NTD&lang=eng");
  assert.equal(body.result, true);
  const data = body.data as Record<string, unknown>;
  const classification = data.classification as Record<string, unknown>;
  assert.equal(classification.die, 4);
  assert.equal(classification.ce, 2);
  assert.equal((data.extraInfo as Record<string, unknown>)["DRAM Type"], undefined);
  assert.equal((data.extraInfo as Record<string, unknown>)["DRAM Die Count"], undefined);
  assert.equal((data.extraInfo as Record<string, unknown>)["CS Count"], undefined);
});

test("/decodeId maps known flash id to FlashIdInfo field set", async () => {
  const { body } = await inject("/decodeId?id=2C64444BA900&lang=eng");
  assert.equal(body.result, true);
  const data = body.data as Record<string, unknown>;
  assert.deepEqual(Object.keys(data).filter((key) => !flashIdInfoKeys.has(key)), []);
  assert.equal(data.vendor, "Micron");
  assert.equal(data.rawVendor, "micron");
  assert.ok(Array.isArray(data.partNumbers));
  assert.match((data.partNumbers as string[])[0] ?? "", /^Micron /);
  assert.equal((data.url as Record<string, string>)["FlashMaster Web"], "https://fm.itxtech.org");
});

test("/searchPn returns string array with FD vendor casing", async () => {
  const { body } = await inject("/searchPn?pn=MT29F4G08ABAEA&lang=eng&limit=3");
  assert.equal(body.result, true);
  assert.ok(Array.isArray(body.data));
  assert.ok((body.data as unknown[]).every((item) => typeof item === "string"));
  assert.ok((body.data as string[]).includes("Micron MT29F4G08ABAEA"));
});

test("/searchPn applies the default hard cap and only allows lower explicit limits", async () => {
  const omitted = await inject("/searchPn?pn=M&lang=eng");
  assert.equal(omitted.body.result, true);
  assert.equal((omitted.body.data as unknown[]).length, 300);

  const overCap = await inject("/searchPn?pn=M&lang=eng&limit=10000");
  assert.equal((overCap.body.data as unknown[]).length, 300);

  const lower = await inject("/searchPn?pn=M&lang=eng&limit=7");
  assert.equal((lower.body.data as unknown[]).length, 7);
});

test("fd-server search cap can be overridden by environment", async () => {
  const part = await fetchJson("/searchPn?pn=M&lang=eng&limit=10000", {
    FD_SERVER_SEARCH_LIMIT: "3"
  });
  assert.equal((part.body.data as unknown[]).length, 3);

  const identifier = await fetchJson("/searchId?id=98&lang=eng&limit=10000", {
    FDNEXT_SEARCH_LIMIT: "4"
  });
  assert.equal(Object.keys(identifier.body.data as Record<string, unknown>).length, 4);
});

test("/searchId returns object keyed by flash id", async () => {
  const { body } = await inject("/searchId?id=2C64&lang=eng&limit=1");
  assert.equal(body.result, true);
  assert.equal(typeof body.data, "object");
  const data = body.data as Record<string, unknown>;
  const [id, item] = Object.entries(data)[0] ?? [];
  assert.ok(id);
  assert.match(id, /^[0-9A-F]+$/);
  assert.equal(typeof item, "object");
  assert.ok(Array.isArray((item as { partNumbers?: unknown }).partNumbers));
});

test("controllerGroup query parameter is ignored", async () => {
  const selected = await inject("/decodeId?id=2C64444BA900&lang=eng");
  const queried = await inject("/decodeId?id=2C64444BA900&lang=eng&controllerGroup=all");
  assert.deepEqual(
    (queried.body.data as { controllers?: unknown }).controllers,
    (selected.body.data as { controllers?: unknown }).controllers
  );
});

test("extra URLs are limited to decode outputs", async () => {
  const searchPn = await inject("/searchPn?pn=MT29F4G08ABAEA&lang=eng&limit=1");
  assert.equal(JSON.stringify(searchPn.body).includes("FlashMaster Web"), false);

  const searchId = await inject("/searchId?id=2C64&lang=eng&limit=1");
  assert.equal(JSON.stringify(searchId.body).includes("FlashMaster Web"), false);

  const summary = await inject("/summary?pn=MT29F4G08ABAEA&lang=eng");
  assert.equal(JSON.stringify(summary.body).includes("FlashMaster Web"), false);
});

test("node server reads process env by default", async () => {
  const previous = process.env.FD_SERVER_EXTRA_URLS;
  process.env.FD_SERVER_EXTRA_URLS = "{\"Env Link\":\"https://fm.itxtech.org\"}";
  let app: ReturnType<typeof createFdServer> | undefined;
  try {
    app = createFdServer({ host: "127.0.0.1", port: 0, engine: sharedEngine, warn: () => undefined });
    await app.listen();
    const address = app.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/decode?pn=MT29F4G08ABAEA&lang=eng`);
    const body = await response.json() as { data?: { url?: Record<string, string> } };
    assert.equal(body.data?.url?.["Env Link"], "https://fm.itxtech.org");
  } finally {
    if (app) {
      await closeServer(app.server);
    }
    if (previous === undefined) {
      delete process.env.FD_SERVER_EXTRA_URLS;
    } else {
      process.env.FD_SERVER_EXTRA_URLS = previous;
    }
  }
});

test("fdnext HTTP routes are not exposed", async () => {
  const { response, body } = await inject("/parts/decode?query=MT29F4G08ABAEA");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(body, { result: false, message: "Not found" });
});

test("worker handler serves the same legacy routes", async () => {
  const { response, body } = await fetchJson("/decodeId?id=2C64444BA900&lang=eng", {
    FD_SERVER_EXTRA_URLS: "{\"FlashMaster Web\":\"https://fm.itxtech.org\"}"
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(body.result, true);
  const data = body.data as Record<string, unknown>;
  assert.deepEqual(Object.keys(data).filter((key) => !flashIdInfoKeys.has(key)), []);
  assert.equal(data.vendor, "Micron");
  assert.equal((data.url as Record<string, string>)["FlashMaster Web"], "https://fm.itxtech.org");
});

test("worker handler replies to OPTIONS preflight", () => {
  const handler = createFdServerHandler({ engine: sharedEngine, warn: () => undefined });
  const response = handler.handleRequest(new Request("https://fd.example.test/decode", { method: "OPTIONS" }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
});
