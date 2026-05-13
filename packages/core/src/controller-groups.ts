import {
  fdnextControllerGroupIds,
  type CapabilityControllerGroup,
  type ControllerGroupId,
  type ControllerGroupSelection
} from "./result";
import type { ControllerResourceIndex } from "./types";

const controllerGroupIdSet = new Set<string>(fdnextControllerGroupIds);
const interfaceControllerGroupIds = fdnextControllerGroupIds.filter((id) => id.startsWith("if:"));
const eraControllerGroupIds = fdnextControllerGroupIds.filter((id) => id.startsWith("era:"));

export interface ControllerGroupIndex {
  defaultGroups: ControllerGroupId[] | "all";
  groups: CapabilityControllerGroup[];
}

function isControllerGroupId(value: string): value is ControllerGroupId {
  return controllerGroupIdSet.has(value);
}

function controllerGroupSelection(value: unknown): ControllerGroupId[] | "all" | undefined {
  if (value === "all") {
    return "all";
  }
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const groups: ControllerGroupId[] = [];
  const seen = new Set<string>();
  for (const item of values) {
    if (typeof item !== "string") continue;
    for (const piece of item.split(",")) {
      const group = piece.trim();
      if (group === "all") {
        return "all";
      }
      if (isControllerGroupId(group) && !seen.has(group)) {
        seen.add(group);
        groups.push(group);
      }
    }
  }
  return groups.length > 0 ? groups : undefined;
}

function hasAnyGroup(controller: string, groups: Map<ControllerGroupId, Set<string>>, ids: readonly ControllerGroupId[]): boolean {
  return ids.some((id) => groups.get(id)?.has(controller));
}

export function buildControllerGroupIndex(controllers: string[], resource: ControllerResourceIndex | undefined): ControllerGroupIndex {
  const groups = new Map<ControllerGroupId, Set<string>>();
  const controllerSet = new Set(controllers);
  for (const id of fdnextControllerGroupIds) {
    groups.set(id, new Set());
  }

  for (const [rawId, items] of Object.entries(resource?.groups ?? {})) {
    if (!isControllerGroupId(rawId) || !Array.isArray(items)) {
      continue;
    }
    const group = groups.get(rawId);
    for (const item of items) {
      if (typeof item === "string" && controllerSet.has(item)) {
        group?.add(item);
      }
    }
  }

  for (const controller of controllers) {
    if (!hasAnyGroup(controller, groups, interfaceControllerGroupIds)) {
      groups.get("if:unknown")?.add(controller);
    }
    if (!hasAnyGroup(controller, groups, eraControllerGroupIds)) {
      groups.get("era:unknown")?.add(controller);
    }
  }

  const defaultGroups = controllerGroupSelection(resource?.defaultGroups) ?? "all";
  return {
    defaultGroups,
    groups: fdnextControllerGroupIds.map((id) => {
      const groupItems = controllers.filter((controller) => groups.get(id)?.has(controller));
      return {
        id,
        count: groupItems.length,
        items: groupItems
      };
    })
  };
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
