import { UNKNOWN } from "./constants";
import { draftDensity, draftField, draftVendor } from "./draft";
import { asRecord, inferChipKindFromDraft, inferProductTypeFromDraft, isKnownInfoValue, normalizeInfoText } from "./device-inference";
import type { FdnextChipKind, FdnextProductType, OperationConstraints, ResultWarning } from "./result";
import type { RuntimeIndexRefBucket, RuntimeMarkingIndexRow, RuntimePartIndexRow, RuntimeSearchSection } from "./runtime-data";
import type { PartDecodeDraft } from "./types";
import { normalizePartNumber, normalizePartNumberTokenKey } from "./utils/normalize";
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
  markingCode?: string;
  source: PartIndexSource;
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
  partIndex: RuntimePartIndexRow[];
  identifierIndex: string[];
  markingIndex: RuntimeMarkingIndexRow[];
  partExactIndex: Record<string, RuntimeIndexRefBucket>;
  markingExactIndex: Record<string, RuntimeIndexRefBucket>;
  partPrefixIndex: Record<string, RuntimeIndexRefBucket>;
  markingPrefixIndex: Record<string, RuntimeIndexRefBucket>;
}

export function partIndexRecordFromRow(row: RuntimePartIndexRow): PartIndexRecord {
  return {
    partNumber: row[0],
    normalizedPartNumber: row[1],
    vendor: row[2],
    chipKind: row[3] as FdnextChipKind,
    ...(row[4] ? { productType: row[4] as FdnextProductType } : {}),
    ...(row[5] ? { markingCode: row[5] } : {}),
    source: row[6] as PartIndexSource
  };
}

export function markingIndexRecordFromRow(row: RuntimeMarkingIndexRow): MarkingIndexRecord {
  return {
    markingCode: row[0],
    vendor: row[1],
    partNumber: row[2],
    normalizedPartNumber: row[3],
    chipKind: row[4] as FdnextChipKind,
    ...(row[5] ? { productType: row[5] as FdnextProductType } : {}),
    source: row[6] as MarkingIndexSource
  };
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

export interface ClassifyPartOptions {
  indexes: NormalizedIndexes;
  mode: "decode" | "search";
  limit?: number;
  partialMatch?: boolean;
  inspectPart(partNumber: string): PartDecodeDraft;
  decoderPriority(partNumber: string): number;
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber) ||
    /^(?:XCBB|XCB|PR[A-Z]|S[A-Z]{1,2})(?:[0-9]+M|[0-9]+G)[0-9]{1,2}[A-Z0-9]/.test(partNumber);
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
    esmt: ["elite semiconductor"],
    "elite semiconductor": ["esmt"],
    etron: ["etron technology"],
    "etron technology": ["etron"],
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
  } else if (record.markingCode && !existing.markingCode) {
    records.set(key, { ...existing, markingCode: record.markingCode });
  }
}

function normalizeMarkingCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

const PART_PREFIX_PROFILES = [
  "MT29",
  "MTFC",
  "MTFD",
  "MT40",
  "MT41",
  "MT42",
  "MT43",
  "MT44",
  "MT46",
  "MT47",
  "MT48",
  "MT49",
  "MT51",
  "MT52",
  "MT53",
  "MT54",
  "MT58",
  "MT60",
  "MT61",
  "MT62",
  "MT68",
  "CT40",
  "K4",
  "K9",
  "KLM",
  "KLU",
  "H25",
  "H26",
  "H27",
  "H28",
  "H9",
  "TC58",
  "TH",
  "SDIN",
  "SDT",
  "SD"
];

const MARKING_PREFIX_PROFILES = ["C9", "D8", "D9", "Z8", "Z9", "NC", "NW", "NY", "NX", "NQ", "NV", "PF"];

