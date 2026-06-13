import type { ControllerGroupIndex } from "../controller-groups";
import { buildCapabilities } from "../result-builder";
import { FDNEXT_BUILD_METADATA, FDNEXT_VERSION, type FdnextCapabilities } from "../result";
import type { RuntimeCapabilitySection, RuntimeFdbSection } from "../runtime-data";
import type { IdentifierDecoder, PartNumberDecoder } from "../types";

function decoderPriority(priority: number | undefined): { priority?: number } {
  return typeof priority === "number" ? { priority } : {};
}

export function buildCapabilitiesSnapshot(input: {
  fdb: RuntimeFdbSection;
  capability: RuntimeCapabilitySection;
  controllerGroups: ControllerGroupIndex;
  decoders: PartNumberDecoder[];
  identifierDecoders: IdentifierDecoder[];
  lang: string;
  translateString(key: string, lang?: string | null): string;
}): FdnextCapabilities {
  const controllers = input.capability.ct;
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
      name: input.fdb.i[0],
      version: input.fdb.i[1],
      time: input.fdb.i[3],
      website: input.fdb.i[2]
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
          count: input.capability.n.fid
        },
        {
          id: "part_numbers",
          label: input.translateString("capability_inventory_metric.part_numbers", input.lang),
          count: input.capability.n.pn
        },
        {
          id: "micron_fbga",
          label: input.translateString("capability_inventory_metric.micron_fbga", input.lang),
          count: input.capability.n.fbga
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
