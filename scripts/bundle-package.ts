import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname as pathDirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

async function loadEsbuild() {
  try {
    return await import("esbuild");
  } catch {
    // pnpm does not always link transitive deps to the workspace root. Fall back to the pnpm store path.
    // This keeps the repo self-contained without adding a direct esbuild dependency.
    const root = resolve(THIS_DIR, "..");
    const esbuildMain = resolveEsbuildFromPnpmStore(root);
    if (!esbuildMain) {
      throw new Error("Unable to locate esbuild from pnpm store. Run pnpm install to restore dependencies.");
    }
    return await import(esbuildMain);
  }
}

const THIS_DIR = typeof __dirname === "string" ? __dirname : pathDirname(fileURLToPath(import.meta.url));

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

async function bundleEntry(
  esbuild: typeof import("esbuild"),
  opts: { entry: string; outfile: string; platform: "node" | "neutral"; banner?: string }
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
    banner: opts.banner ? { js: opts.banner } : undefined,
    loader: {
      ".json": "json"
    }
  });
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

  switch (pkg) {
    case "core": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/core/src/index.ts"),
        outfile: resolve(root, "packages/core/dist/index.js"),
        platform: "neutral"
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/core/src/loaders/node.ts"),
        outfile: resolve(root, "packages/core/dist/loaders/node.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false })
      });
      return;
    }
    case "dsl": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/dsl/src/index.ts"),
        outfile: resolve(root, "packages/dsl/dist/index.js"),
        platform: "neutral"
      });
      return;
    }
    case "server": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/server/src/index.ts"),
        outfile: resolve(root, "packages/server/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false })
      });
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/server/src/bin.ts"),
        outfile: resolve(root, "packages/server/dist/bin.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true })
      });
      return;
    }
    case "cli": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/cli/src/index.ts"),
        outfile: resolve(root, "packages/cli/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: true })
      });
      return;
    }
    case "compat-test": {
      await bundleEntry(esbuild, {
        entry: resolve(root, "packages/compat-test/src/index.ts"),
        outfile: resolve(root, "packages/compat-test/dist/index.js"),
        platform: "node",
        banner: nodeBanner({ shebang: false })
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
