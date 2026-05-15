#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { auditFdb, auditFdbFile, formatFdbAuditText } from "./audit";
import { auditExtra, type ExtraAuditDecodePart, formatExtraAuditText } from "./extra-audit";
import { generateFdb, generateFdbWithTrace } from "./fdbgen";
import { crawlMdb } from "./mdb";

interface CliOptions {
  inputDir?: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  version?: string;
  name?: string;
  website?: string;
  pretty?: boolean;
  controllerBlacklist?: string[];
  file?: string;
  candidateFile?: string;
  baseExtraFile?: string;
  baseFdbFile?: string;
  auditOutputFile?: string;
  decodepack?: boolean;
  micronMax?: number;
  spectekMax?: number;
  delayMs?: number;
  saveEachHit?: boolean;
  flushHits?: number;
  concurrency?: number;
  userAgent?: string;
  codesFile?: string;
  startFromCode?: string;
  format?: "text" | "json";
  maxSamples?: number;
  failOnIssues?: boolean;
  traceSources?: boolean;
}

function usage(): string {
  return [
    "Usage:",
    "  fdnext-fdbgen build --input <dir> --output <file> --version <ver> [options]",
    "  fdnext-fdbgen audit --file <fdb.json> [options]",
    "  fdnext-fdbgen audit --input <dir> --version <ver> --trace-sources [options]",
    "  fdnext-fdbgen audit-extra --candidate <extra.json> [options]",
    "  fdnext-fdbgen crawl-mdb --file <mdb.json> [options]",
    "",
    "Build options:",
    "  --input <dir>       Input dataset directory",
    "  --output <file>     Output fdb.json path",
    "  --meta <file>       Optional metadata JSON path",
    "  --extra <file>      Optional extra merge JSON path",
    "  --version <ver>     Required info.version",
    "  --name <name>       Override info.name",
    "  --website <url>     Override info.website",
    "  --exclude-controller <name>",
    "                      Exclude a controller from generated FDB output; repeatable",
    "  --pretty            Write pretty JSON (default for MDB crawls)",
    "",
    "Audit options:",
    "  --file <path>       fdb.json file path to audit",
    "  --input <dir>       Generate FDB from a dataset for audit",
    "  --version <ver>     Required with --input",
    "  --trace-sources     Include generator provenance in audit issues",
    "  --json              Print JSON audit report",
    "  --max-samples <n>   Maximum samples per issue (default 8)",
    "  --fail-on-issues    Exit with status 2 when any audit issue is found",
    "",
    "Extra audit options:",
    "  --candidate <path>   Candidate extra.json file to audit",
    "  --base-extra <path>  Existing extra.json file for conflict checks",
    "  --base-fdb <path>    Generated fdb.json file for merge-impact checks",
    "  --decodepack         Check candidate PNs against the fdnext decodepack engine",
    "  --json              Print JSON audit report",
    "  --out <path>        Write audit report to a file instead of stdout",
    "  --max-samples <n>   Maximum samples per issue (default 8)",
    "  --fail-on-issues    Exit with status 2 when any audit issue is found",
    "",
    "MDB crawl options:",
    "  --file <path>       mdb.json file path for read/write",
    "  --codes <path>      Supplemental MDB code JSON; Micron/Spectek is inferred by prefix",
    "  --start-from <code> Start from a Micron or SpecTek code segment, e.g. D9N, NW101, or PB002",
    "  --micron-max <n>    Numbered Micron FBGA upper bound (exclusive, default 1000)",
    "  --spectek-max <n>   SpecTek upper bound (exclusive, optional)",
    "  --delay-ms <n>      Delay between requests in milliseconds",
    "  --concurrency <n>   Maximum concurrent MDB requests (default 5)",
    "  --flush-hits <n>    Flush mdb.json after this many hits (default 20)",
    "  --user-agent <ua>   Custom HTTP User-Agent",
    "  --save-each-hit     Flush mdb.json after every hit",
    "  --no-save-each-hit  Save only once at the end",
    "  -h, --help          Show help"
  ].join("\n");
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function addControllerBlacklist(options: CliOptions, raw: string): void {
  const items = raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) {
    return;
  }
  options.controllerBlacklist = [...(options.controllerBlacklist ?? []), ...items];
}

