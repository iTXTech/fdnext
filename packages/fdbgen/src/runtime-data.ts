import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const FDNEXT_RUNTIME_DATA_VERSION = "fdnext.runtime.v1";

export const RUNTIME_DATA_SOURCE_FILES = [
  "fdb.json",
  "mdb.json",
  "managed-nand-pn.json",
  "dram-pn.json",
  "controller-groups.json",
  "lang/chs.json",
  "lang/eng.json"
] as const;

type JsonObject = Record<string, unknown>;
type RuntimeRefBucket = number | number[];
type NullableTupleValue = string | number | string[] | null;
type PartNumberTuple = NullableTupleValue[];
type FlashIdTuple = Array<number | string[] | null>;
type PartIndexTuple = [string, string, string, string, string | null, string | null, string];
type MarkingIndexTuple = [string, string, string, string, string, string | null, string];
type ControllerGroupTuple = [string, number, string[], 0 | 1];

interface PartNumberRecord {
  pn: string;
  id: string[];
  f?: string[];
  a?: string[];
  l?: string;
  c?: string;
  t?: string[];
  m?: string;
  pkg?: string;
  sg?: string;
  pc?: string;
  vol?: string;
  so?: string;
  d?: number;
  e?: number;
  r?: number;
  n?: number;
  pl?: number;
}

interface FlashIdRecord {
  id: string;
  s?: number;
  p?: number;
  b?: number;
  t?: string[];
  n?: string[];
}

interface FdbInfo {
  name: string;
  version: string;
  website: string;
  time: string;
  controllers: string[];
}

interface FdbDataset {
  info: FdbInfo;
  vendors: Map<string, Map<string, PartNumberRecord>>;
  flashIds: Map<string, FlashIdRecord>;
}

interface MdbDataset {
  micron: Record<string, string>;
  spectek: Record<string, string[]>;
}

interface KnownPartNumberEntry {
  pn: string;
  vendor: string;
}

interface RuntimeDataSources {
  fdb: JsonObject;
  mdb: JsonObject;
  managedNandPn: unknown;
  dramPn: unknown;
  controllerGroups: JsonObject;
  lang: Record<string, Record<string, string>>;
}

export interface RuntimeDataFile {
  v: string;
  src: string;
  d: {
    f: {
      i: [string, string, string, string];
      p: Record<string, Record<string, PartNumberTuple>>;
      id: Record<string, FlashIdTuple>;
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
      p: PartIndexTuple[];
      m: MarkingIndexTuple[];
      id: string[];
      pe: Record<string, RuntimeRefBucket>;
      pp: Record<string, RuntimeRefBucket>;
      me: Record<string, RuntimeRefBucket>;
      mp: Record<string, RuntimeRefBucket>;
    };
    c: {
      n: {
        fid: number;
        pn: number;
        fbga: number;
      };
      ct: string[];
      dg: string[] | "all";
      g: ControllerGroupTuple[];
    };
    l: {
      k: string[];
      eng: string[];
      chs: string[];
    };
  };
}

export interface RuntimeDataCheckResult {
  ok: boolean;
  expected: RuntimeDataFile;
  actual?: RuntimeDataFile;
}

export interface RuntimeDataAuditIssue {
  code: string;
  message: string;
}

export interface RuntimeDataAuditResult {
  ok: boolean;
  issues: RuntimeDataAuditIssue[];
}

const VENDOR_PATCH: Record<string, string> = {
  sandisk: "sndk",
  "san disk": "sndk",
  sndk: "sndk",
  westerndigital: "sndk",
  "western digital": "sndk",
  wd: "sndk",
  toshiba: "kioxia",
  "toshiba-iver": "kioxia",
  hynix: "skhynix",
  "giga device": "gigadevice",
  gd: "gigadevice",
  "兆易创新": "gigadevice",
  septeck: "spectek",
  stm: "st"
};

const MICRON_LIKE_PACKAGE_SUFFIXES = new Set([
  "WP", "WC", "C3", "C4", "C5", "C6", "C7", "C8", "D1", "D4", "D5", "D6", "D7",
  "G1", "G2", "G4", "G5", "G6", "G7", "G8", "G9", "H1", "H2", "H3", "H4", "H5",
  "H6", "H7", "H8", "H9", "HC", "J1", "J2", "J3", "J4", "J5", "J6", "J7", "J9",
  "K3", "K4", "K6", "K7", "K8", "K9", "L4", "M4", "M5", "M8", "M9", "MD"
]);

