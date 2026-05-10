import { server as createHapiServer } from "@hapi/hapi";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { createEngine, FDNEXT_VERSION, type FdnextEngine } from "@itxtech/fdnext-core";
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";
import { compileIdentifierRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultIdentifierRules } from "@itxtech/fdnext-dsl";
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  resourceDir?: string;
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

function hasHeaderMethod(value: unknown): value is { header: (name: string, value: string) => unknown } {
  return !!value && typeof value === "object" && "header" in value && typeof value.header === "function";
}

function queryRecord(request: Request): Record<string, unknown> {
  return request.query && typeof request.query === "object" && !Array.isArray(request.query)
    ? (request.query as Record<string, unknown>)
    : {};
}

function stringParam(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first.trim() : undefined;
  }
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function limitParam(record: Record<string, unknown>): number | undefined {
  const value = record.limit;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function booleanParam(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = stringParam(record, key);
  if (value == null) {
    return undefined;
  }
  if (["1", "true", "yes"].includes(value.toLowerCase())) {
    return true;
  }
  if (["0", "false", "no"].includes(value.toLowerCase())) {
    return false;
  }
  return undefined;
}

function constraintsParam(record: Record<string, unknown>): Record<string, unknown> | undefined {
  const constraints: Record<string, unknown> = {};
  for (const key of ["vendor", "chipKind", "productType"] as const) {
    const value = stringParam(record, key);
    if (value) {
      constraints[key] = value;
    }
  }
  const strict = booleanParam(record, "strict");
  if (strict !== undefined) {
    constraints.strict = strict;
  }
  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

function replyJson(h: ResponseToolkit, payload: object) {
  return h.response(payload).code(200);
}

function createDefaultEngineFromResources(resourceDir?: string): FdnextEngine {
  return createEngine({
    resources: resourceDir ? loadResourcesFromDir(resourceDir) : embeddedResourceBundle,
    decoders: compileRulesToDecoders(defaultDslRules),
    identifierDecoders: compileIdentifierRulesToDecoders(defaultIdentifierRules)
  });
}

export function createHttpServer(options: HttpServerOptions) {
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const engine = createDefaultEngineFromResources(options.resourceDir);

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
      response.header("X-Powered-By", `fdnext/${FDNEXT_VERSION}`);
    }
    return h.continue;
  });

  server.route({
    method: "GET",
    path: "/",
    handler: (_request, h) => replyJson(h, { status: "ok", name: "fdnext-server" })
  });

  server.route({
    method: "GET",
    path: "/capabilities",
    handler: (_request, h) => replyJson(h, engine.getCapabilities())
  });

  server.route({
    method: "GET",
    path: "/parts/decode",
    handler: (request, h) => {
      const query = queryRecord(request);
      return replyJson(h, engine.decodePart({
        query: stringParam(query, "query") ?? "",
        lang: stringParam(query, "lang") ?? null,
        constraints: constraintsParam(query)
      }));
    }
  });

  server.route({
    method: "GET",
    path: "/parts/search",
    handler: (request, h) => {
      const query = queryRecord(request);
      const limit = limitParam(query);
      return replyJson(h, engine.searchParts({
        query: stringParam(query, "query") ?? "",
        lang: stringParam(query, "lang") ?? null,
        ...(limit ? { limit } : {}),
        constraints: constraintsParam(query)
      }));
    }
  });

  server.route({
    method: "GET",
    path: "/identifiers/decode",
    handler: (request, h) => {
      const query = queryRecord(request);
      const idScheme = stringParam(query, "idScheme") as "nand.flash_id" | undefined;
      return replyJson(h, engine.decodeIdentifier({
        query: stringParam(query, "query") ?? "",
        lang: stringParam(query, "lang") ?? null,
        ...(idScheme ? { idScheme } : {})
      }));
    }
  });

  server.route({
    method: "GET",
    path: "/identifiers/search",
    handler: (request, h) => {
      const query = queryRecord(request);
      const idScheme = stringParam(query, "idScheme") as "nand.flash_id" | undefined;
      const limit = limitParam(query);
      return replyJson(h, engine.searchIdentifiers({
        query: stringParam(query, "query") ?? "",
        lang: stringParam(query, "lang") ?? null,
        ...(idScheme ? { idScheme } : {}),
        ...(limit ? { limit } : {})
      }));
    }
  });

  server.route({
    method: "*",
    path: "/{p*}",
    handler: (_request, h) => replyJson(h, { schemaVersion: "fdnext.result.v1", status: "not_found", warnings: [] })
  });

  return {
    engine,
    server,
    listen: async () => {
      await server.start();
    }
  };
}

export function createDefaultEngine(resourceDir: string): FdnextEngine {
  return createDefaultEngineFromResources(resourceDir);
}
