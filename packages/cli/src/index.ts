import { resolve } from "node:path";
import { createEngine } from "@fdnext/core";
import { loadResourcesFromDir } from "@fdnext/core/node";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "@fdnext/dsl";
import { createHttpServer } from "@fdnext/server";

function resourceDir(): string {
  return resolve(process.env.FDNEXT_RESOURCES ?? resolve(process.cwd(), "resources"));
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): void {
  process.stdout.write(
    [
      "Usage:",
      "  fdnext fd <partNumber> [lang]",
      "  fdnext fid <flashId> [lang]",
      "  fdnext summary <partNumber> [lang]",
      "  fdnext summary-id <flashId> [lang]",
      "  fdnext search-pn <partNumber> [lang] [limit]",
      "  fdnext search-id <flashId> [lang] [limit]",
      "  fdnext info",
      "  fdnext serve [host] [port]"
    ].join("\n") + "\n"
  );
}

async function main() {
  const command = process.argv[2];
  if (!command) {
    usage();
    process.exit(1);
  }

  const engine = createEngine({
    resources: loadResourcesFromDir(resourceDir()),
    decoders: compileRulesToDecoders(defaultDslRules),
    flashIdDecoders: compileFlashIdRulesToDecoders(defaultFlashIdRules)
  });

  switch (command) {
    case "fd": {
      const pn = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!pn) {
        process.stderr.write("Missing part number\n");
        process.exit(1);
      }
      print(engine.detect(pn, { lang }));
      return;
    }
    case "fid": {
      const id = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!id) {
        process.stderr.write("Missing Flash Id\n");
        process.exit(1);
      }
      print(engine.decodeFlashId(id, { lang }));
      return;
    }
    case "summary": {
      const pn = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!pn) {
        process.stderr.write("Missing part number\n");
        process.exit(1);
      }
      process.stdout.write(`${engine.getSummary(pn, lang)}\n`);
      return;
    }
    case "summary-id": {
      const id = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!id) {
        process.stderr.write("Missing flash Id\n");
        process.exit(1);
      }
      process.stdout.write(`${engine.getIdSummary(id, lang)}\n`);
      return;
    }
    case "search-pn": {
      const pn = process.argv[3];
      const lang = process.argv[4] ?? null;
      const limit = Number.parseInt(process.argv[5] ?? "0", 10) || 0;
      if (!pn) {
        process.stderr.write("Missing part number\n");
        process.exit(1);
      }
      print(engine.searchPartNumber(pn, { lang, limit, partialMatch: true }));
      return;
    }
    case "search-id": {
      const id = process.argv[3];
      const lang = process.argv[4] ?? null;
      const limit = Number.parseInt(process.argv[5] ?? "0", 10) || 0;
      if (!id) {
        process.stderr.write("Missing Flash Id\n");
        process.exit(1);
      }
      print(engine.searchFlashId(id, { lang, limit, partialMatch: true }));
      return;
    }
    case "info": {
      print({ ver: engine.getVersion(), info: engine.getInfo() });
      return;
    }
    case "serve": {
      const host = process.argv[3] ?? "0.0.0.0";
      const port = Number.parseInt(process.argv[4] ?? "8080", 10);
      const app = createHttpServer({ host, port, resourceDir: resourceDir() });
      await app.listen(port, host);
      process.stdout.write(`fdnext server listening on http://${host}:${port}\n`);
      return;
    }
    default:
      usage();
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.exit(1);
});
