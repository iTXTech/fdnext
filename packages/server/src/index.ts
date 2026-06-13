import { server as createHapiServer } from "@hapi/hapi";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { FDNEXT_VERSION, type FdnextEngine } from "@itxtech/fdnext-core";
import { createRuntime, type FdnextRuntime } from "@itxtech/fdnext-core/runtime";
import { loadRuntimeDataFile } from "./runtime-data";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  runtimeDataFile?: string;
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

async function createDefaultRuntime(runtimeDataFile?: string, serverName?: string): Promise<FdnextRuntime> {
  return createRuntime({
    ...(runtimeDataFile ? { runtimeData: loadRuntimeDataFile(runtimeDataFile) } : {}),
    serverName
  });
}

function requestUrl(request: Request): string {
  return `${request.url.pathname}${request.url.search}`;
}

function requestHeaders(request: Request): Record<string, string | string[] | undefined> {
  const headers: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key] = value;
  }
  return headers;
}

async function replyRuntimeJson(runtime: FdnextRuntime, request: Request, h: ResponseToolkit) {
  const response = await runtime.handleHttp({
    method: request.method,
    url: requestUrl(request),
    headers: requestHeaders(request),
    remote: request.info.remoteAddress,
    adapter: "hapi"
  });
  const reply = h.response(response.body === null ? undefined : response.body).code(response.status);
  for (const [name, value] of Object.entries(response.headers)) {
    reply.header(name, value);
  }
  return reply;
}

export async function createHttpServer(options: HttpServerOptions) {
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const runtime = await createDefaultRuntime(options.runtimeDataFile, options.serverName);

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
    method: "*",
    path: "/{p*}",
    handler: (request, h) => replyRuntimeJson(runtime, request, h)
  });

  return {
    engine: runtime.engine,
    runtime,
    server,
    listen: async () => {
      await server.start();
    }
  };
}

export async function createDefaultEngine(runtimeDataFile?: string): Promise<FdnextEngine> {
  return (await createDefaultRuntime(runtimeDataFile)).engine;
}
