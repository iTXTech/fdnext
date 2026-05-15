import type { DecodePack } from "./types";
import { defaultIdentifierDecodeSpecs } from "./identifier/default-rules";
import { defaultPartDecodeSpecs } from "./rules/default-rules";
import ymtcProcessTable from "./rules/tables/ymtc-process.json" with { type: "json" };

export const defaultDecodePack: DecodePack = {
  sharedTables: {
    "ymtc.process": ymtcProcessTable
  },
  partSpecs: defaultPartDecodeSpecs,
  identifierSpecs: defaultIdentifierDecodeSpecs
};
