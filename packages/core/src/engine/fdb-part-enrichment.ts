import { UNKNOWN } from "../constants";
import { draftField, draftPartNumber, draftVendor, setDraftField } from "../draft";
import { inferVendorFromPartNumber, normalizeVendor } from "../fdb-lookup";
import { findFlashIdRecord, getPartNumberRecord } from "../fdb";
import type { ResultWarning } from "../result";
import type { FdbDataset, IdentifierDecodeDraft, PartDecodeDraft, PartNumberRecord } from "../types";
import { normalizePartNumber } from "../utils/normalize";
import { mergeStringArray } from "./common";
import { isKnownClassificationValue } from "./field-normalization";

export type FdbPartEnricher = (info: PartDecodeDraft, lookupPartNumber?: string) => PartDecodeDraft;
export interface FdbPartRecordMatch {
  vendor: string;
  record: PartNumberRecord;
}

export function findFdbPartRecords(fdb: FdbDataset, partNumber: string): FdbPartRecordMatch[] {
  const normalized = normalizePartNumber(partNumber);
  if (!normalized) {
    return [];
  }
  const result: FdbPartRecordMatch[] = [];
  const seen = new Set<string>();
  const addVendor = (vendor: string | undefined): void => {
    if (!vendor || seen.has(vendor)) {
      return;
    }
    seen.add(vendor);
    const record = getPartNumberRecord(fdb, vendor, normalized);
    if (record) {
      result.push({ vendor, record });
    }
  };

  addVendor(inferVendorFromPartNumber(normalized) ?? undefined);
  for (const vendor of fdb.vendors.keys()) {
    addVendor(vendor);
  }
  return result;
}

