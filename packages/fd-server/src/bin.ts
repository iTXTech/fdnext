#!/usr/bin/env node

import { createFdServer } from "./index";

function readArg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  if (idx === -1) {
    return fallback;
  }
  const value = process.argv[idx + 1];
  return value && !value.startsWith("-") ? value : fallback;
}

function parsePort(raw: string): number {
  const port = Number.parseInt(raw, 10);
  if (Number.isInteger(port) && port > 0 && port <= 65535) {
    return port;
  }
  throw new Error(`Invalid --port value: ${raw}`);
}

async function main() {
  const host = readArg("--host", "0.0.0.0");
  const port = parsePort(readArg("--port", "8080"));
  const app = createFdServer({ host, port });
  await app.listen();
  process.stdout.write(`fd-server listening on http://${host}:${port}\n`);
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.exit(1);
});
