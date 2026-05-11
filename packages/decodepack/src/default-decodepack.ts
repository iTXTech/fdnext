import type { DecodePack } from "./types";
import { defaultIdentifierDecodeSpecs } from "./identifier/default-rules";
import { defaultPartDecodeSpecs } from "./rules/default-rules";

export const defaultDecodePack: DecodePack = {
  partSpecs: defaultPartDecodeSpecs,
  identifierSpecs: defaultIdentifierDecodeSpecs
};