function addIndexRef(index: Map<string, RuntimeIndexRefBucket>, key: string, ref: number): void {
  if (!key) {
    return;
  }
  const existing = index.get(key);
  if (existing !== undefined) {
    if (typeof existing === "number") {
      if (existing !== ref) {
        index.set(key, [existing, ref]);
      }
      return;
    }
    if (existing[existing.length - 1] !== ref) {
      existing.push(ref);
    }
    return;
  }
  index.set(key, ref);
}

function matchingProfile(value: string, profiles: string[]): string | undefined {
  let matched: string | undefined;
  for (const profile of profiles) {
    if (value.startsWith(profile) && (!matched || profile.length > matched.length)) {
      matched = profile;
    }
  }
  return matched;
}

function addExactIndexKeys(index: Map<string, RuntimeIndexRefBucket>, value: string, ref: number): void {
  addIndexRef(index, value, ref);
  addIndexRef(index, normalizePartNumberTokenKey(value), ref);
}

function addPrefixIndexKeys(index: Map<string, RuntimeIndexRefBucket>, value: string, ref: number, profiles: string[]): void {
  const profile = matchingProfile(value, profiles);
  const tokenKey = normalizePartNumberTokenKey(value);
  const tokenProfile = matchingProfile(tokenKey, profiles);
  for (const key of new Set([profile, tokenProfile])) {
    if (key) {
      addIndexRef(index, key, ref);
    }
  }
}

function chipKindForMdbPart(partNumber: string): FdnextChipKind {
  return isDramPartNumber(partNumber) ? "dram" : "raw_nand";
}

