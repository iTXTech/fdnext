import type {
  CompileDecodePackResult,
  DecodePack,
  DecodePackTraceStep,
  IdentifierDecodeExplainBitfield,
  IdentifierDecodeExplainResult,
  IdentifierDecodeSpec,
  PartDecodeExplainResult,
  PartDecodeSpec
} from "./types";
import { compileIdentifierDecodeSpecs, decodeIdentifierByDefinition } from "./identifier-compiler";
import { checkMatch, compilePartDecodeSpecs, decodePartBySpec, normalize } from "./part-compiler";
import { normalizeDecodeTables } from "./table";

export function compileDecodePack(pack: DecodePack): CompileDecodePackResult {
  return {
    partDecoders: compilePartDecodeSpecs(pack.partSpecs, pack.sharedTables),
    identifierDecoders: compileIdentifierDecodeSpecs(pack.identifierSpecs, pack.sharedTables),
    profileTables: pack.sharedTables ? normalizeDecodeTables(pack.sharedTables) : undefined
  };
}

function sortedPartSpecs(pack: DecodePack): PartDecodeSpec[] {
  return [...pack.partSpecs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function sortedIdentifierSpecs(pack: DecodePack): IdentifierDecodeSpec[] {
  return [...pack.identifierSpecs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function explainPartDecode(
  pack: DecodePack,
  input: string,
  options: { specId?: string } = {}
): PartDecodeExplainResult {
  const candidates = sortedPartSpecs(pack).filter((spec) => !options.specId || spec.id === options.specId);
  for (const spec of candidates) {
    const normalized = normalize(input, spec.normalize);
    if (!checkMatch(normalized, spec.match)) {
      continue;
    }
    const steps: DecodePackTraceStep[] = [];
    return {
      kind: "part",
      input,
      normalized,
      status: "matched",
      specId: spec.id,
      priority: spec.priority,
      steps,
      draft: decodePartBySpec(spec, normalized, steps, pack.sharedTables)
    };
  }
  const normalized = candidates[0] ? normalize(input, candidates[0].normalize) : input;
  return {
    kind: "part",
    input,
    normalized,
    status: "not_matched",
    steps: [],
    draft: null
  };
}

export function explainIdentifierDecode(
  pack: DecodePack,
  input: string,
  options: { idScheme?: "nand.flash_id"; specId?: string } = {}
): IdentifierDecodeExplainResult {
  const idScheme = options.idScheme ?? "nand.flash_id";
  const normalized = input.toUpperCase();
  const candidates = sortedIdentifierSpecs(pack).filter((spec) => spec.idScheme === idScheme && (!options.specId || spec.id === options.specId));
  for (const spec of candidates) {
    if (!checkMatch(normalized, spec.match)) {
      continue;
    }
    const bitfields: IdentifierDecodeExplainBitfield[] = [];
    return {
      kind: "identifier",
      input,
      normalized,
      idScheme,
      status: "matched",
      specId: spec.id,
      priority: spec.priority,
      bitfields,
      draft: decodeIdentifierByDefinition(normalized, spec, bitfields)
    };
  }
  return {
    kind: "identifier",
    input,
    normalized,
    idScheme,
    status: "not_matched",
    bitfields: [],
    draft: null
  };
}
