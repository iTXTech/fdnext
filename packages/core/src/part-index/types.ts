import type { FdnextChipKind, FdnextProductType, OperationConstraints, ResultWarning } from "../result";
import type { FdbDataset, KnownPartNumberEntry, MdbDataset, PartDecodeDraft } from "../types";

export type PartIndexSource = "managed_nand" | "dram" | "fdb" | "mdb" | "fallback";
export type MarkingIndexSource = "micron_fbga" | "spectek_fbga";

export interface PartIndexRecord {
  partNumber: string;
  partNumberTokenKey: string;
  vendor: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  markingCode?: string;
  source: PartIndexSource;
}

export interface MarkingIndexRecord {
  markingCode: string;
  vendor: string;
  partNumber: string;
  partNumberTokenKey: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
  source: MarkingIndexSource;
}

export interface CompactPostingIndex {
  /** Encodes `offset * 65536 + length` for each trigram. */
  readonly spans: ReadonlyMap<string, number>;
  readonly refs: Uint32Array;
}

export interface PartSearchIndexes {
  readonly partNormalizedRefs: Uint32Array;
  readonly partTokenRefs: Uint32Array;
  readonly markingCodeRefs: Uint32Array;
  readonly markingPartRefs: Uint32Array;
  readonly markingPartTokenRefs: Uint32Array;
  readonly partTrigramRefs: CompactPostingIndex;
  readonly markingTrigramRefs: CompactPostingIndex;
}

export interface NormalizedIndexes {
  partIndex: PartIndexRecord[];
  markingIndex: MarkingIndexRecord[];
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
}

export interface ClassifyPartOptions {
  indexes: NormalizedIndexes;
  mode: "decode" | "search";
  limit?: number;
  partialMatch?: boolean;
  inspectPart(partNumber: string): PartDecodeDraft;
  decoderPriority(partNumber: string): number;
}
