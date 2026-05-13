import chsJson from "./resources/lang/chs.json" with { type: "json" };
import controllerGroupsJson from "./resources/controller-groups.json" with { type: "json" };
import dramPnJson from "./resources/dram-pn.json" with { type: "json" };
import engJson from "./resources/lang/eng.json" with { type: "json" };
import fdbJson from "./resources/fdb.json" with { type: "json" };
import managedNandPnJson from "./resources/managed-nand-pn.json" with { type: "json" };
import mdbJson from "./resources/mdb.json" with { type: "json" };

export type ResourcesRecord = Record<string, unknown>;
export type SearchResourceRecord = Record<string, unknown> | unknown[];
export type LangRecord = Record<string, string>;
export type ResourceJson = ResourcesRecord | unknown[];

export interface EmbeddedResourceBundle {
  partIndex: {
    rawNand: ResourcesRecord;
    managedNand: SearchResourceRecord;
    dram: SearchResourceRecord;
  };
  identifierIndex: {
    nandFlash: ResourcesRecord;
  };
  markingIndex: {
    packageMarkings: ResourcesRecord;
  };
  vendorIndex: Record<string, never>;
  controllerIndex: ResourcesRecord;
  translationIndex: Record<string, LangRecord>;
}

const flashDatabase = fdbJson as ResourcesRecord;
const packageMarkings = mdbJson as ResourcesRecord;
const managedNandParts = managedNandPnJson as SearchResourceRecord;
const dramParts = dramPnJson as SearchResourceRecord;
const controllerIndex = controllerGroupsJson as ResourcesRecord;
const translationIndex = {
  chs: chsJson as LangRecord,
  eng: engJson as LangRecord
};

export const embeddedResourceBundle = {
  partIndex: {
    rawNand: flashDatabase,
    managedNand: managedNandParts,
    dram: dramParts
  },
  identifierIndex: {
    nandFlash: flashDatabase
  },
  markingIndex: {
    packageMarkings
  },
  vendorIndex: {},
  controllerIndex,
  translationIndex
} satisfies EmbeddedResourceBundle;

export function getEmbeddedResourceBundle(): EmbeddedResourceBundle {
  return embeddedResourceBundle;
}
