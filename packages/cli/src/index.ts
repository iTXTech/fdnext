import { resolve } from "node:path";
import { createEngine } from "@itxtech/fdnext-core";
import { loadResourcesFromDir } from "@itxtech/fdnext-core/node";
import { compileFlashIdRulesToDecoders, compileRulesToDecoders, defaultDslRules, defaultFlashIdRules } from "@itxtech/fdnext-dsl";
import { embeddedResources } from "@itxtech/fdnext-resources";

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
      "  fdnext fd <partNumber> [lang]",
      "  fdnext fid <flashId> [lang]",
      "  fdnext summary <partNumber> [lang]",
      "  fdnext summary-id <flashId> [lang]",
      "  fdnext search-pn <partNumber> [lang] [limit]",
      "  fdnext search-id <flashId> [lang] [limit]",
      "  fdnext info"
    ].join("\n") + "\n"
  );
}

function cliContext(
  extra: Partial<{
    lang: string | null;
    pn: string | null;
    id: string | null;
    limit: number;
  }> = {}
) {
  return {
    query: process.argv.slice(2).join(" "),
    remote: "cli",
    userAgent: "fdnext-cli",
    ...extra
  };
}

function isSuccessPayload(payload: Record<string, unknown>): payload is { result: true; data?: unknown } {
  return payload.result === true;
}

async function main() {
  const command = process.argv[2];
  if (!command) {
    usage();
    process.exit(1);
  }

  const engine = createEngine({
    resources: (() => {
      const resourceDir = resourceDirFromEnv();
      return resourceDir ? loadResourcesFromDir(resourceDir) : embeddedResources;
    })(),
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
      const payload = engine.dispatch("decode", cliContext({ pn, lang }));
      if (isSuccessPayload(payload) && "data" in payload) {
        print(payload.data);
        return;
      }
      print(payload);
      return;
    }
    case "fid": {
      const id = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!id) {
        process.stderr.write("Missing Flash Id\n");
        process.exit(1);
      }
      const payload = engine.dispatch("decodeId", cliContext({ id, lang }));
      if (isSuccessPayload(payload) && "data" in payload) {
        print(payload.data);
        return;
      }
      print(payload);
      return;
    }
    case "summary": {
      const pn = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!pn) {
        process.stderr.write("Missing part number\n");
        process.exit(1);
      }
      const payload = engine.dispatch("summary", cliContext({ pn, lang }));
      if (isSuccessPayload(payload) && typeof payload.data === "string") {
        process.stdout.write(`${payload.data}\n`);
        return;
      }
      print(payload);
      return;
    }
    case "summary-id": {
      const id = process.argv[3];
      const lang = process.argv[4] ?? null;
      if (!id) {
        process.stderr.write("Missing flash Id\n");
        process.exit(1);
      }
      const payload = engine.dispatch("summaryId", cliContext({ id, lang }));
      if (isSuccessPayload(payload) && typeof payload.data === "string") {
        process.stdout.write(`${payload.data}\n`);
        return;
      }
      print(payload);
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
      const payload = engine.dispatch("searchPn", cliContext({ pn, lang, limit }));
      if (isSuccessPayload(payload) && "data" in payload) {
        print(payload.data);
        return;
      }
      print(payload);
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
      const payload = engine.dispatch("searchId", cliContext({ id, lang, limit }));
      if (isSuccessPayload(payload) && "data" in payload) {
        print(payload.data);
        return;
      }
      print(payload);
      return;
    }
    case "info": {
      print(engine.dispatch("info", cliContext()));
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
