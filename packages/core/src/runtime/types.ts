import type {
  CapabilitiesInput,
  DecodeIdentifierInput,
  DecodePartInput,
  DeviceIdentity,
  ExternalLink,
  FdnextCapabilities,
  FdnextFieldValueData,
  FdnextOperation,
  FdnextResult,
  SearchIdentifiersInput,
  SearchPartsInput,
  SearchResultItem
} from "../result";
import type { EngineOptions, FdnextEngine } from "../types";

export type FdnextRuntimeOperation = FdnextOperation | "capabilities" | "index";
export type FdnextCorsOrigins = "*" | string[];
export type FdnextOperationInput = DecodePartInput | SearchPartsInput | DecodeIdentifierInput | SearchIdentifiersInput;

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
  productType?: DeviceIdentity["productType"];
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
  /** Default and hard maximum for HTTP search responses. Core SDK calls are not capped. */
  searchLimit?: number;
}

export interface FdnextRuntime {
  engine: FdnextEngine;
  dispatch(request: FdnextDispatchRequest): Promise<FdnextDispatchResponse>;
  handleHttp(request: FdnextHttpRequest): Promise<FdnextDispatchResponse>;
  fetch(request: Request, meta?: Omit<FdnextRuntimeMeta, "requestUrl" | "userAgent"> & { cors?: FdnextCorsOptions }): Promise<Response>;
}
