import { compileDecodePack, defaultDecodePack, type CompileDecodePackResult } from "../decodepack";

let cachedDefaultDecodePack: CompileDecodePackResult | undefined;

export function defaultCompiledDecodePack(): CompileDecodePackResult {
  cachedDefaultDecodePack ??= compileDecodePack(defaultDecodePack);
  return cachedDefaultDecodePack;
}
