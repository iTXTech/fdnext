import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { EngineResources, LangPacks } from "../types";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function readJsonIfExists(path: string): Record<string, unknown> | undefined {
  return existsSync(path) ? readJson(path) : undefined;
}

export function loadResourcesFromDir(resourceDir: string): EngineResources {
  const root = resolve(resourceDir);
  const fdbRaw = readJson(join(root, "fdb.json"));
  const mdbRaw = readJson(join(root, "mdb.json"));
  const managedNandPnRaw = readJsonIfExists(join(root, "managed-nand-pn.json"));
  const dramPnRaw = readJsonIfExists(join(root, "dram-pn.json"));
  const micronDramFbgaRaw = readJsonIfExists(join(root, "micron-dram-fbga.json"));
  const langRaw: LangPacks = {
    chs: readJson(join(root, "lang", "chs.json")) as Record<string, string>,
    eng: readJson(join(root, "lang", "eng.json")) as Record<string, string>
  };

  return { fdbRaw, mdbRaw, langRaw, managedNandPnRaw, dramPnRaw, micronDramFbgaRaw };
}
