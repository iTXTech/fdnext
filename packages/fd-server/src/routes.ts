import type {
  FdnextEngine,
  IdentifierSearchResult,
  PartSearchResult
} from "@itxtech/fdnext-core";
import { parseLegacyLang } from "./config";
import {
  idSummary,
  legacyInfo,
  legacySearchPart,
  partSummary,
  toLegacyFlashIdInfo,
  toLegacyFlashInfo,
  toLegacySearchIdItem
} from "./legacy-serializer";
import type { FdServerConfig, FdServerHttpResponse, LegacyLang } from "./types";

export const FD_SERVER_NAME = "fdnext-fd-server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};

function cleanPath(pathname: string): string {
  const withoutTrailing = pathname.replaceAll(/\/+$/g, "");
  return withoutTrailing || "/";
}

function hasQueryParam(url: URL, key: string): boolean {
  return url.searchParams.has(key);
}

function queryParam(url: URL, key: string): string {
  return url.searchParams.get(key) ?? "";
}

function positiveLimit(url: URL): number | undefined {
  const raw = url.searchParams.get("limit")?.trim();
  if (!raw) {
    return undefined;
  }
  const limit = Number.parseInt(raw, 10);
  return Number.isFinite(limit) && limit > 0 ? limit : undefined;
}

function requestLang(url: URL, fallback: LegacyLang): LegacyLang {
  return parseLegacyLang(url.searchParams.get("lang"), fallback);
}

export function fdServerJson(body: unknown, code = 200): FdServerHttpResponse {
  return { body, code };
}

export function handleFdServerUrl(engine: FdnextEngine, config: FdServerConfig, url: URL): FdServerHttpResponse {
  const path = cleanPath(url.pathname);
  const lang = requestLang(url, config.defaultLang);

  if (path === "/") {
    return fdServerJson({ result: true, time: Math.floor(Date.now() / 1000), server: FD_SERVER_NAME });
  }
  if (path === "/info") {
    return fdServerJson(legacyInfo(engine));
  }
  if (path === "/decode") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const result = engine.decodePart({ query: pn, lang, controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: toLegacyFlashInfo(result, pn, lang, config.extraUrls) });
  }
  if (path === "/decodeId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const result = engine.decodeIdentifier({ query: id, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: toLegacyFlashIdInfo(result, id, lang, config.extraUrls) });
  }
  if (path === "/searchPn") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const limit = positiveLimit(url);
    const result: PartSearchResult = engine.searchParts({ query: pn, lang, ...(limit ? { limit } : {}) });
    return fdServerJson({ result: true, data: result.items.map((item) => legacySearchPart(item, lang)) });
  }
  if (path === "/searchId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const limit = positiveLimit(url);
    const result: IdentifierSearchResult = engine.searchIdentifiers({ query: id, lang, idScheme: "nand.flash_id", ...(limit ? { limit } : {}) });
    const data: Record<string, ReturnType<typeof toLegacySearchIdItem>> = {};
    for (const item of result.items) {
      const identifier = item.device.identifier ?? item.label;
      const decoded = engine.decodeIdentifier({ query: identifier, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
      data[identifier] = toLegacySearchIdItem(item, decoded, lang);
    }
    return fdServerJson({ result: true, data });
  }
  if (path === "/summary") {
    if (!hasQueryParam(url, "pn")) {
      return fdServerJson({ result: false, message: "Missing part number" });
    }
    const pn = queryParam(url, "pn");
    const result = engine.decodePart({ query: pn, lang, controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: partSummary(toLegacyFlashInfo(result, pn, lang, config.extraUrls)) });
  }
  if (path === "/summaryId") {
    if (!hasQueryParam(url, "id")) {
      return fdServerJson({ result: false, message: "Missing flash id" });
    }
    const id = queryParam(url, "id");
    const result = engine.decodeIdentifier({ query: id, lang, idScheme: "nand.flash_id", controllerGroup: config.controllerGroup });
    return fdServerJson({ result: true, data: idSummary(toLegacyFlashIdInfo(result, id, lang, config.extraUrls)) });
  }

  return fdServerJson({ result: false, message: "Not found" });
}

function toFetchResponse(response: FdServerHttpResponse): Response {
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json");
  return new Response(
    response.code === 204 || response.body === undefined ? null : JSON.stringify(response.body),
    { status: response.code, headers }
  );
}

export function handleFdServerFetchRequest(engine: FdnextEngine, config: FdServerConfig, request: Request): Response {
  if (request.method === "OPTIONS") {
    return toFetchResponse(fdServerJson(undefined, 204));
  }
  if (request.method !== "GET") {
    return toFetchResponse(fdServerJson({ result: false, message: "Not found" }));
  }
  return toFetchResponse(handleFdServerUrl(engine, config, new URL(request.url)));
}
