import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  CrawlMdbOptions,
  CrawlMdbResult,
  MdbCrawlSectionStats,
  MdbPayload,
  MdbQueryOptions,
  MicronFbgaCrawlPlan,
  MicronFbgaCrawlPlanEntry,
  MicronFbgaPrefixProfile,
  MicronFbgaPrefixProfileKind
} from "./types";

export const DEFAULT_SPECTEK_HEADERS = ["PB", "PE", "PF", "PFA", "PFB", "PFC", "PFD", "PFE", "PFF", "PFG", "PFH", "PP", "PU", "PX"] as const;
export const DEFAULT_MDB_FLUSH_HITS = 20;
export const DEFAULT_MDB_CONCURRENCY = 5;
export const DEFAULT_MDB_FBGA_LETTER_GRID_PREFIXES = ["D9", "D8", "C9", "Z8", "Z9"] as const;
export const DEFAULT_MDB_FBGA_NUMBERED_PREFIXES = ["NC", "NW", "NY", "NX", "NQ", "NV"] as const;
export const DEFAULT_MDB_FBGA_LETTERS = [
  "B",
  "C",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "W",
  "X",
  "Y",
  "Z"
] as const;
export const DEFAULT_MDB_FBGA_NUMBERED_START_FROM: Record<string, number> = {
  NC: 0,
  NW: 101,
  NY: 101,
  NQ: 101,
  NX: 101,
  NV: 101
};

const MICRON_FBGA_API =
  "https://www.micron.com/content/micron/us/en/sales-support/design-tools/fbga-parts-decoder/_jcr_content.products.json/getpartbyfbgacode/-/-/-/en_US/-/-";
const SPECTEK_MARK_CODE_URL = "https://www.spectek.com/menus/mark_code.aspx";
const DEFAULT_USER_AGENT = "fdnext-fdbgen/0.1 (+https://github.com/iTXTech/fdnext)";
const DEFAULT_TIMEOUT_MS = 15000;

interface SpectekFormState {
  viewState: string;
  viewStateGenerator: string;
  eventValidation?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

function normalizePartNumber(input: string): string {
  return input.trim().toUpperCase();
}

function normalizePartList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out = new Set<string>();
  for (const item of value) {
    const text = normalizePartNumber(String(item));
    if (text) {
      out.add(text);
    }
  }
  return [...out];
}

function sortUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function writeJson(file: string, data: unknown, pretty = false): void {
  const fullPath = resolve(file);
  mkdirSync(dirname(fullPath), { recursive: true });
  const indent = pretty ? 2 : undefined;
  writeFileSync(fullPath, JSON.stringify(data, null, indent));
}

function ensureMdbShape(input: unknown): MdbPayload {
  const raw = asRecord(input);
  const micronRaw = asRecord(raw.micron);
  const spectekRaw = asRecord(raw.spectek);

  const micron: Record<string, string> = {};
  for (const [code, pn] of Object.entries(micronRaw)) {
    const normalizedCode = normalizeCode(code);
    const normalizedPn = normalizePartNumber(String(pn));
    if (normalizedCode && normalizedPn) {
      micron[normalizedCode] = normalizedPn;
    }
  }

  const spectek: Record<string, string[]> = {};
  for (const [code, values] of Object.entries(spectekRaw)) {
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      continue;
    }
    spectek[normalizedCode] = normalizePartList(values);
  }

  return { micron, spectek };
}

function delay(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolveFn) => {
    setTimeout(resolveFn, ms);
  });
}

function getFetchImpl(options?: MdbQueryOptions) {
  const fetchImpl = options?.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("No fetch implementation available");
  }
  return fetchImpl;
}

function getUserAgent(options?: MdbQueryOptions): string {
  return options?.userAgent?.trim() || DEFAULT_USER_AGENT;
}

function getTimeoutMs(options?: MdbQueryOptions): number {
  const value = options?.timeoutMs;
  if (Number.isFinite(value) && Number(value) > 0) {
    return Number(value);
  }
  return DEFAULT_TIMEOUT_MS;
}

