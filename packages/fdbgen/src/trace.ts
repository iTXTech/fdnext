export interface FdbProvenanceSource {
  controller?: string;
  directory?: string;
  filename?: string;
  file?: string;
  line?: number;
  recordIndex?: number;
  raw?: string;
}

export interface FdbProvenanceRecord {
  target: "part" | "flash";
  decision: string;
  vendor?: string;
  partNumber?: string;
  flashId?: string;
  source?: FdbProvenanceSource;
  raw?: Record<string, unknown>;
  normalized?: Record<string, unknown>;
}

export interface FdbProvenanceLookup {
  part(vendor: string, partNumber: string): FdbProvenanceRecord[];
  flash(flashId: string): FdbProvenanceRecord[];
}

export interface FdbProvenanceTrace extends FdbProvenanceLookup {
  records: FdbProvenanceRecord[];
  record(record: FdbProvenanceRecord): void;
}

function partTraceKey(vendor: string, partNumber: string): string {
  return `${vendor.toLowerCase()} ${partNumber.toUpperCase()}`;
}

function flashTraceKey(flashId: string): string {
  return flashId.toUpperCase();
}

function compactRaw(raw: string): string {
  return raw.length > 240 ? `${raw.slice(0, 237)}...` : raw;
}

export function mergeProvenanceSource(base: FdbProvenanceSource | undefined, patch: FdbProvenanceSource): FdbProvenanceSource {
  return {
    ...(base ?? {}),
    ...patch,
    ...(patch.raw ? { raw: compactRaw(patch.raw) } : {})
  };
}

export function createFdbProvenanceTrace(): FdbProvenanceTrace {
  const records: FdbProvenanceRecord[] = [];
  const parts = new Map<string, FdbProvenanceRecord[]>();
  const flashes = new Map<string, FdbProvenanceRecord[]>();

  function addToIndex(map: Map<string, FdbProvenanceRecord[]>, key: string, record: FdbProvenanceRecord): void {
    const existing = map.get(key) ?? [];
    existing.push(record);
    map.set(key, existing);
  }

  return {
    records,
    record(record) {
      records.push(record);
      if (record.vendor && record.partNumber) {
        addToIndex(parts, partTraceKey(record.vendor, record.partNumber), record);
      }
      if (record.flashId) {
        addToIndex(flashes, flashTraceKey(record.flashId), record);
      }
    },
    part(vendor, partNumber) {
      return parts.get(partTraceKey(vendor, partNumber)) ?? [];
    },
    flash(flashId) {
      return flashes.get(flashTraceKey(flashId)) ?? [];
    }
  };
}
