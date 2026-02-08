#!/usr/bin/env node

import { resolve } from "node:path";
import { generateFdb } from "./fdbgen";

interface CliOptions {
  inputDir?: string;
  outputFile?: string;
  metaFile?: string;
  extraFile?: string;
  version?: string;
  name?: string;
  website?: string;
  time?: string;
  pretty?: boolean;
}

function usage(): string {
  return [
    "Usage:",
    "  fdnext-fdbgen build --input <dir> --output <file> [options]",
    "",
    "Options:",
    "  --input <dir>       Input dataset directory",
    "  --output <file>     Output fdb.json path",
    "  --meta <file>       Optional metadata JSON path",
    "  --extra <file>      Optional extra merge JSON path",
    "  --version <ver>     Override info.version",
    "  --name <name>       Override info.name",
    "  --website <url>     Override info.website",
    "  --time <text>       Override info.time",
    "  --pretty            Write pretty JSON",
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
    if (arg === "--time") {
      options.time = requireValue(args, i, arg);
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

function runBuild(args: string[]): void {
  const opts = parseBuildOptions(args);
  if (!opts.inputDir) {
    throw new Error("Missing required --input");
  }
  if (!opts.outputFile) {
    throw new Error("Missing required --output");
  }

  generateFdb({
    inputDir: resolve(opts.inputDir),
    outputFile: resolve(opts.outputFile),
    metaFile: opts.metaFile ? resolve(opts.metaFile) : undefined,
    extraFile: opts.extraFile ? resolve(opts.extraFile) : undefined,
    version: opts.version,
    name: opts.name,
    website: opts.website,
    time: opts.time,
    pretty: opts.pretty ?? false
  });

  process.stdout.write(`FDB generated: ${resolve(opts.outputFile)}\n`);
}

function main(): void {
  const command = process.argv[2];
  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (command === "build") {
    runBuild(process.argv.slice(3));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.stderr.write(`${usage()}\n`);
  process.exit(1);
}
