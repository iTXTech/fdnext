import { createServer, type Server } from "node:http";
import { createNodeHttpRequestListener } from "@itxtech/fdnext-core/node-http";
import {
  createFdnextCorsOptionsFromEnv,
  createRuntime,
  fdnextSearchLimitFromEnv,
  type FdnextCorsOptions,
  type FdnextRuntime,
  type FdnextRuntimeOptions
} from "@itxtech/fdnext-core/runtime";

export interface AliyunFcHandlerOptions {
  runtime?: FdnextRuntime;
  runtimeOptions?: FdnextRuntimeOptions;
  cors?: FdnextCorsOptions;
}

export interface AliyunFcStartOptions extends AliyunFcHandlerOptions {
  host?: string;
  port?: number;
}

export function createAliyunFcHandler(options: AliyunFcHandlerOptions = {}) {
  const cors = options.cors ?? createFdnextCorsOptionsFromEnv(process.env);
  const runtime = options.runtime ?? createRuntime({
    ...options.runtimeOptions,
    searchLimit: options.runtimeOptions?.searchLimit ?? fdnextSearchLimitFromEnv(process.env),
    ...(cors ? { cors } : {})
  });
  return createNodeHttpRequestListener(
    (request, context) => runtime.fetch(request, {
      remote: context.remote,
      adapter: "aliyun-fc",
      cors
    }),
    {
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ status: "error", message }), {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
    }
  );
}

export function startAliyunFc(options: AliyunFcStartOptions = {}): Server {
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const port = options.port ?? Number.parseInt(process.env.FC_SERVER_PORT ?? process.env.PORT ?? "9000", 10);
  const server = createServer(createAliyunFcHandler(options));
  server.listen(port, host);
  return server;
}