const SNDK_TWELVE_DIGIT_MARKING = /^[0-9]{4}[0-9A-Z][HKRPQVXEFCJGU][0-9A-Z]{6}$/;
const PART_PREFIX_PROFILES = [
  "MT29", "MTFC", "MTFD", "MT40", "MT41", "MT42", "MT43", "MT44", "MT46", "MT47",
  "MT48", "MT49", "MT51", "MT52", "MT53", "MT54", "MT58", "MT60", "MT61", "MT62",
  "MT68", "CT40", "K4", "K9", "KLM", "KLU", "H25", "H26", "H27", "H28", "H9",
  "TC58", "TH", "SDIN", "SDT", "SD"
];
const MARKING_PREFIX_PROFILES = ["C9", "D8", "D9", "Z8", "Z9", "NC", "NW", "NY", "NX", "NQ", "NV", "PF"];
const CONTROLLER_GROUP_IDS = ["all", "selected", "if:usb20", "if:usb32g1", "if:usb32g2", "if:sata", "if:nvme", "era:pre18", "era:plus18"];

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function readJsonObject(path: string): JsonObject {
  return asRecord(readJson(path));
}

function compactJson(data: unknown): string {
  return JSON.stringify(data);
}

function normalizeSourceText(text: string): string {
  return text.replaceAll(/\r\n?/g, "\n");
}

function removeChars(input: string, chars: string[]): string {
  let out = input;
  for (const char of chars) {
    out = out.replaceAll(char, "");
  }
  return out;
}

function normalizePartNumberAlias(partNumber: string): string {
  return partNumber
    .replace(/^EMT29F/, "MT29F")
    .replace(/^(H25[A-Z0-9]+)-X([0-9A-Z]+)(?:-([A-Z0-9]+))?$/, (_match, base: string, suffix: string, tail: string | undefined) => `${base}X${suffix}${tail ?? ""}`);
}

function normalizePartNumber(partNumber: string): string {
  return normalizePartNumberAlias(removeChars(partNumber.toUpperCase().replace(/\uFFFD/g, "-"), [" ", ",", "&", ".", "|"]));
}

function normalizePartNumberTokenKey(partNumber: string): string {
  return removeChars(normalizePartNumber(partNumber), [":", "-"]);
}

function normalizeFlashId(id: string): string {
  return id.toUpperCase().replace(/[^0-9A-F]/g, "");
}

function normalizeFlashIdKey(id: string): string | null {
  const normalized = id.replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return null;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : null;
}