export function createFdbPartEnricher(
  fdb: FdbDataset,
  decodeNandFlashIdRaw: (id: string) => IdentifierDecodeDraft
): FdbPartEnricher {
  const dieProfileFromIdentifiers = (ids: string[] | undefined): string | undefined => {
    const profiles = new Set<string>();
    for (const id of ids ?? []) {
      const decoded = decodeNandFlashIdRaw(id);
      const dieProfile = typeof draftField(decoded, "die_codename") === "string" ? String(draftField(decoded, "die_codename")).trim() : "";
      if (dieProfile && dieProfile !== UNKNOWN) {
        profiles.add(dieProfile);
      }
    }
    return profiles.size === 1 ? [...profiles][0] : undefined;
  };

  const samsungSpecialOptionFromFdbMetadata = (vendor: string | undefined, record: PartNumberRecord, chipKind: string | undefined): string | undefined => {
    if (normalizeVendor(vendor ?? "") !== "samsung" || chipKind !== "raw_nand") {
      return undefined;
    }
    const metadata = record.m?.trim();
    if (!metadata) {
      return undefined;
    }
    const upper = metadata.toUpperCase();
    return /(?:^|[^A-Z0-9])CER(?:[^A-Z0-9]|$)|CERCE\d|CER_(?:SLC|MLC|TLC|QLC)/.test(upper) ? "CER" : undefined;
  };

  const mergeSpecialOption = (current: unknown, option: string): string => {
    const text = typeof current === "string" ? current.trim() : "";
    if (!text) {
      return option;
    }
    return text.split(/\s*;\s*/).includes(option) ? text : `${text}; ${option}`;
  };

  const normalizeLegacyFdbProcessProfileToken = (token: string): string => {
    const upper = token.toUpperCase();
    if (/^[0-9]{2,3}NM$/.test(upper)) {
      return `${upper.slice(0, -2)}nm`;
    }
    if (upper === "1YNM" || upper === "1ZNM") {
      return upper.toLowerCase();
    }
    if (upper === "A19NM") {
      return "A19nm";
    }
    const bics = /^([KS])BICS([0-9])(?:\.?5)?([MQS])?$/.exec(upper);
    if (bics?.[1] && bics[2]) {
      const half = upper.includes("45") || upper.includes(".5") ? ".5" : "";
      return `${bics[1]}BiCS${bics[2]}${half}${bics[3] ?? ""}`;
    }
    return upper;
  };

  const legacyFdbProcessDieProfile = (value: string | undefined): string | undefined => {
    const normalized = value?.toUpperCase().replaceAll(/[()]/g, " ") ?? "";
    const specific = normalized.match(
      /\b(?:[BLMN][0-9][0-9A-Z]{2}|[BLMN][0-9]{2}|HYV[0-9](?:[MQ])?|HY[0-9]{2}M?|SSV[0-9](?:[EMPQ])?|SS[0-9]{2}M?|SS2D|[KS](?:BICS[0-9](?:\.?5)?[MQS]?|[0-9][TSF][0-9A-Z]{2})|(?:TSB|SNK)[0-9A-Z]+)\b/g
    );
    if (specific?.[0]) {
      return normalizeLegacyFdbProcessProfileToken(specific[0]);
    }
    const fallback = normalized.match(/\b(?:[0-9]{2,3}NM|1[YZ]NM|A19NM|3DV[0-9](?:P5)?)\b/g);
    return fallback?.[0] ? normalizeLegacyFdbProcessProfileToken(fallback[0]) : undefined;
  };

  const legacyFdbProcessText = (value: string | undefined): string | undefined => {
    const text = value?.trim().replaceAll(/\s+/g, " ");
    return text && text !== UNKNOWN ? text : undefined;
  };

  const appendWarning = (info: PartDecodeDraft, warning: ResultWarning): void => {
    const existing = info.warnings ?? [];
    if (!existing.some((item) => item.code === warning.code && item.fieldKey === warning.fieldKey && item.message === warning.message)) {
      info.warnings = [...existing, warning];
    }
  };

  const matchingFdbRecords = (partNumbers: string[]): Array<{ vendor: string; record: PartNumberRecord }> => {
    const result: Array<{ vendor: string; record: PartNumberRecord }> = [];
    const seen = new Set<string>();
    for (const rawPartNumber of partNumbers) {
      for (const { vendor, record } of findFdbPartRecords(fdb, rawPartNumber)) {
        const key = `${vendor}\0${record.pn}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push({ vendor, record });
      }
    }
    return result;
  };

  const combineFromFdb = (info: PartDecodeDraft, lookupPartNumber = draftPartNumber(info)): PartDecodeDraft => {
    const lookupPartNumbers = [
      ...new Set(
        [draftPartNumber(info), lookupPartNumber, ...(info.meta?.lookupPartNumbers ?? [])]
          .map((item) => normalizePartNumber(item))
          .filter(Boolean)
      )
    ];
    const allMatches = matchingFdbRecords(lookupPartNumbers);
    const allControllers = allMatches.flatMap(({ record }) => record.t ?? []);
    if (allControllers.length > 0) {
      info.controllers = mergeStringArray(info.controllers, allControllers);
    }

    let byVendor: PartNumberRecord | undefined;
    for (const partNumber of lookupPartNumbers) {
      byVendor = getPartNumberRecord(fdb, draftVendor(info), partNumber);
      if (byVendor) {
        break;
      }
    }

    let byAny: { vendor: string; record: PartNumberRecord } | undefined;
    if (!byVendor) {
      for (const partNumber of lookupPartNumbers) {
        byAny = findFdbPartRecords(fdb, partNumber)[0];
        if (byAny) {
          break;
        }
      }
    }
    const record = byVendor ?? byAny?.record;
    const recordVendor = byVendor ? draftVendor(info) : byAny?.vendor;

    if (!record) {
      return info;
    }

    // SpecTek package markings resolve through the Micron-like lookup path, while SpecTek PNs should not
    // inherit Micron FDB-combined geometry. The legacy FDB process string is still useful audit data.
    if (draftVendor(info) === "spectek") {
      if (!isKnownClassificationValue(draftField(info, "die_codename"))) {
        const dieProfile = legacyFdbProcessDieProfile(record.l);
        if (dieProfile) {
          setDraftField(info, "die_codename", dieProfile);
        }
      }
      const legacyProcess = legacyFdbProcessText(record.l);
      if (
        legacyProcess &&
        !isKnownClassificationValue(draftField(info, "die_codename")) &&
        !isKnownClassificationValue(draftField(info, "generation_info"))
      ) {
        setDraftField(info, "generation_info", legacyProcess);
        appendWarning(info, {
          code: "fdb_process_fallback",
          message: "Using legacy FDB process information because no die profile rule matched",
          fieldKey: "generation_info",
          severity: "info",
          details: {
            process_info: legacyProcess
          }
        });
      }
      return info;
    }

    if (!info.device.chipKind || info.device.chipKind === "unknown") {
      info.device.chipKind = "raw_nand";
    }

    if (byAny?.vendor && draftVendor(info) === UNKNOWN) {
      info.device.vendor = byAny.vendor;
    }

    const relatedFlashIds = mergeStringArray(record.id ?? [], record.f ?? []);
    info.identifiers = {
      ...(info.identifiers ?? {}),
      flashIds: mergeStringArray(info.identifiers?.flashIds, relatedFlashIds),
      partNumbers: mergeStringArray(info.identifiers?.partNumbers, record.a ?? [])
    };
    info.controllers = mergeStringArray(info.controllers, record.t ?? []);
    for (const id of info.identifiers.flashIds ?? []) {
      info.controllers = mergeStringArray(info.controllers, findFlashIdRecord(fdb, id)?.t);
    }

    if (!isKnownClassificationValue(draftField(info, "die_codename"))) {
      const dieProfile = dieProfileFromIdentifiers(relatedFlashIds) ?? legacyFdbProcessDieProfile(record.l);
      if (dieProfile) {
        setDraftField(info, "die_codename", dieProfile);
      }
    }

    const legacyProcess = legacyFdbProcessText(record.l);
    if (
      legacyProcess &&
      !isKnownClassificationValue(draftField(info, "die_codename")) &&
      !isKnownClassificationValue(draftField(info, "generation_info"))
    ) {
      setDraftField(info, "generation_info", legacyProcess);
      appendWarning(info, {
        code: "fdb_process_fallback",
        message: "Using legacy FDB process information because no die profile rule matched",
        fieldKey: "generation_info",
        severity: "info",
        details: {
          process_info: legacyProcess
        }
      });
    }

    if (!isKnownClassificationValue(draftField(info, "cell_level")) && record.c) {
      setDraftField(info, "cell_level", record.c);
    }

    if (record.d != null && record.d !== -1 && !isKnownClassificationValue(draftField(info, "die_count"))) {
      setDraftField(info, "die_count", record.d);
    }
    if (record.e != null && record.e !== -1 && !isKnownClassificationValue(draftField(info, "ce_count"))) {
      setDraftField(info, "ce_count", record.e);
    }
    if (record.r != null && record.r !== -1 && !isKnownClassificationValue(draftField(info, "rb_count"))) {
      setDraftField(info, "rb_count", record.r);
    }
    if (record.n != null && record.n !== -1 && !isKnownClassificationValue(draftField(info, "channel_count"))) {
      setDraftField(info, "channel_count", record.n);
    }
    if (record.pl != null && record.pl !== -1 && !isKnownClassificationValue(draftField(info, "plane_count"))) {
      setDraftField(info, "plane_count", record.pl);
    }
    if (record.pkg && !isKnownClassificationValue(draftField(info, "package"))) {
      setDraftField(info, "package", record.pkg);
    }
    if (record.sg && !isKnownClassificationValue(draftField(info, "speed_grade"))) {
      setDraftField(info, "speed_grade", record.sg);
    }
    if (record.pc && !isKnownClassificationValue(draftField(info, "product_class"))) {
      setDraftField(info, "product_class", record.pc);
    }
    if (record.vol) {
      setDraftField(info, "voltage", record.vol);
    }
    if (record.so) {
      setDraftField(info, "special_option", mergeSpecialOption(draftField(info, "special_option"), record.so));
    }

    const specialOption = samsungSpecialOptionFromFdbMetadata(recordVendor, record, info.device.chipKind);
    if (specialOption) {
      setDraftField(info, "special_option", mergeSpecialOption(draftField(info, "special_option"), specialOption));
    }

    return info;
  };

  return combineFromFdb;
}
