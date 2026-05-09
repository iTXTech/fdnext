import { server as createHapiServer } from "@hapi/hapi";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { createEngine, type FdnextEngine } from "@itxtech/fdnext-core";
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

function payloadRecord(request: Request): Record<string, unknown> {
  return request.payload && typeof request.payload === "object" && !Array.isArray(request.payload)
    ? (request.payload as Record<string, unknown>)
    : {};
}

function stringPayload(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function limitPayload(record: Record<string, unknown>): number | undefined {
  const value = record.limit;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function constraintsPayload(record: Record<string, unknown>): Record<string, unknown> | undefined {
  const value = record.constraints;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
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
      response.header("X-Powered-By", "fdnext/1.0.0");
    }
    return h.continue;
  });

  server.route({
    method: "GET",
    path: "/capabilities",
    handler: (_request, h) => replyJson(h, engine.getCapabilities())
  });

  server.route({
    method: "POST",
    path: "/parts/decode",
    handler: (request, h) => {
      const payload = payloadRecord(request);
      return replyJson(h, engine.decodePart({
        query: stringPayload(payload, "query") ?? "",
        lang: stringPayload(payload, "lang") ?? null,
        constraints: constraintsPayload(payload)
      }));
    }
  });

  server.route({
    method: "POST",
    path: "/parts/search",
    handler: (request, h) => {
      const payload = payloadRecord(request);
      return replyJson(h, engine.searchParts({
        query: stringPayload(payload, "query") ?? "",
        lang: stringPayload(payload, "lang") ?? null,
        ...(limitPayload(payload) ? { limit: limitPayload(payload) } : {}),
        constraints: constraintsPayload(payload)
      }));
    }
  });

  server.route({
    method: "POST",
    path: "/identifiers/decode",
    handler: (request, h) => {
      const payload = payloadRecord(request);
      return replyJson(h, engine.decodeIdentifier({
        query: stringPayload(payload, "query") ?? "",
        lang: stringPayload(payload, "lang") ?? null,
        ...(stringPayload(payload, "idScheme") ? { idScheme: stringPayload(payload, "idScheme") as "nand.flash_id" } : {}),
        constraints: constraintsPayload(payload)
      }));
    }
  });

  server.route({
    method: "POST",
    path: "/identifiers/search",
    handler: (request, h) => {
      const payload = payloadRecord(request);
      return replyJson(h, engine.searchIdentifiers({
        query: stringPayload(payload, "query") ?? "",
        lang: stringPayload(payload, "lang") ?? null,
        ...(stringPayload(payload, "idScheme") ? { idScheme: stringPayload(payload, "idScheme") as "nand.flash_id" } : {}),
        ...(limitPayload(payload) ? { limit: limitPayload(payload) } : {}),
        constraints: constraintsPayload(payload)
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
