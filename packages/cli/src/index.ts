import { resolve } from "node:path";
import {
  checkDecodePack,
  createEngine,
  defaultDecodePack,
  explainIdentifierDecode,
  explainPartDecode,
  type ControllerGroupSelection
} from "@itxtech/fdnext-core";
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";

function resourceDirFromEnv(): string | null {
  const fromEnv = process.env.FDNEXT_RESOURCES?.trim();
  if (!fromEnv) {
    return null;
  }
  return resolve(fromEnv);
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): void {
  process.stdout.write(
    [
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
    ].join("\n") + "\n"
  );
}

interface CliArgs {
  positionals: string[];
  controllerGroups: string[];
}

function parseCliArgs(args: string[]): CliArgs {
  const positionals: string[] = [];
  const controllerGroups: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--controller-group") {
      const value = args[index + 1];
      if (!value) {
        process.stderr.write("Missing --controller-group value\n");
        process.exit(1);
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
      process.stderr.write("--controller-group all cannot be combined with other groups\n");
      process.exit(1);
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

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const controllerGroup = controllerGroupArg(args.controllerGroups);
  const scope = args.positionals[0];
  const command = args.positionals[1];
  if (!scope) {
    usage();
    process.exit(1);
  }

  if (scope === "decodepack" && command === "check") {
    const result = checkDecodePack(defaultDecodePack);
    print(result);
    if (!result.ok) {
      process.exit(1);
    }
    return;
  }

  if (scope === "decodepack" && command === "explain") {
    const target = args.positionals[2];
    const query = args.positionals[3];
    const option = args.positionals[4];
    if (target !== "part" && target !== "id") {
      process.stderr.write("Expected decodepack explain target: part or id\n");
      process.exit(1);
    }
    if (!query) {
      process.stderr.write(target === "part" ? "Missing part number\n" : "Missing identifier\n");
      process.exit(1);
    }
    if (target === "part") {
      print(explainPartDecode(defaultDecodePack, query, option ? { specId: option } : {}));
      return;
    }
    if (option && option !== "nand.flash_id") {
      process.stderr.write(`Unsupported identifier scheme: ${option}\n`);
      process.exit(1);
    }
    const idScheme = option as "nand.flash_id" | undefined;
    print(explainIdentifierDecode(defaultDecodePack, query, idScheme ? { idScheme } : {}));
    return;
  }

  const resourceDir = resourceDirFromEnv();
  const engine = createEngine({
    ...(resourceDir ? { resources: loadResourcesFromDir(resourceDir) } : {})
  });

  if (scope === "capabilities") {
    print(engine.getCapabilities({ lang: args.positionals[1] ?? null }));
    return;
  }

  if (scope === "part" && command === "decode") {
    const query = args.positionals[2];
    const lang = args.positionals[3] ?? null;
    if (!query) {
      process.stderr.write("Missing part number\n");
      process.exit(1);
    }
    print(engine.decodePart({ query, lang, ...(controllerGroup ? { controllerGroup } : {}) }));
    return;
  }

  if (scope === "part" && command === "search") {
    const query = args.positionals[2];
    const lang = args.positionals[3] ?? null;
    const limit = limitArg(args.positionals[4]);
    if (!query) {
      process.stderr.write("Missing part query\n");
      process.exit(1);
    }
    print(engine.searchParts({ query, lang, ...(limit ? { limit } : {}), ...(controllerGroup ? { controllerGroup } : {}) }));
    return;
  }

  if (scope === "id" && command === "decode") {
    const query = args.positionals[2];
    const lang = args.positionals[3] ?? null;
    const idScheme = args.positionals[4] as "nand.flash_id" | undefined;
    if (!query) {
      process.stderr.write("Missing identifier\n");
      process.exit(1);
    }
    print(engine.decodeIdentifier({ query, lang, ...(idScheme ? { idScheme } : {}), ...(controllerGroup ? { controllerGroup } : {}) }));
    return;
  }

  if (scope === "id" && command === "search") {
    const query = args.positionals[2];
    const lang = args.positionals[3] ?? null;
    const limit = limitArg(args.positionals[4]);
    const idScheme = args.positionals[5] as "nand.flash_id" | undefined;
    if (!query) {
      process.stderr.write("Missing identifier query\n");
      process.exit(1);
    }
    print(engine.searchIdentifiers({ query, lang, ...(idScheme ? { idScheme } : {}), ...(limit ? { limit } : {}), ...(controllerGroup ? { controllerGroup } : {}) }));
    return;
  }

  usage();
  process.exit(1);
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.exit(1);
});
