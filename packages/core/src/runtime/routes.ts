import type {
  CapabilitiesInput,
  ControllerGroupSelection,
  DecodeIdentifierInput,
  DecodePartInput,
  SearchIdentifiersInput,
  SearchPartsInput
} from "../result";
import type { FdnextDispatchRequest } from "./types";

export function parseUrl(url: string): URL {
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

export function resolveHttpRoute(method: string, url: URL): FdnextDispatchRequest | null | undefined {
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
