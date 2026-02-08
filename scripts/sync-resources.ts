import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname as pathDirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function copy(src: string, dst: string) {
  ensureDir(pathDirname(dst));
  copyFileSync(src, dst);
}

function main() {
  const thisDir = typeof __dirname === "string" ? __dirname : pathDirname(fileURLToPath(import.meta.url));
  const root = resolve(thisDir, "..");
  const srcBase = resolve(process.argv[2] ?? resolve(root, "..", "FlashDetector", "FlashDetector", "resources"));
  const dstBase = resolve(root, "resources");

  if (!existsSync(srcBase)) {
    process.stderr.write(`resource source not found: ${srcBase}\n`);
    process.exit(1);
  }

  ensureDir(resolve(dstBase, "lang"));
  copy(resolve(srcBase, "fdb.json"), resolve(dstBase, "fdb.json"));
  copy(resolve(srcBase, "mdb.json"), resolve(dstBase, "mdb.json"));
  copy(resolve(srcBase, "lang", "chs.json"), resolve(dstBase, "lang", "chs.json"));
  copy(resolve(srcBase, "lang", "eng.json"), resolve(dstBase, "lang", "eng.json"));

  process.stdout.write("resources synced\n");
}

main();
