#!/usr/bin/env node

import { resolve } from "node:path";
import { generateFdb } from "./fdbgen";
import { crawlMdb, crawlMdbDram } from "./mdb";

interface CliOptions {
  inputDir?: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  version?: string;
  name?: string;
  website?: string;
  pretty?: boolean;
  file?: string;
  micronMax?: number;
  spectekMax?: number;
  delayMs?: number;
  saveEachHit?: boolean;
  userAgent?: string;
  codesFile?: string;
}

function usage(): string {
  return [
    "Usage:",
    "  fdnext-fdbgen build --input <dir> --output <file> --version <ver> [options]",
    "  fdnext-fdbgen crawl-mdb --file <mdb.json> [options]",
    "  fdnext-fdbgen crawl-mdb-dram --codes <fbga-codes.json> --file <mdb-dram.json> [options]",
    "",
    "Build options:",
    "  --input <dir>       Input dataset directory",
    "  --output <file>     Output fdb.json path",
    "  --meta <file>       Optional metadata JSON path",
    "  --extra <file>      Optional extra merge JSON path",
    "  --version <ver>     Required info.version",
    "  --name <name>       Override info.name",
    "  --website <url>     Override info.website",
    "  --pretty            Write pretty JSON",
    "",
    "MDB crawl options:",
    "  --file <path>       mdb.json file path for read/write",
    "  --micron-max <n>    Micron upper bound (exclusive, default 1000)",
    "  --spectek-max <n>   SpecTek upper bound (exclusive, optional)",
    "  --delay-ms <n>      Delay between requests in milliseconds",
    "  --user-agent <ua>   Custom HTTP User-Agent",
    "  --no-save-each-hit  Save only once at the end",
    "",
    "Micron DRAM MDB options:",
    "  --codes <path>      Predefined FBGA code JSON (top-level string array)",
    "  --file <path>       mdb-dram.json file path for read/write",
    "  --delay-ms <n>      Delay between requests in milliseconds",
    "  --user-agent <ua>   Custom HTTP User-Agent",
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
    if (arg === "--pretty") {
      options.pretty = true;
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

function parseCrawlMdbDramOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    saveEachHit: true
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--codes") {
      options.codesFile = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--file") {
      options.file = requireValue(args, i, arg);
      i += 1;
      continue;
    }
    if (arg === "--pretty") {
      options.pretty = true;
      continue;
    }
    if (arg === "--delay-ms") {
      options.delayMs = parseIntegerFlag(args, i, arg);
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
    pretty: opts.pretty ?? false
  });

  process.stdout.write(`FDB generated: ${resolve(opts.outputFile)}\n`);
}

async function runCrawlMdb(args: string[]): Promise<void> {
  const opts = parseCrawlOptions(args);
  if (!opts.file) {
    throw new Error("Missing required --file");
  }

  const targetFile = resolve(opts.file);
  const result = await crawlMdb({
    file: targetFile,
    pretty: opts.pretty ?? false,
    saveEachHit: opts.saveEachHit ?? true,
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
    `Micron req=${result.stats.micron.requests} hit=${result.stats.micron.hits} miss=${result.stats.micron.misses} skip=${result.stats.micron.skips} err=${result.stats.micron.errors}\n`
  );
  process.stdout.write(
    `SpecTek req=${result.stats.spectek.requests} hit=${result.stats.spectek.hits} miss=${result.stats.spectek.misses} skip=${result.stats.spectek.skips} err=${result.stats.spectek.errors}\n`
  );
  process.stdout.write(`Duration=${result.stats.durationMs}ms\n`);
}

async function runCrawlMdbDram(args: string[]): Promise<void> {
  const opts = parseCrawlMdbDramOptions(args);
  if (!opts.codesFile) {
    throw new Error("Missing required --codes");
  }
  if (!opts.file) {
    throw new Error("Missing required --file");
  }

  const targetFile = resolve(opts.file);
  const result = await crawlMdbDram({
    codesFile: resolve(opts.codesFile),
    file: targetFile,
    pretty: opts.pretty ?? false,
    saveEachHit: opts.saveEachHit ?? true,
    delayMs: opts.delayMs,
    userAgent: opts.userAgent,
    logger: (line) => {
      console.debug(line);
    }
  });

  process.stdout.write(`DRAM MDB crawl completed: ${targetFile}\n`);
  process.stdout.write(
    `Micron DRAM req=${result.stats.requests} hit=${result.stats.hits} miss=${result.stats.misses} skip=${result.stats.skips} err=${result.stats.errors}\n`
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
  if (command === "crawl-mdb") {
    await runCrawlMdb(process.argv.slice(3));
    return;
  }
  if (command === "crawl-mdb-dram") {
    await runCrawlMdbDram(process.argv.slice(3));
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
