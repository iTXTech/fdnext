import nandDieProfileTableJson from "./rules/tables/nand-die-profile.json" with { type: "json" };

export interface NandDieProfile {
  die_codename?: string;
  generation_info?: string;
  layer_count?: number;
  cell_level?: number;
  die_density?: string;
  plane_count?: number;
  firmware_match?: string[];
  die_mark?: string[];
}

export const nandDieProfileTable = nandDieProfileTableJson as Record<string, NandDieProfile>;
export const nandDieProfileKeys = Object.freeze(Object.keys(nandDieProfileTable).sort());

export function isNandDieProfileKey(value: string): boolean {
  return Object.hasOwn(nandDieProfileTable, value);
}
