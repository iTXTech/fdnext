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

function hapiNotFound(handler: ReturnType<typeof createFdServerHandler>, request: Request): Response {
  const headers = new Headers(handler.handleRequest(request).headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify({ statusCode: 404, error: "Not Found", message: "Not Found" }), {
    status: 404,
    headers
  });
}

function handleNodeRequest(handler: ReturnType<typeof createFdServerHandler>, request: Request): Response {
  if (request.method === "GET" || request.method === "OPTIONS") {
    return handler.handleRequest(request);
  }
  if (request.method === "HEAD") {
    return handler.handleRequest(new Request(request.url, { method: "GET", headers: request.headers }));
  }
  return hapiNotFound(handler, request);
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
