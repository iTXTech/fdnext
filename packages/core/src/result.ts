export const FDNEXT_RESULT_SCHEMA_VERSION = "fdnext.result.v1" as const;
export const FDNEXT_CAPABILITIES_SCHEMA_VERSION = "fdnext.capabilities.v1" as const;
export const FDNEXT_VERSION = "2.1.0" as const;
declare const __FDNEXT_COMMIT_HASH__: string;
declare const __FDNEXT_BUILD_TIME__: string;

export interface FdnextBuildMetadata {
  commitHash: string;
  buildTime: string;
}

function buildMetadataValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const FDNEXT_BUILD_METADATA: FdnextBuildMetadata = {
  commitHash: buildMetadataValue(typeof __FDNEXT_COMMIT_HASH__ === "string" ? __FDNEXT_COMMIT_HASH__ : undefined, "dev"),
  buildTime: buildMetadataValue(typeof __FDNEXT_BUILD_TIME__ === "string" ? __FDNEXT_BUILD_TIME__ : undefined, "1970-01-01T00:00:00.000Z")
};

export const fdnextOperations = [
  "part.decode",
  "part.search",
  "identifier.decode",
  "identifier.search"
] as const;

export type FdnextOperation = (typeof fdnextOperations)[number];

export const fdnextResultStatuses = [
  "ok",
  "not_found",
  "ambiguous",
  "unsupported",
  "invalid_input"
] as const;

export type FdnextResultStatus = (typeof fdnextResultStatuses)[number];

export const fdnextDomains = ["memory", "power", "controller", "unknown"] as const;
export type FdnextDomain = (typeof fdnextDomains)[number];

export const fdnextChipKinds = [
  "raw_nand",
  "on_die_ecc_nand",
  "managed_nand",
  "dram",
  "nor",
  "pmic",
  "controller",
  "unknown"
] as const;

export type FdnextChipKind = (typeof fdnextChipKinds)[number];

export const fdnextProductTypes = [
  "emmc",
  "ufs",
  "sata",
  "nvme",
  "emcp",
  "umcp",
  "e2nand",
  "lpddr4",
  "lpddr4x",
  "lpddr5",
  "lpddr5x",
  "ddr3",
  "ddr4",
  "ddr5"
] as const;

export type FdnextKnownProductType = (typeof fdnextProductTypes)[number];
export type FdnextProductType = FdnextKnownProductType | (string & {});

export const fdnextIdSchemes = ["nand.flash_id"] as const;
export type FdnextIdScheme = (typeof fdnextIdSchemes)[number];

export const fdnextCapabilityNames = [
  "part.decode",
  "part.search",
  "identifier.decode.nand.flash_id",
  "identifier.search.nand.flash_id",
  "marking.lookup.micron.fbga",
  "field_profile.raw_nand",
  "field_profile.on_die_ecc_nand",
  "field_profile.managed_nand",
  "field_profile.dram",
  "field_profile.nand.flash_id"
] as const;

export type FdnextCapabilityName = (typeof fdnextCapabilityNames)[number];

export const fdnextBlockIds = [
  "identity",
  "storage",
  "dram",
  "geometry",
  "package",
  "interface",
  "timing",
  "marking",
  "components",
  "controllers",
  "additional"
] as const;

export type FdnextBlockId = (typeof fdnextBlockIds)[number];

export const fdnextFieldImportances = ["primary", "secondary", "detail"] as const;
export type FdnextFieldImportance = (typeof fdnextFieldImportances)[number];

export type FdnextFieldScalar = string | number | boolean | null;
export type FdnextFieldObject = Record<string, FdnextFieldScalar | FdnextFieldScalar[]>;
export type FdnextFieldValueData = FdnextFieldScalar | FdnextFieldScalar[] | FdnextFieldObject;

export interface VendorIdentity {
  id: string;
  name: string;
}

export interface DeviceIdentity {
  domain: FdnextDomain;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  partNumber?: string;
  identifier?: string;
  idScheme?: FdnextIdScheme;
  markingCode?: string;
  vendor: VendorIdentity;
}

export interface FieldValue {
  key: string;
  label: string;
  value: FdnextFieldValueData;
  unit?: string;
  display?: string;
  importance: FdnextFieldImportance;
}

export interface ResultBlock {
  id: FdnextBlockId | (string & {});
  label: string;
  fields: FieldValue[];
  importance?: FdnextFieldImportance;
}

export const fdnextRelationKinds = [
  "component",
  "contains",
  "marking_for",
  "identifier_for",
  "alternate_part",
  "uses_controller"
] as const;

export type FdnextRelationKind = (typeof fdnextRelationKinds)[number];

export interface RelationEndpoint {
  role?: string;
  label?: string;
  device?: DeviceIdentity;
  partNumber?: string;
  identifier?: string;
  idScheme?: FdnextIdScheme;
  markingCode?: string;
}

export interface Relation {
  kind: FdnextRelationKind;
  label?: string;
  source?: RelationEndpoint;
  target: RelationEndpoint;
  fields?: FieldValue[];
  action?: Action;
}

