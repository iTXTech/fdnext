import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

interface PackageMetadata {
  files?: unknown;
}

test("core package publishes embedded bundles without duplicate raw resources", () => {
  const metadata = JSON.parse(
    readFileSync(new URL("../../core/package.json", import.meta.url), "utf8")
  ) as PackageMetadata;
  assert.ok(Array.isArray(metadata.files));
  const files = metadata.files.map(String);

  assert.ok(files.some((pattern) => pattern.startsWith("dist/") && pattern.endsWith(".js")));
  assert.ok(!files.some((pattern) => pattern === "resources" || pattern.startsWith("resources/")));
});
