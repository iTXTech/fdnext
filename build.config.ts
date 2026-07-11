import { execFileSync } from "node:child_process";
import { chmodSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "tsdown";

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const SHORT_COMMIT_HASH_LENGTH = 7;

export const fdnextCoreDependencyPattern = /^@itxtech\/fdnext-core(?:\/.*)?$/;

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function fdnextVersion(root: string): string {
  const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { version?: unknown };
  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error("Root package metadata must include a version.");
  }
  return packageJson.version;
}

function gitShortCommitHash(root: string): string {
  const fromEnv = cleanEnvValue(process.env.FDNEXT_COMMIT_HASH);
  if (fromEnv) {
    return fromEnv.slice(0, SHORT_COMMIT_HASH_LENGTH);
  }
  try {
    const hash = execFileSync("git", ["rev-parse", `--short=${SHORT_COMMIT_HASH_LENGTH}`, "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return hash || "unknown";
  } catch {
    return "unknown";
  }
}

function buildTime(): string {
  return cleanEnvValue(process.env.FDNEXT_BUILD_TIME) ?? new Date().toISOString();
}

function buildMetadataDefines(root: string): Record<string, string> {
  return {
    __FDNEXT_VERSION__: JSON.stringify(fdnextVersion(root)),
    __FDNEXT_COMMIT_HASH__: JSON.stringify(gitShortCommitHash(root)),
    __FDNEXT_BUILD_TIME__: JSON.stringify(buildTime())
  };
}

function chmodExecutable(paths: string[]): void {
  for (const path of paths) {
    chmodSync(resolve(process.cwd(), path), 0o755);
  }
}

export function fdnextBundleConfig(config: UserConfig, options: { executable?: string[] } = {}): UserConfig {
  return {
    ...config,
    format: "esm",
    target: "esnext",
    outDir: "dist",
    clean: false,
    dts: false,
    fixedExtension: false,
    minify: false,
    report: false,
    sourcemap: false,
    treeshake: true,
    alias: {
      "@itxtech/fdnext-core": resolve(REPO_ROOT, "packages/core/src/index.ts"),
      "@itxtech/fdnext-core/decodepack": resolve(REPO_ROOT, "packages/core/src/decodepack/index.ts"),
      "@itxtech/fdnext-core/runtime": resolve(REPO_ROOT, "packages/core/src/runtime/index.ts"),
      ...config.alias
    },
    deps: {
      onlyBundle: false,
      ...config.deps
    },
    define: {
      ...buildMetadataDefines(REPO_ROOT),
      ...config.define
    },
    onSuccess: async (resolvedConfig, signal) => {
      if (options.executable) {
        chmodExecutable(options.executable);
      }
      if (typeof config.onSuccess === "function") {
        await config.onSuccess(resolvedConfig, signal);
      }
    }
  };
}

export function fdnextNodeBundleConfig(config: UserConfig, options: { executable?: string[] } = {}): UserConfig {
  return fdnextBundleConfig({
    platform: "node",
    shims: true,
    fixedExtension: false,
    ...config
  }, options);
}
