import { normalizePartNumber } from "../utils/normalize";
import type { FdbDataset, KnownPartNumberEntry } from "../types";

function resourceEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const entries = (raw as Record<string, unknown>).entries;
  return Array.isArray(entries) ? entries : [];
}

export function isMicronDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber);
}

export function buildKnownPartNumbers(raw: unknown): KnownPartNumberEntry[] {
  const rawEntries = resourceEntries(raw);
  const entries: KnownPartNumberEntry[] = [];
  const seen = new Set<string>();

  for (const item of rawEntries) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const pn = typeof record.pn === "string" ? normalizePartNumber(record.pn) : "";
    const vendor = typeof record.vendor === "string" ? record.vendor.trim() : "";
    if (!pn || !vendor) {
      continue;
    }

    const key = `${vendor}\0${pn}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push({ pn, vendor });
  }

  return entries;
}

export function countFdbPartNumbers(fdb: FdbDataset): number {
  let count = 0;
  for (const partNumbers of fdb.vendors.values()) {
    count += partNumbers.size;
  }
  return count;
}

export function collectFdbControllers(fdb: FdbDataset): string[] {
  const controllers = new Set<string>();
  for (const controller of fdb.info.controllers) {
    if (controller) {
      controllers.add(controller);
    }
  }
  for (const record of fdb.flashIds.values()) {
    for (const controller of record.t ?? []) {
      if (controller) {
        controllers.add(controller);
      }
    }
  }
  for (const partNumbers of fdb.vendors.values()) {
    for (const record of partNumbers.values()) {
      for (const controller of record.t ?? []) {
        if (controller) {
          controllers.add(controller);
        }
      }
    }
  }
  return [...controllers].sort((a, b) => a.localeCompare(b));
}
