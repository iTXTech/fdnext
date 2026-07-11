import type { FdnextChipKind, FdnextProductType } from "../result";
import { normalizePartNumber, normalizePartNumberTokenKey } from "../utils/normalize";
import { sourceWeight, vendorKey } from "./scoring";
import type {
  BuildNormalizedIndexesInput,
  CompactPostingIndex,
  MarkingIndexRecord,
  MarkingIndexSource,
  NormalizedIndexes,
  PartSearchIndexes,
  PartIndexRecord,
  PartIndexSource
} from "./types";

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedRefs(length: number, keyAt: (ref: number) => string): Uint32Array {
  return Uint32Array.from(
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

function buildPartSearchIndexes(
  partIndex: readonly PartIndexRecord[],
  markingIndex: readonly MarkingIndexRecord[]
): PartSearchIndexes {
  return Object.freeze({
    partNormalizedRefs: sortedRefs(partIndex.length, (ref) => partIndex[ref]?.partNumber ?? ""),
    partTokenRefs: sortedRefs(partIndex.length, (ref) => partIndex[ref]?.partNumberTokenKey ?? ""),
    markingCodeRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.markingCode ?? ""),
    markingPartRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.partNumber ?? ""),
    markingPartTokenRefs: sortedRefs(markingIndex.length, (ref) => markingIndex[ref]?.partNumberTokenKey ?? ""),
    partTrigramRefs: buildTrigramRefs(partIndex.length, (ref) => [partIndex[ref]?.partNumberTokenKey ?? ""]),
    markingTrigramRefs: buildTrigramRefs(markingIndex.length, (ref) => [
      markingIndex[ref]?.markingCode ?? "",
      markingIndex[ref]?.partNumberTokenKey ?? ""
    ])
  });
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber) ||
    /^(?:XCBB|XCB|PR[A-Z]|S[A-Z]{1,2})(?:[0-9]+M|[0-9]+G)[0-9]{1,2}[A-Z0-9]/.test(partNumber);
}

function addPartRecord(records: Map<string, PartIndexRecord>, record: PartIndexRecord): void {
  const key = `${vendorKey(record.vendor)}\0${record.partNumber}\0${record.chipKind}`;
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

function chipKindForMdbPart(partNumber: string): FdnextChipKind {
  return isDramPartNumber(partNumber) ? "dram" : "raw_nand";
}

export function buildNormalizedIndexes(input: BuildNormalizedIndexesInput): NormalizedIndexes {
  const partRecords = new Map<string, PartIndexRecord>();
  const markingIndex: MarkingIndexRecord[] = [];

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
      partNumberTokenKey: normalizePartNumberTokenKey(partNumber),
      vendor,
      chipKind,
      ...(productType ? { productType } : {}),
      ...(markingCode ? { markingCode } : {}),
      source
    });
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
      partNumberTokenKey: normalizePartNumberTokenKey(partNumber),
      chipKind,
      source
    };
    markingIndex.push(record);
    addPart(vendor, partNumber, chipKind, "mdb", undefined, markingCode);
  };

  for (const [code, partNumber] of Object.entries(input.mdb.micron)) {
    addMarking("micron", code, partNumber, "micron_fbga");
  }

  for (const [code, partNumbers] of Object.entries(input.mdb.spectek)) {
    for (const partNumber of partNumbers) {
      addMarking("spectek", code, partNumber, "spectek_fbga");
    }
  }

  const partIndex = [...partRecords.values()];

  return {
    partIndex,
    markingIndex,
    search: buildPartSearchIndexes(partIndex, markingIndex)
  };
}
