import { createServer, type IncomingHttpHeaders, type IncomingMessage, type RequestListener, type Server, type ServerResponse } from "node:http";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);
const JSON_COMPRESSION_THRESHOLD = 1024;

export interface NodeHttpRequestContext {
  remote?: string;
}

export type NodeHttpFetchHandler = (
  request: Request,
  context: NodeHttpRequestContext
) => Response | Promise<Response>;

export interface NodeHttpAdapterOptions {
  onError?: (error: unknown) => Response | Promise<Response>;
}

export interface NodeHttpListenOptions {
  host: string;
  port: number;
}

function absoluteRequestUrl(request: IncomingMessage): string {
  const rawUrl = request.url ?? "/";
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  const host = request.headers.host ?? "fdnext.local";
  return `http://${host}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
}

function fetchHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(name, item);
      }
    } else if (value !== undefined) {
      result.set(name, value);
    }
  }
  return result;
}

function fetchRequest(request: IncomingMessage): Request {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    // fdnext routes are bodyless. Drain unsupported request bodies so keep-alive sockets remain reusable.
    request.resume();
  }
  return new Request(absoluteRequestUrl(request), {
    method,
    headers: fetchHeaders(request.headers)
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

function acceptsGzip(value: string | undefined): boolean {
  let gzipQuality: number | undefined;
  let wildcardQuality: number | undefined;
  for (const entry of value?.split(",") ?? []) {
    const [rawName, ...parameters] = entry.trim().split(";");
    const name = rawName?.trim().toLowerCase();
    if (name !== "gzip" && name !== "*") {
      continue;
    }
    const qualityParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
    const parsedQuality = qualityParameter
      ? Number.parseFloat(qualityParameter.slice(qualityParameter.indexOf("=") + 1))
      : 1;
    const quality = Number.isFinite(parsedQuality) ? Math.max(0, Math.min(1, parsedQuality)) : 0;
    if (name === "gzip") {
      gzipQuality = quality;
    } else {
      wildcardQuality = quality;
    }
  }
  return (gzipQuality ?? wildcardQuality ?? 0) > 0;
}

function normalizeJsonHeaders(headers: Headers): void {
  const contentType = headers.get("content-type")?.trim() ?? "";
  if (contentType.toLowerCase() === "application/json") {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-cache");
  }
}

function isJsonResponse(headers: Headers): boolean {
  const contentType = headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.startsWith("application/json") || /^[^;]+\+json(?:;|$)/.test(contentType);
}

async function writeFetchResponse(
  request: IncomingMessage,
  response: ServerResponse,
  fetchResponse: Response
): Promise<void> {
  const headers = new Headers(fetchResponse.headers);
  normalizeJsonHeaders(headers);
  response.statusCode = fetchResponse.status;
  if (request.method === "HEAD" || fetchResponse.body === null) {
    for (const [name, value] of headers) {
      response.setHeader(name, value);
    }
    response.end();
    return;
  }

  let body = Buffer.from(await fetchResponse.arrayBuffer());
  if (
    body.byteLength >= JSON_COMPRESSION_THRESHOLD &&
    isJsonResponse(headers) &&
    !headers.has("content-encoding") &&
    acceptsGzip(request.headers["accept-encoding"])
  ) {
    body = await gzipAsync(body);
    headers.set("content-encoding", "gzip");
    headers.delete("content-length");
    appendVary(headers, "Accept-Encoding");
  }
  for (const [name, value] of headers) {
    response.setHeader(name, value);
  }
  response.end(body);
}

function defaultErrorResponse(): Response {
  return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), {
    status: 500,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export function createNodeHttpRequestListener(
  handler: NodeHttpFetchHandler,
  options: NodeHttpAdapterOptions = {}
): RequestListener {
  return (request, response) => {
    const dispatch = async (): Promise<void> => {
      try {
        const fetchResponse = await handler(fetchRequest(request), {
          remote: request.socket.remoteAddress
        });
        await writeFetchResponse(request, response, fetchResponse);
      } catch (error) {
        const fetchResponse = options.onError
          ? await options.onError(error)
          : defaultErrorResponse();
        await writeFetchResponse(request, response, fetchResponse);
      }
    };
    void dispatch().catch((error: unknown) => {
      response.destroy(error instanceof Error ? error : undefined);
    });
  };
}

export function createNodeHttpServer(
  handler: NodeHttpFetchHandler,
  options: NodeHttpAdapterOptions = {}
): Server {
  return createServer(createNodeHttpRequestListener(handler, options));
}

export function listenNodeHttpServer(server: Server, options: NodeHttpListenOptions): Promise<void> {
  if (server.listening) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = (): void => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(options.port, options.host);
  });
}
