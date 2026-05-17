import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname as pathDirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface EsbuildModule {
  build(options: Record<string, unknown>): Promise<void>;
}

function resolveEsbuildFromPnpmStore(root: string): string | null {
  const pnpmDir = resolve(root, "node_modules", ".pnpm");
  if (!existsSync(pnpmDir)) {
    return null;
  }

  const entries = readdirSync(pnpmDir)
    .filter((name) => name.startsWith("esbuild@"))
    .sort()
    .reverse();

  for (const entry of entries) {
    const candidate = resolve(pnpmDir, entry, "node_modules", "esbuild", "lib", "main.js");
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadEsbuild(): Promise<EsbuildModule> {
  const esbuildPackage = "esbuild";
  try {
    return (await import(esbuildPackage)) as EsbuildModule;
  } catch {
    // pnpm does not always link transitive deps to the workspace root. Fall back to the pnpm store path.
    // This keeps the repo self-contained without adding a direct esbuild dependency.
    const root = resolve(THIS_DIR, "..");
    const esbuildMain = resolveEsbuildFromPnpmStore(root);
    if (!esbuildMain) {
      throw new Error("Unable to locate esbuild from pnpm store. Run pnpm install to restore dependencies.");
    }
    return (await import(esbuildMain)) as EsbuildModule;
  }
}

const THIS_DIR = typeof __dirname === "string" ? __dirname : pathDirname(fileURLToPath(import.meta.url));
const SHORT_COMMIT_HASH_LENGTH = 7;

function repoRoot() {
  return resolve(THIS_DIR, "..");
}

function repoTsconfig() {
  return resolve(repoRoot(), "tsconfig.base.json");
}

function pkgNameFromCwd() {
  const cwd = resolve(process.cwd());
  const root = repoRoot();
  const rel = cwd.startsWith(root) ? cwd.slice(root.length + 1) : cwd;
  // expected: packages/<name>
  return rel.split("/")[1] ?? "";
}

function ensureDir(path: string) {
  mkdirSync(pathDirname(path), { recursive: true });
}

function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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

function fdnextVersion(root: string): string {
  const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { version?: unknown };
  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error("Root package metadata must include a version.");
  }
  return packageJson.version;
}

function buildMetadataDefines(root: string): Record<string, string> {
  return {
    __FDNEXT_VERSION__: JSON.stringify(fdnextVersion(root)),
    __FDNEXT_COMMIT_HASH__: JSON.stringify(gitShortCommitHash(root)),
    __FDNEXT_BUILD_TIME__: JSON.stringify(buildTime())
  };
}

async function bundleEntry(
  esbuild: EsbuildModule,
  opts: {
    entry: string;
    outfile: string;
    platform: "node" | "neutral";
    banner?: string;
    define?: Record<string, string>;
    executable?: boolean;
  }
) {
  ensureDir(opts.outfile);
  await esbuild.build({
    entryPoints: [opts.entry],
    outfile: opts.outfile,
    bundle: true,
    format: "esm",
    platform: opts.platform,
    target: "esnext",
    sourcemap: false,
    minify: false,
    treeShaking: true,
    legalComments: "none",
    tsconfig: repoTsconfig(),
    define: opts.define,
    banner: opts.banner ? { js: opts.banner } : undefined,
    loader: {
      ".json": "json"
    }
  });
  if (opts.executable) {
    chmodSync(opts.outfile, 0o755);
  }
}

function nodeRequireShim() {
  // Some CJS dependencies use `require()` at runtime. In ESM bundles, esbuild emits a require shim that needs a real
  // `require` function to exist. Providing it via createRequire keeps Node-only bundles runnable.
  return ['import { createRequire } from "node:module";', "const require = createRequire(import.meta.url);"].join("\n");
}

function nodeBanner({ shebang }: { shebang: boolean }) {
  const parts: string[] = [];
  if (shebang) parts.push("#!/usr/bin/env node");
  parts.push(nodeRequireShim());
  return parts.join("\n");
}

async function main() {
  const esbuild = await loadEsbuild();
  const root = repoRoot();
  const pkg = pkgNameFromCwd();
  const define = buildMetadataDefines(root);

  switch (pkg) {
    case "core": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/core/src/index.ts"),
        outfile: resolve(root, "packages/core/dist/index.js"),
        platform: "neutral",
        define
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/core/src/loaders/node.ts"),
        outfile: resolve(root, "packages/core/dist/loaders/node.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false }),
        define
      });
      return;
    }
    case "decodepack": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/decodepack/src/index.ts"),
        outfile: resolve(root, "packages/decodepack/dist/index.js"),
        platform: "neutral",
        define
      });
      return;
    }
    case "runtime": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/runtime/src/index.ts"),
        outfile: resolve(root, "packages/runtime/dist/index.js"),
        platform: "neutral",
        define
      });
      return;
    }
    case "server": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/server/src/index.ts"),
        outfile: resolve(root, "packages/server/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false }),
        define
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/server/src/bin.ts"),
        outfile: resolve(root, "packages/server/dist/bin.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true }),
        define,
        executable: true
      });
      return;
    }
    case "cf-workers": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/cf-workers/src/index.ts"),
        outfile: resolve(root, "packages/cf-workers/dist/index.js"),
        platform: "neutral",
        define
      });
      return;
    }
    case "aliyun-fc": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/aliyun-fc/src/index.ts"),
        outfile: resolve(root, "packages/aliyun-fc/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false }),
        define
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/aliyun-fc/src/bin.ts"),
        outfile: resolve(root, "packages/aliyun-fc/dist/bin.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true }),
        define,
        executable: true
      });
      return;
    }
    case "cli": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/cli/src/index.ts"),
        outfile: resolve(root, "packages/cli/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true }),
        define,
        executable: true
      });
      return;
    }
    case "contract-test": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/contract-test/src/index.ts"),
        outfile: resolve(root, "packages/contract-test/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false }),
        define
      });
      return;
    }
    case "fdbgen": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/fdbgen/src/index.ts"),
        outfile: resolve(root, "packages/fdbgen/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false }),
        define
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/fdbgen/src/cli.ts"),
        outfile: resolve(root, "packages/fdbgen/dist/cli.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true }),
        define,
        executable: true
      });
      return;
    }
    case "resources": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/resources/index.ts"),
        outfile: resolve(root, "packages/resources/dist/index.js"),
        platform: "neutral",
        define
      });
      return;
    }
    default:
      throw new Error(`Unknown package for bundling: ${pkg} (cwd=${process.cwd()})`);
  }
}

main().catch((err) => {
  process.stderr.write(`${(err as { stack?: string })?.stack ?? err}\n`);
  process.exit(1);
});
