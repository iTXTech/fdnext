import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { EngineResources, LangPacks, ResourceJson } from "../types";

function readJson(path: string): ResourceJson {
  return JSON.parse(readFileSync(path, "utf8")) as ResourceJson;
}

function readJsonObject(path: string): Record<string, unknown> {
  return readJson(path) as Record<string, unknown>;
}

function readJsonIfExists(path: string): ResourceJson | undefined {
  return existsSync(path) ? readJson(path) : undefined;
}

export function loadResourcesFromDir(resourceDir: string): EngineResources {
  const root = resolve(resourceDir);
  const fdbRaw = readJsonObject(join(root, "fdb.json"));
  const mdbRaw = readJsonObject(join(root, "mdb.json"));
  const managedNandPnRaw = readJsonIfExists(join(root, "managed-nand-pn.json"));
  const dramPnRaw = readJsonIfExists(join(root, "dram-pn.json"));
  const micronDramFbgaRaw = readJsonIfExists(join(root, "mdb-dram.json")) ?? readJsonIfExists(join(root, "micron-dram-fbga.json"));
  const langRaw: LangPacks = {
    chs: readJsonObject(join(root, "lang", "chs.json")) as Record<string, string>,
    eng: readJsonObject(join(root, "lang", "eng.json")) as Record<string, string>
  };

  return { fdbRaw, mdbRaw, langRaw, managedNandPnRaw, dramPnRaw, micronDramFbgaRaw };
}
