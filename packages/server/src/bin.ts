import { resolve } from "node:path";
import { createHttpServer } from "./index";

function readArg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  if (idx === -1) {
    return fallback;
  }
  return process.argv[idx + 1] ?? fallback;
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
  const resourceDir = resolve(readArg("--resources", resolve(process.cwd(), "resources")));

  const app = createHttpServer({ host, port, resourceDir });
  await app.listen();
  process.stdout.write(`fdnext server listening on http://${host}:${port}\n`);
}

main().catch((error: unknown) => {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${text}\n`);
  process.exit(1);
});
