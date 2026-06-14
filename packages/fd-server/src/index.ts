import { server as createHapiServer } from "@hapi/hapi";
import type { Request as HapiRequest, ResponseToolkit, Server } from "@hapi/hapi";
import type { FdnextEngine } from "@itxtech/fdnext-core";
import {
  createFdServerHandler,
  FD_SERVER_NAME,
  type FdServerHandlerOptions,
  type FdServerHttpResponse
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
  if (Number.isInteger(value) && value > 0 && value <= 65535) {
    return value;
  }
  throw new Error(`Invalid port: ${value}`);
}

function json(h: ResponseToolkit, response: FdServerHttpResponse) {
  return h.response(response.body as Parameters<ResponseToolkit["response"]>[0]).code(response.code)
    .type("application/json")
    .header("Access-Control-Allow-Origin", "*")
    .header("Access-Control-Allow-Headers", "*");
}

export function createFdServer(options: FdServerOptions = {}): FdServerApp {
  const host = options.host ?? "0.0.0.0";
  const port = parsePort(options.port);
  const handler = createFdServerHandler({ env: process.env, ...options });
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

  server.route({
    method: "OPTIONS",
    path: "/{p*}",
    handler: (_request: HapiRequest, h: ResponseToolkit) => json(h, { body: undefined, code: 204 })
  });

  server.route({
    method: "GET",
    path: "/{p*}",
    handler: (request: HapiRequest, h: ResponseToolkit) => json(h, handler.handleUrl(request.url))
  });

  return {
    engine: handler.engine,
    server,
    listen: async () => {
      await server.start();
    }
  };
}
