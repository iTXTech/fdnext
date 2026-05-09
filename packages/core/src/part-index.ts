import { UNKNOWN } from "./constants";
import { asRecord, inferChipKindFromInfo, inferProductTypeFromInfo, isKnownInfoValue, normalizeInfoText } from "./device-inference";
import type { FdnextChipKind, FdnextProductType, OperationConstraints, ResultWarning } from "./result";
import type { FdbDataset, FlashIdRecord, InternalPartInfo, KnownPartNumberEntry, MdbDataset } from "./types";
import { normalizeFlashId, normalizePartNumber } from "./utils/normalize";
import { contains } from "./utils/string";

export type PartIndexSource = "managed_nand" | "dram" | "fdb" | "mdb" | "fallback";
export type MarkingIndexSource = "micron_fbga" | "spectek_fbga";
export type IdentifierIndexSource = "fdb";

export interface PartIndexRecord {
  partNumber: string;
  normalizedPartNumber: string;
  vendor: string;
  chipKind: FdnextChipKind;
  productType?: FdnextProductType;
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
  vendor: string;
  partNumber: string;
  normalizedPartNumber: string;
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

export interface NormalizedIndexes {
  partIndex: PartIndexRecord[];
  identifierIndex: Map<string, IdentifierIndexRecord>;
  markingIndex: MarkingIndexRecord[];
  vendorIndex: Map<string, VendorIndexRecord>;
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
  info?: InternalPartInfo;
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
  inspectPart(partNumber: string): InternalPartInfo;
  decoderPriority(partNumber: string): number;
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber);
}

function vendorKey(vendor: string): string {
  return normalizeInfoText(vendor);
}

function vendorMatches(actual: string, expected: string): boolean {
  const actualText = vendorKey(actual);
  const expectedText = vendorKey(expected);
  if (!expectedText) {
    return true;
  }
  if (actualText === expectedText) {
    return true;
  }
  const aliases: Record<string, string[]> = {
    sndk: ["sandisk", "western digital", "wd"],
    "western digital": ["sndk", "sandisk", "wd"],
    wd: ["sndk", "sandisk", "western digital"],
    skhynix: ["sk hynix"],
    "sk hynix": ["skhynix"]
  };
  return aliases[actualText]?.includes(expectedText) || aliases[expectedText]?.includes(actualText) || false;
}

function createVendorIndexRecord(vendorIndex: Map<string, VendorIndexRecord>, vendor: string): VendorIndexRecord {
  const key = vendorKey(vendor) || UNKNOWN;
  const existing = vendorIndex.get(key);
  if (existing) {
    return existing;
  }
  const record = {
    vendor: key,
    partNumbers: new Set<string>(),
    markings: new Set<string>(),
    identifiers: new Set<string>()
  };
  vendorIndex.set(key, record);
  return record;
}

function addPartRecord(records: Map<string, PartIndexRecord>, record: PartIndexRecord): void {
  const key = `${vendorKey(record.vendor)}\0${record.normalizedPartNumber}\0${record.chipKind}`;
  const existing = records.get(key);
  if (!existing || sourceWeight(record.source) > sourceWeight(existing.source)) {
    records.set(key, record);
  }
}

function normalizeMarkingCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function chipKindForMdbPart(partNumber: string): FdnextChipKind {
  return isDramPartNumber(partNumber) ? "dram" : "raw_nand";
}

