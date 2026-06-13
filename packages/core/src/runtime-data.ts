export const FDNEXT_RUNTIME_DATA_VERSION = "fdnext.runtime.v1" as const;

export type RuntimeIndexRefBucket = number | number[];
export type RuntimeTupleValue = string | number | string[] | null;
export type RuntimePartNumberTuple = RuntimeTupleValue[];
export type RuntimeFlashIdTuple = Array<number | string[] | null>;
export type RuntimePartIndexRow = [string, string, string, string, string | null, string | null, string];
export type RuntimeMarkingIndexRow = [string, string, string, string, string, string | null, string];
export type RuntimeControllerGroupRow = [string, number, string[], 0 | 1];

export interface FdnextRuntimeData {
  v: typeof FDNEXT_RUNTIME_DATA_VERSION;
  src: string;
  d: {
    f: {
      i: [string, string, string, string];
      p: Record<string, Record<string, RuntimePartNumberTuple>>;
      id: Record<string, RuntimeFlashIdTuple>;
      tk: Record<string, Record<string, string>>;
      ct: string[];
    };
    m: {
      mi: Record<string, string>;
      sp: Record<string, string[]>;
      dc: Record<string, string[]>;
      mk: string[];
    };
    s: {
      p: RuntimePartIndexRow[];
      m: RuntimeMarkingIndexRow[];
      id: string[];
      pe: Record<string, RuntimeIndexRefBucket>;
      pp: Record<string, RuntimeIndexRefBucket>;
      me: Record<string, RuntimeIndexRefBucket>;
      mp: Record<string, RuntimeIndexRefBucket>;
    };
    c: {
      n: {
        fid: number;
        pn: number;
        fbga: number;
      };
      ct: string[];
      dg: string[] | "all";
      g: RuntimeControllerGroupRow[];
    };
    l: {
      k: string[];
      eng: string[];
      chs: string[];
    };
  };
}

export type RuntimeFdbSection = FdnextRuntimeData["d"]["f"];
export type RuntimeMdbSection = FdnextRuntimeData["d"]["m"];
export type RuntimeSearchSection = FdnextRuntimeData["d"]["s"];
export type RuntimeCapabilitySection = FdnextRuntimeData["d"]["c"];
export type RuntimeLanguageSection = FdnextRuntimeData["d"]["l"];

export type RuntimeDataFetch = typeof fetch;

export interface RuntimeDataLoadOptions {
  runtimeData?: unknown;
  runtimeDataUrl?: string | URL;
  fetch?: RuntimeDataFetch;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function assertRuntimeDataHeader(value: unknown): FdnextRuntimeData {
  const record = asRecord(value);
  if (record.v !== FDNEXT_RUNTIME_DATA_VERSION) {
    throw new Error(`Unsupported fdnext runtime data version: ${String(record.v ?? "")}`);
  }
  if (typeof record.src !== "string" || !/^[0-9A-F]{8}$/.test(record.src)) {
    throw new Error("fdnext runtime data src must be 8 uppercase CRC32 hex characters");
  }
  return value as FdnextRuntimeData;
}

export async function loadRuntimeData(options: RuntimeDataLoadOptions, embedded?: unknown): Promise<FdnextRuntimeData> {
  if (options.runtimeData !== undefined) {
    return assertRuntimeDataHeader(options.runtimeData);
  }
  if (options.runtimeDataUrl !== undefined) {
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new Error("runtimeDataUrl requires a fetch implementation");
    }
    const response = await fetchImpl(options.runtimeDataUrl);
    if (!response.ok) {
      throw new Error(`Unable to load fdnext runtime data: HTTP ${response.status}`);
    }
    return assertRuntimeDataHeader(await response.json());
  }
  if (embedded !== undefined) {
    return assertRuntimeDataHeader(embedded);
  }
  throw new Error("runtimeData or runtimeDataUrl is required");
}

export function languagePacksFromRuntimeData(section: RuntimeLanguageSection): Record<string, Record<string, string>> {
  const eng: Record<string, string> = {};
  const chs: Record<string, string> = {};
  for (let i = 0; i < section.k.length; i += 1) {
    const key = section.k[i];
    if (!key) {
      continue;
    }
    eng[key] = section.eng[i] ?? key;
    chs[key] = section.chs[i] ?? key;
  }
  return { eng, chs };
}
