#!/usr/bin/env node

import {
  createEngine,
  type ControllerGroupSelection,
  type FdnextEngine
} from "../index";
import { checkDecodePack, defaultDecodePack, explainIdentifierDecode, explainPartDecode } from "../decodepack";

export interface CliCommandOptions {
  /** Reuse the caller's long-lived engine when executing more than one command in-process. */
  readonly engine?: FdnextEngine;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

interface CliArgs {
  positionals: string[];
  controllerGroups: string[];
}

class CliInputError extends Error {}

function parseCliArgs(args: readonly string[]): CliArgs {
  const positionals: string[] = [];
  const controllerGroups: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--controller-group") {
      const value = args[index + 1];
      if (!value) {
        throw new CliInputError("Missing --controller-group value");
      }
      controllerGroups.push(value);
      index += 1;
      continue;
    }
    if (arg.startsWith("--controller-group=")) {
      controllerGroups.push(arg.slice("--controller-group=".length));
      continue;
    }
    positionals.push(arg);
  }
  return { positionals, controllerGroups };
}

function controllerGroupArg(values: string[]): ControllerGroupSelection | undefined {
  const groups = values.flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
  if (groups.length === 0) {
    return undefined;
  }
  if (groups.includes("all")) {
    if (groups.length > 1) {
      throw new CliInputError("--controller-group all cannot be combined with other groups");
    }
    return "all";
  }
  return groups.length === 1 ? groups[0] as ControllerGroupSelection : groups as ControllerGroupSelection;
}

function limitArg(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function usageText(): string {
  return [
    "Usage:",
    "  fdnext part decode <partNumber> [lang]",
    "  fdnext part search <query> [lang] [limit]",
    "  fdnext id decode <identifier> [lang] [idScheme]",
    "  fdnext id search <query> [lang] [limit] [idScheme]",
    "  fdnext ... --controller-group <group|all>",
    "  fdnext decodepack check",
    "  fdnext decodepack explain part <partNumber> [specId]",
    "  fdnext decodepack explain id <identifier> [idScheme]",
    "  fdnext capabilities [lang]"
  ].join("\n") + "\n";
}

/** Execute one CLI command without taking ownership of process IO or process lifetime. */
export function runCliCommand(rawArgs: readonly string[], options: CliCommandOptions = {}): number {
  const writeStdout = options.stdout ?? ((text: string) => process.stdout.write(text));
  const writeStderr = options.stderr ?? ((text: string) => process.stderr.write(text));
  const print = (value: unknown): void => writeStdout(`${JSON.stringify(value, null, 2)}\n`);
  let engine = options.engine;
  const getEngine = (): FdnextEngine => (engine ??= createEngine());

  try {
    const args = parseCliArgs(rawArgs);
    const controllerGroup = controllerGroupArg(args.controllerGroups);
    const scope = args.positionals[0];
    const command = args.positionals[1];
    if (!scope) {
      writeStdout(usageText());
      return 1;
    }

    if (scope === "decodepack" && command === "check") {
      const result = checkDecodePack(defaultDecodePack);
      print(result);
      return result.ok ? 0 : 1;
    }

    if (scope === "decodepack" && command === "explain") {
      const target = args.positionals[2];
      const query = args.positionals[3];
      const option = args.positionals[4];
      if (target !== "part" && target !== "id") {
        throw new CliInputError("Expected decodepack explain target: part or id");
      }
      if (!query) {
        throw new CliInputError(target === "part" ? "Missing part number" : "Missing identifier");
      }
      if (target === "part") {
        print(explainPartDecode(defaultDecodePack, query, option ? { specId: option } : {}));
        return 0;
      }
      if (option && option !== "nand.flash_id") {
        throw new CliInputError(`Unsupported identifier scheme: ${option}`);
      }
      const idScheme = option as "nand.flash_id" | undefined;
      print(explainIdentifierDecode(defaultDecodePack, query, idScheme ? { idScheme } : {}));
      return 0;
    }

    if (scope === "capabilities") {
      print(getEngine().getCapabilities({ lang: args.positionals[1] ?? null }));
      return 0;
    }

    if (scope === "part" && command === "decode") {
      const query = args.positionals[2];
      const lang = args.positionals[3] ?? null;
      if (!query) {
        throw new CliInputError("Missing part number");
      }
      print(getEngine().decodePart({ query, lang, ...(controllerGroup ? { controllerGroup } : {}) }));
      return 0;
    }

    if (scope === "part" && command === "search") {
      const query = args.positionals[2];
      const lang = args.positionals[3] ?? null;
      const limit = limitArg(args.positionals[4]);
      if (!query) {
        throw new CliInputError("Missing part query");
      }
      print(getEngine().searchParts({ query, lang, ...(limit ? { limit } : {}) }));
      return 0;
    }

    if (scope === "id" && command === "decode") {
      const query = args.positionals[2];
      const lang = args.positionals[3] ?? null;
      const idScheme = args.positionals[4] as "nand.flash_id" | undefined;
      if (!query) {
        throw new CliInputError("Missing identifier");
      }
      print(getEngine().decodeIdentifier({
        query,
        lang,
        ...(idScheme ? { idScheme } : {}),
        ...(controllerGroup ? { controllerGroup } : {})
      }));
      return 0;
    }

    if (scope === "id" && command === "search") {
      const query = args.positionals[2];
      const lang = args.positionals[3] ?? null;
      const limit = limitArg(args.positionals[4]);
      const idScheme = args.positionals[5] as "nand.flash_id" | undefined;
      if (!query) {
        throw new CliInputError("Missing identifier query");
      }
      print(getEngine().searchIdentifiers({
        query,
        lang,
        ...(idScheme ? { idScheme } : {}),
        ...(limit ? { limit } : {})
      }));
      return 0;
    }

    writeStdout(usageText());
    return 1;
  } catch (error) {
    if (error instanceof CliInputError) {
      writeStderr(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}

function isDirectExecution(): boolean {
  return process.argv[1] === import.meta.filename;
}

if (isDirectExecution()) {
  try {
    process.exitCode = runCliCommand(process.argv.slice(2));
  } catch (error) {
    const text = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${text}\n`);
    process.exitCode = 1;
  }
}