export function buildNormalizedIndexes(input: BuildNormalizedIndexesInput): NormalizedIndexes {
  const partRecords = new Map<string, PartIndexRecord>();
  const identifierIndex = new Map<string, IdentifierIndexRecord>();
  const markingIndex: MarkingIndexRecord[] = [];
  const vendorIndex = new Map<string, VendorIndexRecord>();

  const addPart = (vendor: string, partNumberRaw: string, chipKind: FdnextChipKind, source: PartIndexSource, productType?: FdnextProductType): void => {
    const partNumber = normalizePartNumber(partNumberRaw);
    if (!vendor || !partNumber) {
      return;
    }
    addPartRecord(partRecords, {
      partNumber,
      normalizedPartNumber: partNumber,
      vendor,
      chipKind,
      ...(productType ? { productType } : {}),
      source
    });
    createVendorIndexRecord(vendorIndex, vendor).partNumbers.add(partNumber);
  };

  for (const entry of input.managedNandPartNumbers) {
    addPart(entry.vendor, entry.pn, "managed_nand", "managed_nand");
  }

  for (const entry of input.dramPartNumbers) {
    addPart(entry.vendor, entry.pn, "dram", "dram");
  }

  for (const [vendor, partNumbers] of input.fdb.vendors.entries()) {
    for (const partNumber of partNumbers.keys()) {
      addPart(vendor, partNumber, "raw_nand", "fdb");
    }
  }

  const addMarking = (vendor: string, codeRaw: string, partNumberRaw: string, source: MarkingIndexSource): void => {
    const markingCode = normalizeMarkingCode(codeRaw);
    const partNumber = normalizePartNumber(partNumberRaw);
    if (!markingCode || !partNumber) {
      return;
    }
    const chipKind = chipKindForMdbPart(partNumber);
    const record: MarkingIndexRecord = {
      markingCode,
      vendor,
      partNumber,
      normalizedPartNumber: partNumber,
      chipKind,
      source
    };
    markingIndex.push(record);
    createVendorIndexRecord(vendorIndex, vendor).markings.add(markingCode);
    addPart(vendor, partNumber, chipKind, "mdb");
  };

  for (const [code, partNumbers] of input.micronDramFbgaCodes.entries()) {
    for (const partNumber of partNumbers) {
      addMarking("micron", code, partNumber, "micron_fbga");
    }
  }

  for (const [code, partNumber] of Object.entries(input.mdb.micron)) {
    addMarking("micron", code, partNumber, "micron_fbga");
  }

  for (const [code, partNumbers] of Object.entries(input.mdb.spectek)) {
    for (const partNumber of partNumbers) {
      addMarking("spectek", code, partNumber, "spectek_fbga");
    }
  }

  for (const [identifier, record] of input.fdb.flashIds.entries()) {
    const normalized = normalizeFlashId(identifier);
    if (!normalized) {
      continue;
    }
    identifierIndex.set(normalized, {
      identifier: normalized,
      idScheme: "nand.flash_id",
      record,
      source: "fdb"
    });
    for (const part of record.n ?? []) {
      const vendor = /^(\S+)\s+/.exec(part)?.[1];
      if (vendor) {
        createVendorIndexRecord(vendorIndex, vendor).identifiers.add(normalized);
      }
    }
  }

  return {
    partIndex: [...partRecords.values()],
    identifierIndex,
    markingIndex,
    vendorIndex
  };
}

function sourceWeight(source: PartIndexSource | MarkingIndexSource): number {
  switch (source) {
    case "micron_fbga":
    case "spectek_fbga":
      return 100;
    case "dram":
      return 92;
    case "managed_nand":
      return 88;
    case "mdb":
      return 78;
    case "fdb":
      return 62;
    case "fallback":
      return 15;
  }
}

function matchKind(value: string, query: string, partialMatch: boolean): "exact" | "prefix" | "contains" | null {
  if (value === query) {
    return "exact";
  }
  if (!partialMatch) {
    return null;
  }
  if (value.startsWith(query)) {
    return "prefix";
  }
  if (contains(value, query)) {
    return "contains";
  }
  return null;
}

function matchWeight(kind: PartClassificationCandidate["matchKind"]): number {
  switch (kind) {
    case "exact":
      return 100;
    case "prefix":
      return 42;
    case "contains":
      return 24;
    case "fallback":
      return 1;
  }
}

function tokenCompleteness(info: InternalPartInfo): number {
  let score = 0;
  if (isKnownInfoValue(info.type)) score += 6;
  if (isKnownInfoValue(info.density)) score += 6;
  if (isKnownInfoValue(info.package)) score += 4;
  if (isKnownInfoValue(info.processNode)) score += 3;
  if (isKnownInfoValue(info.cellLevel)) score += 3;
  const extra = asRecord(info.fields);
  score += Math.min(8, Object.keys(extra).filter((key) => isKnownInfoValue(extra[key])).length);
  return score;
}

