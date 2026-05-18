import { compileDecodePack } from "../decodepack/compiler";
import { defaultDecodePack } from "../decodepack/default-decodepack";
import type { CompileDecodePackResult } from "../decodepack/types";

let cachedDefaultDecodePack: CompileDecodePackResult | undefined;

export function defaultCompiledDecodePack(): CompileDecodePackResult {
  cachedDefaultDecodePack ??= compileDecodePack(defaultDecodePack);
  return cachedDefaultDecodePack;
}
