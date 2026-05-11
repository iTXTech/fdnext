import { resolve } from "node:path";
import { createEngine } from "@itxtech/fdnext-core";
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";
import { checkDecodePack, compileDecodePack, defaultDecodePack, explainIdentifierDecode, explainPartDecode } from "@itxtech/fdnext-decodepack";
import { embeddedResourceBundle } from "@itxtech/fdnext-resources";

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
      "  fdnext decodepack check",
      "  fdnext decodepack explain part <partNumber> [specId]",
      "  fdnext decodepack explain id <identifier> [idScheme]",
      "  fdnext capabilities"
    ].join("\n") + "\n"
  );
}

function limitArg(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function main() {
  const scope = process.argv[2];
  const command = process.argv[3];
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
    const target = process.argv[4];
    const query = process.argv[5];
    const option = process.argv[6];
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

  const compiledPack = compileDecodePack(defaultDecodePack);
  const engine = createEngine({
    resources: (() => {
      const resourceDir = resourceDirFromEnv();
      return resourceDir ? loadResourcesFromDir(resourceDir) : embeddedResourceBundle;
    })(),
    decoders: compiledPack.partDecoders,
    identifierDecoders: compiledPack.identifierDecoders
  });

  if (scope === "capabilities") {
    print(engine.getCapabilities());
    return;
  }

  if (scope === "part" && command === "decode") {
    const query = process.argv[4];
    const lang = process.argv[5] ?? null;
    if (!query) {
      process.stderr.write("Missing part number\n");
      process.exit(1);
    }
    print(engine.decodePart({ query, lang }));
    return;
  }

  if (scope === "part" && command === "search") {
    const query = process.argv[4];
    const lang = process.argv[5] ?? null;
    const limit = limitArg(process.argv[6]);
    if (!query) {
      process.stderr.write("Missing part query\n");
      process.exit(1);
    }
    print(engine.searchParts({ query, lang, ...(limit ? { limit } : {}) }));
    return;
  }

  if (scope === "id" && command === "decode") {
    const query = process.argv[4];
    const lang = process.argv[5] ?? null;
    const idScheme = process.argv[6] as "nand.flash_id" | undefined;
    if (!query) {
      process.stderr.write("Missing identifier\n");
      process.exit(1);
    }
    print(engine.decodeIdentifier({ query, lang, ...(idScheme ? { idScheme } : {}) }));
    return;
  }

  if (scope === "id" && command === "search") {
    const query = process.argv[4];
    const lang = process.argv[5] ?? null;
    const limit = limitArg(process.argv[6]);
    const idScheme = process.argv[7] as "nand.flash_id" | undefined;
    if (!query) {
      process.stderr.write("Missing identifier query\n");
      process.exit(1);
    }
    print(engine.searchIdentifiers({ query, lang, ...(idScheme ? { idScheme } : {}), ...(limit ? { limit } : {}) }));
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
