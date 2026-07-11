import type { Server } from "node:http";
import type { FdnextEngine } from "@itxtech/fdnext-core";
import { createNodeHttpServer, listenNodeHttpServer } from "@itxtech/fdnext-core/node-http";
import {
  createFdServerHandler,
  type FdServerHandlerOptions
} from "./handler";

export {
  createFdServerConfig,
  createFdServerHandler,
  FD_SERVER_NAME,
  fdServerJson,
  handleFdServerFetchRequest,
  handleFdServerUrl,
  type FdServerConfig,
  type FdServerEnv,
  type FdServerHandler,
  type FdServerHandlerOptions,
  type FdServerHttpResponse
} from "./handler";

export interface FdServerOptions extends FdServerHandlerOptions {
  host?: string;
  port?: number;
}

export interface FdServerApp {
  engine: FdnextEngine;
  server: Server;
  listen: () => Promise<void>;
}

function parsePort(value: number | undefined): number {
  if (value == null) {
    return 8080;
  }
  if (Number.isInteger(value) && value >= 0 && value <= 65535) {
    return value;
  }
  throw new Error(`Invalid port: ${value}`);
}

function hapiNotFound(request: Request): Response {
  const headers = new Headers({ "content-type": "application/json" });
  const origin = request.headers.get("origin");
  headers.set("vary", "Origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
  }
  return new Response(JSON.stringify({ statusCode: 404, error: "Not Found", message: "Not Found" }), {
    status: 404,
    headers
  });
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("vary");
  if (!current) {
    headers.set("vary", value);
    return;
  }
  const entries = current.split(",").map((entry) => entry.trim().toLowerCase());
  if (!entries.includes(value.toLowerCase())) {
    headers.set("vary", `${current}, ${value}`);
  }
}

function applyHapiCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin");
  headers.delete("access-control-allow-origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
  }
  appendVary(headers, "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function handleNodeRequest(handler: ReturnType<typeof createFdServerHandler>, request: Request): Response {
  if (request.method === "GET" || request.method === "OPTIONS") {
    return applyHapiCors(request, handler.handleRequest(request));
  }
  if (request.method === "HEAD") {
    const response = handler.handleRequest(new Request(request.url, { method: "GET", headers: request.headers }));
    return applyHapiCors(request, response);
  }
  return hapiNotFound(request);
}

export function createFdServer(options: FdServerOptions = {}): FdServerApp {
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const handler = createFdServerHandler({ env: process.env, ...options });
  const server = createNodeHttpServer((request) => handleNodeRequest(handler, request));

  return {
    engine: handler.engine,
    server,
    listen: () => listenNodeHttpServer(server, { host, port })
  };
}
