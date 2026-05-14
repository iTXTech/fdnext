import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  CrawlMdbDramOptions,
  CrawlMdbDramResult,
  CrawlMdbOptions,
  CrawlMdbResult,
  MdbCrawlSectionStats,
  MdbDramEntry,
  MdbPayload,
  MdbQueryOptions
} from "./types";

export const DEFAULT_MICRON_HEADERS = ["NC", "NW", "NY", "NX", "NQ", "NV"] as const;
export const DEFAULT_SPECTEK_HEADERS = ["PE", "PF", "PFA", "PFB", "PFC", "PFD", "PFE", "PFF", "PFG", "PFH"] as const;
export const DEFAULT_MDB_FLUSH_HITS = 20;
export const DEFAULT_MDB_CONCURRENCY = 5;
export const DEFAULT_MDB_FBGA_PREFIX_ALLOWLIST = ["D9", "D8", "C9", "Z8", "Z9"] as const;
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
export const DEFAULT_MICRON_START_FROM: Record<string, number> = {
  NC: 101,
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

function applyFbgaStartFromCode(codes: string[], startFromCode?: string): string[] {
  const start = startFromCode ? normalizeFbgaCode(startFromCode) : "";
  if (!start) {
    return codes;
  }
  if (!/^[0-9A-Z]{2,5}$/.test(start)) {
    throw new Error(`Invalid FBGA start segment: ${startFromCode}`);
  }
  const index = codes.findIndex((code) => code === start || code.startsWith(start));
  if (index < 0) {
    throw new Error(`FBGA start segment not found: ${start}`);
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

export function loadMicronFbgaCodes(file: string): string[] {
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

export function generateMicronDramFbgaCodes(
  prefixes: readonly string[] = DEFAULT_MDB_FBGA_PREFIX_ALLOWLIST,
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

function buildMicronFbgaCrawlCodes(options: CrawlMdbDramOptions): string[] {
  const generatedCodes = options.generatedCodes ?? true;
  const out: string[] = [];
  const seen = new Set<string>();
  const addCodes = (codes: Iterable<string>): void => {
    for (const code of codes) {
      const normalized = normalizeFbgaCode(code);
      if (!isFiveDigitFbgaCode(normalized) || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      out.push(normalized);
    }
  };

  if (generatedCodes) {
    addCodes(generateMicronDramFbgaCodes());
  }
  if (options.codesFile) {
    addCodes(loadMicronFbgaCodes(options.codesFile));
  }

  return out;
}

function normalizeMdbDramEntries(input: unknown): MdbDramEntry[] {
  const values = Array.isArray(input) ? input : Array.isArray(asRecord(input).entries) ? (asRecord(input).entries as unknown[]) : [];
  const out: MdbDramEntry[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const row = asRecord(value);
    const code = normalizeFbgaCode(row.code);
    const pn = normalizePartNumber(String(row.pn ?? ""));
    if (!isFiveDigitFbgaCode(code) || !pn) {
      continue;
    }
    const key = `${code}\0${pn}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ code, pn });
  }
  return out;
}

export function loadMdbDram(file: string): MdbDramEntry[] {
  const fullPath = resolve(file);
  if (!existsSync(fullPath)) {
    return [];
  }
  return normalizeMdbDramEntries(JSON.parse(readFileSync(fullPath, "utf8")) as unknown);
}

export function saveMdbDram(file: string, data: MdbDramEntry[], pretty = false): void {
  writeJson(file, data, pretty);
}

export async function crawlMdbDram(options: CrawlMdbDramOptions): Promise<CrawlMdbDramResult> {
  const file = options.file ? resolve(options.file) : undefined;
  const pretty = options.pretty ?? true;
  const saveEachHit = options.saveEachHit ?? true;
  const flushHitInterval = getFlushHitInterval(saveEachHit, options.flushHits);
  const concurrency = getConcurrencyLimit(options.concurrency);
  const logger = options.logger ?? (() => {});
  const delayMs = Number.isFinite(options.delayMs) && options.delayMs ? Math.max(0, options.delayMs) : 0;
  const codes = applyFbgaStartFromCode(buildMicronFbgaCrawlCodes(options), options.startFromCode);
  const existing = file ? loadMdb(file) : createEmptyMdb();
  const legacy = file ? loadMdbDram(file) : [];
  const byCode = new Map<string, MdbDramEntry>();
  const order: string[] = [];
  let pendingFlushHits = 0;

  for (const [code, partNumber] of Object.entries(existing.micron)) {
    if (!byCode.has(code)) {
      order.push(code);
    }
    byCode.set(code, { code, pn: partNumber });
  }

  for (const entry of legacy) {
    if (byCode.has(entry.code)) {
      continue;
    }
    byCode.set(entry.code, entry);
    order.push(entry.code);
  }

  const emit = (): void => {
    if (!file) {
      return;
    }
    const merged: MdbPayload = {
      micron: Object.fromEntries(order.map((code) => [code, byCode.get(code)?.pn]).filter(([, partNumber]) => Boolean(partNumber))) as Record<
        string,
        string
      >,
      spectek: existing.spectek
    };
    saveMdb(file, merged, pretty);
  };
  const flushAfterHit = (): void => {
    if (!file || flushHitInterval <= 0) {
      return;
    }
    pendingFlushHits += 1;
    if (pendingFlushHits >= flushHitInterval) {
      emit();
      pendingFlushHits = 0;
    }
  };

  const stats = { ...emptySectionStats(), durationMs: 0 };
  const startAt = Date.now();
  const allowedPrefixes = new Set<string>(DEFAULT_MDB_FBGA_PREFIX_ALLOWLIST);
  const pendingCodes: string[] = [];

  for (const code of codes) {
    const prefix = code.slice(0, 2);
    if (!allowedPrefixes.has(prefix)) {
      stats.skips += 1;
      continue;
    }

    if (byCode.has(code)) {
      stats.skips += 1;
      continue;
    }

    pendingCodes.push(code);
  }

  for (let offset = 0; offset < pendingCodes.length; offset += concurrency) {
    const batch = pendingCodes.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (code) => {
        stats.requests += 1;
        if (stats.requests % 200 === 0) {
          logger(`[mdb-fbga] progress requests=${stats.requests} hit=${stats.hits} miss=${stats.misses} skip=${stats.skips} err=${stats.errors}`);
        }
        try {
          return { code, partNumber: await queryMicronByFbgaCode(code, options) };
        } catch (error: unknown) {
          return { code, error };
        }
      })
    );

    for (const result of results) {
      if ("error" in result) {
        stats.errors += 1;
        const text = result.error instanceof Error ? result.error.message : String(result.error);
        logger(`[mdb-fbga] ${result.code} failed: ${text}`);
        continue;
      }
      if (result.partNumber) {
        const { code, partNumber } = result;
        const entry = { code, pn: partNumber };
        byCode.set(code, entry);
        order.push(code);
        stats.hits += 1;
        logger(`[mdb-fbga] ${code} => ${partNumber}`);
        flushAfterHit();
      } else {
        stats.misses += 1;
      }
    }
    await delay(delayMs);
  }

  const data = order.map((code) => byCode.get(code)).filter((item): item is MdbDramEntry => !!item);
  if (file) {
    emit();
  }

  stats.durationMs = Date.now() - startAt;
  return { data, stats };
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
  const micronHeaders = (options.micronHeaders ?? [...DEFAULT_MICRON_HEADERS]).map(normalizeCode).filter(Boolean);
  const spectekHeaders = (options.spectekHeaders ?? [...DEFAULT_SPECTEK_HEADERS]).map(normalizeCode).filter(Boolean);
  const micronStartFrom = { ...DEFAULT_MICRON_START_FROM, ...(options.micronStartFrom ?? {}) };
  const micronMax = Number.isFinite(options.micronMax) && options.micronMax ? Math.max(1, Math.floor(options.micronMax)) : 1000;
  const spectekMax = Number.isFinite(options.spectekMax) && options.spectekMax ? Math.max(2, Math.floor(options.spectekMax)) : undefined;

  const mdb = file ? loadMdb(file) : createEmptyMdb();
  const knownMicronPn = new Set<string>(Object.values(mdb.micron).map(normalizePartNumber).filter((item) => item.length > 0));
  const knownSpectekPn = new Set<string>();
  for (const values of Object.values(mdb.spectek)) {
    for (const value of values) {
      const normalized = normalizePartNumber(value);
      if (normalized) {
        knownSpectekPn.add(normalized);
      }
    }
  }
  const startAt = Date.now();
  const micronStats = emptySectionStats();
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

  const pendingMicronCodes: string[] = [];
  for (const header of micronHeaders) {
    const fromRaw = micronStartFrom[header];
    const from = Number.isFinite(fromRaw) ? Math.max(1, Math.floor(Number(fromRaw))) : 1;
    for (let index = from; index < micronMax; index += 1) {
      const code = formatCode(header, index);
      if (mdb.micron[code]) {
        micronStats.skips += 1;
        continue;
      }
      pendingMicronCodes.push(code);
    }
  }

  for (let offset = 0; offset < pendingMicronCodes.length; offset += concurrency) {
    const batch = pendingMicronCodes.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (code) => {
        micronStats.requests += 1;
        if (micronStats.requests % 200 === 0) {
          logger(
            `[micron] progress requests=${micronStats.requests} hit=${micronStats.hits} miss=${micronStats.misses} skip=${micronStats.skips} err=${micronStats.errors}`
          );
        }
        try {
          return { code, partNumber: await queryMicronByFbgaCode(code, options) };
        } catch (error: unknown) {
          return { code, error };
        }
      })
    );

    for (const result of results) {
      if ("error" in result) {
        micronStats.errors += 1;
        const text = result.error instanceof Error ? result.error.message : String(result.error);
        logger(`[micron] ${result.code} failed: ${text}`);
        continue;
      }
      if (result.partNumber) {
        const { code, partNumber } = result;
        if (knownMicronPn.has(partNumber)) {
          micronStats.skips += 1;
          logger(`[micron] ${code} skipped known pn ${partNumber}`);
          continue;
        }
        mdb.micron[code] = partNumber;
        knownMicronPn.add(partNumber);
        micronStats.hits += 1;
        logger(`[micron] ${code} => ${partNumber}`);
        flushAfterHit();
      } else {
        micronStats.misses += 1;
      }
    }
    await delay(delayMs);
  }

  const pendingSpectekCodes: string[] = [];
  for (const header of spectekHeaders) {
    const maxByHeader = Number(`1${"0".repeat(Math.max(0, 5 - header.length))}`);
    const end = spectekMax ? Math.min(maxByHeader, spectekMax) : maxByHeader;
    for (let index = 1; index < end; index += 1) {
      const code = formatCode(header, index);
      if (mdb.spectek[code]) {
        spectekStats.skips += 1;
        continue;
      }
      pendingSpectekCodes.push(code);
    }
  }

  for (let offset = 0; offset < pendingSpectekCodes.length; offset += concurrency) {
    const batch = pendingSpectekCodes.slice(offset, offset + concurrency);
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
        const newPartNumbers = uniquePartNumbers.filter((partNumber) => !knownSpectekPn.has(partNumber));
        if (newPartNumbers.length === 0) {
          spectekStats.skips += 1;
          logger(`[spectek] ${result.code} skipped known pn ${JSON.stringify(uniquePartNumbers)}`);
          continue;
        }
        mdb.spectek[result.code] = newPartNumbers;
        for (const partNumber of newPartNumbers) {
          knownSpectekPn.add(partNumber);
        }
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
      micron: micronStats,
      spectek: spectekStats,
      durationMs: Date.now() - startAt
    }
  };
}