function createRequestSignal(timeoutMs: number): AbortSignal | undefined {
  const abortWithTimeout = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout;
  if (typeof abortWithTimeout === "function") {
    return abortWithTimeout(timeoutMs);
  }
  return undefined;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ");
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function extractInputValue(html: string, name: string): string {
  const inputRegex = /<input\b[^>]*>/gi;
  const nameRegex = new RegExp(`\\bname=["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i");
  const valueRegex = /\bvalue=["']([^"']*)["']/i;
  const tags = html.match(inputRegex) ?? [];
  for (const tag of tags) {
    if (!nameRegex.test(tag)) {
      continue;
    }
    const match = tag.match(valueRegex);
    if (match && typeof match[1] === "string") {
      return decodeHtmlEntities(match[1]);
    }
  }
  return "";
}

function formatCode(header: string, index: number): string {
  const text = String(index);
  const zeros = Math.max(0, 5 - header.length - text.length);
  return `${header}${"0".repeat(zeros)}${text}`;
}

function emptySectionStats(): MdbCrawlSectionStats {
  return {
    requests: 0,
    hits: 0,
    misses: 0,
    skips: 0,
    errors: 0
  };
}

function cloneSectionStats(stats: MdbCrawlSectionStats): MdbCrawlSectionStats {
  return {
    requests: stats.requests,
    hits: stats.hits,
    misses: stats.misses,
    skips: stats.skips,
    errors: stats.errors
  };
}

function incrementStats(stats: MdbCrawlSectionStats, key: keyof MdbCrawlSectionStats, amount = 1): void {
  stats[key] += amount;
}

function getFlushHitInterval(saveEachHit: boolean, flushHits?: number): number {
  if (!saveEachHit) {
    return 0;
  }
  if (Number.isFinite(flushHits) && Number(flushHits) > 0) {
    return Math.max(1, Math.floor(Number(flushHits)));
  }
  return DEFAULT_MDB_FLUSH_HITS;
}

function getConcurrencyLimit(concurrency?: number): number {
  if (Number.isFinite(concurrency) && Number(concurrency) > 0) {
    return Math.max(1, Math.floor(Number(concurrency)));
  }
  return DEFAULT_MDB_CONCURRENCY;
}

function applyFbgaStartFromEntries(entries: MicronFbgaCrawlPlanEntry[], startFromCode?: string): MicronFbgaCrawlPlanEntry[] {
  const start = startFromCode ? normalizeFbgaCode(startFromCode) : "";
  if (!start) {
    return entries;
  }
  if (!/^[0-9A-Z]{2,5}$/.test(start)) {
    throw new Error(`Invalid FBGA start segment: ${startFromCode}`);
  }
  const index = entries.findIndex((entry) => entry.code === start || entry.code.startsWith(start));
  if (index < 0) {
    throw new Error(`FBGA start segment not found: ${start}`);
  }
  return entries.slice(index);
}

function applyCodeStartFrom(codes: string[], startFromCode: string | undefined, label: string): string[] {
  const start = startFromCode ? normalizeFbgaCode(startFromCode) : "";
  if (!start) {
    return codes;
  }
  if (!/^[0-9A-Z]{1,5}$/.test(start)) {
    throw new Error(`Invalid ${label} start segment: ${startFromCode}`);
  }
  const index = codes.findIndex((code) => code === start || code.startsWith(start));
  if (index < 0) {
    throw new Error(`${label} start segment not found: ${start}`);
  }
  return codes.slice(index);
}

export function createEmptyMdb(): MdbPayload {
  return { micron: {}, spectek: {} };
}

export function loadMdb(file: string): MdbPayload {
  const fullPath = resolve(file);
  if (!existsSync(fullPath)) {
    return createEmptyMdb();
  }
  const raw = JSON.parse(readFileSync(fullPath, "utf8"));
  return ensureMdbShape(raw);
}

export function saveMdb(file: string, data: MdbPayload, pretty = true): void {
  writeJson(file, data, pretty);
}

export async function queryMicronByFbgaCode(code: string, options?: MdbQueryOptions): Promise<string | null> {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return null;
  }
  const fetchImpl = getFetchImpl(options);
  const userAgent = getUserAgent(options);
  const timeoutMs = getTimeoutMs(options);
  const url = `${MICRON_FBGA_API}/${encodeURIComponent(normalizedCode)}`;
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      "user-agent": userAgent
    },
    signal: createRequestSignal(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`Micron API request failed: ${response.status}`);
  }

  const payload = asRecord(await response.json());
  const details = Array.isArray(payload.details) ? payload.details : [];
  for (const item of details) {
    const row = asRecord(item);
    const pn = row["part-number"];
    if (typeof pn === "string" && pn.trim()) {
      return normalizePartNumber(pn);
    }
  }
  return null;
}

function normalizeFbgaCode(input: unknown): string {
  return String(input).trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function isFiveDigitFbgaCode(input: string): boolean {
  return /^[0-9A-Z]{5}$/.test(input);
}

export function loadMdbCodes(file: string): string[] {
  const raw = JSON.parse(readFileSync(resolve(file), "utf8")) as unknown;
  const values = Array.isArray(raw) ? raw : Array.isArray(asRecord(raw).codes) ? (asRecord(raw).codes as unknown[]) : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const code = normalizeFbgaCode(typeof value === "object" && value !== null && !Array.isArray(value) ? asRecord(value).code : value);
    if (!isFiveDigitFbgaCode(code) || seen.has(code)) {
      continue;
    }
    seen.add(code);
    out.push(code);
  }
  return out;
}

function collectSupplementalCodes(options: CrawlMdbOptions): string[] {
  const codes = options.codesFile ? loadMdbCodes(options.codesFile) : [];
  if (options.supplementalCodes) {
    codes.push(...options.supplementalCodes);
  }
  return codes;
}

export function generateMicronDramFbgaCodes(
  prefixes: readonly string[] = DEFAULT_MDB_FBGA_LETTER_GRID_PREFIXES,
  letters: readonly string[] = DEFAULT_MDB_FBGA_LETTERS
): string[] {
  const normalizedLetters = sortUnique(letters.map((letter) => normalizeFbgaCode(letter))).filter((letter) =>
    /^[0-9A-Z]$/.test(letter)
  );
  const out: string[] = [];
  for (const rawPrefix of prefixes) {
    const prefix = normalizeFbgaCode(rawPrefix);
    if (!/^[0-9A-Z]{2}$/.test(prefix)) {
      continue;
    }
    for (const first of normalizedLetters) {
      for (const second of normalizedLetters) {
        for (const third of normalizedLetters) {
          out.push(`${prefix}${first}${second}${third}`);
        }
      }
    }
  }
  return out;
}

export function generateMicronNumberedFbgaCodes(prefix: string, startFrom = 1, max = 1000): string[] {
  const normalizedPrefix = normalizeFbgaCode(prefix);
  if (!/^[0-9A-Z]{1,4}$/.test(normalizedPrefix)) {
    return [];
  }
  const from = Number.isFinite(startFrom) ? Math.max(1, Math.floor(Number(startFrom))) : 1;
  const end = Number.isFinite(max) ? Math.max(from, Math.floor(Number(max))) : 1000;
  const out: string[] = [];
  for (let index = from; index < end; index += 1) {
    out.push(formatCode(normalizedPrefix, index));
  }
  return out.filter(isFiveDigitFbgaCode);
}

function normalizeProfileName(profile: MicronFbgaPrefixProfile, fallback: string): string {
  return String(profile.name ?? "").trim() || fallback;
}

function normalizeProfilePrefixes(profile: MicronFbgaPrefixProfile): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const rawPrefix of profile.prefixes) {
    const prefix = normalizeFbgaCode(rawPrefix);
    if (!/^[0-9A-Z]{1,5}$/.test(prefix) || seen.has(prefix)) {
      continue;
    }
    seen.add(prefix);
    out.push(prefix);
  }
  return out;
}

function createDefaultMicronFbgaProfiles(options: CrawlMdbOptions): MicronFbgaPrefixProfile[] {
  const profiles: MicronFbgaPrefixProfile[] = [];
  if (options.generatedCodes !== false) {
    profiles.push({
      name: "letterGrid",
      kind: "letterGrid",
      prefixes: [...(options.micronLetterGridPrefixes ?? DEFAULT_MDB_FBGA_LETTER_GRID_PREFIXES)],
      letters: [...(options.micronFbgaLetters ?? DEFAULT_MDB_FBGA_LETTERS)]
    });
  }
  profiles.push({
    name: "numberedRange",
    kind: "numberedRange",
    prefixes: [...(options.micronNumberedPrefixes ?? DEFAULT_MDB_FBGA_NUMBERED_PREFIXES)],
    startFrom: { ...DEFAULT_MDB_FBGA_NUMBERED_START_FROM, ...(options.micronStartFrom ?? {}) },
    max: Number.isFinite(options.micronMax) && options.micronMax ? Math.max(1, Math.floor(options.micronMax)) : 1000
  });
  return profiles;
}

function profileCodes(profile: MicronFbgaPrefixProfile, prefixes: readonly string[]): string[] {
  if (profile.kind === "letterGrid") {
    return generateMicronDramFbgaCodes(prefixes, profile.letters ?? DEFAULT_MDB_FBGA_LETTERS);
  }
  const startFrom = profile.startFrom ?? {};
  const max = Number.isFinite(profile.max) && profile.max ? Math.max(1, Math.floor(profile.max)) : 1000;
  return prefixes.flatMap((prefix) => generateMicronNumberedFbgaCodes(prefix, startFrom[prefix] ?? 1, max));
}

function findMatchingProfile(
  code: string,
  profiles: { name: string; kind: MicronFbgaPrefixProfileKind; prefixes: string[] }[]
): { name: string; kind: MicronFbgaPrefixProfileKind; prefix: string } | undefined {
  let matched: { name: string; kind: MicronFbgaPrefixProfileKind; prefix: string } | undefined;
  for (const profile of profiles) {
    for (const prefix of profile.prefixes) {
      if (!code.startsWith(prefix)) {
        continue;
      }
      if (!matched || prefix.length > matched.prefix.length) {
        matched = { name: profile.name, kind: profile.kind, prefix };
      }
    }
  }
  return matched;
}

function findMatchingHeader(code: string, headers: readonly string[]): string | undefined {
  let matched: string | undefined;
  for (const header of headers) {
    if (!code.startsWith(header)) {
      continue;
    }
    if (!matched || header.length > matched.length) {
      matched = header;
    }
  }
  return matched;
}

function isSpectekSupplementalCode(code: string, headers: readonly string[]): boolean {
  return code.startsWith("P") || Boolean(findMatchingHeader(code, headers));
}

function isSpectekStartSegment(startFromCode?: string): boolean {
  return normalizeFbgaCode(startFromCode ?? "").startsWith("P");
}

function routeSupplementalCodes(
  codes: readonly string[],
  options: CrawlMdbOptions,
  spectekHeaders: readonly string[]
): { micron: string[]; spectek: string[]; skipped: number } {
  const profiles = options.micronFbgaProfiles ?? createDefaultMicronFbgaProfiles(options);
  const normalizedProfiles = profiles.map((profile, index) => ({
    name: normalizeProfileName(profile, `profile${index + 1}`),
    kind: profile.kind,
    prefixes: normalizeProfilePrefixes(profile)
  }));
  const normalizedSpectekHeaders = spectekHeaders.map(normalizeCode).filter(Boolean);
  const micron: string[] = [];
  const spectek: string[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const rawCode of codes) {
    const code = normalizeFbgaCode(rawCode);
    if (!isFiveDigitFbgaCode(code) || seen.has(code)) {
      skipped += 1;
      continue;
    }
    seen.add(code);
    if (findMatchingProfile(code, normalizedProfiles)) {
      micron.push(code);
      continue;
    }
    if (isSpectekSupplementalCode(code, normalizedSpectekHeaders)) {
      spectek.push(code);
      continue;
    }
    skipped += 1;
  }

  return { micron, spectek, skipped };
}

export function buildMicronFbgaCrawlPlan(options: CrawlMdbOptions = {}): MicronFbgaCrawlPlan {
  const profiles = options.micronFbgaProfiles ?? createDefaultMicronFbgaProfiles(options);
  const normalizedProfiles = profiles.map((profile, index) => ({
    name: normalizeProfileName(profile, `profile${index + 1}`),
    kind: profile.kind,
    prefixes: normalizeProfilePrefixes(profile),
    profile
  }));
  const entries: MicronFbgaCrawlPlanEntry[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  const addCode = (code: string, fallback?: { name: string; kind: MicronFbgaPrefixProfileKind; prefix: string }): void => {
    const normalized = normalizeFbgaCode(code);
    if (!isFiveDigitFbgaCode(normalized) || seen.has(normalized)) {
      skipped += 1;
      return;
    }
    const match = fallback ?? findMatchingProfile(normalized, normalizedProfiles);
    if (!match) {
      skipped += 1;
      return;
    }
    seen.add(normalized);
    entries.push({
      code: normalized,
      profile: match.name,
      prefix: match.prefix,
      kind: match.kind
    });
  };

  for (const { name, kind, prefixes, profile } of normalizedProfiles) {
    for (const code of profileCodes(profile, prefixes)) {
      const match = findMatchingProfile(code, normalizedProfiles);
      addCode(code, match ?? { name, kind, prefix: code.slice(0, 2) });
    }
  }

  if (options.codesFile) {
    for (const code of loadMdbCodes(options.codesFile)) {
      addCode(code);
    }
  }
  for (const code of options.supplementalCodes ?? []) {
    addCode(code);
  }

  return {
    entries: applyFbgaStartFromEntries(entries, options.startFromCode),
    skipped
  };
}

async function loadSpectekFormState(options?: MdbQueryOptions): Promise<SpectekFormState> {
  const fetchImpl = getFetchImpl(options);
  const userAgent = getUserAgent(options);
  const timeoutMs = getTimeoutMs(options);

  const response = await fetchImpl(SPECTEK_MARK_CODE_URL, {
    method: "GET",
    headers: {
      "user-agent": userAgent
    },
    signal: createRequestSignal(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`SpecTek form request failed: ${response.status}`);
  }
  const html = await response.text();
  const viewState = extractInputValue(html, "__VIEWSTATE");
  const viewStateGenerator = extractInputValue(html, "__VIEWSTATEGENERATOR");
  const eventValidation = extractInputValue(html, "__EVENTVALIDATION");

  if (!viewState || !viewStateGenerator) {
    throw new Error("SpecTek form state not found");
  }

  return {
    viewState,
    viewStateGenerator,
    eventValidation: eventValidation || undefined
  };
}

function parseSpectekPartNumbers(html: string, targetCode: string): string[] {
  const normalizedTarget = normalizeCode(targetCode);
  const tableMatch = html.match(/<table[^>]*class=["'][^"']*bdrBlackTbl[^"']*["'][\s\S]*?<\/table>/i);
  if (!tableMatch) {
    return [];
  }

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const rowMatch of tableMatch[0].matchAll(rowRegex)) {
    const rowHtml = rowMatch[1] ?? "";
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((item) => item[1] ?? "");
    if (cells.length !== 3) {
      continue;
    }

    const markCodeRaw = cells[0] ?? "";
    const partCellRaw = cells[1] ?? "";
    const markCode = normalizeCode(normalizeText(decodeHtmlEntities(stripTags(markCodeRaw))));
    if (markCode !== normalizedTarget) {
      continue;
    }

    const partCell = partCellRaw.replace(/<br\s*\/?>/gi, ", ");
    const partText = normalizeText(decodeHtmlEntities(stripTags(partCell)));
    if (!partText) {
      return [];
    }

    const values = partText
      .split(",")
      .map((value) => normalizePartNumber(value))
      .filter((value) => value.length > 0);
    return sortUnique(values);
  }

  return [];
}

export async function querySpectekByMarkCode(code: string, options?: MdbQueryOptions): Promise<string[]> {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return [];
  }
  const fetchImpl = getFetchImpl(options);
  const userAgent = getUserAgent(options);
  const timeoutMs = getTimeoutMs(options);
  const formState = await loadSpectekFormState(options);
  const payload = new URLSearchParams();
  payload.set("__LASTFOCUS", "");
  payload.set("__VIEWSTATE", formState.viewState);
  payload.set("__VIEWSTATEGENERATOR", formState.viewStateGenerator);
  payload.set("__EVENTTARGET", "");
  payload.set("__EVENTARGUMENT", "");
  if (formState.eventValidation) {
    payload.set("__EVENTVALIDATION", formState.eventValidation);
  }
  payload.set("ctl00$MainCPH$MarkCodeTextBox", normalizedCode);
  payload.set("ctl00$MainCPH$PartNumberTextBox", "");
  payload.set("ctl00$MainCPH$MarkCodeButton.x", "1");
  payload.set("ctl00$MainCPH$MarkCodeButton.y", "1");

  const response = await fetchImpl(SPECTEK_MARK_CODE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent
    },
    body: payload.toString(),
    signal: createRequestSignal(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`SpecTek API request failed: ${response.status}`);
  }
  const html = await response.text();
  return parseSpectekPartNumbers(html, normalizedCode);
}

export async function crawlMdb(options: CrawlMdbOptions = {}): Promise<CrawlMdbResult> {
  const file = options.file ? resolve(options.file) : undefined;
  const pretty = options.pretty ?? true;
  const saveEachHit = options.saveEachHit ?? true;
  const flushHitInterval = getFlushHitInterval(saveEachHit, options.flushHits);
  const concurrency = getConcurrencyLimit(options.concurrency);
  const logger = options.logger ?? (() => {});
  const delayMs = Number.isFinite(options.delayMs) && options.delayMs ? Math.max(0, options.delayMs) : 0;
  const spectekHeaders = (options.spectekHeaders ?? [...DEFAULT_SPECTEK_HEADERS]).map(normalizeCode).filter(Boolean);
  const spectekMax = Number.isFinite(options.spectekMax) && options.spectekMax ? Math.max(2, Math.floor(options.spectekMax)) : undefined;
  const startTargetsSpectek = isSpectekStartSegment(options.startFromCode);
  const routedCodes = routeSupplementalCodes(collectSupplementalCodes(options), options, spectekHeaders);

  const mdb = file ? loadMdb(file) : createEmptyMdb();
  const startAt = Date.now();
  const micronFbgaStats = emptySectionStats();
  const micronFbgaProfileStats: Record<string, MdbCrawlSectionStats> = {};
  const spectekStats = emptySectionStats();
  let pendingFlushHits = 0;
  const flushAfterHit = (): void => {
    if (!file || flushHitInterval <= 0) {
      return;
    }
    pendingFlushHits += 1;
    if (pendingFlushHits >= flushHitInterval) {
      saveMdb(file, mdb, pretty);
      pendingFlushHits = 0;
    }
  };

  const getProfileStats = (profile: string): MdbCrawlSectionStats => {
    const existing = micronFbgaProfileStats[profile];
    if (existing) {
      return existing;
    }
    const created = emptySectionStats();
    micronFbgaProfileStats[profile] = created;
    return created;
  };
  const bumpMicronStats = (entry: MicronFbgaCrawlPlanEntry, key: keyof MdbCrawlSectionStats, amount = 1): void => {
    incrementStats(micronFbgaStats, key, amount);
    incrementStats(getProfileStats(entry.profile), key, amount);
  };

  const plan = startTargetsSpectek
    ? { entries: [], skipped: 0 }
    : buildMicronFbgaCrawlPlan({
        ...options,
        codesFile: undefined,
        supplementalCodes: routedCodes.micron
      });
  micronFbgaStats.skips += plan.skipped + routedCodes.skipped;
  const pendingMicronEntries: MicronFbgaCrawlPlanEntry[] = [];
  for (const entry of plan.entries) {
    getProfileStats(entry.profile);
    if (mdb.micron[entry.code]) {
      bumpMicronStats(entry, "skips");
      continue;
    }
    pendingMicronEntries.push(entry);
  }

  for (let offset = 0; offset < pendingMicronEntries.length; offset += concurrency) {
    const batch = pendingMicronEntries.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (entry) => {
        bumpMicronStats(entry, "requests");
        if (micronFbgaStats.requests % 200 === 0) {
          logger(
            `[micron-fbga] progress requests=${micronFbgaStats.requests} hit=${micronFbgaStats.hits} miss=${micronFbgaStats.misses} skip=${micronFbgaStats.skips} err=${micronFbgaStats.errors}`
          );
        }
        try {
          return { entry, partNumber: await queryMicronByFbgaCode(entry.code, options) };
        } catch (error: unknown) {
          return { entry, error };
        }
      })
    );

    for (const result of results) {
      const { entry } = result;
      if ("error" in result) {
        bumpMicronStats(entry, "errors");
        const text = result.error instanceof Error ? result.error.message : String(result.error);
        logger(`[micron-fbga:${entry.profile}] ${entry.code} failed: ${text}`);
        continue;
      }
      if (result.partNumber) {
        mdb.micron[entry.code] = result.partNumber;
        bumpMicronStats(entry, "hits");
        logger(`[micron-fbga:${entry.profile}] ${entry.code} => ${result.partNumber}`);
        flushAfterHit();
      } else {
        bumpMicronStats(entry, "misses");
      }
    }
    await delay(delayMs);
  }

  const pendingSpectekCodes: string[] = [];
  const pendingSpectekCodeSet = new Set<string>();
  const addPendingSpectekCode = (rawCode: string): void => {
    const code = normalizeFbgaCode(rawCode);
    if (!isFiveDigitFbgaCode(code) || pendingSpectekCodeSet.has(code)) {
      spectekStats.skips += 1;
      return;
    }
    if (mdb.spectek[code]) {
      spectekStats.skips += 1;
      return;
    }
    pendingSpectekCodeSet.add(code);
    pendingSpectekCodes.push(code);
  };
  for (const header of spectekHeaders) {
    const maxByHeader = Number(`1${"0".repeat(Math.max(0, 5 - header.length))}`);
    const end = spectekMax ? Math.min(maxByHeader, spectekMax) : maxByHeader;
    for (let index = 1; index < end; index += 1) {
      addPendingSpectekCode(formatCode(header, index));
    }
  }
  for (const code of routedCodes.spectek) {
    addPendingSpectekCode(code);
  }

  const spectekCodes = applyCodeStartFrom(pendingSpectekCodes, startTargetsSpectek ? options.startFromCode : undefined, "SpecTek");

  for (let offset = 0; offset < spectekCodes.length; offset += concurrency) {
    const batch = spectekCodes.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (code) => {
        spectekStats.requests += 1;
        if (spectekStats.requests % 100 === 0) {
          logger(
            `[spectek] progress requests=${spectekStats.requests} hit=${spectekStats.hits} miss=${spectekStats.misses} skip=${spectekStats.skips} err=${spectekStats.errors}`
          );
        }
        try {
          return { code, partNumbers: await querySpectekByMarkCode(code, options) };
        } catch (error: unknown) {
          return { code, error };
        }
      })
    );

    for (const result of results) {
      if ("error" in result) {
        spectekStats.errors += 1;
        const text = result.error instanceof Error ? result.error.message : String(result.error);
        logger(`[spectek] ${result.code} failed: ${text}`);
        continue;
      }
      if (result.partNumbers.length > 0) {
        const uniquePartNumbers = sortUnique(result.partNumbers);
        mdb.spectek[result.code] = uniquePartNumbers;
        spectekStats.hits += 1;
        logger(`[spectek] ${result.code} => ${JSON.stringify(mdb.spectek[result.code])}`);
        flushAfterHit();
      } else {
        spectekStats.misses += 1;
      }
    }
    await delay(delayMs);
  }

  if (file) {
    saveMdb(file, mdb, pretty);
  }

  return {
    data: mdb,
    stats: {
      micronFbga: micronFbgaStats,
      micronFbgaProfiles: Object.fromEntries(
        Object.entries(micronFbgaProfileStats).map(([profile, stats]) => [profile, cloneSectionStats(stats)])
      ),
      spectek: spectekStats,
      durationMs: Date.now() - startAt
    }
  };
}
