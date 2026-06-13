import {
  fdnextControllerGroupIds,
  type CapabilityControllerGroup,
  type ControllerGroupId,
  type ControllerGroupSelection,
  type ControllerProjectionGroupId
} from "./result";
import type { RuntimeCapabilitySection } from "./runtime-data";

const controllerGroupIdSet = new Set<string>(fdnextControllerGroupIds);
export interface ControllerGroupIndex {
  defaultGroups: ControllerProjectionGroupId[] | "all";
  groups: CapabilityControllerGroup[];
}

function isProjectionControllerGroupId(value: string): value is ControllerProjectionGroupId {
  return controllerGroupIdSet.has(value) && value !== "all";
}

function controllerGroupSelection(value: unknown): ControllerProjectionGroupId[] | "all" | undefined {
  if (value === "all") {
    return "all";
  }
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const groups: ControllerProjectionGroupId[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    if (typeof item !== "string") continue;
    for (const piece of item.split(",")) {
      const group = piece.trim();
      if (group === "all") {
        return "all";
      }
      if (isProjectionControllerGroupId(group) && !seen.has(group)) {
        seen.add(group);
        groups.push(group);
      }
    }
  }
  return groups.length > 0 ? groups : undefined;
}

export function projectControllersByGroup(
  controllers: string[] | undefined,
  index: ControllerGroupIndex,
  selection: ControllerGroupSelection | undefined
): string[] {
  if (!controllers || controllers.length === 0) {
    return [];
  }
  const normalizedSelection = controllerGroupSelection(selection) ?? index.defaultGroups;
  if (normalizedSelection === "all") {
    return [...controllers];
  }

  const allowed = new Set<string>();
  for (const groupId of normalizedSelection) {
    const group = index.groups.find((item) => item.id === groupId);
    for (const controller of group?.items ?? []) {
      allowed.add(controller);
    }
  }
  return controllers.filter((controller) => allowed.has(controller));
}

export function controllerGroupIndexFromRuntimeData(section: RuntimeCapabilitySection): ControllerGroupIndex {
  return {
    defaultGroups: section.dg === "all" ? "all" : section.dg.filter(isProjectionControllerGroupId),
    groups: section.g.map(([id, count, items, exclusive]) => ({
      id: id as ControllerGroupId,
      title: id,
      ...(exclusive ? { exclusive: true } : {}),
      count,
      items
    }))
  };
}
