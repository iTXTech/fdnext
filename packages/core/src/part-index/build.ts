import { UNKNOWN } from "../constants";
import type { FdnextChipKind, FdnextProductType } from "../result";
import { normalizeFlashId, normalizePartNumber, normalizePartNumberTokenKey } from "../utils/normalize";
import { sourceWeight, vendorKey } from "./scoring";
import type {
  BuildNormalizedIndexesInput,
  CompactPostingIndex,
  IdentifierIndexRecord,
  IndexRefBucket,
  MarkingIndexRecord,
  MarkingIndexSource,
  NormalizedIndexes,
  PartSearchIndexes,
  PartIndexRecord,
  PartIndexSource,
  VendorIndexRecord
} from "./types";

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedRefs(length: number, keyAt: (ref: number) => string): readonly number[] {
  return Object.freeze(
    Array.from({ length }, (_, ref) => ref).sort((a, b) => compareText(keyAt(a), keyAt(b)) || a - b)
  );
}

function addTrigrams(target: Set<string>, value: string): void {
  for (let index = 0; index <= value.length - 3; index += 1) {
    target.add(value.slice(index, index + 3));
  }
}

const POSTING_LENGTH_BASE = 65_536;

function buildTrigramRefs(length: number, valuesAt: (ref: number) => readonly string[]): CompactPostingIndex {
  const refsByTrigram = new Map<string, number[]>();
  for (let ref = 0; ref < length; ref += 1) {
    const recordTrigrams = new Set<string>();
    for (const value of valuesAt(ref)) {
      addTrigrams(recordTrigrams, value);
    }
    for (const trigram of recordTrigrams) {
      const refs = refsByTrigram.get(trigram);
      if (refs) {
        refs.push(ref);
      } else {
        refsByTrigram.set(trigram, [ref]);
      }
    }
  }
  let totalRefs = 0;
  for (const refs of refsByTrigram.values()) {
    totalRefs += refs.length;
  }
  const flattenedRefs = new Uint32Array(totalRefs);
  const spans = new Map<string, number>();
  let offset = 0;
  for (const [trigram, refs] of refsByTrigram) {
    if (refs.length >= POSTING_LENGTH_BASE) {
      throw new RangeError(`Trigram posting ${trigram} exceeds ${POSTING_LENGTH_BASE - 1} records`);
    }
    flattenedRefs.set(refs, offset);
    spans.set(trigram, offset * POSTING_LENGTH_BASE + refs.length);
    offset += refs.length;
  }
  return Object.freeze({ spans, refs: flattenedRefs });
}

function lazyPostingIndex(build: () => CompactPostingIndex): () => CompactPostingIndex {
  let cached: CompactPostingIndex | undefined;
  return Object.freeze(() => (cached ??= build()));
}

function buildPartSearchIndexes(
  partIndex: readonly PartIndexRecord[],
  markingIndex: readonly MarkingIndexRecord[]
): PartSearchIndexes {
  return Object.freeze({
    partNormalizedRefs: sortedRefs(partIndex.length, (ref) => partIndex[ref]?.normalizedPartNumber ?? ""),
    partTokenRefs: sortedRefs(partIndex.length, (ref) => partIndex[ref]?.partNumberTokenKey ?? ""),
    markingCodeRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.markingCode ?? ""),
    markingTokenRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.markingTokenKey ?? ""),
    markingPartRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.normalizedPartNumber ?? ""),
    markingPartTokenRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.partNumberTokenKey ?? ""),
    partTrigramRefs: lazyPostingIndex(() =>
      buildTrigramRefs(partIndex.length, (ref) => [partIndex[ref]?.partNumberTokenKey ?? ""])
    ),
    markingTrigramRefs: lazyPostingIndex(() =>
      buildTrigramRefs(markingIndex.length, (ref) => [
        markingIndex[ref]?.markingTokenKey ?? "",
        markingIndex[ref]?.partNumberTokenKey ?? ""
      ])
    )
  });
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber) ||
    /^(?:XCBB|XCB|PR[A-Z]|S[A-Z]{1,2})(?:[0-9]+M|[0-9]+G)[0-9]{1,2}[A-Z0-9]/.test(partNumber);
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

function addIndexRef(index: Map<string, IndexRefBucket>, key: string, ref: number): void {
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

function addExactIndexKeys(index: Map<string, IndexRefBucket>, value: string, ref: number): void {
  addIndexRef(index, value, ref);
  addIndexRef(index, normalizePartNumberTokenKey(value), ref);
}

function chipKindForMdbPart(partNumber: string): FdnextChipKind {
  return isDramPartNumber(partNumber) ? "dram" : "raw_nand";
}

export function buildNormalizedIndexes(input: BuildNormalizedIndexesInput): NormalizedIndexes {
  const partRecords = new Map<string, PartIndexRecord>();
  const identifierIndex = new Map<string, IdentifierIndexRecord>();
  const markingIndex: MarkingIndexRecord[] = [];
  const vendorIndex = new Map<string, VendorIndexRecord>();

  const addPart = (
    vendor: string,
    partNumberRaw: string,
    chipKind: FdnextChipKind,
    source: PartIndexSource,
    productType?: FdnextProductType,
    markingCodeRaw?: string
  ): void => {
    const partNumber = normalizePartNumber(partNumberRaw);
    const markingCode = markingCodeRaw ? normalizeMarkingCode(markingCodeRaw) : "";
    if (!vendor || !partNumber) {
      return;
    }
    addPartRecord(partRecords, {
      partNumber,
      normalizedPartNumber: partNumber,
      partNumberTokenKey: normalizePartNumberTokenKey(partNumber),
      vendor,
      chipKind,
      ...(productType ? { productType } : {}),
      ...(markingCode ? { markingCode } : {}),
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
      markingTokenKey: normalizePartNumberTokenKey(markingCode),
      vendor,
      partNumber,
      normalizedPartNumber: partNumber,
      partNumberTokenKey: normalizePartNumberTokenKey(partNumber),
      chipKind,
      source
    };
    markingIndex.push(record);
    createVendorIndexRecord(vendorIndex, vendor).markings.add(markingCode);
    addPart(vendor, partNumber, chipKind, "mdb", undefined, markingCode);
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

  const partIndex = [...partRecords.values()];
  const partExactIndex = new Map<string, IndexRefBucket>();
  const markingExactIndex = new Map<string, IndexRefBucket>();

  partIndex.forEach((record, ref) => {
    addExactIndexKeys(partExactIndex, record.normalizedPartNumber, ref);
  });

  markingIndex.forEach((record, ref) => {
    addExactIndexKeys(markingExactIndex, record.markingCode, ref);
  });

  return {
    partIndex,
    identifierIndex,
    markingIndex,
    partExactIndex,
    markingExactIndex,
    vendorIndex,
    search: buildPartSearchIndexes(partIndex, markingIndex)
  };
}
