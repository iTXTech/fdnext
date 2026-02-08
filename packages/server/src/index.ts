import { server as createHapiServer } from "@hapi/hapi";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { createEngine, type FlashDetectorEngine } from "@fdnext/core";
import { loadResourcesFromDir } from "@fdnext/core/node";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "@fdnext/dsl";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  resourceDir: string;
  serverName?: string;
}

function parsePort(value: number | undefined): number {
  if (value == null) {
    return 8080;
  }
  if (Number.isInteger(value) && value > 0 && value <= 65535) {
    return value;
  }
  throw new Error(`Invalid port: ${value}`);
}

function parseLimit(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function hasHeaderMethod(value: unknown): value is { header: (name: string, value: string) => unknown } {
  return !!value && typeof value === "object" && "header" in value && typeof value.header === "function";
}

function toRequestMeta(
  request: Request,
  extra: Partial<{
    serverName: string;
    lang: string | null;
    pn: string | null;
    id: string | null;
    limit: number;
  }> = {}
) {
  const ua = request.headers["user-agent"];
  const userAgent = Array.isArray(ua) ? ua.join("; ") : typeof ua === "string" ? ua : "";
  return {
    query: request.url.search ?? "",
    remote: request.info.remoteAddress ?? "",
    userAgent,
    ...extra
  };
}

function replyJson(h: ResponseToolkit, payload: Record<string, unknown>) {
  return h.response(payload).code(200);
}

export function createHttpServer(options: HttpServerOptions) {
  const resources = loadResourcesFromDir(options.resourceDir);
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const engine = createEngine({
    resources,
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });
  const serverName = options.serverName ?? "FDWebServer-TS";

  const server = createHapiServer({
    host,
    port,
    routes: {
      cors: {
        origin: ["*"],
        additionalHeaders: ["*"]
      }
    }
  });

  server.ext("onPreResponse", (request, h) => {
    const response = request.response;
    if (hasHeaderMethod(response)) {
      response.header("X-Powered-By", "fdnext/1.0.0");
    }
    return h.continue;
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => replyJson(h, engine.dispatch("index", toRequestMeta(request, { serverName })))
  });

  server.route({
    method: "GET",
    path: "/info",
    handler: (request, h) => replyJson(h, engine.dispatch("info", toRequestMeta(request)))
  });

  server.route({
    method: "GET",
    path: "/decode",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      return replyJson(h, engine.dispatch("decode", toRequestMeta(request, { lang, pn })));
    }
  });

  server.route({
    method: "GET",
    path: "/decodeId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      return replyJson(h, engine.dispatch("decodeId", toRequestMeta(request, { lang, id })));
    }
  });

  server.route({
    method: "GET",
    path: "/searchPn",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      const limitStr = typeof request.query.limit === "string" ? request.query.limit : null;
      return replyJson(h, engine.dispatch("searchPn", toRequestMeta(request, { lang, pn, limit: parseLimit(limitStr) })));
    }
  });

  server.route({
    method: "GET",
    path: "/searchId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      const limitStr = typeof request.query.limit === "string" ? request.query.limit : null;
      return replyJson(h, engine.dispatch("searchId", toRequestMeta(request, { lang, id, limit: parseLimit(limitStr) })));
    }
  });

  server.route({
    method: "GET",
    path: "/summary",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const pn = typeof request.query.pn === "string" ? request.query.pn : null;
      return replyJson(h, engine.dispatch("summary", toRequestMeta(request, { lang, pn })));
    }
  });

  server.route({
    method: "GET",
    path: "/summaryId",
    handler: (request, h) => {
      const lang = typeof request.query.lang === "string" ? request.query.lang : null;
      const id = typeof request.query.id === "string" ? request.query.id : null;
      return replyJson(h, engine.dispatch("summaryId", toRequestMeta(request, { lang, id })));
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
    listen: async () => {
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
