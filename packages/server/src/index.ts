import type { Server } from "node:http";
import type { FdnextEngine } from "@itxtech/fdnext-core";
import { createNodeHttpServer, listenNodeHttpServer } from "@itxtech/fdnext-core/node-http";
import {
  createFdnextCorsOptionsFromEnv,
  createRuntime,
  fdnextSearchLimitFromEnv,
  type FdnextCorsOptions,
  type FdnextRuntime
} from "@itxtech/fdnext-core/runtime";
import { loadResourcesFromDir } from "./resources";

export interface HttpServerOptions {
  host?: string;
  port?: number;
  resourceDir?: string;
  serverName?: string;
  engine?: FdnextEngine;
  runtime?: FdnextRuntime;
  env?: Record<string, unknown>;
  cors?: FdnextCorsOptions;
  searchLimit?: number;
}

export interface HttpServerApp {
  engine: FdnextEngine;
  runtime: FdnextRuntime;
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

function createDefaultRuntimeFromResources(resourceDir?: string, serverName?: string, searchLimit?: number): FdnextRuntime {
  return createRuntime({
    ...(resourceDir ? { resources: loadResourcesFromDir(resourceDir) } : {}),
    serverName,
    searchLimit
  });
}

export function createHttpServer(options: HttpServerOptions): HttpServerApp {
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const env = options.env ?? process.env;
  const cors = options.cors ?? createFdnextCorsOptionsFromEnv(env);
  const searchLimit = options.searchLimit ?? fdnextSearchLimitFromEnv(env);
  const runtime = options.runtime ?? (options.engine
    ? createRuntime({ engine: options.engine, serverName: options.serverName, searchLimit })
    : createDefaultRuntimeFromResources(options.resourceDir, options.serverName, searchLimit));

  const server = createNodeHttpServer((request, context) => runtime.fetch(request, {
    remote: context.remote,
    adapter: "node-http",
    ...(cors ? { cors } : {})
  }));

  return {
    engine: runtime.engine,
    runtime,
    server,
    listen: () => listenNodeHttpServer(server, { host, port })
  };
}

export function createDefaultEngine(resourceDir: string): FdnextEngine {
  return createDefaultRuntimeFromResources(resourceDir).engine;
}
