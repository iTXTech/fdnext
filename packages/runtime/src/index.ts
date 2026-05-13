import {
  createEngine,
  FDNEXT_VERSION,
  fdnextExternalLinkCategories,
  fdnextFieldRegistry,
  type CapabilitiesInput,
  type DecodeIdentifierInput,
  type DecodePartInput,
  type ControllerGroupSelection,
  type DeviceIdentity,
  type EngineOptions,
  type ExternalLink,
  type FdnextCapabilities,
  type FdnextEngine,
  type FdnextFieldValueData,
  type FdnextOperation,
  type FdnextResult,
  type FieldValue,
  type IdentifierSearchResult,
  type PartSearchResult,
  type SearchIdentifiersInput,
  type SearchPartsInput,
  type SearchResultItem
} from "@itxtech/fdnext-core";
import {
  compileDecodePack,
  defaultDecodePack
} from "@itxtech/fdnext-decodepack";
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";

const externalLinkCategories = new Set<string>(fdnextExternalLinkCategories);
export const FDNEXT_CORS_ORIGINS_ENV = "FDNEXT_CORS_ORIGINS";
const corsAllowMethods = "GET, HEAD, OPTIONS";
const corsDefaultAllowHeaders = "content-type";

export type FdnextRuntimeOperation = FdnextOperation | "capabilities" | "index";
export type FdnextCorsOrigins = "*" | string[];
type FdnextOperationInput = DecodePartInput | SearchPartsInput | DecodeIdentifierInput | SearchIdentifiersInput;

export interface FdnextCorsOptions {
  origins: FdnextCorsOrigins;
}

export interface FdnextRuntimeMeta {
  remote?: string;
  userAgent?: string;
  requestUrl?: string;
  adapter?: string;
  serverName?: string;
}

export interface FdnextDispatchRequest {
  operation: FdnextRuntimeOperation;
  input?: CapabilitiesInput | FdnextOperationInput;
  meta?: FdnextRuntimeMeta;
}

export interface FdnextDispatchResponse {
  status: number;
  headers: Record<string, string>;
  body: FdnextResult | FdnextCapabilities | Record<string, unknown> | null;
}

export interface FdnextHttpRequest {
  method: string;
  url: string;
  headers?: Headers | Record<string, string | string[] | undefined>;
  remote?: string;
  adapter?: string;
  cors?: FdnextCorsOptions;
}

export interface ExternalLinkFacts {
  partNumber?: string;
  identifier?: string;
  vendor?: string;
  chipKind?: string;
  productType?: string;
  controllers: string[];
  fields: Record<string, FdnextFieldValueData>;
}

export interface ExternalLinkContext {
  operation: FdnextOperation;
  input?: FdnextOperationInput;
  result: FdnextResult;
  item?: SearchResultItem;
  facts: ExternalLinkFacts;
  meta: FdnextRuntimeMeta;
}

export interface ExternalLinkProvider {
  id: string;
  resolveLinks(context: ExternalLinkContext): ExternalLink[] | Promise<ExternalLink[]>;
}

export interface FdnextRuntimeOptions extends EngineOptions {
  engine?: FdnextEngine;
  externalLinkProviders?: ExternalLinkProvider[];
  serverName?: string;
  responseHeaders?: Record<string, string>;
  cors?: FdnextCorsOptions;
}

export interface FdnextRuntime {
  engine: FdnextEngine;
  dispatch(request: FdnextDispatchRequest): Promise<FdnextDispatchResponse>;
  handleHttp(request: FdnextHttpRequest): Promise<FdnextDispatchResponse>;
  fetch(request: Request, meta?: Omit<FdnextRuntimeMeta, "requestUrl" | "userAgent"> & { cors?: FdnextCorsOptions }): Promise<Response>;
}

function createDefaultEngine(options: FdnextRuntimeOptions): FdnextEngine {
  const compiledPack = compileDecodePack(defaultDecodePack);
  return createEngine({
    resources: options.resources ?? embeddedResourceBundle,
    fallbackLang: options.fallbackLang,
    decoders: options.decoders ?? compiledPack.partDecoders,
    identifierDecoders: options.identifierDecoders ?? compiledPack.identifierDecoders,
    processors: options.processors
  });
}

