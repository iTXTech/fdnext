export type Language = string;

export interface Classification {
  ce?: number | string;
  ch?: number | string;
  rb?: number | string;
  die?: number | string;
}

export interface FlashInterface {
  sync?: boolean | string;
  async?: boolean | string;
  toggle?: boolean | string;
  spi?: boolean | string;
}

export interface UrlLink {
  desc: string;
  url: string;
  img?: string;
  hint?: string;
  icon?: string;
}

export interface FlashInfo {
  partNumber: string;
  vendor: string;
  type?: string;
  density?: number | string;
  rawDensity?: number;
  deviceWidth?: number | string;
  processNode?: string;
  cellLevel?: string;
  classification?: Classification;
  voltage?: string;
  generation?: string | number;
  interface?: FlashInterface;
  package?: string;
  // PHP json_encode uses `[]` for empty arrays even when later used as a map. Keep this flexible for compat.
  extraInfo?: Record<string, unknown> | unknown[];
  flashId?: string[];
  controller?: string[];
  remark?: string;
  url?: Record<string, string> | unknown[];
  urls?: UrlLink[];
  rawVendor?: string;
  [key: string]: unknown;
}

export interface FlashIdInfo {
  id: string;
  vendor: string;
  density?: number | string;
  die?: number | string;
  plane?: number | string;
  pageSize?: number | string;
  blockSize?: number | string;
  processNode?: string;
  cellLevel?: number | string;
  voltage?: string;
  // PHP json_encode(empty associative array) yields [], not {}.
  ext?: Record<string, unknown> | unknown[];
  controllers?: string[];
  partNumbers?: string[];
  url?: Record<string, string> | unknown[];
  urls?: UrlLink[];
  rawVendor?: string;
  [key: string]: unknown;
}

export interface PartNumberRecord {
  pn: string;
  id: string[];
  l?: string;
  c?: string;
  t?: string[];
  m?: string;
  d?: number;
  e?: number;
  r?: number;
  n?: number;
}

export interface FlashIdRecord {
  id: string;
  s?: number;
  p?: number;
  b?: number;
  t?: string[];
  n?: string[];
}

export interface FdbInfo {
  name: string;
  version: string;
  website: string;
  time: string;
  controllers: string[];
}

export interface FdbDataset {
  info: FdbInfo;
  vendors: Map<string, Map<string, PartNumberRecord>>;
  flashIds: Map<string, FlashIdRecord>;
}

export interface MdbDataset {
  micron: Record<string, string>;
  spectek: Record<string, string[]>;
}

export interface KnownPartNumberEntry {
  pn: string;
  vendor: string;
}

export type ManagedNandPartNumberEntry = KnownPartNumberEntry;

export type ManagedNandPartNumberDataset = ManagedNandPartNumberEntry[];

export type KnownPartNumberDataset = KnownPartNumberEntry[];

export interface MicronDramFbgaEntry {
  code: string;
  pn: string;
}

export type MicronDramFbgaDataset = MicronDramFbgaEntry[];

export interface LangPack {
  [key: string]: string;
}

export interface LangPacks {
  [language: string]: LangPack;
}

export type ResourceJson = Record<string, unknown> | unknown[];

export interface EngineResources {
  fdbRaw: Record<string, unknown>;
  mdbRaw: Record<string, unknown>;
  langRaw: LangPacks;
  managedNandPnRaw?: ResourceJson;
  dramPnRaw?: ResourceJson;
  micronDramFbgaRaw?: ResourceJson;
}

export interface DecodeOptions {
  lang?: Language | null;
  combineFdb?: boolean;
}

export interface SearchOptions {
  lang?: Language | null;
  limit?: number;
  partialMatch?: boolean;
}

export interface PartNumberDecoder {
  id: string;
  priority?: number;
  check(partNumber: string): boolean;
  decode(partNumber: string): Partial<FlashInfo> | null;
}

export interface FlashIdDecoder {
  id: string;
  priority?: number;
  check(id: string): boolean;
  decode(id: string): Partial<FlashIdInfo> | null;
}

export type ProcessorEndpoint = "index" | "info" | "decode" | "decodeId" | "searchPn" | "searchId" | "summary" | "summaryId";

export interface ProcessorRequestContext {
  endpoint: ProcessorEndpoint;
  query: string;
  remote: string;
  userAgent: string;
  serverName?: string;
  lang?: Language | null;
  pn?: string | null;
  id?: string | null;
  limit?: number;
}

export type RequestProcessorHandler = (context: ProcessorRequestContext, payload: Record<string, unknown>) => boolean | void;

export interface ProcessorHooks {
  flashInfo?(flashInfo: FlashInfo): FlashInfo;
  flashIdInfo?(idInfo: FlashIdInfo): FlashIdInfo;
  index?: RequestProcessorHandler;
  info?: RequestProcessorHandler;
  decode?: RequestProcessorHandler;
  decodeId?: RequestProcessorHandler;
  searchPn?: RequestProcessorHandler;
  searchId?: RequestProcessorHandler;
  summary?: RequestProcessorHandler;
  summaryId?: RequestProcessorHandler;
}

export interface EngineOptions {
  resources?: Partial<EngineResources>;
  fallbackLang?: string;
  decoders?: PartNumberDecoder[];
  flashIdDecoders?: FlashIdDecoder[];
  processors?: ProcessorHooks[];
}

export interface FlashDetectorInfo {
  fdb: FdbInfo;
  flash_cnt: number;
  id_cnt: number;
  mdb_cnt: number;
}

export interface FlashDetectorEngine {
  getVersion(): string;
  getInfo(): FlashDetectorInfo;
  getVendor(partNumber: string): string;
  getFdb(): FdbDataset;
  getMdb(): MdbDataset;
  getLang(): LangPacks;
  getProcessors(): readonly ProcessorHooks[];
  detect(partNumber: string, opts?: DecodeOptions): FlashInfo;
  decodeFlashId(id: string, opts?: DecodeOptions): FlashIdInfo;
  searchPartNumber(pn: string, opts?: SearchOptions): string[];
  searchFlashId(id: string, opts?: SearchOptions): Record<string, unknown> | FlashIdRecord | [];
  searchMicronFbgaCode(code: string): string[];
  getSummary(partNumber: string, lang?: string | null): string;
  getIdSummary(id: string, lang?: string | null): string;
  translateString(key: string, lang?: string | null): string;
  translate(value: unknown, lang?: string | null): unknown;
  translateArray(value: Record<string, unknown>, translateKey: boolean, lang?: string | null): Record<string, unknown>;
  getHumanReadableDensity(density: number, useByte?: boolean): string;
  dispatch(endpoint: ProcessorEndpoint, context?: Partial<Omit<ProcessorRequestContext, "endpoint">>): Record<string, unknown>;
  registerDecoder(decoder: PartNumberDecoder): void;
  registerFlashIdDecoder(decoder: FlashIdDecoder): void;
  registerProcessor(processor: ProcessorHooks): void;
}
