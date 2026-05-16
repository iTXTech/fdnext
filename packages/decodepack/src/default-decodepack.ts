import type { DecodePack } from "./types";
import { defaultIdentifierDecodeSpecs } from "./identifier/default-rules";
import { defaultPartDecodeSpecs } from "./rules/default-rules";
import nandDieProfileTable from "./rules/tables/nand-die-profile.json" with { type: "json" };
import ymtcProcessTable from "./rules/tables/ymtc-process.json" with { type: "json" };

export const defaultDecodePack: DecodePack = {
  sharedTables: {
    "nand.die_profile": nandDieProfileTable,
    "ymtc.process": ymtcProcessTable
  },
  partSpecs: defaultPartDecodeSpecs,
  identifierSpecs: defaultIdentifierDecodeSpecs
};
