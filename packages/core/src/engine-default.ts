import { createEngineFromRuntimeData } from "./engine";
import { embeddedRuntimeData } from "./default-runtime-data";
import { loadRuntimeData } from "./runtime-data";
import type { EngineOptions, FdnextEngine } from "./types";

export async function createEngine(options: EngineOptions = {}): Promise<FdnextEngine> {
  const runtimeData = await loadRuntimeData(options, embeddedRuntimeData);
  return createEngineFromRuntimeData(runtimeData, options);
}
