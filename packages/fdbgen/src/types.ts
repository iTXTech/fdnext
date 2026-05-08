export interface FdbInfoPayload {
  name?: string;
  website?: string;
  controllers?: string[];
}

export interface PartNumberPayload {
  id?: string[];
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
  info?: FdbInfoPayload;
  vendors?: Record<string, Record<string, PartNumberPayload>>;
  iddb?: Record<string, FlashIdPayload>;
}

export interface GenerateFdbOptions {
  inputDir: string;
  version: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  name?: string;
  website?: string;
  pretty?: boolean;
}

export interface MdbPayload {
  micron: Record<string, string>;
  spectek: Record<string, string[]>;
}

export interface MdbDramEntry {
  code: string;
  pn: string;
}

export interface MdbCrawlSectionStats {
  requests: number;
  hits: number;
  misses: number;
  skips: number;
  errors: number;
}

export interface MdbCrawlStats {
  micron: MdbCrawlSectionStats;
  spectek: MdbCrawlSectionStats;
  durationMs: number;
}

export interface CrawlMdbResult {
  data: MdbPayload;
  stats: MdbCrawlStats;
}

export interface CrawlMdbDramResult {
  data: MdbDramEntry[];
  stats: MdbCrawlSectionStats & { durationMs: number };
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
  delayMs?: number;
  micronHeaders?: string[];
  spectekHeaders?: string[];
  micronStartFrom?: Record<string, number>;
  micronMax?: number;
  spectekMax?: number;
  logger?: (message: string) => void;
}

export interface CrawlMdbDramOptions extends MdbQueryOptions {
  codesFile: string;
  file?: string;
  pretty?: boolean;
  saveEachHit?: boolean;
  delayMs?: number;
  logger?: (message: string) => void;
}
