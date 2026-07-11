import { createEngine } from "../engine";
import { FDNEXT_VERSION } from "../result";
import type {
  CapabilitiesInput,
  DecodeIdentifierInput,
  DecodePartInput,
  FdnextResult,
  SearchIdentifiersInput,
  SearchPartsInput
} from "../result";
import type { FdnextEngine } from "../types";
import { applyCorsHeaders, createFdnextCorsOptionsFromEnv, FDNEXT_CORS_ORIGINS_ENV, parseFdnextCorsOrigins } from "./cors";
import { attachExternalLinks } from "./external-links";
import { baseHeaders, getHeader, resultHttpStatus } from "./headers";
import { parseUrl, resolveHttpRoute } from "./routes";
import { parseFdnextSearchLimit } from "./search-limit";
import type {
  FdnextCorsOptions,
  FdnextDispatchRequest,
  FdnextDispatchResponse,
  FdnextHttpRequest,
  FdnextOperationInput,
  FdnextRuntime,
  FdnextRuntimeMeta,
  FdnextRuntimeOptions
} from "./types";

export { applyCorsHeaders, createFdnextCorsOptionsFromEnv, FDNEXT_CORS_ORIGINS_ENV, parseFdnextCorsOrigins };
export {
  DEFAULT_HTTP_SEARCH_LIMIT,
  FDNEXT_SEARCH_LIMIT_ENV,
  fdnextSearchLimitFromEnv,
  parseFdnextSearchLimit
} from "./search-limit";
export type {
  ExternalLinkContext,
  ExternalLinkFacts,
  ExternalLinkProvider,
  FdnextCorsOptions,
  FdnextCorsOrigins,
  FdnextDispatchRequest,
  FdnextDispatchResponse,
  FdnextHttpRequest,
  FdnextRuntime,
  FdnextRuntimeMeta,
  FdnextRuntimeOperation,
  FdnextRuntimeOptions
} from "./types";

function createDefaultEngine(options: FdnextRuntimeOptions): FdnextEngine {
  return createEngine({
    resources: options.resources,
    fallbackLang: options.fallbackLang,
    decoders: options.decoders,
    identifierDecoders: options.identifierDecoders,
    processors: options.processors
  });
}

export function createRuntime(options: FdnextRuntimeOptions = {}): FdnextRuntime {
  const engine = options.engine ?? createDefaultEngine(options);
  const externalLinkProviders = [...(options.externalLinkProviders ?? [])];
  const headers = baseHeaders(options.responseHeaders);
  const runtimeCors = options.cors;
  const serverName = options.serverName ?? "fdnext-server";
  const searchLimit = parseFdnextSearchLimit(options.searchLimit);

  const dispatch = async (request: FdnextDispatchRequest): Promise<FdnextDispatchResponse> => {
    const meta: FdnextRuntimeMeta = {
      serverName,
      ...(request.meta ?? {})
    };
    if (request.operation === "index") {
      return {
        status: 200,
        headers,
        body: { status: "ok", name: serverName, version: FDNEXT_VERSION }
      };
    }
    if (request.operation === "capabilities") {
      return {
        status: 200,
        headers,
        body: engine.getCapabilities((request.input ?? {}) as CapabilitiesInput)
      };
    }

    let result: FdnextResult;
    const operationInput = request.input as FdnextOperationInput | undefined;
    if (request.operation === "part.decode") {
      result = engine.decodePart((operationInput ?? { query: "" }) as DecodePartInput);
    } else if (request.operation === "part.search") {
      result = engine.searchParts((operationInput ?? { query: "" }) as SearchPartsInput);
    } else if (request.operation === "identifier.decode") {
      result = engine.decodeIdentifier((operationInput ?? { query: "" }) as DecodeIdentifierInput);
    } else {
      result = engine.searchIdentifiers((operationInput ?? { query: "" }) as SearchIdentifiersInput);
    }

    const body = await attachExternalLinks(externalLinkProviders, result, operationInput, meta);
    return {
      status: resultHttpStatus(body),
      headers,
      body
    };
  };

  const handleHttp = async (request: FdnextHttpRequest): Promise<FdnextDispatchResponse> => {
    const url = parseUrl(request.url);
    const cors = request.cors ?? runtimeCors;
    if (request.method.toUpperCase() === "OPTIONS" && cors) {
      return {
        status: 204,
        headers: applyCorsHeaders(headers, request.headers, cors, true),
        body: null
      };
    }
    const route = resolveHttpRoute(request.method, url, searchLimit);
    const meta: FdnextRuntimeMeta = {
      remote: request.remote,
      userAgent: getHeader(request.headers, "user-agent") ?? "",
      requestUrl: url.pathname + url.search,
      adapter: request.adapter,
      serverName
    };
    if (route === null) {
      return {
        status: 200,
        headers: applyCorsHeaders(headers, request.headers, cors, false),
        body: { status: "not_found", name: serverName }
      };
    }
    if (route === undefined) {
      return {
        status: 200,
        headers: applyCorsHeaders(headers, request.headers, cors, false),
        body: { status: "not_found", name: serverName }
      };
    }
    const response = await dispatch({
      ...route,
      meta
    });
    return {
      ...response,
      headers: applyCorsHeaders(response.headers, request.headers, cors, false)
    };
  };

  const fetch = async (
    request: Request,
    meta: Omit<FdnextRuntimeMeta, "requestUrl" | "userAgent"> & { cors?: FdnextCorsOptions } = {}
  ): Promise<Response> => {
    const response = await handleHttp({
      method: request.method,
      url: request.url,
      headers: request.headers,
      remote: meta.remote,
      adapter: meta.adapter,
      cors: meta.cors
    });
    return new Response(request.method.toUpperCase() === "HEAD" || response.body === null ? null : JSON.stringify(response.body), {
      status: response.status,
      headers: response.headers
    });
  };

  return {
    engine,
    dispatch,
    handleHttp,
    fetch
  };
}