function shouldPreferDecodedClassification(source: PartIndexSource | MarkingIndexSource): boolean {
  return source === "mdb" || source === "micron_fbga" || source === "spectek_fbga";
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
  const valueTokenKey = normalizePartNumberTokenKey(value);
  const queryTokenKey = normalizePartNumberTokenKey(query);
  if (valueTokenKey === queryTokenKey) {
    return "exact";
  }
  if (!partialMatch) {
    return null;
  }
  if (value.startsWith(query)) {
    return "prefix";
  }
  if (valueTokenKey.startsWith(queryTokenKey)) {
    return "prefix";
  }
  if (contains(value, query)) {
    return "contains";
  }
  if (contains(valueTokenKey, queryTokenKey)) {
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

function tokenCompleteness(info: PartDecodeDraft): number {
  let score = 0;
  if (isKnownInfoValue(info.device.productType) || isKnownInfoValue(draftField(info, "product_type")) || isKnownInfoValue(draftField(info, "dram_type"))) score += 6;
  if (isKnownInfoValue(draftDensity(info))) score += 6;
  if (isKnownInfoValue(draftField(info, "package"))) score += 4;
  if (isKnownInfoValue(draftField(info, "die_codename")) || isKnownInfoValue(draftField(info, "process_node"))) score += 3;
  if (isKnownInfoValue(draftField(info, "cell_level"))) score += 3;
  const extra = asRecord(info.fields);
  const primaryKeys = new Set([
    "density",
    "dram_density",
    "package",
    "die_codename",
    "process_node",
    "cell_level",
    "device_width",
    "dram_width",
    "voltage",
    "dram_voltage"
  ]);
  score += Math.min(8, Object.keys(extra).filter((key) => !primaryKeys.has(key) && isKnownInfoValue(extra[key])).length);
  return score;
}

function vendorConsistency(candidateVendor: string, info: PartDecodeDraft): number {
  if (!isKnownInfoValue(draftVendor(info))) {
    return 0;
  }
  return vendorMatches(draftVendor(info), candidateVendor) ? 18 : -60;
}

function productTypeMatches(actual: FdnextProductType | undefined, expected: FdnextProductType): boolean {
  return normalizeInfoText(actual) === normalizeInfoText(expected);
}

function hasSearchConstraints(constraints: Omit<OperationConstraints, "idScheme">): boolean {
  return Boolean(constraints.vendor || constraints.chipKind || constraints.productType);
}

function chipKindForProductTypeConstraint(productType: FdnextProductType): FdnextChipKind | undefined {
  const normalized = normalizeInfoText(productType);
  if (["emmc", "ufs", "sata", "nvme", "emcp", "umcp", "e2nand", "e3nand"].includes(normalized)) {
    return "managed_nand";
  }
  if (normalized === "dram" || /^(?:sdr|lpsdr|lpddr|ddr|gddr|rldram)/.test(normalized)) {
    return "dram";
  }
  return undefined;
}

function baseMatchesSearchConstraints(
  candidate: Omit<PartClassificationCandidate, "score" | "warnings" | "info">,
  constraints: Omit<OperationConstraints, "idScheme">
): boolean {
  if (constraints.vendor && !vendorMatches(candidate.vendor, constraints.vendor)) {
    return false;
  }
  if (constraints.chipKind && candidate.chipKind !== constraints.chipKind) {
    return false;
  }
  if (constraints.productType) {
    if (candidate.productType) {
      return productTypeMatches(candidate.productType, constraints.productType);
    }
    const expectedChipKind = chipKindForProductTypeConstraint(constraints.productType);
    if (expectedChipKind && candidate.chipKind !== "unknown" && candidate.chipKind !== expectedChipKind) {
      return false;
    }
  }
  return true;
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
  const decodedChipKind = inferChipKindFromDraft(info);
  const decodedProductType = inferProductTypeFromDraft(info);
  const vendor = base.vendor === UNKNOWN && isKnownInfoValue(draftVendor(info)) ? draftVendor(info) : base.vendor;
  const chipKind = shouldPreferDecodedClassification(base.source) && decodedChipKind !== "unknown"
    ? decodedChipKind
    : base.chipKind === "unknown"
    ? decodedChipKind
    : base.chipKind;
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
    const key = `${candidate.vendor}\0${candidate.normalizedPartNumber}\0${candidate.chipKind}`;
    const existing = best.get(key);
    if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.markingCode && !existing.markingCode)) {
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
  const deferredBases: Array<Omit<PartClassificationCandidate, "score" | "warnings" | "info">> = [];
  const constrainedSearch = hasSearchConstraints(constraints);
  const prioritizeConstrainedSearch = options.mode === "search" && constrainedSearch;
  const searchLimitMultiplier = constrainedSearch ? 80 : 6;
  const searchLimitFloor = constrainedSearch ? 1200 : 48;
  const baseLimit = options.mode === "search" ? Math.max((options.limit ?? 50) * searchLimitMultiplier, searchLimitFloor) : 0;
  const preferredBaseLimit = prioritizeConstrainedSearch
    ? Math.max((options.limit ?? 50) * 4, 64)
    : baseLimit;
  const canAddBase = (): boolean => baseLimit === 0 || bases.length < baseLimit;
  const canAddPreferredBase = (): boolean => preferredBaseLimit === 0 || bases.length < preferredBaseLimit;
  const seenBaseKeys = new Set<string>();
  const addBase = (base: Omit<PartClassificationCandidate, "score" | "warnings" | "info">): void => {
    const key = `${base.source}\0${base.vendor}\0${base.normalizedPartNumber}\0${base.chipKind}\0${base.markingCode ?? ""}\0${base.markingMatch ? "marking" : "part"}`;
    if (seenBaseKeys.has(key)) {
      return;
    }
    seenBaseKeys.add(key);
    if (prioritizeConstrainedSearch && !baseMatchesSearchConstraints(base, constraints)) {
      if (deferredBases.length < baseLimit) {
        deferredBases.push(base);
      }
      return;
    }
    if (canAddPreferredBase()) {
      bases.push(base);
    }
  };

  let usedFastIndex = false;
  let hasExactFastMatch = false;
  const normalizedTokenKey = normalizePartNumberTokenKey(normalized);

  const addMarkingRecord = (record: MarkingIndexRecord): void => {
    const byCode = matchKind(record.markingCode, normalized, partialMatch);
    const byPart = matchKind(record.normalizedPartNumber, normalized, partialMatch);
    const match = byCode ?? byPart;
    if (!match) {
      return;
    }
    addBase({
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
  };

  const addPartRecord = (record: PartIndexRecord): void => {
    const match = matchKind(record.normalizedPartNumber, normalized, partialMatch);
    if (!match) {
      return;
    }
    addBase({
      partNumber: record.partNumber,
      normalizedPartNumber: record.normalizedPartNumber,
      vendor: record.vendor,
      chipKind: record.chipKind,
      ...(record.productType ? { productType: record.productType } : {}),
      ...(record.markingCode ? { markingCode: record.markingCode } : {}),
      source: record.source,
      matchKind: match
    });
  };

  const addMarkingRefs = (refs: RuntimeIndexRefBucket | undefined, exact: boolean): void => {
    if (refs === undefined) {
      return;
    }
    usedFastIndex = true;
    hasExactFastMatch = hasExactFastMatch || exact;
    for (const ref of typeof refs === "number" ? [refs] : refs) {
      if (!prioritizeConstrainedSearch && !canAddBase()) {
        break;
      }
      const row = options.indexes.markingIndex[ref];
      if (row) {
        addMarkingRecord(markingIndexRecordFromRow(row));
      }
    }
  };

  const addPartRefs = (refs: RuntimeIndexRefBucket | undefined, exact: boolean): void => {
    if (refs === undefined) {
      return;
    }
    usedFastIndex = true;
    hasExactFastMatch = hasExactFastMatch || exact;
    for (const ref of typeof refs === "number" ? [refs] : refs) {
      if (!prioritizeConstrainedSearch && !canAddBase()) {
        break;
      }
      const row = options.indexes.partIndex[ref];
      if (row) {
        addPartRecord(partIndexRecordFromRow(row));
      }
    }
  };

  for (const key of new Set([normalized, normalizedTokenKey])) {
    addMarkingRefs(options.indexes.markingExactIndex[key], true);
    addPartRefs(options.indexes.partExactIndex[key], true);
  }

  if (partialMatch && !hasExactFastMatch) {
    const markingProfiles = new Set(
      [normalized, normalizedTokenKey]
        .map((key) => matchingProfile(key, MARKING_PREFIX_PROFILES))
        .filter((profile): profile is string => Boolean(profile))
    );
    const partProfiles = new Set(
      [normalized, normalizedTokenKey]
        .map((key) => matchingProfile(key, PART_PREFIX_PROFILES))
        .filter((profile): profile is string => Boolean(profile))
    );
    for (const profile of markingProfiles) {
      addMarkingRefs(options.indexes.markingPrefixIndex[profile], false);
    }
    for (const profile of partProfiles) {
      addPartRefs(options.indexes.partPrefixIndex[profile], false);
    }
  }

  const fallbackThreshold = options.mode === "search" ? Math.max(1, Math.min(options.limit ?? 50, 10)) : 0;
  const shouldFallbackScan = options.mode === "search" && (!usedFastIndex || (!hasExactFastMatch && bases.length < fallbackThreshold));

  if (shouldFallbackScan) {
    for (const row of options.indexes.markingIndex) {
      if (!prioritizeConstrainedSearch && !canAddBase()) {
        break;
      }
      addMarkingRecord(markingIndexRecordFromRow(row));
    }

    for (const row of options.indexes.partIndex) {
      if (!prioritizeConstrainedSearch && !canAddBase()) {
        break;
      }
      addPartRecord(partIndexRecordFromRow(row));
    }
  }

  if (prioritizeConstrainedSearch && bases.length < Math.max(options.limit ?? 50, 1)) {
    bases.push(...deferredBases.slice(0, Math.max(0, baseLimit - bases.length)));
  }

  const hasExactMarkingMatch = bases.some((base) => base.markingMatch && base.matchKind === "exact");
  if (options.mode === "decode" && !hasExactMarkingMatch) {
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
