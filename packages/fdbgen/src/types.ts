export const FDNEXT_FDB_EXTRA_SCHEMA_VERSION = "fdnext.fdb.extra.v1" as const;
export const FDNEXT_FDB_SCHEMA_VERSION = "fdnext.fdb.v1" as const;

export type FdbExtraSchemaVersion = typeof FDNEXT_FDB_EXTRA_SCHEMA_VERSION;
export type FdbSchemaVersion = typeof FDNEXT_FDB_SCHEMA_VERSION;

export interface FdbInfoPayload {
  name?: string;
  website?: string;
  controllers?: string[];
}

export interface PartNumberPayload {
  id?: string[];
  fid?: string[];
  f?: string[];
  a?: string[];
  l?: string;
  c?: string;
  t?: string[];
  m?: string;
  d?: number;
  e?: number;
  r?: number;
  n?: number;
}

export interface FlashIdPayload {
  s?: number;
  p?: number;
  b?: number;
  t?: string[];
  n?: string[];
}

export interface ExtraPayload {
  schemaVersion?: FdbExtraSchemaVersion;
  priority?: number;
  info?: FdbInfoPayload;
  controllerBlacklist?: string[];
  vendors?: Record<string, Record<string, PartNumberPayload>>;
  iddb?: Record<string, FlashIdPayload>;
}

export interface GenerateFdbOptions {
  inputDir: string;
  version: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  extraFiles?: string[];
  name?: string;
  website?: string;
  pretty?: boolean;
  controllerBlacklist?: string[];
}

export interface MdbPayload {
  micron: Record<string, string>;
  spectek: Record<string, string[]>;
}

export interface MdbCrawlSectionStats {
  requests: number;
  hits: number;
  misses: number;
  skips: number;
  errors: number;
}

export type MicronFbgaPrefixProfileKind = "letterGrid" | "numberedRange";

export interface MicronFbgaPrefixProfile {
  name: string;
  kind: MicronFbgaPrefixProfileKind;
  prefixes: string[];
  letters?: string[];
  startFrom?: Record<string, number>;
  max?: number;
}

export interface MicronFbgaCrawlPlanEntry {
  code: string;
  profile: string;
  prefix: string;
  kind: MicronFbgaPrefixProfileKind;
}

export interface MicronFbgaCrawlPlan {
  entries: MicronFbgaCrawlPlanEntry[];
  skipped: number;
}

export interface MdbCrawlStats {
  micronFbga: MdbCrawlSectionStats;
  micronFbgaProfiles: Record<string, MdbCrawlSectionStats>;
  spectek: MdbCrawlSectionStats;
  durationMs: number;
}

export interface CrawlMdbResult {
  data: MdbPayload;
  stats: MdbCrawlStats;
}

export interface MdbQueryOptions {
  userAgent?: string;
  timeoutMs?: number;
  fetchImpl?: (
    input: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }
  ) => Promise<{ ok: boolean; status: number; text(): Promise<string>; json(): Promise<unknown> }>;
}

export interface CrawlMdbOptions extends MdbQueryOptions {
  file?: string;
  pretty?: boolean;
  saveEachHit?: boolean;
  flushHits?: number;
  concurrency?: number;
  delayMs?: number;
  codesFile?: string;
  supplementalCodes?: string[];
  generatedCodes?: boolean;
  startFromCode?: string;
  micronFbgaProfiles?: MicronFbgaPrefixProfile[];
  micronLetterGridPrefixes?: string[];
  micronFbgaLetters?: string[];
  micronNumberedPrefixes?: string[];
  spectekHeaders?: string[];
  micronStartFrom?: Record<string, number>;
  micronMax?: number;
  spectekMax?: number;
  logger?: (message: string) => void;
}
