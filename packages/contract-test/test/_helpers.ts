import { execFile } from "node:child_process";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { Server as NodeServer } from "node:http";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

export function parseJsonObject(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as unknown;
  assert.ok(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as Record<string, unknown>;
}

const rootPackageMetadata = parseJsonObject(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
assert.equal(typeof rootPackageMetadata.version, "string", "root package metadata must expose a version");
export const fdnextPackageVersion = rootPackageMetadata.version as string;

const execFileAsync = promisify(execFile);

export async function runCli(args: string[]): Promise<Record<string, unknown>> {
  const result = await execFileAsync(process.execPath, ["./packages/core/dist/cli.js", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  assert.ok(result.stdout.trim(), result.stderr);
  return parseJsonObject(result.stdout);
}

export function assertCapabilitiesBuildTime(capabilities: unknown): void {
  const server = capabilities && typeof capabilities === "object" ? (capabilities as { server?: unknown }).server : undefined;
  const build = server && typeof server === "object" ? (server as { build?: unknown }).build : undefined;
  const buildTime = build && typeof build === "object" ? (build as { buildTime?: unknown }).buildTime : undefined;
  assert.equal(typeof buildTime, "string");
  assert.ok(!Number.isNaN(Date.parse(String(buildTime))));
  assert.notEqual(buildTime, "1970-01-01T00:00:00.000Z");
}

export function normalizeCapabilitiesForComparison(capabilities: unknown): unknown {
  const normalized = JSON.parse(JSON.stringify(capabilities)) as { server?: { build?: { buildTime?: string } } };
  if (normalized.server?.build) {
    normalized.server.build.buildTime = "<runtime-build-time>";
  }
  return normalized;
}

export async function waitForListening(server: NodeServer): Promise<void> {
  if (server.listening) {
    return;
  }
  await once(server, "listening");
}

export async function closeNodeServer(server: NodeServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export function collectResultFields(value: unknown, fields: Array<Record<string, unknown>> = []): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectResultFields(item, fields));
    return fields;
  }
  if (!value || typeof value !== "object") {
    return fields;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.key === "string" && Object.hasOwn(record, "value")) {
    fields.push(record);
  }
  Object.values(record).forEach((item) => collectResultFields(item, fields));
  return fields;
}

export function collectBlockIds(result: { blocks?: unknown }): string[] {
  return Array.isArray(result.blocks)
    ? result.blocks.map((block) => typeof block === "object" && block ? String((block as { id?: unknown }).id) : "")
    : [];
}

export function controllerFieldValues(value: unknown): string[] {
  const field = collectResultFields(value).find((item) => item.key === "controller") as { value?: unknown } | undefined;
  return Array.isArray(field?.value) ? field.value.map(String) : [];
}

export function searchItemControllerValues(item: unknown): string[] {
  return controllerFieldValues({ item });
}
