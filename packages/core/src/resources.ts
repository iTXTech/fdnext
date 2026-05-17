import chsJson from "../resources/lang/chs.json" with { type: "json" };
import controllerGroupsJson from "../resources/controller-groups.json" with { type: "json" };
import dramPnJson from "../resources/dram-pn.json" with { type: "json" };
import engJson from "../resources/lang/eng.json" with { type: "json" };
import fdbJson from "../resources/fdb.json" with { type: "json" };
import managedNandPnJson from "../resources/managed-nand-pn.json" with { type: "json" };
import mdbJson from "../resources/mdb.json" with { type: "json" };
import type { FdnextResourceBundle, LangPack, ResourceJson } from "./types";

const flashDatabase = fdbJson as Record<string, unknown>;
const packageMarkings = mdbJson as Record<string, unknown>;
const managedNandParts = managedNandPnJson as ResourceJson;
const dramParts = dramPnJson as ResourceJson;
const controllerIndex = controllerGroupsJson as Record<string, unknown>;
const translationIndex = {
  chs: chsJson as LangPack,
  eng: engJson as LangPack
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
} satisfies FdnextResourceBundle;

export function getEmbeddedResourceBundle(): FdnextResourceBundle {
  return embeddedResourceBundle;
}