function baseHeaders(extra: Record<string, string> | undefined): Record<string, string> {
  return {
    "content-type": "application/json; charset=utf-8",
    "x-powered-by": `fdnext/${FDNEXT_VERSION}`,
    ...(extra ?? {})
  };
}

function resultHttpStatus(result: FdnextResult): number {
  if (result.status === "unsupported" || result.status === "invalid_input") {
    return 400;
  }
  return 200;
}

function getHeader(headers: FdnextHttpRequest["headers"], name: string): string | undefined {
  if (!headers) {
    return undefined;
  }
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lowerName) {
      continue;
    }
    if (Array.isArray(value)) {
      return value.join("; ");
    }
    return value;
  }
  return undefined;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function splitCorsOrigins(value: string): string[] {
  return value
    .split(/[,\s;]+/g)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeCorsOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === "*") {
    return "*";
  }
  if (trimmed === "null") {
    return "null";
  }
  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
}

export function parseFdnextCorsOrigins(value: unknown): FdnextCorsOrigins | undefined {
  const rawOrigins = Array.isArray(value)
    ? value.flatMap((entry) => (typeof entry === "string" ? splitCorsOrigins(entry) : []))
    : typeof value === "string"
      ? splitCorsOrigins(value)
      : [];
  const origins = uniqueStrings(rawOrigins.map((origin) => normalizeCorsOrigin(origin)).filter((origin): origin is string => !!origin));
  if (origins.includes("*")) {
    return "*";
  }
  return origins.length > 0 ? origins : undefined;
}

export function createFdnextCorsOptionsFromEnv(env: Record<string, unknown> | undefined): FdnextCorsOptions | undefined {
  const origins = parseFdnextCorsOrigins(env?.[FDNEXT_CORS_ORIGINS_ENV]);
  return origins ? { origins } : undefined;
}

function parseUrl(url: string): URL {
  return new URL(url, "http://fdnext.local");
}

function cleanPath(pathname: string): string {
  const withoutTrailing = pathname.replaceAll(/\/+$/g, "");
  return withoutTrailing || "/";
}

function stringParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value && value.trim() ? value.trim() : undefined;
}

function queryParam(params: URLSearchParams, ...keys: string[]): string {
  for (const key of keys) {
    const value = stringParam(params, key);
    if (value) {
      return value;
    }
  }
  return "";
}