function vendorConsistency(candidateVendor: string, info: InternalPartInfo): number {
  if (!isKnownInfoValue(info.vendor)) {
    return 0;
  }
  return vendorMatches(String(info.vendor), candidateVendor) ? 18 : -60;
}

function productTypeMatches(actual: FdnextProductType | undefined, expected: FdnextProductType): boolean {
  return normalizeInfoText(actual) === normalizeInfoText(expected);
}

function constraintScore(
  candidate: Omit<PartClassificationCandidate, "score" | "warnings">,
  constraints: Omit<OperationConstraints, "idScheme">
): { score: number; rejected: boolean; warnings: ResultWarning[] } {
  let score = 0;
  const warnings: ResultWarning[] = [];
  const strict = constraints.strict === true;

  if (constraints.vendor) {
    if (vendorMatches(candidate.vendor, constraints.vendor)) {
      score += 24;
    } else if (strict) {
      warnings.push({
        code: "constraint_mismatch",
        message: `Vendor constraint ${constraints.vendor} does not match ${candidate.vendor}`,
        severity: "warning"
      });
      return { score, rejected: true, warnings };
    } else {
      score -= 20;
    }
  }

  if (constraints.chipKind) {
    if (candidate.chipKind === constraints.chipKind) {
      score += 28;
    } else if (strict) {
      warnings.push({
        code: "constraint_mismatch",
        message: `Chip kind constraint ${constraints.chipKind} does not match ${candidate.chipKind}`,
        severity: "warning"
      });
      return { score, rejected: true, warnings };
    } else {
      score -= 26;
    }
  }

  if (constraints.productType) {
    if (candidate.productType && productTypeMatches(candidate.productType, constraints.productType)) {
      score += 20;
    } else if (strict) {
      warnings.push({
        code: "constraint_mismatch",
        message: `Product type constraint ${constraints.productType} does not match ${candidate.productType ?? "unknown"}`,
        severity: "warning"
      });
      return { score, rejected: true, warnings };
    } else {
      score -= 14;
    }
  }

  return { score, rejected: false, warnings };
}

function enrichCandidate(
  base: Omit<PartClassificationCandidate, "score" | "warnings" | "info">,
  constraints: Omit<OperationConstraints, "idScheme">,
  options: ClassifyPartOptions
): PartClassificationCandidate | null {
  const info = options.inspectPart(base.partNumber);
  const decodedChipKind = inferChipKindFromInfo(info);
  const decodedProductType = inferProductTypeFromInfo(info);
  const vendor = base.vendor === UNKNOWN && isKnownInfoValue(info.vendor) ? String(info.vendor) : base.vendor;
  const chipKind = base.chipKind === "unknown" ? decodedChipKind : base.chipKind;
  const productType = base.productType ?? decodedProductType;
  const constrainedBase = {
    ...base,
    vendor,
    chipKind,
    ...(productType ? { productType } : {})
  };
  const constraint = constraintScore(constrainedBase, constraints);
  if (constraint.rejected) {
    return null;
  }
  const score =
    sourceWeight(base.source) +
    matchWeight(base.matchKind) +
    options.decoderPriority(base.partNumber) +
    tokenCompleteness(info) +
    vendorConsistency(constrainedBase.vendor, info) +
    constraint.score;

  return {
    ...constrainedBase,
    score,
    info,
    warnings: constraint.warnings
  };
}

