export type Language = string;

import type {
  CapabilitiesInput,
  Capability,
  ControllerGroupId,
  ControllerProjectionGroupId,
  ControllerGroupSelection,
  DecodeIdentifierInput,
  DecodePartInput,
  FdnextCapabilities,
  FdnextCapabilityName,
  FdnextChipKind,
  FdnextDomain,
  FdnextFieldValueData,
  FdnextIdScheme,
  FdnextOperation,
  FdnextProductType,
  FdnextResult,
  IdentifierDecodeResult,
  IdentifierSearchResult,
  PartDecodeResult,
  PartSearchResult,
  ResultWarning,
  SearchIdentifiersInput,
  SearchPartsInput
} from "./result";
import type { FdnextFieldKey } from "./field-registry";

export type DecodeDraftFields = Partial<Record<FdnextFieldKey, FdnextFieldValueData>>;

export interface DecodeDraftDevice {
  domain?: FdnextDomain;
  chipKind?: FdnextChipKind;
  productType?: FdnextProductType;
  vendor?: string;
  partNumber?: string;
  identifier?: string;
  idScheme?: FdnextIdScheme;
  markingCode?: string;
}

export interface DecodeDraftIdentifiers {
  flashIds?: string[];
  partNumbers?: string[];
}

export interface DecodeDraftComponent {
  role: string;
  hidden?: boolean;
  device?: DecodeDraftDevice;
  fields?: DecodeDraftFields;
}

export interface DecodeDraftMeta {
  ruleId?: string;
  fieldProfile?: FdnextChipKind | "nand.flash_id";
  capabilities?: FdnextCapabilityName[] | string[];
  hiddenFields?: FdnextFieldKey[];
  references?: unknown;
}

export interface PartDecodeDraft {
  device: DecodeDraftDevice & { partNumber: string };
  fields?: DecodeDraftFields;
  identifiers?: Pick<DecodeDraftIdentifiers, "flashIds" | "partNumbers">;
  controllers?: string[];
  components?: DecodeDraftComponent[];
  meta?: DecodeDraftMeta;
  warnings?: ResultWarning[];
}

export interface IdentifierDecodeDraft {
  device: DecodeDraftDevice & { identifier: string; idScheme: FdnextIdScheme };
  fields?: DecodeDraftFields;
  identifiers?: Pick<DecodeDraftIdentifiers, "partNumbers">;
  controllers?: string[];
  meta?: DecodeDraftMeta;
  warnings?: ResultWarning[];
}

export interface PartNumberRecord {
  pn: string;
  id: string[];
  f?: string[];
  a?: string[];
  l?: string;
  c?: string;
  t?: string[];
  m?: string;
  pkg?: string;
  sg?: string;
  pc?: string;
  vol?: string;
  so?: string;
  d?: number;
  e?: number;
  r?: number;
  n?: number;
  pl?: number;
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

export interface LangPack {
  [key: string]: string;
}

export interface LangPacks {
  [language: string]: LangPack;
}

export type ResourceJson = Record<string, unknown> | unknown[];

export interface PartResourceIndex {
  rawNand?: Record<string, unknown>;
  managedNand?: ResourceJson;
  dram?: ResourceJson;
}

export interface IdentifierResourceIndex {
  nandFlash?: Record<string, unknown>;
}

export interface MarkingResourceIndex {
  packageMarkings?: Record<string, unknown>;
}

export interface VendorResourceIndex {
  aliases?: Record<string, string[]>;
}

export interface ControllerResourceIndex {
  defaultGroups?: ControllerProjectionGroupId[] | "all";
  exclusiveGroups?: ControllerGroupId[];
  groups?: Partial<Record<ControllerGroupId, string[]>>;
}

export interface FdnextResourceBundle {
  partIndex?: PartResourceIndex;
  identifierIndex?: IdentifierResourceIndex;
  markingIndex?: MarkingResourceIndex;
  vendorIndex?: VendorResourceIndex;
  controllerIndex?: ControllerResourceIndex;
  translationIndex?: LangPacks;
}

export interface PartDecodeOptions {
  lang?: Language | null;
  controllerGroup?: ControllerGroupSelection;
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
  profileTables?: Record<string, Record<string, unknown>>;
  check(partNumber: string): boolean;
  decode(partNumber: string): PartDecodeDraft | null;
}

export interface IdentifierDecoder {
  id: string;
  idScheme: FdnextIdScheme;
  priority?: number;
  profileTables?: Record<string, Record<string, unknown>>;
  check(id: string): boolean;
  decode(id: string): IdentifierDecodeDraft | null;
}

export interface ProcessorOperationContext {
  operation: FdnextOperation | "capabilities";
  input?: DecodePartInput | SearchPartsInput | DecodeIdentifierInput | SearchIdentifiersInput | CapabilitiesInput;
  query: string;
  remote: string;
  userAgent: string;
  serverName?: string;
  lang?: Language | null;
}

export type BeforeOperationHandler = (context: ProcessorOperationContext) => boolean | void;

export type AfterOperationHandler = (
  context: ProcessorOperationContext,
  result: FdnextResult | FdnextCapabilities
) => FdnextResult | FdnextCapabilities | void;

export interface ProcessorHooks {
  beforeOperation?: BeforeOperationHandler;
  afterOperation?: AfterOperationHandler;
}

export interface EngineOptions {
  resources?: FdnextResourceBundle;
  fallbackLang?: string;
  decoders?: PartNumberDecoder[];
  identifierDecoders?: IdentifierDecoder[];
  profileTables?: Record<string, Record<string, unknown>>;
  processors?: ProcessorHooks[];
}

export interface FdnextEngine {
  getVersion(): string;
  getCapabilities(input?: CapabilitiesInput): FdnextCapabilities;
  decodePart(input: DecodePartInput): PartDecodeResult;
  searchParts(input: SearchPartsInput): PartSearchResult;
  decodeIdentifier(input: DecodeIdentifierInput): IdentifierDecodeResult;
  searchIdentifiers(input: SearchIdentifiersInput): IdentifierSearchResult;
}