function parseBuildOptions(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--input") {
      options.inputDir = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--output") {
      options.outputFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--meta") {
      options.metaFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--extra") {
      options.extraFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--version") {
      options.version = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--name") {
      options.name = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--website") {
      options.website = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--exclude-controller" || arg === "--controller-blacklist") {
      addControllerBlacklist(options, requireValue(args, i, arg));
      i += 1;
      continue;
    }
    if (arg === "--pretty") {
      options.pretty = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function parseIntegerFlag(args: string[], index: number, flag: string): number {
  const raw = requireValue(args, index, flag);
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value for ${flag}: ${raw}`);
  }
  return value;
}

function parseCrawlOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    saveEachHit: true
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--file") {
      options.file = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--codes") {
      options.codesFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--pretty") {
      options.pretty = true;
      continue;
    }
    if (arg === "--start-from" || arg === "--start-segment") {
      options.startFromCode = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--micron-max") {
      options.micronMax = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--spectek-max") {
      options.spectekMax = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--delay-ms") {
      options.delayMs = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--concurrency") {
      options.concurrency = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--flush-hits") {
      options.flushHits = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--user-agent") {
      options.userAgent = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--no-save-each-hit") {
      options.saveEachHit = false;
      continue;
    }
    if (arg === "--save-each-hit") {
      options.saveEachHit = true;
      options.flushHits = 1;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function parseAuditOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    format: "text",
    failOnIssues: false
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--file") {
      options.file = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--input") {
      options.inputDir = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--version") {
      options.version = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--trace-sources") {
      options.traceSources = true;
      continue;
    }
    if (arg === "--json") {
      options.format = "json";
      continue;
    }
    if (arg === "--max-samples") {
      options.maxSamples = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--fail-on-issues") {
      options.failOnIssues = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function parseAuditExtraOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    format: "text",
    failOnIssues: false
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--candidate") {
      options.candidateFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--base-extra") {
      options.baseExtraFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--base-fdb") {
      options.baseFdbFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--decodepack") {
      options.decodepack = true;
      continue;
    }
    if (arg === "--json") {
      options.format = "json";
      continue;
    }
    if (arg === "--out" || arg === "--output") {
      options.auditOutputFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--max-samples") {
      options.maxSamples = parseIntegerFlag(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--fail-on-issues") {
      options.failOnIssues = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function runBuild(args: string[]): void {
  const opts = parseBuildOptions(args);
  if (!opts.inputDir) {
    throw new Error("Missing required --input");
  }
  if (!opts.outputFile) {
    throw new Error("Missing required --output");
  }
  if (!opts.version) {
    throw new Error("Missing required --version");
  }

  generateFdb({
    inputDir: resolve(opts.inputDir),
    outputFile: resolve(opts.outputFile),
    metaFile: opts.metaFile ? resolve(opts.metaFile) : undefined,
    extraFile: opts.extraFile ? resolve(opts.extraFile) : undefined,
    version: opts.version,
    name: opts.name,
    website: opts.website,
    pretty: opts.pretty ?? false,
    controllerBlacklist: opts.controllerBlacklist
  });

  process.stdout.write(`FDB generated: ${resolve(opts.outputFile)}\n`);
}

function runAudit(args: string[]): void {
  const opts = parseAuditOptions(args);
  if (!opts.file && !opts.inputDir) {
    throw new Error("Missing required --file or --input");
  }
  if (opts.inputDir && !opts.version) {
    throw new Error("Missing required --version for --input audit");
  }

  const targetFile = opts.file ? resolve(opts.file) : undefined;
  const generated = opts.inputDir
    ? generateFdbWithTrace({
        inputDir: resolve(opts.inputDir),
        version: opts.version ?? "audit"
      })
    : undefined;
  const result = generated
    ? auditFdb(generated.fdb, {
        maxSamples: opts.maxSamples,
        trace: opts.traceSources ? generated.trace : undefined
      })
    : auditFdbFile(targetFile!, {
        maxSamples: opts.maxSamples
      });
  if (opts.format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(formatFdbAuditText(result, targetFile ?? resolve(opts.inputDir!)));
  }
  if (opts.failOnIssues && result.issues.length > 0) {
    process.exitCode = 2;
  }
}

function loadJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function writeReport(text: string, file?: string): void {
  if (file) {
    writeFileSync(file, text);
    return;
  }
  process.stdout.write(text);
}

interface DecodeResultLike {
  status?: unknown;
  device?: {
    vendor?: string | { id?: unknown; name?: unknown };
    chipKind?: unknown;
    productType?: unknown;
  };
  blocks?: Array<{
    fields?: Array<{
      key?: unknown;
      value?: unknown;
      display?: unknown;
    }>;
  }>;
}

interface CoreModuleLike {
  createEngine(options?: Record<string, unknown>): {
    decodePart(input: { query: string; lang?: string | null }): DecodeResultLike;
  };
}

interface DecodepackModuleLike {
  defaultDecodePack: unknown;
  compileDecodePack(pack: unknown): {
    partDecoders?: unknown[];
    identifierDecoders?: unknown[];
  };
}

async function importPackageOrRepoSource<T>(packageName: string, repoSourcePath: string): Promise<T> {
  try {
    return (await import(packageName)) as T;
  } catch (packageError: unknown) {
    try {
      return (await import(new URL(repoSourcePath, import.meta.url).href)) as T;
    } catch {
      const message = packageError instanceof Error ? packageError.message : String(packageError);
      throw new Error(`Unable to load ${packageName} for --decodepack audit: ${message}`);
    }
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function decodeVendorId(value: DecodeResultLike["device"]): string | undefined {
  if (!value?.vendor) {
    return undefined;
  }
  if (typeof value.vendor === "string") {
    return value.vendor;
  }
  return stringField(value.vendor.id) ?? stringField(value.vendor.name);
}

function collectDecodeFields(result: DecodeResultLike): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const block of result.blocks ?? []) {
    for (const field of block.fields ?? []) {
      const key = stringField(field.key);
      if (!key) {
        continue;
      }
      fields[key] = field.value ?? field.display;
    }
  }
  return fields;
}

async function loadDecodepackAuditDecoder(): Promise<ExtraAuditDecodePart> {
  const [core, decodepack] = await Promise.all([
    importPackageOrRepoSource<CoreModuleLike>("@itxtech/fdnext-core", "../../core/src/index.ts"),
    importPackageOrRepoSource<DecodepackModuleLike>("@itxtech/fdnext-decodepack", "../../decodepack/src/index.ts")
  ]);
  const compiled = decodepack.compileDecodePack(decodepack.defaultDecodePack);
  const engine = core.createEngine({
    decoders: compiled.partDecoders ?? [],
    identifierDecoders: compiled.identifierDecoders ?? []
  });

  return (partNumber) => {
    const result = engine.decodePart({ query: partNumber, lang: "eng" });
    return {
      status: stringField(result.status) ?? "unknown",
      vendor: decodeVendorId(result.device),
      chipKind: stringField(result.device?.chipKind),
      productType: stringField(result.device?.productType),
      fields: collectDecodeFields(result)
    };
  };
}

async function runAuditExtra(args: string[]): Promise<void> {
  const opts = parseAuditExtraOptions(args);
  if (!opts.candidateFile) {
    throw new Error("Missing required --candidate");
  }

  const candidateFile = resolve(opts.candidateFile);
  const result = auditExtra(loadJsonFile(candidateFile), {
    baseExtra: opts.baseExtraFile ? loadJsonFile(resolve(opts.baseExtraFile)) : undefined,
    baseFdb: opts.baseFdbFile ? loadJsonFile(resolve(opts.baseFdbFile)) : undefined,
    decodePart: opts.decodepack ? await loadDecodepackAuditDecoder() : undefined,
    maxSamples: opts.maxSamples
  });
  const report = opts.format === "json" ? `${JSON.stringify(result, null, 2)}\n` : formatExtraAuditText(result, candidateFile);
  writeReport(report, opts.auditOutputFile ? resolve(opts.auditOutputFile) : undefined);
  if (opts.failOnIssues && result.issues.length > 0) {
    process.exitCode = 2;
  }
}

async function runCrawlMdb(args: string[]): Promise<void> {
  const opts = parseCrawlOptions(args);
  if (!opts.file) {
    throw new Error("Missing required --file");
  }

  const targetFile = resolve(opts.file);
  const result = await crawlMdb({
    file: targetFile,
    pretty: opts.pretty ?? true,
    saveEachHit: opts.saveEachHit ?? true,
    flushHits: opts.flushHits,
    concurrency: opts.concurrency,
    codesFile: opts.codesFile ? resolve(opts.codesFile) : undefined,
    startFromCode: opts.startFromCode,
    micronMax: opts.micronMax,
    spectekMax: opts.spectekMax,
    delayMs: opts.delayMs,
    userAgent: opts.userAgent,
    logger: (line) => {
      console.debug(line);
    }
  });

  process.stdout.write(`MDB crawl completed: ${targetFile}\n`);
  process.stdout.write(
    `Micron FBGA req=${result.stats.micronFbga.requests} hit=${result.stats.micronFbga.hits} miss=${result.stats.micronFbga.misses} skip=${result.stats.micronFbga.skips} err=${result.stats.micronFbga.errors}\n`
  );
  process.stdout.write(
    `SpecTek req=${result.stats.spectek.requests} hit=${result.stats.spectek.hits} miss=${result.stats.spectek.misses} skip=${result.stats.spectek.skips} err=${result.stats.spectek.errors}\n`
  );
  process.stdout.write(`Duration=${result.stats.durationMs}ms\n`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (command === "build") {
    runBuild(process.argv.slice(3));
    return;
  }
  if (command === "audit") {
    runAudit(process.argv.slice(3));
    return;
  }
  if (command === "audit-extra") {
    await runAuditExtra(process.argv.slice(3));
    return;
  }
  if (command === "crawl-mdb") {
    await runCrawlMdb(process.argv.slice(3));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

try {
  await main();
} catch (error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.stderr.write(`${usage()}\n`);
  process.exit(1);
}