function dedupeCandidates(candidates: PartClassificationCandidate[]): PartClassificationCandidate[] {
  const best = new Map<string, PartClassificationCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.markingCode ?? ""}\0${candidate.vendor}\0${candidate.normalizedPartNumber}\0${candidate.chipKind}`;
    const existing = best.get(key);
    if (!existing || candidate.score > existing.score) {
      best.set(key, candidate);
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.normalizedPartNumber.localeCompare(b.normalizedPartNumber));
}

function isAmbiguous(candidates: PartClassificationCandidate[], mode: "decode" | "search"): boolean {
  if (mode !== "decode" || candidates.length < 2) {
    return false;
  }
  const [first, second] = candidates;
  if (!first || !second) {
    return false;
  }
  if (first.normalizedPartNumber === second.normalizedPartNumber && first.chipKind === second.chipKind) {
    return false;
  }
  if (first.markingCode && second.markingCode && first.markingCode === second.markingCode) {
    return first.score - second.score <= 12;
  }
  return first.score - second.score <= 5 && first.chipKind !== second.chipKind;
}

export function classifyPart(
  queryRaw: string,
  constraintsRaw: Omit<OperationConstraints, "idScheme"> | undefined,
  options: ClassifyPartOptions
): PartClassification {
  const normalized = normalizePartNumber(queryRaw);
  const constraints = constraintsRaw ?? {};
  if (!normalized) {
    return {
      query: queryRaw,
      normalized: queryRaw,
      constraints,
      status: "not_found",
      candidates: [],
      warnings: []
    };
  }

  const partialMatch = options.mode === "search" ? options.partialMatch ?? true : false;
  const bases: Array<Omit<PartClassificationCandidate, "score" | "warnings" | "info">> = [];
  const baseLimit = options.mode === "search" ? Math.max((options.limit ?? 50) * 6, 48) : 0;
  const canAddBase = (): boolean => baseLimit === 0 || bases.length < baseLimit;

  for (const record of options.indexes.markingIndex) {
    if (!canAddBase()) {
      break;
    }
    const byCode = matchKind(record.markingCode, normalized, partialMatch);
    const byPart = matchKind(record.normalizedPartNumber, normalized, partialMatch);
    const match = byCode ?? byPart;
    if (!match) {
      continue;
    }
    bases.push({
      partNumber: record.partNumber,
      normalizedPartNumber: record.normalizedPartNumber,
      vendor: record.vendor,
      chipKind: record.chipKind,
      ...(record.productType ? { productType: record.productType } : {}),
      markingCode: record.markingCode,
      ...(byCode ? { markingMatch: true } : {}),
      source: record.source,
      matchKind: byCode === "exact" ? "exact" : match
    });
  }

  for (const record of options.indexes.partIndex) {
    if (!canAddBase()) {
      break;
    }
    const match = matchKind(record.normalizedPartNumber, normalized, partialMatch);
    if (!match) {
      continue;
    }
    bases.push({
      partNumber: record.partNumber,
      normalizedPartNumber: record.normalizedPartNumber,
      vendor: record.vendor,
      chipKind: record.chipKind,
      ...(record.productType ? { productType: record.productType } : {}),
      source: record.source,
      matchKind: match
    });
  }

  if (options.mode === "decode") {
    bases.push({
      partNumber: normalized,
      normalizedPartNumber: normalized,
      vendor: UNKNOWN,
      chipKind: "unknown",
      source: "fallback",
      matchKind: "fallback"
    });
  }

  const enriched = dedupeCandidates(
    bases
      .map((candidate) => enrichCandidate(candidate, constraints, options))
      .filter((candidate): candidate is PartClassificationCandidate => Boolean(candidate))
  );
  const limited = options.limit && options.limit > 0 ? enriched.slice(0, options.limit) : enriched;
  const selected = limited[0];
  const warnings: ResultWarning[] = [];

  if (!selected) {
    if (constraints.strict) {
      warnings.push({
        code: "constraint_mismatch",
        message: "No part candidate matched the requested strict constraints",
        severity: "warning"
      });
    }
    return {
      query: queryRaw,
      normalized,
      constraints,
      status: "not_found",
      candidates: [],
      warnings
    };
  }

  if (isAmbiguous(limited, options.mode)) {
    return {
      query: queryRaw,
      normalized,
      constraints,
      status: "ambiguous",
      selected,
      candidates: limited,
      warnings: [{
        code: "ambiguous_part",
        message: "Multiple part candidates matched the query",
        severity: "warning"
      }]
    };
  }

  return {
    query: queryRaw,
    normalized,
    constraints,
    status: "selected",
    selected,
    candidates: limited,
    warnings
  };
}
