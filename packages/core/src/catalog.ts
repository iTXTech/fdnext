import { buildControllerGroupIndex, type ControllerGroupIndex } from "./controller-groups";
import { buildFdb, buildMdb } from "./fdb";
import { buildKnownPartNumbers, buildMicronDramFbgaCodes, collectFdbControllers, countFdbPartNumbers } from "./engine/resources";
import { buildNormalizedIndexes, type NormalizedIndexes } from "./part-index";
import { embeddedResourceBundle } from "./resources";
import type {
  FdbDataset,
  FdnextResourceBundle,
  KnownPartNumberEntry,
  LangPacks,
  MdbDataset
} from "./types";

const preparedCatalogData = new WeakMap<PreparedCatalog, PreparedCatalogData>();
const preparedCatalogByResources = new WeakMap<FdnextResourceBundle, PreparedCatalog>();

export interface PreparedCatalog {
  /** Opaque runtime brand. Catalog internals are intentionally not mutable through the public SDK. */
  readonly kind: "fdnext.prepared-catalog";
  readonly fdbVersion: string;
}

export interface PreparedCatalogInventory {
  readonly controllers: readonly string[];
  readonly fdbPartNumberCount: number;
  readonly managedNandPartNumberCount: number;
  readonly dramPartNumberCount: number;
  readonly micronFbgaCount: number;
}

export interface PreparedCatalogData {
  readonly fdb: FdbDataset;
  readonly mdb: MdbDataset;
  readonly managedNandPartNumbers: readonly KnownPartNumberEntry[];
  readonly dramPartNumbers: readonly KnownPartNumberEntry[];
  readonly micronDramFbgaCodes: ReadonlyMap<string, readonly string[]>;
  readonly micronDramFbgaCodeSet: ReadonlySet<string>;
  readonly micronFbgaCodeSet: ReadonlySet<string>;
  readonly controllerGroups: ControllerGroupIndex;
  readonly normalizedIndexes: NormalizedIndexes;
  readonly translationIndex: LangPacks;
  readonly inventory: PreparedCatalogInventory;
}

function buildPreparedCatalogData(resources: FdnextResourceBundle): PreparedCatalogData {
  const partResources = resources.partIndex ?? {};
  const identifierResources = resources.identifierIndex ?? {};
  const markingResources = resources.markingIndex ?? {};
  const rawPartFdb = (partResources.rawNand ?? {}) as Record<string, unknown>;
  const rawIdentifierFdb = (identifierResources.nandFlash ?? rawPartFdb) as Record<string, unknown>;
  const rawMdb = (markingResources.packageMarkings ?? {}) as Record<string, unknown>;
  const rawManagedNandPn = partResources.managedNand ?? [];
  const rawDramPn = partResources.dram ?? [];

  const partFdb = buildFdb(rawPartFdb);
  const identifierFdb = rawIdentifierFdb === rawPartFdb ? partFdb : buildFdb(rawIdentifierFdb);
  const fdb: FdbDataset = {
    info: partFdb.info,
    vendors: partFdb.vendors,
    flashIds: identifierFdb.flashIds
  };
  const mdb = buildMdb(rawMdb);
  const managedNandPartNumbers = buildKnownPartNumbers(rawManagedNandPn);
  const dramPartNumbers = buildKnownPartNumbers(rawDramPn);
  const micronDramFbgaCodes = buildMicronDramFbgaCodes(rawMdb);
  const controllers = collectFdbControllers(fdb);
  const controllerGroups = buildControllerGroupIndex(controllers, resources.controllerIndex);
  const normalizedIndexes = buildNormalizedIndexes({
    fdb,
    mdb,
    managedNandPartNumbers,
    dramPartNumbers,
    micronDramFbgaCodes
  });

  return Object.freeze({
    fdb,
    mdb,
    managedNandPartNumbers,
    dramPartNumbers,
    micronDramFbgaCodes,
    micronDramFbgaCodeSet: new Set(micronDramFbgaCodes.keys()),
    micronFbgaCodeSet: new Set(Object.keys(mdb.micron)),
    controllerGroups,
    normalizedIndexes,
    translationIndex: (resources.translationIndex ?? {}) as LangPacks,
    inventory: Object.freeze({
      controllers: Object.freeze(controllers),
      fdbPartNumberCount: countFdbPartNumbers(fdb),
      managedNandPartNumberCount: managedNandPartNumbers.length,
      dramPartNumberCount: dramPartNumbers.length,
      micronFbgaCount: Object.keys(mdb.micron).length
    })
  });
}

/**
 * Prepare immutable resource-derived state for one or more engines.
 *
 * The resource object is treated as immutable and cached by object identity. Most applications should
 * create one long-lived engine instead of creating an engine per operation; explicit catalogs are for
 * genuinely distinct engine configurations that share the same data.
 */
export function prepareCatalog(resources: FdnextResourceBundle = embeddedResourceBundle): PreparedCatalog {
  const cached = preparedCatalogByResources.get(resources);
  if (cached) {
    return cached;
  }

  const data = buildPreparedCatalogData(resources);
  const catalog = Object.freeze({
    kind: "fdnext.prepared-catalog" as const,
    fdbVersion: String(data.fdb.info.version)
  });
  preparedCatalogData.set(catalog, data);
  preparedCatalogByResources.set(resources, catalog);
  return catalog;
}

export function getDefaultPreparedCatalog(): PreparedCatalog {
  return prepareCatalog(embeddedResourceBundle);
}

export function getPreparedCatalogData(catalog: PreparedCatalog): PreparedCatalogData {
  const data = preparedCatalogData.get(catalog);
  if (!data) {
    throw new TypeError("Invalid PreparedCatalog: use prepareCatalog() to create catalog instances");
  }
  return data;
}
