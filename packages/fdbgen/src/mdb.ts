import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CrawlMdbOptions, CrawlMdbResult, MdbCrawlSectionStats, MdbPayload, MdbQueryOptions } from "./types";

export const DEFAULT_MICRON_HEADERS = ["NC", "NW", "NY", "NX", "NQ", "NV"] as const;
export const DEFAULT_SPECTEK_HEADERS = ["PF", "PFA", "PFB", "PFC", "PFD", "PFE", "PFF", "PFG", "PFH"] as const;
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

export function saveMdb(file: string, data: MdbPayload, pretty = false): void {
  const fullPath = resolve(file);
  mkdirSync(dirname(fullPath), { recursive: true });
  const indent = pretty ? 2 : undefined;
  writeFileSync(fullPath, JSON.stringify(data, null, indent));
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
  const pretty = options.pretty ?? false;
  const saveEachHit = options.saveEachHit ?? true;
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

  for (const header of micronHeaders) {
    const fromRaw = micronStartFrom[header];
    const from = Number.isFinite(fromRaw) ? Math.max(1, Math.floor(Number(fromRaw))) : 1;
    for (let index = from; index < micronMax; index += 1) {
      const code = formatCode(header, index);
      if (mdb.micron[code]) {
        micronStats.skips += 1;
        continue;
      }
      micronStats.requests += 1;
      if (micronStats.requests % 200 === 0) {
        logger(`[micron] progress requests=${micronStats.requests} hit=${micronStats.hits} miss=${micronStats.misses} skip=${micronStats.skips} err=${micronStats.errors}`);
      }
      try {
        const partNumber = await queryMicronByFbgaCode(code, options);
        if (partNumber) {
          if (knownMicronPn.has(partNumber)) {
            micronStats.skips += 1;
            logger(`[micron] ${code} skipped known pn ${partNumber}`);
            continue;
          }
          mdb.micron[code] = partNumber;
          knownMicronPn.add(partNumber);
          micronStats.hits += 1;
          logger(`[micron] ${code} => ${partNumber}`);
          if (file && saveEachHit) {
            saveMdb(file, mdb, pretty);
          }
        } else {
          micronStats.misses += 1;
        }
      } catch (error: unknown) {
        micronStats.errors += 1;
        const text = error instanceof Error ? error.message : String(error);
        logger(`[micron] ${code} failed: ${text}`);
      }
      if (delayMs > 0) {
        await delay(delayMs);
      }
    }
  }

  for (const header of spectekHeaders) {
    const maxByHeader = Number(`1${"0".repeat(Math.max(0, 5 - header.length))}`);
    const end = spectekMax ? Math.min(maxByHeader, spectekMax) : maxByHeader;
    for (let index = 1; index < end; index += 1) {
      const code = formatCode(header, index);
      if (mdb.spectek[code]) {
        spectekStats.skips += 1;
        continue;
      }
      spectekStats.requests += 1;
      if (spectekStats.requests % 100 === 0) {
        logger(`[spectek] progress requests=${spectekStats.requests} hit=${spectekStats.hits} miss=${spectekStats.misses} skip=${spectekStats.skips} err=${spectekStats.errors}`);
      }
      try {
        const partNumbers = await querySpectekByMarkCode(code, options);
        if (partNumbers.length > 0) {
          const uniquePartNumbers = sortUnique(partNumbers);
          const newPartNumbers = uniquePartNumbers.filter((partNumber) => !knownSpectekPn.has(partNumber));
          if (newPartNumbers.length === 0) {
            spectekStats.skips += 1;
            logger(`[spectek] ${code} skipped known pn ${JSON.stringify(uniquePartNumbers)}`);
            continue;
          }
          mdb.spectek[code] = newPartNumbers;
          for (const partNumber of newPartNumbers) {
            knownSpectekPn.add(partNumber);
          }
          spectekStats.hits += 1;
          logger(`[spectek] ${code} => ${JSON.stringify(mdb.spectek[code])}`);
          if (file && saveEachHit) {
            saveMdb(file, mdb, pretty);
          }
        } else {
          spectekStats.misses += 1;
        }
      } catch (error: unknown) {
        spectekStats.errors += 1;
        const text = error instanceof Error ? error.message : String(error);
        logger(`[spectek] ${code} failed: ${text}`);
      }
      if (delayMs > 0) {
        await delay(delayMs);
      }
    }
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
