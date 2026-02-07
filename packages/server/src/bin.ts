#!/usr/bin/env node
import { resolve } from "node:path";
import { createHttpServer } from "./index.js";

function readArg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  if (idx === -1) {
    return fallback;
  }
  return process.argv[idx + 1] ?? fallback;
}

async function main() {
  const host = readArg("--host", "0.0.0.0");
  const port = Number.parseInt(readArg("--port", "8080"), 10);
  const resourceDir = resolve(readArg("--resources", resolve(process.cwd(), "resources")));

  const app = createHttpServer({ host, port, resourceDir });
  await app.listen(port, host);
  process.stdout.write(`fdnext server listening on http://${host}:${port}\n`);
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.exit(1);
});
