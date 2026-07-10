import { UNKNOWN } from "../constants";
import { draftDensity, draftField, draftVendor } from "../draft";
import { asRecord, inferChipKindFromDraft, inferProductTypeFromDraft, isKnownInfoValue, normalizeInfoText } from "../device-inference";
import type { FdnextProductType, OperationConstraints, ResultWarning } from "../result";
import type { PartDecodeDraft } from "../types";
import { normalizePartNumber, normalizePartNumberTokenKey } from "../utils/normalize";
import { contains } from "../utils/string";
import { shouldPreferDecodedClassification, sourceWeight, vendorMatches } from "./scoring";
import type {
  ClassifyPartOptions,
  IndexRefBucket,
  MarkingIndexRecord,
  PartClassification,
  PartClassificationCandidate,
  PartIndexRecord
} from "./types";

function matchKind(
  value: string,
  valueTokenKey: string,
  query: string,
  queryTokenKey: string,
  partialMatch: boolean
): "exact" | "prefix" | "contains" | null {
  if (value === query) {
    return "exact";
  }
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
  // Search order must not change merely because a DecodePack starts exposing another field.
  // Keeping search rank resource/match based also lets explicit top-K searches project only the selected candidates.
  const decodeQualityScore = options.mode === "decode"
    ? options.decoderPriority(base.partNumber) + tokenCompleteness(info) + vendorConsistency(constrainedBase.vendor, info)
    : 0;
  const score =
    sourceWeight(base.source) +
    matchWeight(base.matchKind) +
    decodeQualityScore +
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

function dedupeCandidateBases(
  candidates: Array<Omit<PartClassificationCandidate, "score" | "warnings" | "info">>
): Array<Omit<PartClassificationCandidate, "score" | "warnings" | "info">> {
  const best = new Map<string, Omit<PartClassificationCandidate, "score" | "warnings" | "info">>();
  for (const candidate of candidates) {
    const key = `${candidate.vendor}\0${candidate.normalizedPartNumber}\0${candidate.chipKind}`;
    const existing = best.get(key);
    const score = candidateBaseScore(candidate);
    const existingScore = existing ? candidateBaseScore(existing) : -1;
    if (!existing || score > existingScore || (score === existingScore && candidate.markingCode && !existing.markingCode)) {
      best.set(key, candidate);
    }
  }
  return [...best.values()].sort(
    (a, b) => candidateBaseScore(b) - candidateBaseScore(a) || a.normalizedPartNumber.localeCompare(b.normalizedPartNumber)
  );
}

function candidateBaseScore(candidate: Omit<PartClassificationCandidate, "score" | "warnings" | "info">): number {
  return sourceWeight(candidate.source) + matchWeight(candidate.matchKind);
}

function hasPartSearchConstraints(constraints: Omit<OperationConstraints, "idScheme">): boolean {
  return Boolean(constraints.vendor || constraints.chipKind || constraints.productType);
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
  const seenBaseKeys = new Set<string>();
  const addBase = (base: Omit<PartClassificationCandidate, "score" | "warnings" | "info">): void => {
    const key = `${base.source}\0${base.vendor}\0${base.normalizedPartNumber}\0${base.chipKind}\0${base.markingCode ?? ""}\0${base.markingMatch ? "marking" : "part"}`;
    if (seenBaseKeys.has(key)) {
      return;
    }
    seenBaseKeys.add(key);
    bases.push(base);
  };

  const normalizedTokenKey = normalizePartNumberTokenKey(normalized);

  const addMarkingRecord = (record: MarkingIndexRecord): void => {
    const byCode = matchKind(record.markingCode, record.markingTokenKey, normalized, normalizedTokenKey, partialMatch);
    const byPart = matchKind(
      record.normalizedPartNumber,
      record.partNumberTokenKey,
      normalized,
      normalizedTokenKey,
      partialMatch
    );
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
    const match = matchKind(
      record.normalizedPartNumber,
      record.partNumberTokenKey,
      normalized,
      normalizedTokenKey,
      partialMatch
    );
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

  const addMarkingRefs = (refs: IndexRefBucket | undefined): void => {
    if (refs === undefined) {
      return;
    }
    for (const ref of typeof refs === "number" ? [refs] : refs) {
      const record = options.indexes.markingIndex[ref];
      if (record) {
        addMarkingRecord(record);
      }
    }
  };

  const addPartRefs = (refs: IndexRefBucket | undefined): void => {
    if (refs === undefined) {
      return;
    }
    for (const ref of typeof refs === "number" ? [refs] : refs) {
      const record = options.indexes.partIndex[ref];
      if (record) {
        addPartRecord(record);
      }
    }
  };

  if (options.mode === "search" && partialMatch) {
    for (const record of options.indexes.markingIndex) {
      addMarkingRecord(record);
    }

    for (const record of options.indexes.partIndex) {
      addPartRecord(record);
    }
  } else {
    for (const key of new Set([normalized, normalizedTokenKey])) {
      addMarkingRefs(options.indexes.markingExactIndex.get(key));
      addPartRefs(options.indexes.partExactIndex.get(key));
    }
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

  const candidateBases = dedupeCandidateBases(bases);
  const enrichBases = (
    pending: Array<Omit<PartClassificationCandidate, "score" | "warnings" | "info">>
  ): PartClassificationCandidate[] => pending
    .map((candidate) => enrichCandidate(candidate, constraints, options))
    .filter((candidate): candidate is PartClassificationCandidate => Boolean(candidate));

  let enriched: PartClassificationCandidate[];
  if (options.mode === "search" && options.limit && options.limit > 0 && !hasPartSearchConstraints(constraints)) {
    const batchSize = Math.max(options.limit, 16);
    const collected: PartClassificationCandidate[] = [];
    enriched = [];
    for (let offset = 0; offset < candidateBases.length; offset += batchSize) {
      collected.push(...enrichBases(candidateBases.slice(offset, offset + batchSize)));
      enriched = dedupeCandidates(collected);
      if (enriched.length >= options.limit) {
        break;
      }
    }
  } else {
    enriched = dedupeCandidates(enrichBases(candidateBases));
  }
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
