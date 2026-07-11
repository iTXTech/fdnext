import type { ControllerGroupSelection, FdnextEngine } from "@itxtech/fdnext-core";
import type { FdnextCorsOptions } from "@itxtech/fdnext-core/runtime";

export type LegacyLang = "chs" | "eng";
export type LegacyUnknown = string;
export type LegacyScalar = string | number | boolean | null | LegacyScalar[] | Record<string, unknown>;

export interface LegacyFlashInfo {
  partNumber: string;
  vendor: string;
  type: string;
  density: string;
  deviceWidth: string;
  processNode: string;
  cellLevel: string;
  classification: {
    ce: LegacyScalar;
    ch: LegacyScalar;
    rb: LegacyScalar;
    die: LegacyScalar;
  };
  voltage: string;
  generation: string;
  interface: LegacyScalar;
  package: string;
  extraInfo: Record<string, LegacyScalar>;
  flashId: string[];
  controller: string[];
  remark: string;
  url: Record<string, string>;
  urls: unknown[];
  rawDensity?: number;
  rawVendor: string;
}

export interface LegacyFlashIdInfo {
  id: string;
  vendor: string;
  density: LegacyScalar;
  die: LegacyScalar;
  plane: LegacyScalar;
  pageSize: LegacyScalar;
  blockSize: LegacyScalar;
  processNode: string;
  cellLevel: LegacyScalar;
  voltage: string;
  ext: Record<string, LegacyScalar>;
  controllers: string[];
  partNumbers: string[];
  url: Record<string, string>;
  urls: unknown[];
  rawVendor: string;
}

export type FdServerEnv = Record<string, string | undefined>;

export interface FdServerHandlerOptions {
  engine?: FdnextEngine;
  env?: FdServerEnv;
  cors?: FdnextCorsOptions;
  defaultLang?: string | null;
  controllerGroup?: string | ControllerGroupSelection | null;
  searchLimit?: number;
  extraUrls?: Record<string, string>;
  warn?: (message: string) => void;
}

export interface FdServerConfig {
  cors?: FdnextCorsOptions;
  defaultLang: LegacyLang;
  controllerGroup: ControllerGroupSelection;
  searchLimit: number;
  extraUrls: Record<string, string>;
}

export interface FdServerHandler {
  engine: FdnextEngine;
  config: FdServerConfig;
  handleUrl: (url: URL) => FdServerHttpResponse;
  handleRequest: (request: Request) => Response;
}

export interface FdServerHttpResponse {
  body: unknown;
  code: number;
}
