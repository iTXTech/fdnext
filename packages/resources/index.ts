import chsJson from "./resources/lang/chs.json" with { type: "json" };
import dramPnJson from "./resources/dram-pn.json" with { type: "json" };
import engJson from "./resources/lang/eng.json" with { type: "json" };
import fdbJson from "./resources/fdb.json" with { type: "json" };
import managedNandPnJson from "./resources/managed-nand-pn.json" with { type: "json" };
import micronDramFbgaJson from "./resources/micron-dram-fbga.json" with { type: "json" };
import mdbJson from "./resources/mdb.json" with { type: "json" };

export type ResourcesRecord = Record<string, unknown>;
export type LangRecord = Record<string, string>;

export const fdbRaw = fdbJson as ResourcesRecord;
export const mdbRaw = mdbJson as ResourcesRecord;
export const managedNandPnRaw = managedNandPnJson as ResourcesRecord;
export const dramPnRaw = dramPnJson as ResourcesRecord;
export const micronDramFbgaRaw = micronDramFbgaJson as ResourcesRecord;
export const langRaw: Record<string, LangRecord> = {
  chs: chsJson as LangRecord,
  eng: engJson as LangRecord
};

export const embeddedResources = {
  fdbRaw,
  mdbRaw,
  managedNandPnRaw,
  dramPnRaw,
  micronDramFbgaRaw,
  langRaw
};

export function getEmbeddedResources() {
  return embeddedResources;
}
