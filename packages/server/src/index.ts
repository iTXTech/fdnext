import { server as createHapiServer } from "@hapi/hapi";
import type { ResponseToolkit } from "@hapi/hapi";
import { createEngine, type FlashDetectorEngine } from "@fdnext/core";
import { loadResourcesFromDir } from "@fdnext/core/node";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "@fdnext/dsl";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  resourceDir: string;
  serverName?: string;
}

function parseLimit(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function replyJson(h: ResponseToolkit, payload: any) {
  return h.response(payload).code(200);
}

export function createHttpServer(options: HttpServerOptions) {
  const resources = loadResourcesFromDir(options.resourceDir);
  const engine = createEngine({
    resources,
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });
  const serverName = options.serverName ?? "FDWebServer-TS";

  const server = createHapiServer({
    host: options.host ?? "0.0.0.0",
    port: options.port ?? 8080,
    routes: {
      cors: {
        origin: ["*"],
        additionalHeaders: ["*"]
      }
    }
  });

  server.ext("onPreResponse", (request, h) => {
    const response = request.response;
    if ("header" in response) {
      response.header("X-Powered-By", "fdnext/1.0.0");
    }
    return h.continue;
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (_request, h) =>
      replyJson(h, { result: true, time: Math.floor(Date.now() / 1000), server: serverName })
  });

  server.route({
    method: "GET",
    path: "/info",
    handler: (_request, h) =>
      replyJson(h, { result: true, ver: engine.getVersion(), info: engine.getInfo() })
  });

  server.route({
    method: "GET",
    path: "/decode",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      return replyJson(
        h,
        pn ? { result: true, data: engine.detect(pn, { lang, combineFdb: true }) } : { result: false, message: "Missing part number" }
      );
    }
  });

  server.route({
    method: "GET",
    path: "/decodeId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      return replyJson(
        h,
        id ? { result: true, data: engine.decodeFlashId(id, { lang, combineFdb: true }) } : { result: false, message: "Missing Flash Id" }
      );
    }
  });

  server.route({
    method: "GET",
    path: "/searchPn",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      const limitStr = typeof request.query.limit === "string" ? request.query.limit : null;
      return replyJson(
        h,
        pn
          ? {
              result: true,
              data: engine.searchPartNumber(pn, { lang, limit: parseLimit(limitStr), partialMatch: true })
            }
          : { result: false, message: "Missing part number" }
      );
    }
  });

  server.route({
    method: "GET",
    path: "/searchId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      const limitStr = typeof request.query.limit === "string" ? request.query.limit : null;
      return replyJson(
        h,
        id
          ? {
              result: true,
              data: engine.searchFlashId(id, { lang, limit: parseLimit(limitStr), partialMatch: true })
            }
          : { result: false, message: "Missing Flash Id" }
      );
    }
  });

  server.route({
    method: "GET",
    path: "/summary",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      return replyJson(
        h,
        pn ? { result: true, data: engine.getSummary(pn, lang) } : { result: false, message: "Missing part number" }
      );
    }
  });

  server.route({
    method: "GET",
    path: "/summaryId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      return replyJson(
        h,
        id ? { result: true, data: engine.getIdSummary(id, lang) } : { result: false, message: "Missing flash Id" }
      );
    }
  });

  server.route({
    method: "*",
    path: "/{p*}",
    handler: (_request, h) => replyJson(h, { result: false, message: "Not found" })
  });

  return {
    engine,
    server,
    listen: async (port = options.port ?? 8080, host = options.host ?? "0.0.0.0") => {
      (server.settings as any).port = port;
      (server.settings as any).host = host;
      await server.start();
    }
  };
}

export function createDefaultEngine(resourceDir: string): FlashDetectorEngine {
  return createEngine({
    resources: loadResourcesFromDir(resourceDir),
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });
}
