import type { PartNumberDecoder } from "./types";

// Core no longer ships vendor-specific part-number decoders.
// Callers should inject decoders compiled from iTXTech fdnext DecodePack specs.
export function buildDefaultDecoders(): PartNumberDecoder[] {
  return [];
}
