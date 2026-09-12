import nandDieProfileTableJson from "./rules/tables/nand-die-profile.json" with { type: "json" };
import type { NandInterface } from "../nand-interface";

export interface NandDieProfile {
  die_codename?: string;
  process_alias?: string;
  generation_info?: string;
  nand_technology?: string;
  layer_count?: number;
  cell_level?: number;
  die_density?: number;
  plane_count?: number;
  nand_interface?: NandInterface;
  firmware_match?: string[];
  die_mark?: string[];
}

export const nandDieProfileTable = nandDieProfileTableJson as Record<string, NandDieProfile>;
export const nandDieProfileKeys = Object.freeze(Object.keys(nandDieProfileTable).sort());

export function isNandDieProfileKey(value: string): boolean {
  return Object.hasOwn(nandDieProfileTable, value);
}
