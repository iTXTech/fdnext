import { VENDOR_PATCH } from "./constants.js";
import type { FdbDataset, FlashIdRecord, MdbDataset, PartNumberRecord } from "./types.js";

function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function buildFdb(rawInput: Record<string, unknown>): FdbDataset {
  const raw = asRecord(rawInput);
  const info = asRecord(raw.info);
  const infoControllers = Array.isArray(info.controllers) ? info.controllers.map(String) : [];

  const vendors = new Map<string, Map<string, PartNumberRecord>>();
  const flashIds = new Map<string, FlashIdRecord>();

  const iddb = asRecord(raw.iddb);
  for (const [flashId, value] of Object.entries(iddb)) {
    const data = asRecord(value);
    flashIds.set(flashId.toUpperCase(), {
      id: flashId.toUpperCase(),
      s: typeof data.s === "number" ? data.s : undefined,
      p: typeof data.p === "number" ? data.p : undefined,
      b: typeof data.b === "number" ? data.b : undefined,
      t: Array.isArray(data.t) ? data.t.map(String) : [],
      n: Array.isArray(data.n) ? data.n.map(String) : []
    });
  }

  for (const [vendorName, value] of Object.entries(raw)) {
    if (vendorName === "info" || vendorName === "iddb") {
      continue;
    }

    const vendorMap = new Map<string, PartNumberRecord>();
    for (const [pn, pnDataRaw] of Object.entries(asRecord(value))) {
      const pnData = asRecord(pnDataRaw);
      vendorMap.set(pn.toUpperCase(), {
        pn: pn.toUpperCase(),
        id: Array.isArray(pnData.id) ? pnData.id.map(String) : [],
        l: typeof pnData.l === "string" ? pnData.l : undefined,
        c: typeof pnData.c === "string" ? pnData.c : undefined,
        t: Array.isArray(pnData.t) ? pnData.t.map(String) : [],
        m: typeof pnData.m === "string" ? pnData.m : undefined,
        d: typeof pnData.d === "number" ? pnData.d : undefined,
        e: typeof pnData.e === "number" ? pnData.e : undefined,
        r: typeof pnData.r === "number" ? pnData.r : undefined,
        n: typeof pnData.n === "number" ? pnData.n : undefined
      });
    }

    vendors.set(normalizeVendor(vendorName), vendorMap);
  }

  return {
    info: {
      name: String(info.name ?? "iTXTech FlashDetector Flash Database"),
      version: String(info.version ?? "0"),
      website: String(info.website ?? ""),
      time: String(info.time ?? ""),
      controllers: infoControllers
    },
    vendors,
    flashIds
  };
}

export function buildMdb(rawInput: Record<string, unknown>): MdbDataset {
  const raw = asRecord(rawInput);
  const micronRaw = asRecord(raw.micron);
  const spectekRaw = asRecord(raw.spectek);

  const micron: Record<string, string> = {};
  for (const [code, partNumber] of Object.entries(micronRaw)) {
    micron[code.toUpperCase()] = String(partNumber).toUpperCase();
  }

  const spectek: Record<string, string[]> = {};
  for (const [code, partNumbers] of Object.entries(spectekRaw)) {
    if (Array.isArray(partNumbers)) {
      spectek[code.toUpperCase()] = partNumbers.map((value) => String(value).toUpperCase());
    }
  }

  return { micron, spectek };
}

export function getPartNumberRecord(
  fdb: FdbDataset,
  vendor: string,
  partNumber: string
): PartNumberRecord | undefined {
  const vendorData = fdb.vendors.get(normalizeVendor(vendor));
  return vendorData?.get(partNumber.toUpperCase());
}

export function findPartNumberAcrossVendors(
  fdb: FdbDataset,
  partNumber: string
): { vendor: string; record: PartNumberRecord } | undefined {
  const target = partNumber.toUpperCase();
  for (const [vendor, partNumbers] of fdb.vendors.entries()) {
    const record = partNumbers.get(target);
    if (record) {
      return { vendor, record };
    }
  }
  return undefined;
}

export function findFlashIdRecord(fdb: FdbDataset, flashId: string): FlashIdRecord | undefined {
  return fdb.flashIds.get(flashId.toUpperCase());
}
