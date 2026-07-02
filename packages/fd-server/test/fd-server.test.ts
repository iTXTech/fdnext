import assert from "node:assert/strict";
import test from "node:test";
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

async function inject(path: string) {
  const app = createFdServer({
    extraUrls: {
      "FlashMaster Web": "https://fm.itxtech.org"
    },
    warn: () => undefined
  });
  const response = await app.server.inject({ method: "GET", url: path });
  return {
    response,
    body: JSON.parse(response.payload) as Record<string, unknown>
  };
}

async function fetchJson(path: string, env: Record<string, string | undefined> = {}) {
  const handler = createFdServerHandler({
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
  assert.equal(body.result, true);
  assert.equal(body.server, FD_SERVER_NAME);
  assert.equal(typeof body.time, "number");
});

test("/info returns FlashDetector-shaped metadata", async () => {
  const { body } = await inject("/info");
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
  try {
    const app = createFdServer({ warn: () => undefined });
    const response = await app.server.inject({ method: "GET", url: "/decode?pn=MT29F4G08ABAEA&lang=eng" });
    const body = JSON.parse(response.payload) as { data?: { url?: Record<string, string> } };
    assert.equal(body.data?.url?.["Env Link"], "https://fm.itxtech.org");
  } finally {
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
  const handler = createFdServerHandler({ warn: () => undefined });
  const response = handler.handleRequest(new Request("https://fd.example.test/decode", { method: "OPTIONS" }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
});
