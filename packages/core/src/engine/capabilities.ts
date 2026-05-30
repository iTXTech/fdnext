import type { ControllerGroupIndex } from "../controller-groups";
import { buildCapabilities } from "../result-builder";
import { FDNEXT_BUILD_METADATA, FDNEXT_VERSION, type FdnextCapabilities } from "../result";
import type { FdbDataset, IdentifierDecoder, KnownPartNumberEntry, MdbDataset, PartNumberDecoder } from "../types";
import { collectFdbControllers, countFdbPartNumbers } from "./resources";

function decoderPriority(priority: number | undefined): { priority?: number } {
  return typeof priority === "number" ? { priority } : {};
}

export function buildCapabilitiesSnapshot(input: {
  fdb: FdbDataset;
  mdb: MdbDataset;
  managedNandPartNumbers: KnownPartNumberEntry[];
  dramPartNumbers: KnownPartNumberEntry[];
  controllerGroups: ControllerGroupIndex;
  decoders: PartNumberDecoder[];
  identifierDecoders: IdentifierDecoder[];
  lang: string;
  translateString(key: string, lang?: string | null): string;
}): FdnextCapabilities {
  const controllers = collectFdbControllers(input.fdb);
  const fdbPartNumberCount = countFdbPartNumbers(input.fdb);
  const managedNandPartNumberCount = input.managedNandPartNumbers.length;
  const dramPartNumberCount = input.dramPartNumbers.length;
  const partNumberCount = fdbPartNumberCount + managedNandPartNumberCount + dramPartNumberCount;
  const micronFbgaCount = Object.keys(input.mdb.micron).length;
  const controllerGroups = input.controllerGroups.groups.map((group) => {
    const titleKey = `controller_group.${group.id}.title`;
    const descriptionKey = `controller_group.${group.id}.description`;
    const title = input.translateString(titleKey, input.lang);
    const description = input.translateString(descriptionKey, input.lang);
    return {
      ...group,
      title: title !== titleKey ? title : group.title,
      ...(description !== descriptionKey ? { description } : {})
    };
  });

  return buildCapabilities({
    server: {
      name: "fdnext-server",
      version: FDNEXT_VERSION,
      build: FDNEXT_BUILD_METADATA
    },
    fdb: {
      name: input.fdb.info.name,
      version: input.fdb.info.version,
      time: input.fdb.info.time,
      website: input.fdb.info.website
    },
    inventory: {
      metrics: [
        {
          id: "controllers",
          label: input.translateString("capability_inventory_metric.controllers", input.lang),
          count: controllers.length
        },
        {
          id: "flash_ids",
          label: input.translateString("capability_inventory_metric.flash_ids", input.lang),
          count: input.fdb.flashIds.size
        },
        {
          id: "part_numbers",
          label: input.translateString("capability_inventory_metric.part_numbers", input.lang),
          count: partNumberCount
        },
        {
          id: "micron_fbga",
          label: input.translateString("capability_inventory_metric.micron_fbga", input.lang),
          count: micronFbgaCount
        }
      ],
      controllers: {
        count: controllers.length,
        items: controllers,
        defaultGroups: input.controllerGroups.defaultGroups,
        groups: controllerGroups
      }
    },
    decoders: {
      partNumber: input.decoders.map((decoder) => ({
        id: decoder.id,
        ...decoderPriority(decoder.priority)
      })),
      identifier: input.identifierDecoders.map((decoder) => ({
        id: decoder.id,
        idScheme: decoder.idScheme,
        ...decoderPriority(decoder.priority)
      }))
    }
  });
}
