import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

function runCli(args: string[]): unknown {
  const output = execFileSync(process.execPath, ["--import", "tsx/esm", "src/index.ts", ...args], {
    cwd: packageRoot,
    encoding: "utf8"
  });
  return JSON.parse(output) as unknown;
}

const check = runCli(["decodepack", "check"]) as { ok?: boolean; findings?: unknown[] };
assert.equal(check.ok, true);
assert.deepEqual(check.findings, []);

const explain = runCli(["decodepack", "explain", "part", "BWCA2KZC-64G"]) as {
  status?: string;
  specId?: string;
  steps?: unknown[];
  draft?: { components?: Array<{ fields?: Record<string, unknown> }> };
};
assert.equal(explain.status, "matched");
assert.ok(explain.specId);
assert.ok((explain.steps ?? []).length > 0);
assert.ok(explain.draft?.components?.some((component) => component.fields?.storage_density === "64GB eMMC"));