function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function inferVendorFromPartNumber(partNumber: string): string | null {
  const normalized = normalizePartNumber(partNumber);
  if (/^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(normalized)) return "micron";
  if (/^(K9|KLM|KLU|KMD|KMF|KMN|KMV)/.test(normalized)) return "samsung";
  if (/^(HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/.test(normalized)) return "skhynix";
  if (/^(TC58|TH58|THG)/.test(normalized)) return "kioxia";
  if (/^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(normalized) || SNDK_TWELVE_DIGIT_MARKING.test(normalized)) return "sndk";
  if (/^(JS29F|I29F|PF29F|PC29F|PD29F)/.test(normalized)) return "intel";
  if (/^(FBNL|FNNL|FNN|FXXL)/.test(normalized)) return "spectek";
  if (/^(NAND|M29F)/.test(normalized)) return "st";
  if (/^(YM|YMN|XT|YMC|YME|YMUS)/.test(normalized)) return "ymtc";
  if (/^(GDP|GDQ|GDB)/.test(normalized)) return "gigadevice";
  if (/^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(normalized)) return "phison";
  return null;
}

function removeSpectekPackage(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  const suffix = base.slice(-2);
  return MICRON_LIKE_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
}

function removeMicronPackage(partNumber: string): string {
  if (/^(FN|FT|FB|FX|CB)/.test(partNumber)) {
    return removeSpectekPackage(partNumber);
  }
  const bit = partNumber.indexOf("08");
  return bit !== -1 && partNumber.length - bit >= 8 ? partNumber.slice(0, bit + 7) : partNumber;
}

function normalizeSkhynixH25XPackage(partNumber: string): string {
  return partNumber.replace(/^(H25[A-Z0-9]+)-X([0-9A-Z]+)(?:-([A-Z0-9]+))?$/, (_match, base: string, suffix: string, tail: string | undefined) => `${base}X${suffix}${tail ?? ""}`);
}

function removeSkhynixPackage(partNumber: string): string {
  const normalized = normalizeSkhynixH25XPackage(partNumber);
  const base = normalized.split("-")[0] ?? normalized;
  return base.startsWith("H27") || base.startsWith("H25") ? base.slice(0, 10) : base;
}

function getPartNumberLookupKeys(vendor: string, partNumber: string): string[] {
  const normalizedPartNumber = normalizePartNumber(partNumber);
  if (!normalizedPartNumber) return [];
  switch (normalizeVendor(vendor)) {
    case "micron":
      return unique([normalizedPartNumber, removeMicronPackage(normalizedPartNumber)]);
    case "spectek":
      return unique([normalizedPartNumber, removeSpectekPackage(normalizedPartNumber)]);
    case "skhynix":
      return unique([normalizedPartNumber, normalizeSkhynixH25XPackage(normalizedPartNumber), removeSkhynixPackage(normalizedPartNumber)]);
    case "samsung": {
      const base = normalizedPartNumber.split("-")[0] ?? normalizedPartNumber;
      return unique([normalizedPartNumber, base]);
    }
    default:
      return [normalizedPartNumber];
  }
}

function mergeStringArray(target: string[] | undefined, source: string[]): string[] {
  const set = new Set<string>();
  for (const item of target ?? []) {
    const text = String(item).trim();
    if (text) set.add(text);
  }
  for (const item of source) {
    const text = String(item).trim();
    if (text) set.add(text);
  }
  return [...set];
}

function parsePartReference(value: unknown): { vendor: string; partNumber: string } | null {
  const text = String(value).trim();
  const match = /^(\S+)\s+(.+)$/.exec(text);
  if (!match) return null;
  const partNumber = normalizePartNumber(match[2] ?? "");
  const vendor = inferVendorFromPartNumber(partNumber) ?? normalizeVendor(match[1] ?? "");
  return vendor && partNumber ? { vendor, partNumber } : null;
}

function canonicalPartNumberKey(partNumber: string, partNumbers: Map<string, PartNumberRecord>): string {
  const inferredVendor = inferVendorFromPartNumber(partNumber);
  if (inferredVendor) {
    for (const candidate of getPartNumberLookupKeys(inferredVendor, partNumber)) {
      if (candidate !== partNumber && partNumbers.has(candidate)) return candidate;
    }
  }
  const duplicateSuffix = /^(.*)_1$/.exec(partNumber);
  if (duplicateSuffix?.[1] && partNumbers.has(duplicateSuffix[1])) return duplicateSuffix[1];
  if (partNumber.endsWith("-")) {
    const withoutTrailingDash = partNumber.slice(0, -1);
    if (withoutTrailingDash && partNumbers.has(withoutTrailingDash)) return withoutTrailingDash;
  }
  return partNumber;
}

function toPartReference(value: unknown, vendors: Map<string, Map<string, PartNumberRecord>>): string | null {
  const parsed = parsePartReference(value);
  if (!parsed) return null;
  const vendorParts = vendors.get(parsed.vendor);
  if (!vendorParts) return null;
  const partNumber = canonicalPartNumberKey(parsed.partNumber, vendorParts);
  return vendorParts.has(partNumber) ? `${parsed.vendor} ${partNumber}` : null;
}

function hasExactSupplementalFields(record: PartNumberRecord): boolean {
  return Boolean(record.pkg || record.sg || record.pc || record.vol || record.so || record.d != null || record.e != null || record.r != null || record.n != null || record.pl != null);
}

function shouldPreserveExactPartNumberKey(partNumber: string, record: PartNumberRecord): boolean {
  return /^H25[A-Z0-9]{8,}/.test(partNumber) && partNumber.length > 10 && hasExactSupplementalFields(record);
}

function mergePartNumberRecord(target: PartNumberRecord, source: PartNumberRecord): PartNumberRecord {
  return {
    ...target,
    id: mergeStringArray(target.id, source.id),
    t: mergeStringArray(target.t, source.t ?? []),
    f: mergeStringArray(target.f, source.f ?? []),
    a: mergeStringArray(target.a, source.a ?? []),
    l: source.l ?? target.l,
    c: source.c ?? target.c,
    m: source.m ?? target.m,
    pkg: source.pkg ?? target.pkg,
    sg: source.sg ?? target.sg,
    pc: source.pc ?? target.pc,
    vol: source.vol ?? target.vol,
    so: source.so ?? target.so,
    d: source.d ?? target.d,
    e: source.e ?? target.e,
    r: source.r ?? target.r,
    n: source.n ?? target.n,
    pl: source.pl ?? target.pl
  };
}

function canonicalizePartNumbers(partNumbers: Map<string, PartNumberRecord>): void {
  for (const [partNumber, record] of [...partNumbers.entries()]) {
    if (shouldPreserveExactPartNumberKey(partNumber, record)) continue;
    const canonical = canonicalPartNumberKey(partNumber, partNumbers);
    if (canonical === partNumber) continue;
    const existing = partNumbers.get(canonical);
    partNumbers.set(canonical, existing ? mergePartNumberRecord(existing, { ...record, pn: canonical }) : { ...record, pn: canonical });
    partNumbers.delete(partNumber);
  }
}

function buildFdb(rawInput: JsonObject): FdbDataset {
  const raw = asRecord(rawInput);
  const info = asRecord(raw.info);
  const infoControllers = Array.isArray(info.controllers) ? info.controllers.map(String) : [];
  const vendors = new Map<string, Map<string, PartNumberRecord>>();
  const flashIds = new Map<string, FlashIdRecord>();

  for (const [flashId, value] of Object.entries(asRecord(raw.iddb))) {
    const normalizedId = normalizeFlashIdKey(flashId);
    if (!normalizedId) continue;
    const data = asRecord(value);
    const existing = flashIds.get(normalizedId);
    flashIds.set(normalizedId, {
      ...(existing ?? {}),
      id: normalizedId,
      s: typeof data.s === "number" ? data.s : undefined,
      p: typeof data.p === "number" ? data.p : undefined,
      b: typeof data.b === "number" ? data.b : undefined,
      t: mergeStringArray(existing?.t, Array.isArray(data.t) ? data.t.map(String) : []),
      n: mergeStringArray(existing?.n, Array.isArray(data.n) ? data.n.map(String) : [])
    });
  }

  for (const [vendorName, value] of Object.entries(raw)) {
    if (vendorName === "schemaVersion" || vendorName === "info" || vendorName === "iddb") continue;
    const vendor = normalizeVendor(vendorName);
    for (const [pn, pnDataRaw] of Object.entries(asRecord(value))) {
      const normalizedPn = normalizePartNumber(pn);
      if (!normalizedPn) continue;
      const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? vendor;
      const existingVendorMap = vendors.get(correctedVendor);
      const vendorMap = new Map<string, PartNumberRecord>(existingVendorMap);
      const pnData = asRecord(pnDataRaw);
      const id = Array.isArray(pnData.id) ? pnData.id.map((item) => normalizeFlashIdKey(String(item))).filter((item): item is string => !!item) : [];
      const f = Array.isArray(pnData.f) ? pnData.f.map((item) => normalizeFlashIdKey(String(item))).filter((item): item is string => !!item) : [];
      const a = Array.isArray(pnData.a) ? pnData.a.map(String) : [];
      const next: PartNumberRecord = {
        pn: normalizedPn,
        id,
        f,
        a,
        l: typeof pnData.l === "string" ? pnData.l : undefined,
        c: typeof pnData.c === "string" ? pnData.c : undefined,
        t: Array.isArray(pnData.t) ? pnData.t.map(String) : [],
        m: typeof pnData.m === "string" ? pnData.m : undefined,
        pkg: typeof pnData.pkg === "string" ? pnData.pkg : undefined,
        sg: typeof pnData.sg === "string" ? pnData.sg : undefined,
        pc: typeof pnData.pc === "string" ? pnData.pc : undefined,
        vol: typeof pnData.vol === "string" ? pnData.vol : undefined,
        so: typeof pnData.so === "string" ? pnData.so : undefined,
        d: typeof pnData.d === "number" ? pnData.d : undefined,
        e: typeof pnData.e === "number" ? pnData.e : undefined,
        r: typeof pnData.r === "number" ? pnData.r : undefined,
        n: typeof pnData.n === "number" ? pnData.n : undefined,
        pl: typeof pnData.pl === "number" ? pnData.pl : undefined
      };
      const existing = vendorMap.get(normalizedPn) ?? existingVendorMap?.get(normalizedPn);
      vendorMap.set(normalizedPn, existing ? mergePartNumberRecord(existing, next) : next);
      vendors.set(correctedVendor, vendorMap);
    }
  }

  for (const partNumbers of vendors.values()) {
    canonicalizePartNumbers(partNumbers);
  }

  for (const partNumbers of vendors.values()) {
    for (const [partNumber, record] of partNumbers.entries()) {
      partNumbers.set(partNumber, {
        ...record,
        a: mergeStringArray([], (record.a ?? []).map((item) => toPartReference(item, vendors)).filter((item): item is string => !!item))
      });
    }
  }

  for (const [flashId, record] of flashIds.entries()) {
    flashIds.set(flashId, {
      ...record,
      n: mergeStringArray([], (record.n ?? []).map((item) => toPartReference(item, vendors)).filter((item): item is string => !!item))
    });
  }

  return {
    info: {
      name: String(info.name ?? "iTXTech fdnext Flash Database"),
      version: String(info.version ?? "0"),
      website: String(info.website ?? ""),
      time: String(info.time ?? ""),
      controllers: infoControllers
    },
    vendors,
    flashIds
  };
}

function buildMdb(rawInput: JsonObject): MdbDataset {
  const raw = asRecord(rawInput);
  const micron: Record<string, string> = {};
  for (const [code, partNumber] of Object.entries(asRecord(raw.micron))) {
    micron[code.toUpperCase()] = String(partNumber).toUpperCase();
  }
  const spectek: Record<string, string[]> = {};
  for (const [code, partNumbers] of Object.entries(asRecord(raw.spectek))) {
    if (Array.isArray(partNumbers)) {
      spectek[code.toUpperCase()] = partNumbers.map((value) => String(value).toUpperCase());
    }
  }
  return { micron, spectek };
}

function resourceEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const entries = asRecord(raw).entries;
  return Array.isArray(entries) ? entries : [];
}

