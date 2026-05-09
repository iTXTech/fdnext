#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

interface Options {
  output: string;
  url: string;
  timeoutMs: number;
}

const DEFAULT_URL = "https://www.richpowerhk.com/de/products/micron-bga-code.html";
const DEFAULT_OUTPUT = resolve("packages/resources/resources/micron-fbga-codes.json");

function parseOptions(): Options {
  const args = process.argv.slice(2);
  let url = DEFAULT_URL;
  let output = DEFAULT_OUTPUT;
  let timeoutMs = 30000;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--url" || arg === "-u") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Missing value for ${arg}`);
      }
      url = value;
      i += 1;
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Missing value for ${arg}`);
      }
      output = resolve(value);
      i += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Missing value for ${arg}`);
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid timeout: ${value}`);
      }
      timeoutMs = parsed;
      i += 1;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(
        [
          "Usage:",
          "  pnpm -s tsx ./scripts/update-micron-fbga-codes.ts [--url <url>] [--output <file>] [--timeout-ms <ms>]"
        ].join("\n") + "\n"
      );
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { output, url, timeoutMs };
}

function asSortedUnique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function toCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isFbgaCode(input: string): boolean {
  return /^[A-Z0-9]{5}$/.test(input);
}

function canonicalizeMicronFbgaCode(input: string): string | null {
  const normalized = toCode(input);
  if (!normalized) {
    return null;
  }
  if (isFbgaCode(normalized)) {
    return normalized;
  }
  if (!/^[A-Z0-9]{10}$/.test(normalized)) {
    return null;
  }
  if (!isFbgaCode(normalized.slice(0, 5))) {
    return null;
  }
  return normalized.slice(5);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_m, d) => String.fromCodePoint(Number.parseInt(d, 10)));
}

function extractCodesFromHtml(html: string): string[] {
  const tableMatch = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i);
  const tableHtml = tableMatch ? tableMatch[0] : "";
  const rowMatches = tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  const out: string[] = [];

  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1] ?? "";
    const cellValues = [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)]
      .map((cellMatch) => {
        const cellHtml = cellMatch[1] ?? "";
        return decodeHtmlEntities(
          cellHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        );
      });

    if (cellValues.length === 0) {
      continue;
    }

    if (cellValues[0]?.toUpperCase() === "CODE" && cellValues[2]?.toUpperCase() === "CODE") {
      continue;
    }

    const left = toCode(cellValues[0] ?? "");
    if (left) {
      out.push(left);
    }

    const right = toCode(cellValues[2] ?? "");
    if (right) {
      out.push(right);
    }
  }

  return asSortedUnique(out);
}

function loadExistingCodes(file: string): string[] {
  const fullPath = resolve(file);
  if (!existsSync(fullPath)) {
    return [];
  }
  const raw = JSON.parse(readFileSync(fullPath, "utf8"));
  if (!Array.isArray(raw)) {
    return [];
  }
  return asSortedUnique(
    raw
      .map((value) => canonicalizeMicronFbgaCode(String(value)))
      .filter((value): value is string => value !== null)
  );
}

async function fetchHtml(url: string, timeoutMs: number): Promise<string> {
  const fetchImpl = globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available. Run with Node.js >=24 or provide a polyfill.");
  }

  const requestSignal = (() => {
    const abortWithTimeout = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout;
    if (typeof abortWithTimeout === "function") {
      return abortWithTimeout(timeoutMs);
    }
    return undefined;
  })();

  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      "user-agent": "fdnext-resource-sync (+https://github.com/iTXTech/fdnext)"
    },
    signal: requestSignal
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.text();
}

function writeCodes(file: string, codes: string[]): void {
  const fullPath = resolve(file);
  const dir = dirname(fullPath);
  writeFileSync(fullPath, `${JSON.stringify(codes, null, 2)}\n`);
}

async function main(): Promise<void> {
  const options = parseOptions();
  const html = await fetchHtml(options.url, options.timeoutMs);
  const remoteCodes = extractCodesFromHtml(html);
  const existing = loadExistingCodes(options.output);
  const normalizedRemote = asSortedUnique(
    remoteCodes
      .map(canonicalizeMicronFbgaCode)
      .filter((code): code is string => code !== null)
  );

  const existingSet = new Set(existing);
  let existingCodes = 0;
  let newCodes = 0;
  for (const code of normalizedRemote) {
    if (existingSet.has(code)) {
      existingCodes += 1;
    } else {
      newCodes += 1;
    }
  }

  const invalidCodes = remoteCodes.length - normalizedRemote.length;
  const merged = asSortedUnique([...existing, ...normalizedRemote]);
  writeCodes(options.output, merged);
  const added = merged.length - existing.length;

  process.stdout.write(
    `Updated ${options.output}\n` +
      `  remote codes: ${remoteCodes.length}\n` +
      `  existing codes: ${existing.length}\n` +
      `  merged codes: ${merged.length}\n` +
      `  new codes: ${Math.max(0, added)}\n` +
      `  existed codes: ${existingCodes}\n` +
      `  format-mismatched codes: ${invalidCodes}\n`
  );
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to update micron fbga codes: ${text}\n`);
  process.exit(1);
});
