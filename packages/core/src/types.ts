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
  extraInfo?: Record<string, unknown>;
  flashId?: string[];
  controller?: string[];
  remark?: string;
  url?: Record<string, string>;
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
  ext?: Record<string, unknown>;
  controllers?: string[];
  partNumbers?: string[];
  url?: Record<string, string>;
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

export interface LangPack {
  [key: string]: string;
}

export interface LangPacks {
  [language: string]: LangPack;
}

export interface EngineResources {
  fdbRaw: Record<string, unknown>;
  mdbRaw: Record<string, unknown>;
  langRaw: LangPacks;
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

export interface ProcessorHooks {
  flashInfo?(flashInfo: FlashInfo): FlashInfo;
  flashIdInfo?(idInfo: FlashIdInfo): FlashIdInfo;
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
  detect(partNumber: string, opts?: DecodeOptions): FlashInfo;
  decodeFlashId(id: string, opts?: DecodeOptions): FlashIdInfo;
  searchPartNumber(pn: string, opts?: SearchOptions): string[];
  searchFlashId(id: string, opts?: SearchOptions): Record<string, unknown> | FlashIdRecord | [];
  searchMicronFbgaCode(code: string): string[];
  getSummary(partNumber: string, lang?: string | null): string;
  getIdSummary(id: string, lang?: string | null): string;
  translateString(key: string, lang?: string | null): string;
  registerDecoder(decoder: PartNumberDecoder): void;
  registerFlashIdDecoder(decoder: FlashIdDecoder): void;
  registerProcessor(processor: ProcessorHooks): void;
}