function buildKnownPartNumbers(raw: unknown): KnownPartNumberEntry[] {
  const entries: KnownPartNumberEntry[] = [];
  const seen = new Set<string>();
  for (const item of resourceEntries(raw)) {
    const record = asRecord(item);
    const pn = typeof record.pn === "string" ? normalizePartNumber(record.pn) : "";
    const vendor = typeof record.vendor === "string" ? record.vendor.trim() : "";
    if (!pn || !vendor) continue;
    const key = `${vendor}\0${pn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ pn, vendor });
  }
  return entries;
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|43|44|46|47|48|49|51|52|53|54|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber) ||
    /^(?:XCBB|XCB|PR[A-Z]|S[A-Z]{1,2})(?:[0-9]+M|[0-9]+G)[0-9]{1,2}[A-Z0-9]/.test(partNumber);
}

function buildMicronDramFbgaCodes(raw: unknown): Record<string, string[]> {
  const entries: Record<string, string[]> = {};
  const seen = new Set<string>();
  for (const [codeRaw, pnRaw] of Object.entries(asRecord(asRecord(raw).micron))) {
    const code = String(codeRaw).trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
    const pn = normalizePartNumber(String(pnRaw));
    if (!/^[0-9A-Z]{5}$/.test(code) || !isDramPartNumber(pn) || seen.has(`${code}\0${pn}`)) continue;
    seen.add(`${code}\0${pn}`);
    entries[code] = [...(entries[code] ?? []), pn];
  }
  return entries;
}

function collectFdbControllers(fdb: FdbDataset): string[] {
  const controllers = new Set<string>();
  for (const controller of fdb.info.controllers) if (controller) controllers.add(controller);
  for (const record of fdb.flashIds.values()) for (const controller of record.t ?? []) if (controller) controllers.add(controller);
  for (const partNumbers of fdb.vendors.values()) {
    for (const record of partNumbers.values()) for (const controller of record.t ?? []) if (controller) controllers.add(controller);
  }
  return [...controllers].sort((a, b) => a.localeCompare(b));
}

function countFdbPartNumbers(fdb: FdbDataset): number {
  let count = 0;
  for (const partNumbers of fdb.vendors.values()) count += partNumbers.size;
  return count;
}

function addIndexRef(index: Record<string, RuntimeRefBucket>, key: string, ref: number): void {
  if (!key) return;
  const existing = index[key];
  if (existing !== undefined) {
    if (typeof existing === "number") {
      if (existing !== ref) index[key] = [existing, ref];
      return;
    }
    if (existing[existing.length - 1] !== ref) existing.push(ref);
    return;
  }
  index[key] = ref;
}

function matchingProfile(value: string, profiles: string[]): string | undefined {
  let matched: string | undefined;
  for (const profile of profiles) {
    if (value.startsWith(profile) && (!matched || profile.length > matched.length)) matched = profile;
  }
  return matched;
}

function addExactIndexKeys(index: Record<string, RuntimeRefBucket>, value: string, ref: number): void {
  addIndexRef(index, value, ref);
  addIndexRef(index, normalizePartNumberTokenKey(value), ref);
}

function addPrefixIndexKeys(index: Record<string, RuntimeRefBucket>, value: string, ref: number, profiles: string[]): void {
  const profile = matchingProfile(value, profiles);
  const tokenProfile = matchingProfile(normalizePartNumberTokenKey(value), profiles);
  for (const key of new Set([profile, tokenProfile])) {
    if (key) addIndexRef(index, key, ref);
  }
}

function chipKindForMdbPart(partNumber: string): string {
  return isDramPartNumber(partNumber) ? "dram" : "raw_nand";
}

function vendorKey(vendor: string): string {
  return vendor.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim().replaceAll(/\s+/g, " ");
}

function sourceWeight(source: string): number {
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
    default:
      return 15;
  }
}

function buildSearchSection(input: {
  fdb: FdbDataset;
  mdb: MdbDataset;
  managedNandPartNumbers: KnownPartNumberEntry[];
  dramPartNumbers: KnownPartNumberEntry[];
  micronDramFbgaCodes: Record<string, string[]>;
}): RuntimeDataFile["d"]["s"] {
  const partRecords = new Map<string, PartIndexTuple>();
  const markingRows: MarkingIndexTuple[] = [];
  const addPart = (vendor: string, partNumberRaw: string, chipKind: string, source: string, productType?: string, markingCodeRaw?: string): void => {
    const partNumber = normalizePartNumber(partNumberRaw);
    const markingCode = markingCodeRaw ? markingCodeRaw.trim().toUpperCase().replace(/[^0-9A-Z]/g, "") : "";
    if (!vendor || !partNumber) return;
    const row: PartIndexTuple = [partNumber, partNumber, vendor, chipKind, productType ?? null, markingCode || null, source];
    const key = `${vendorKey(vendor)}\0${partNumber}\0${chipKind}`;
    const existing = partRecords.get(key);
    if (!existing || sourceWeight(source) > sourceWeight(existing[6]) || (markingCode && !existing[5])) {
      partRecords.set(key, row);
    }
  };
  for (const entry of input.managedNandPartNumbers) addPart(entry.vendor, entry.pn, "managed_nand", "managed_nand");
  for (const entry of input.dramPartNumbers) addPart(entry.vendor, entry.pn, "dram", "dram");
  for (const [vendor, partNumbers] of input.fdb.vendors.entries()) {
    for (const partNumber of partNumbers.keys()) addPart(vendor, partNumber, "raw_nand", "fdb");
  }

  const addMarking = (vendor: string, codeRaw: string, partNumberRaw: string, source: string): void => {
    const markingCode = codeRaw.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
    const partNumber = normalizePartNumber(partNumberRaw);
    if (!markingCode || !partNumber) return;
    const chipKind = chipKindForMdbPart(partNumber);
    markingRows.push([markingCode, vendor, partNumber, partNumber, chipKind, null, source]);
    addPart(vendor, partNumber, chipKind, "mdb", undefined, markingCode);
  };
  for (const [code, partNumbers] of Object.entries(input.micronDramFbgaCodes)) {
    for (const partNumber of partNumbers) addMarking("micron", code, partNumber, "micron_fbga");
  }
  for (const [code, partNumber] of Object.entries(input.mdb.micron)) addMarking("micron", code, partNumber, "micron_fbga");
  for (const [code, partNumbers] of Object.entries(input.mdb.spectek)) {
    for (const partNumber of partNumbers) addMarking("spectek", code, partNumber, "spectek_fbga");
  }

  const partRows = [...partRecords.values()];
  const pe: Record<string, RuntimeRefBucket> = {};
  const pp: Record<string, RuntimeRefBucket> = {};
  const me: Record<string, RuntimeRefBucket> = {};
  const mp: Record<string, RuntimeRefBucket> = {};
  partRows.forEach((record, ref) => {
    addExactIndexKeys(pe, record[1], ref);
    addPrefixIndexKeys(pp, record[1], ref, PART_PREFIX_PROFILES);
  });
  markingRows.forEach((record, ref) => {
    addExactIndexKeys(me, record[0], ref);
    addPrefixIndexKeys(mp, record[0], ref, MARKING_PREFIX_PROFILES);
  });
  return {
    p: partRows,
    m: markingRows,
    id: [...input.fdb.flashIds.keys()],
    pe,
    pp,
    me,
    mp
  };
}

function tupleWithTrimmedTail(values: NullableTupleValue[]): NullableTupleValue[] {
  let end = values.length;
  while (end > 0 && (values[end - 1] == null || (Array.isArray(values[end - 1]) && (values[end - 1] as string[]).length === 0))) {
    end -= 1;
  }
  return values.slice(0, end);
}

function partTuple(record: PartNumberRecord): PartNumberTuple {
  return tupleWithTrimmedTail([
    record.pn,
    record.id,
    record.f?.length ? record.f : null,
    record.a?.length ? record.a : null,
    record.l ?? null,
    record.c ?? null,
    record.t?.length ? record.t : null,
    record.m ?? null,
    record.pkg ?? null,
    record.sg ?? null,
    record.pc ?? null,
    record.vol ?? null,
    record.so ?? null,
    record.d ?? null,
    record.e ?? null,
    record.r ?? null,
    record.n ?? null,
    record.pl ?? null
  ]);
}

function flashTuple(record: FlashIdRecord): FlashIdTuple {
  return tupleWithTrimmedTail([
    record.s ?? null,
    record.p ?? null,
    record.b ?? null,
    record.t?.length ? record.t : null,
    record.n?.length ? record.n : null
  ]) as FlashIdTuple;
}

function buildFdbSection(fdb: FdbDataset): RuntimeDataFile["d"]["f"] {
  const p: Record<string, Record<string, PartNumberTuple>> = {};
  const tk: Record<string, Record<string, string>> = {};
  for (const [vendor, partNumbers] of fdb.vendors.entries()) {
    const vendorParts: Record<string, PartNumberTuple> = {};
    const vendorTokens: Record<string, string> = {};
    for (const [partNumber, record] of partNumbers.entries()) {
      vendorParts[partNumber] = partTuple(record);
      for (const key of getPartNumberLookupKeys(vendor, partNumber)) {
        const tokenKey = normalizePartNumberTokenKey(key);
        if (tokenKey && vendorTokens[tokenKey] === undefined) {
          vendorTokens[tokenKey] = partNumber;
        }
      }
      const tokenKey = normalizePartNumberTokenKey(partNumber);
      if (tokenKey && vendorTokens[tokenKey] === undefined) {
        vendorTokens[tokenKey] = partNumber;
      }
    }
    p[vendor] = vendorParts;
    tk[vendor] = vendorTokens;
  }
  const id: Record<string, FlashIdTuple> = {};
  for (const [flashId, record] of fdb.flashIds.entries()) {
    id[flashId] = flashTuple(record);
  }
  return {
    i: [fdb.info.name, fdb.info.version, fdb.info.website, fdb.info.time],
    p,
    id,
    tk,
    ct: collectFdbControllers(fdb)
  };
}

function languageSection(lang: RuntimeDataSources["lang"]): RuntimeDataFile["d"]["l"] {
  const keys = [...new Set([...Object.keys(lang.eng ?? {}), ...Object.keys(lang.chs ?? {})])].sort();
  return {
    k: keys,
    eng: keys.map((key) => lang.eng?.[key] ?? key),
    chs: keys.map((key) => lang.chs?.[key] ?? key)
  };
}

function controllerGroupSelection(value: unknown): string[] | "all" | undefined {
  if (value === "all") return "all";
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const groups: string[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    if (typeof item !== "string") continue;
    for (const piece of item.split(",")) {
      const group = piece.trim();
      if (group === "all") return "all";
      if (CONTROLLER_GROUP_IDS.includes(group) && group !== "all" && !seen.has(group)) {
        seen.add(group);
        groups.push(group);
      }
    }
  }
  return groups.length > 0 ? groups : undefined;
}

function capabilitySection(input: {
  fdb: FdbDataset;
  mdb: MdbDataset;
  managedNandPartNumbers: KnownPartNumberEntry[];
  dramPartNumbers: KnownPartNumberEntry[];
  controllers: string[];
  controllerGroups: JsonObject;
}): RuntimeDataFile["d"]["c"] {
  const resourceGroups = asRecord(input.controllerGroups.groups);
  const exclusiveGroups = new Set((Array.isArray(input.controllerGroups.exclusiveGroups) ? input.controllerGroups.exclusiveGroups : []).map(String));
  const controllerSet = new Set(input.controllers);
  const defaultGroups = controllerGroupSelection(input.controllerGroups.defaultGroups) ?? "all";
  const groups: ControllerGroupTuple[] = CONTROLLER_GROUP_IDS.map((id) => {
    const rawItems = id === "all" ? input.controllers : Array.isArray(resourceGroups[id]) ? (resourceGroups[id] as unknown[]).map(String) : [];
    const items = input.controllers.filter((controller) => rawItems.includes(controller) && controllerSet.has(controller));
    return [id, items.length, items, exclusiveGroups.has(id) ? 1 : 0];
  });
  return {
    n: {
      fid: input.fdb.flashIds.size,
      pn: countFdbPartNumbers(input.fdb) + input.managedNandPartNumbers.length + input.dramPartNumbers.length,
      fbga: Object.keys(input.mdb.micron).length
    },
    ct: input.controllers,
    dg: defaultGroups,
    g: groups
  };
}

function crc32(text: string): string {
  let crc = 0xffffffff;
  for (let i = 0; i < text.length; i += 1) {
    let value = (crc ^ text.charCodeAt(i)) & 0xff;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    crc = (crc >>> 8) ^ value;
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export function runtimeDataSourceCrc32(sourceDir: string): string {
  const root = resolve(sourceDir);
  let canonical = "";
  for (const file of RUNTIME_DATA_SOURCE_FILES) {
    const text = normalizeSourceText(readFileSync(join(root, file), "utf8"));
    canonical += `${file}\0${text}`;
  }
  return crc32(canonical);
}

export function loadRuntimeDataSources(sourceDir: string): RuntimeDataSources {
  const root = resolve(sourceDir);
  return {
    fdb: readJsonObject(join(root, "fdb.json")),
    mdb: readJsonObject(join(root, "mdb.json")),
    managedNandPn: readJson(join(root, "managed-nand-pn.json")),
    dramPn: readJson(join(root, "dram-pn.json")),
    controllerGroups: readJsonObject(join(root, "controller-groups.json")),
    lang: {
      chs: readJsonObject(join(root, "lang", "chs.json")) as Record<string, string>,
      eng: readJsonObject(join(root, "lang", "eng.json")) as Record<string, string>
    }
  };
}

export function buildRuntimeData(sourceDir: string): RuntimeDataFile {
  const sources = loadRuntimeDataSources(sourceDir);
  const fdb = buildFdb(sources.fdb);
  const mdb = buildMdb(sources.mdb);
  const managedNandPartNumbers = buildKnownPartNumbers(sources.managedNandPn);
  const dramPartNumbers = buildKnownPartNumbers(sources.dramPn);
  const micronDramFbgaCodes = buildMicronDramFbgaCodes(sources.mdb);
  const controllers = collectFdbControllers(fdb);

  return {
    v: FDNEXT_RUNTIME_DATA_VERSION,
    src: runtimeDataSourceCrc32(sourceDir),
    d: {
      f: buildFdbSection(fdb),
      m: {
        mi: mdb.micron,
        sp: mdb.spectek,
        dc: micronDramFbgaCodes,
        mk: Object.keys(micronDramFbgaCodes)
      },
      s: buildSearchSection({
        fdb,
        mdb,
        managedNandPartNumbers,
        dramPartNumbers,
        micronDramFbgaCodes
      }),
      c: capabilitySection({
        fdb,
        mdb,
        managedNandPartNumbers,
        dramPartNumbers,
        controllers,
        controllerGroups: sources.controllerGroups
      }),
      l: languageSection(sources.lang)
    }
  };
}

export function writeRuntimeData(sourceDir: string, outputFile: string): RuntimeDataFile {
  const data = buildRuntimeData(sourceDir);
  const target = resolve(outputFile);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, compactJson(data));
  return data;
}

function parseRuntimeDataFile(path: string): RuntimeDataFile | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as RuntimeDataFile;
}

export function checkRuntimeData(sourceDir: string, file: string): RuntimeDataCheckResult {
  const expected = buildRuntimeData(sourceDir);
  const actual = parseRuntimeDataFile(resolve(file));
  return {
    ok: Boolean(actual && compactJson(actual) === compactJson(expected)),
    expected,
    actual
  };
}

function refsFromBucket(bucket: RuntimeRefBucket): number[] {
  return typeof bucket === "number" ? [bucket] : bucket;
}

export function auditRuntimeData(data: RuntimeDataFile): RuntimeDataAuditResult {
  const issues: RuntimeDataAuditIssue[] = [];
  if (data.v !== FDNEXT_RUNTIME_DATA_VERSION) issues.push({ code: "version", message: "runtime data version mismatch" });
  if (!/^[0-9A-F]{8}$/.test(data.src)) issues.push({ code: "src", message: "runtime data src must be 8 uppercase CRC32 hex characters" });
  if (data.d.l.k.length !== data.d.l.eng.length || data.d.l.k.length !== data.d.l.chs.length) {
    issues.push({ code: "language_columns", message: "language columns must have identical lengths" });
  }
  for (const [name, index, rows] of [
    ["part exact", data.d.s.pe, data.d.s.p],
    ["part prefix", data.d.s.pp, data.d.s.p],
    ["marking exact", data.d.s.me, data.d.s.m],
    ["marking prefix", data.d.s.mp, data.d.s.m]
  ] as const) {
    for (const [key, bucket] of Object.entries(index)) {
      for (const ref of refsFromBucket(bucket)) {
        if (!Number.isInteger(ref) || ref < 0 || ref >= rows.length) {
          issues.push({ code: "bucket_ref", message: `${name} bucket ${key} has invalid ref ${ref}` });
        }
      }
    }
  }
  const fidCount = Object.keys(data.d.f.id).length;
  const fdbPartCount = Object.values(data.d.f.p).reduce((sum, vendorParts) => sum + Object.keys(vendorParts).length, 0);
  if (data.d.c.n.fid !== fidCount) issues.push({ code: "capability_fid_count", message: "capability flash ID count does not match FDB section" });
  if (!Number.isInteger(data.d.c.n.pn) || data.d.c.n.pn < fdbPartCount) issues.push({ code: "capability_pn_count", message: "capability part-number count is smaller than FDB part records" });
  if (data.d.c.n.fbga !== Object.keys(data.d.m.mi).length) issues.push({ code: "capability_fbga_count", message: "capability FBGA count does not match MDB section" });
  return {
    ok: issues.length === 0,
    issues
  };
}

export function auditRuntimeDataFile(file: string): RuntimeDataAuditResult {
  const data = parseRuntimeDataFile(resolve(file));
  if (!data) {
    return { ok: false, issues: [{ code: "missing_file", message: `runtime data file not found: ${relative(process.cwd(), file).split(sep).join("/")}` }] };
  }
  return auditRuntimeData(data);
}

export function formatRuntimeDataAuditText(result: RuntimeDataAuditResult, file: string): string {
  const lines = [`Runtime data audit: ${file}`, `Status: ${result.ok ? "ok" : "failed"}`];
  for (const issue of result.issues) {
    lines.push(`- [${issue.code}] ${issue.message}`);
  }
  return `${lines.join("\n")}\n`;
}