function limitParam(params: URLSearchParams): number | undefined {
  const raw = stringParam(params, "limit");
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function controllerGroupParam(params: URLSearchParams): ControllerGroupSelection | undefined {
  const values = params
    .getAll("controllerGroup")
    .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
  if (values.length === 0) {
    return undefined;
  }
  if (values.includes("all")) {
    return "all";
  }
  return values.length === 1 ? values[0] as ControllerGroupSelection : values as ControllerGroupSelection;
}

function booleanParam(params: URLSearchParams, key: string): boolean | undefined {
  const value = stringParam(params, key)?.toLowerCase();
  if (!value) {
    return undefined;
  }
  if (["1", "true", "yes"].includes(value)) {
    return true;
  }
  if (["0", "false", "no"].includes(value)) {
    return false;
  }
  return undefined;
}

function constraintsParam(params: URLSearchParams): Record<string, unknown> | undefined {
  const constraints: Record<string, unknown> = {};
  for (const key of ["vendor", "chipKind", "productType"] as const) {
    const value = stringParam(params, key);
    if (value) {
      constraints[key] = value;
    }
  }
  const strict = booleanParam(params, "strict");
  if (strict !== undefined) {
    constraints.strict = strict;
  }
  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

function partInput(params: URLSearchParams, ...queryKeys: string[]): DecodePartInput {
  const controllerGroup = controllerGroupParam(params);
  return {
    query: queryParam(params, ...queryKeys),
    lang: stringParam(params, "lang") ?? null,
    ...(controllerGroup ? { controllerGroup } : {}),
    constraints: constraintsParam(params) as DecodePartInput["constraints"] | undefined
  };
}

function partSearchInput(params: URLSearchParams, ...queryKeys: string[]): SearchPartsInput {
  const limit = limitParam(params);
  return {
    ...partInput(params, ...queryKeys),
    ...(limit ? { limit } : {})
  };
}

function identifierInput(params: URLSearchParams, ...queryKeys: string[]): DecodeIdentifierInput {
  const idScheme = stringParam(params, "idScheme") as DecodeIdentifierInput["idScheme"] | undefined;
  const controllerGroup = controllerGroupParam(params);
  return {
    query: queryParam(params, ...queryKeys),
    lang: stringParam(params, "lang") ?? null,
    ...(controllerGroup ? { controllerGroup } : {}),
    ...(idScheme ? { idScheme } : {})
  };
}

function identifierSearchInput(params: URLSearchParams, ...queryKeys: string[]): SearchIdentifiersInput {
  const limit = limitParam(params);
  return {
    ...identifierInput(params, ...queryKeys),
    ...(limit ? { limit } : {})
  };
}

function capabilitiesInput(params: URLSearchParams): CapabilitiesInput {
  return {
    lang: stringParam(params, "lang") ?? null
  };
}

function resolveHttpRoute(method: string, url: URL): FdnextDispatchRequest | null | undefined {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod !== "GET" && normalizedMethod !== "HEAD") {
    return null;
  }

  const path = cleanPath(url.pathname);
  const params = url.searchParams;
  if (path === "/") return { operation: "index" };
  if (path === "/capabilities") return { operation: "capabilities", input: capabilitiesInput(params) };
  if (path === "/parts/decode") {
    return { operation: "part.decode", input: partInput(params, "query") };
  }
  if (path === "/parts/search") {
    return { operation: "part.search", input: partSearchInput(params, "query") };
  }
  if (path === "/identifiers/decode") {
    return { operation: "identifier.decode", input: identifierInput(params, "query") };
  }
  if (path === "/identifiers/search") {
    return { operation: "identifier.search", input: identifierSearchInput(params, "query") };
  }
  return undefined;
}

function isSearchResult(result: FdnextResult): result is PartSearchResult | IdentifierSearchResult {
  return result.operation === "part.search" || result.operation === "identifier.search";
}

function collectFieldFacts(fields: FieldValue[] | undefined, facts: ExternalLinkFacts): void {
  for (const field of fields ?? []) {
    facts.fields[field.key] = field.value;
    if (field.key === "controller") {
      const values = Array.isArray(field.value) ? field.value : [field.value];
      for (const value of values) {
        if (typeof value === "string" && value) {
          facts.controllers.push(value);
        }
      }
    }
  }
}

function factsFromDevice(device: DeviceIdentity | undefined): ExternalLinkFacts {
  return {
    partNumber: device?.partNumber,
    identifier: device?.identifier,
    vendor: device?.vendor.id,
    chipKind: device?.chipKind,
    productType: device?.productType,
    controllers: [],
    fields: {}
  };
}

function factsFromResult(result: FdnextResult, item?: SearchResultItem): ExternalLinkFacts {
  const facts = factsFromDevice(item?.device ?? ("device" in result ? result.device : undefined));
  if (item) {
    collectFieldFacts(item.fields, facts);
    for (const relation of item.relations ?? []) {
      collectFieldFacts(relation.fields, facts);
    }
  } else if ("blocks" in result) {
    for (const block of result.blocks) {
      collectFieldFacts(block.fields, facts);
    }
    for (const relation of result.relations) {
      collectFieldFacts(relation.fields, facts);
    }
  } else {
    for (const relation of result.relations ?? []) {
      collectFieldFacts(relation.fields, facts);
    }
  }
  facts.controllers = [...new Set(facts.controllers)];
  return facts;
}

function isAllowedExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeLinks(links: ExternalLink[]): ExternalLink[] {
  const unique = new Map<string, ExternalLink>();
  for (const link of links) {
    if (!link.id || !link.label || !link.url || !isAllowedExternalUrl(link.url)) {
      continue;
    }
    const clean: ExternalLink = {
      id: link.id,
      label: link.label,
      url: link.url,
      ...(link.category && externalLinkCategories.has(link.category) ? { category: link.category } : {}),
      ...(link.image ? { image: link.image } : {}),
      ...(link.hint ? { hint: link.hint } : {}),
      ...(link.fieldKey && Object.hasOwn(fdnextFieldRegistry, link.fieldKey) ? { fieldKey: link.fieldKey } : {}),
      ...(typeof link.priority === "number" && Number.isFinite(link.priority) ? { priority: link.priority } : {})
    };
    unique.set(`${clean.id}\n${clean.url}`, clean);
  }
  return [...unique.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
}

function appendVary(headers: Record<string, string>, value: string): Record<string, string> {
  const current = headers.vary;
  if (!current) {
    return { ...headers, vary: value };
  }
  const entries = current.split(",").map((entry) => entry.trim().toLowerCase());
  return entries.includes(value.toLowerCase()) ? headers : { ...headers, vary: `${current}, ${value}` };
}

function corsAllowOrigin(cors: FdnextCorsOptions, headers: FdnextHttpRequest["headers"]): string | null {
  if (cors.origins === "*") {
    return "*";
  }
  const origin = getHeader(headers, "origin");
  if (!origin) {
    return null;
  }
  const normalized = normalizeCorsOrigin(origin);
  return normalized && cors.origins.includes(normalized) ? normalized : null;
}

function applyCorsHeaders(
  base: Record<string, string>,
  requestHeaders: FdnextHttpRequest["headers"],
  cors: FdnextCorsOptions | undefined,
  preflight: boolean
): Record<string, string> {
  if (!cors) {
    return base;
  }
  const allowOrigin = corsAllowOrigin(cors, requestHeaders);
  let headers = cors.origins === "*" ? base : appendVary(base, "Origin");
  if (!allowOrigin) {
    return headers;
  }
  headers = {
    ...headers,
    "access-control-allow-origin": allowOrigin
  };
  if (!preflight) {
    return headers;
  }
  return {
    ...headers,
    "access-control-allow-methods": corsAllowMethods,
    "access-control-allow-headers": getHeader(requestHeaders, "access-control-request-headers") ?? corsDefaultAllowHeaders,
    "access-control-max-age": "86400"
  };
}

async function collectLinks(
  providers: ExternalLinkProvider[],
  context: ExternalLinkContext
): Promise<ExternalLink[]> {
  const links: ExternalLink[] = [];
  for (const provider of providers) {
    links.push(...(await provider.resolveLinks(context)));
  }
  return sanitizeLinks(links);
}

async function attachExternalLinks(
  providers: ExternalLinkProvider[],
  result: FdnextResult,
  input: FdnextOperationInput | undefined,
  meta: FdnextRuntimeMeta
): Promise<FdnextResult> {
  if (providers.length === 0) {
    return result;
  }

  const topLevelLinks = await collectLinks(providers, {
    operation: result.operation,
    input,
    result,
    facts: factsFromResult(result),
    meta
  });

  if (!isSearchResult(result)) {
    return topLevelLinks.length > 0 ? { ...result, links: topLevelLinks } : result;
  }

  let changed = topLevelLinks.length > 0;
  const items = await Promise.all(
    result.items.map(async (item) => {
      const links = await collectLinks(providers, {
        operation: result.operation,
        input,
        result,
        item,
        facts: factsFromResult(result, item),
        meta
      });
      if (links.length === 0) {
        return item;
      }
      changed = true;
      return { ...item, links };
    })
  );

  return changed ? { ...result, ...(topLevelLinks.length > 0 ? { links: topLevelLinks } : {}), items } : result;
}

export function createFdnextRuntime(options: FdnextRuntimeOptions = {}): FdnextRuntime {
  const engine = options.engine ?? createDefaultEngine(options);
  const externalLinkProviders = [...(options.externalLinkProviders ?? [])];
  const headers = baseHeaders(options.responseHeaders);
  const runtimeCors = options.cors;
  const serverName = options.serverName ?? "fdnext-server";

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
    const route = resolveHttpRoute(request.method, url);
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
