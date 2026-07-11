import type { DecodePack } from "./types";
import { validateDecodePack } from "./checker";
import { defaultIdentifierDecodeSpecs } from "./identifier/default-rules";
import { defaultPartDecodeSpecs } from "./rules/default-rules";
import nandDieProfileTable from "./rules/tables/nand-die-profile.json" with { type: "json" };

const defaultDecodePackSource: DecodePack = {
  sharedTables: {
    "nand.die_profile": nandDieProfileTable
  },
  partSpecs: defaultPartDecodeSpecs,
  identifierSpecs: defaultIdentifierDecodeSpecs
};

export const defaultDecodePack = validateDecodePack(defaultDecodePackSource);