export interface OperationConstraints {
  chipKind?: FdnextChipKind;
  productType?: FdnextProductType;
  vendor?: string;
  strict?: boolean;
  idScheme?: FdnextIdScheme;
}

export interface DecodePartInput {
  query: string;
  lang?: string | null;
  constraints?: Omit<OperationConstraints, "idScheme">;
}

export interface SearchPartsInput extends DecodePartInput {
  limit?: number;
}

export interface DecodeIdentifierInput {
  query: string;
  lang?: string | null;
  idScheme?: FdnextIdScheme;
  constraints?: OperationConstraints;
}

export interface SearchIdentifiersInput extends DecodeIdentifierInput {
  limit?: number;
}

export type FdnextOperationRequestInput =
  | DecodePartInput
  | SearchPartsInput
  | DecodeIdentifierInput
  | SearchIdentifiersInput;

export interface NormalizedOperationInput {
  query: string;
  normalized: string;
  lang?: string;
  constraints: OperationConstraints;
}

export interface Action {
  name: FdnextOperation;
  label: string;
  operation: FdnextOperation;
  input: FdnextOperationRequestInput;
}

export const fdnextExternalLinkCategories = [
  "vendor",
  "datasheet",
  "marketplace",
  "reference",
  "tool",
  "community"
] as const;

export type ExternalLinkCategory = (typeof fdnextExternalLinkCategories)[number];

export interface ExternalLink {
  id: string;
  label: string;
  url: string;
  category?: ExternalLinkCategory;
  image?: string;
  hint?: string;
  fieldKey?: string;
  priority?: number;
}

export interface ResultWarning {
  code: string;
  message: string;
  fieldKey?: string;
  severity?: "info" | "warning";
  details?: Record<string, FdnextFieldValueData>;
}

export interface Candidate {
  device: DeviceIdentity;
  fields?: FieldValue[];
  warnings?: ResultWarning[];
}

export interface SearchResultItem {
  label: string;
  device: DeviceIdentity;
  badges?: string[];
  fields?: FieldValue[];
  relations?: Relation[];
  links?: ExternalLink[];
}

export interface FdnextResultBase<O extends FdnextOperation = FdnextOperation> {
  schemaVersion: typeof FDNEXT_RESULT_SCHEMA_VERSION;
  operation: O;
  status: FdnextResultStatus;
  input: NormalizedOperationInput;
  subtitle?: string;
  links?: ExternalLink[];
  warnings: ResultWarning[];
}

export interface PartDecodeResult extends FdnextResultBase<"part.decode"> {
  device?: DeviceIdentity;
  blocks: ResultBlock[];
  relations: Relation[];
  candidates?: Candidate[];
}

export interface IdentifierDecodeResult extends FdnextResultBase<"identifier.decode"> {
  device?: DeviceIdentity;
  blocks: ResultBlock[];
  relations: Relation[];
  candidates?: Candidate[];
}

export interface PartSearchResult extends FdnextResultBase<"part.search"> {
  items: SearchResultItem[];
  relations?: Relation[];
  candidates?: Candidate[];
}

export interface IdentifierSearchResult extends FdnextResultBase<"identifier.search"> {
  items: SearchResultItem[];
  relations?: Relation[];
  candidates?: Candidate[];
}

export type FdnextResult = PartDecodeResult | PartSearchResult | IdentifierDecodeResult | IdentifierSearchResult;

export interface Capability {
  name: FdnextCapabilityName;
  operation?: FdnextOperation;
  domains?: FdnextDomain[];
  chipKinds?: FdnextChipKind[];
  productTypes?: FdnextProductType[];
  idSchemes?: FdnextIdScheme[];
  description?: string;
}

export interface CapabilityServerInfo {
  name: string;
  version: string;
  build: FdnextBuildMetadata;
}

export interface CapabilityFdbInfo {
  name: string;
  version: string;
  time: string;
  website: string;
}

export interface CapabilityInventory {
  controllers: {
    count: number;
    items: string[];
  };
  flashIds: {
    count: number;
  };
  partNumbers: {
    total: number;
    fdb: number;
    managedNand: number;
    dram: number;
  };
  micronFbga: {
    total: number;
    dramLookup: number;
  };
}

export interface CapabilityPartNumberDecoderInfo {
  id: string;
  priority?: number;
}

export interface CapabilityIdentifierDecoderInfo extends CapabilityPartNumberDecoderInfo {
  idScheme: FdnextIdScheme;
}

export interface CapabilityDecoderInventory {
  partNumber: CapabilityPartNumberDecoderInfo[];
  identifier: CapabilityIdentifierDecoderInfo[];
}

export interface FdnextCapabilities {
  schemaVersion: typeof FDNEXT_CAPABILITIES_SCHEMA_VERSION;
  server: CapabilityServerInfo;
  fdb: CapabilityFdbInfo;
  inventory: CapabilityInventory;
  decoders: CapabilityDecoderInventory;
  capabilities: Capability[];
}
