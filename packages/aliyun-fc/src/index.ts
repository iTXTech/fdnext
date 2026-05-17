import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  createFdnextCorsOptionsFromEnv,
  createRuntime,
  type FdnextCorsOptions,
  type FdnextRuntime,
  type FdnextRuntimeOptions
} from "@itxtech/fdnext-core";

export interface AliyunFcHandlerOptions {
  runtime?: FdnextRuntime;
  runtimeOptions?: FdnextRuntimeOptions;
  cors?: FdnextCorsOptions;
}

export interface AliyunFcStartOptions extends AliyunFcHandlerOptions {
  host?: string;
  port?: number;
}

function nodeRequestUrl(request: IncomingMessage): string {
  const rawUrl = request.url ?? "/";
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  const host = request.headers.host ?? "fdnext.local";
  return `http://${host}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
}

function writeJsonResponse(response: ServerResponse, status: number, headers: Record<string, string>, body: unknown): void {
  response.statusCode = status;
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  if (body === null) {
    response.end();
    return;
  }
  response.end(JSON.stringify(body));
}

export function createAliyunFcHandler(options: AliyunFcHandlerOptions = {}) {
  const cors = options.cors ?? createFdnextCorsOptionsFromEnv(process.env);
  const runtime = options.runtime ?? createRuntime({ ...options.runtimeOptions, ...(cors ? { cors } : {}) });
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    try {
      const result = await runtime.handleHttp({
        method: request.method ?? "GET",
        url: nodeRequestUrl(request),
        headers: request.headers,
        remote: request.socket.remoteAddress,
        adapter: "aliyun-fc",
        cors
      });
      if ((request.method ?? "GET").toUpperCase() === "HEAD") {
        response.statusCode = result.status;
        for (const [name, value] of Object.entries(result.headers)) {
          response.setHeader(name, value);
        }
        response.end();
        return;
      }
      writeJsonResponse(response, result.status, result.headers, result.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeJsonResponse(response, 500, { "content-type": "application/json; charset=utf-8" }, { status: "error", message });
    }
  };
}

export function startAliyunFc(options: AliyunFcStartOptions = {}): Server {
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const port = options.port ?? Number.parseInt(process.env.FC_SERVER_PORT ?? process.env.PORT ?? "9000", 10);
  const server = createServer(createAliyunFcHandler(options));
  server.listen(port, host);
  return server;
}
