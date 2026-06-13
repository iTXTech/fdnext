import { createEngineFromRuntimeData } from "./engine";
import { loadRuntimeData } from "./runtime-data";
import type { EngineOptions, FdnextEngine } from "./types";

export async function createEngine(options: EngineOptions = {}): Promise<FdnextEngine> {
  const runtimeData = await loadRuntimeData(options);
  return createEngineFromRuntimeData(runtimeData, options);
}

export * from "./result";
export * from "./result-schema";
export type {
  BeforeOperationHandler,
  EngineOptions,
  FdnextEngine,
  IdentifierDecoder,
  LangPack,
  LangPacks,
  Language,
  PartNumberDecoder,
  ProcessorHooks,
  ProcessorOperationContext
} from "./types";
export type {
  FdnextRuntimeData,
  RuntimeCapabilitySection,
  RuntimeDataFetch,
  RuntimeDataLoadOptions,
  RuntimeFdbSection,
  RuntimeLanguageSection,
  RuntimeMdbSection,
  RuntimeSearchSection
} from "./runtime-data";
