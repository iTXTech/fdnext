import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { FdnextResourceBundle, LangPacks, ResourceJson } from "@itxtech/fdnext-core";

function readJson(path: string): ResourceJson {
  return JSON.parse(readFileSync(path, "utf8")) as ResourceJson;
}

function readJsonObject(path: string): Record<string, unknown> {
  return readJson(path) as Record<string, unknown>;
}

function readJsonIfExists(path: string): ResourceJson | undefined {
  return existsSync(path) ? readJson(path) : undefined;
}

export function loadResourcesFromDir(resourceDir: string): FdnextResourceBundle {
  const root = resolve(resourceDir);
  const flashDatabase = readJsonObject(join(root, "fdb.json"));
  const packageMarkings = readJsonObject(join(root, "mdb.json"));
  const managedNandParts = readJsonIfExists(join(root, "managed-nand-pn.json"));
  const dramParts = readJsonIfExists(join(root, "dram-pn.json"));
  const controllerIndex = readJsonIfExists(join(root, "controller-groups.json"));
  const translationIndex: LangPacks = {
    chs: readJsonObject(join(root, "lang", "chs.json")) as Record<string, string>,
    eng: readJsonObject(join(root, "lang", "eng.json")) as Record<string, string>
  };

  return {
    partIndex: {
      rawNand: flashDatabase,
      managedNand: managedNandParts,
      dram: dramParts
    },
    identifierIndex: {
      nandFlash: flashDatabase
    },
    markingIndex: {
      packageMarkings
    },
    vendorIndex: {},
    controllerIndex: controllerIndex as FdnextResourceBundle["controllerIndex"],
    translationIndex
  };
}
