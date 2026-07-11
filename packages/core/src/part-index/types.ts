import type { FdnextChipKind, FdnextProductType, OperationConstraints, ResultWarning } from "../result";
import type { FdbDataset, FlashIdRecord, KnownPartNumberEntry, MdbDataset, PartDecodeDraft } from "../types";

export type PartIndexSource = "managed_nand" | "dram" | "fdb" | "mdb" | "fallback";
export type MarkingIndexSource = "micron_fbga" | "spectek_fbga";
export type IdentifierIndexSource = "fdb";

export interface PartIndexRecord {
  partNumber: string;
  normalizedPartNumber: string;
  partNumberTokenKey: string;
  vendor: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  markingCode?: string;
  source: PartIndexSource;
}

export interface IdentifierIndexRecord {
  identifier: string;
  idScheme: "nand.flash_id";
  record: FlashIdRecord;
  source: IdentifierIndexSource;
}

export interface MarkingIndexRecord {
  markingCode: string;
  markingTokenKey: string;
  vendor: string;
  partNumber: string;
  normalizedPartNumber: string;
  partNumberTokenKey: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  source: MarkingIndexSource;
}

export interface VendorIndexRecord {
  vendor: string;
  partNumbers: Set<string>;
  markings: Set<string>;
  identifiers: Set<string>;
}

export type IndexRefBucket = number | number[];

export interface CompactPostingIndex {
  /** Encodes `offset * 65536 + length` for each trigram. */
  readonly spans: ReadonlyMap<string, number>;
  readonly refs: Uint32Array;
}

export interface PartSearchIndexes {
  readonly partNormalizedRefs: readonly number[];
  readonly partTokenRefs: readonly number[];
  readonly markingCodeRefs: readonly number[];
  readonly markingTokenRefs: readonly number[];
  readonly markingPartRefs: readonly number[];
  readonly markingPartTokenRefs: readonly number[];
  readonly partTrigramRefs: () => CompactPostingIndex;
  readonly markingTrigramRefs: () => CompactPostingIndex;
}

export interface NormalizedIndexes {
  partIndex: PartIndexRecord[];
  identifierIndex: Map<string, IdentifierIndexRecord>;
  markingIndex: MarkingIndexRecord[];
  partExactIndex: Map<string, IndexRefBucket>;
  markingExactIndex: Map<string, IndexRefBucket>;
  vendorIndex: Map<string, VendorIndexRecord>;
  /** Optional only so test/custom index fixtures can exercise the complete-scan oracle. */
  search?: PartSearchIndexes;
}

export interface PartClassificationCandidate {
  partNumber: string;
  normalizedPartNumber: string;
  vendor: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  markingCode?: string;
  markingMatch?: boolean;
  source: PartIndexSource | MarkingIndexSource;
  matchKind: "exact" | "prefix" | "contains" | "fallback";
  score: number;
  info?: PartDecodeDraft;
  warnings: ResultWarning[];
}

export interface PartClassification {
  query: string;
  normalized: string;
  constraints: Omit<OperationConstraints, "idScheme">;
  status: "selected" | "ambiguous" | "not_found";
  selected?: PartClassificationCandidate;
  candidates: PartClassificationCandidate[];
  warnings: ResultWarning[];
}

export interface BuildNormalizedIndexesInput {
  fdb: FdbDataset;
  mdb: MdbDataset;
  managedNandPartNumbers: KnownPartNumberEntry[];
  dramPartNumbers: KnownPartNumberEntry[];
  micronDramFbgaCodes: Map<string, string[]>;
}

export interface ClassifyPartOptions {
  indexes: NormalizedIndexes;
  mode: "decode" | "search";
  limit?: number;
  partialMatch?: boolean;
  inspectPart(partNumber: string): PartDecodeDraft;
  decoderPriority(partNumber: string): number;
}
