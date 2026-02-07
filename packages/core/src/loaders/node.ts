import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { EngineResources, LangPacks } from "../types.js";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

export function loadResourcesFromDir(resourceDir: string): EngineResources {
  const root = resolve(resourceDir);
  const fdbRaw = readJson(join(root, "fdb.json"));
  const mdbRaw = readJson(join(root, "mdb.json"));
  const langRaw: LangPacks = {
    chs: readJson(join(root, "lang", "chs.json")) as Record<string, string>,
    eng: readJson(join(root, "lang", "eng.json")) as Record<string, string>
  };

  return { fdbRaw, mdbRaw, langRaw };
}
