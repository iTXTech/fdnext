import type { CompactPostingIndex, MarkingIndexRecord, NormalizedIndexes, PartIndexRecord } from "./types";

const POSTING_LENGTH_BASE = 65_536;

function lowerBound(
  refs: readonly number[],
  keyAt: (ref: number) => string,
  query: string
): number {
  let low = 0;
  let high = refs.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    const ref = refs[middle];
    if (ref !== undefined && keyAt(ref) < query) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

function prefixRefs(
  refs: readonly number[],
  keyAt: (ref: number) => string,
  query: string,
  target: Set<number>
): void {
  let index = lowerBound(refs, keyAt, query);
  while (index < refs.length) {
    const ref = refs[index];
    if (ref === undefined) {
      index += 1;
      continue;
    }
    const key = keyAt(ref);
    if (!key.startsWith(query)) {
      break;
    }
    target.add(ref);
    index += 1;
  }
}

function queryTrigrams(query: string): string[] {
  const result = new Set<string>();
  for (let index = 0; index <= query.length - 3; index += 1) {
    result.add(query.slice(index, index + 3));
  }
  return [...result];
}

function rarestPosting(
  postings: CompactPostingIndex,
  query: string
): Iterable<number> | undefined {
  if (query.length < 3) {
    return undefined;
  }
  let bestOffset = 0;
  let bestLength = Number.POSITIVE_INFINITY;
  for (const trigram of queryTrigrams(query)) {
    const span = postings.spans.get(trigram);
    if (span === undefined) {
      return [];
    }
    const length = span % POSTING_LENGTH_BASE;
    if (length < bestLength) {
      bestLength = length;
      bestOffset = (span - length) / POSTING_LENGTH_BASE;
    }
  }
  return Number.isFinite(bestLength)
    ? postings.refs.subarray(bestOffset, bestOffset + bestLength)
    : [];
}

export function partPrefixCandidateRefs(
  indexes: NormalizedIndexes,
  normalized: string,
  tokenKey: string
): ReadonlySet<number> | undefined {
  const search = indexes.search;
  if (!search) {
    return undefined;
  }
  const result = new Set<number>();
  const partAt = (ref: number): PartIndexRecord | undefined => indexes.partIndex[ref];
  prefixRefs(search.partNormalizedRefs, (ref) => partAt(ref)?.normalizedPartNumber ?? "", normalized, result);
  prefixRefs(search.partTokenRefs, (ref) => partAt(ref)?.partNumberTokenKey ?? "", tokenKey, result);
  return result;
}

export function markingPrefixCandidateRefs(
  indexes: NormalizedIndexes,
  normalized: string,
  tokenKey: string
): ReadonlySet<number> | undefined {
  const search = indexes.search;
  if (!search) {
    return undefined;
  }
  const result = new Set<number>();
  const markingAt = (ref: number): MarkingIndexRecord | undefined => indexes.markingIndex[ref];
  prefixRefs(search.markingCodeRefs, (ref) => markingAt(ref)?.markingCode ?? "", normalized, result);
  prefixRefs(search.markingTokenRefs, (ref) => markingAt(ref)?.markingTokenKey ?? "", tokenKey, result);
  prefixRefs(search.markingPartRefs, (ref) => markingAt(ref)?.normalizedPartNumber ?? "", normalized, result);
  prefixRefs(search.markingPartTokenRefs, (ref) => markingAt(ref)?.partNumberTokenKey ?? "", tokenKey, result);
  return result;
}

export function partContainsCandidateRefs(
  indexes: NormalizedIndexes,
  tokenKey: string
): Iterable<number> | undefined {
  return indexes.search ? rarestPosting(indexes.search.partTrigramRefs(), tokenKey) : undefined;
}

export function markingContainsCandidateRefs(
  indexes: NormalizedIndexes,
  tokenKey: string
): Iterable<number> | undefined {
  return indexes.search ? rarestPosting(indexes.search.markingTrigramRefs(), tokenKey) : undefined;
}
