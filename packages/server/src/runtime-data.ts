import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertRuntimeDataHeader, type FdnextRuntimeData } from "@itxtech/fdnext-core";

export function loadRuntimeDataFile(file: string): FdnextRuntimeData {
  return assertRuntimeDataHeader(JSON.parse(readFileSync(resolve(file), "utf8")) as unknown);
}
