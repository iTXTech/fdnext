import { patchMicronPartNumberDieCodename } from "../micron/process-node";
import { deleteDraftField, draftField, draftIdentifier, draftPartNumber, draftVendor, setDraftField } from "../draft";
import type { IdentifierDecodeDraft, PartDecodeDraft } from "../types";

interface DecodeDraftPostprocessor {
  partInfo?(partInfo: PartDecodeDraft): PartDecodeDraft;
  identifierInfo?(identifierInfo: IdentifierDecodeDraft): IdentifierDecodeDraft;
}
import { normalizePartNumber } from "../utils/normalize";
import { flashIdByteAt } from "./bytes";

type ProcessLookup = {
  start: number;
  hex: string;
  dieCodename: string;
};

type YmtcProcessKey =
  | "X0-A030"
  | "X1-9050"
  | "X2-9060"
  | "X2-6070"
  | "X3-9060"
  | "X3-9070"
  | "X3-6070"
  | "X4-9060"
  | "X4-9070"
  | "X4-6080";

type YmtcProcessInfo = {
  die_codename: string;
  process_alias?: string;
  generation_info?: string;
  layer_count?: number;
  cell_level?: number;
  die_density?: string;
  plane_count?: number;
  speed_grade?: string;
};

type YmtcProcessLookup = {
  start: number;
  hex: string;
  processKey: YmtcProcessKey;
  page_size?: number;
  redundant_area_size?: string;
  pages_per_block?: string;
};

const GBIT_TO_MBIT = 1024;

const MICRON_LIKE_PROCESS_LOOKUPS: ProcessLookup[] = [
  { start: 1, hex: "C30832EA30", dieCodename: "B47R" },
  { start: 1, hex: "D38932EA30", dieCodename: "B47R" },
  { start: 1, hex: "E38A32EA30", dieCodename: "B47R" },
  { start: 1, hex: "C30832EA34", dieCodename: "B47T" },
  { start: 1, hex: "D38932EA34", dieCodename: "B47T" },
  { start: 1, hex: "E38A32EA34", dieCodename: "B47T" },
  { start: 1, hex: "D30C32EA30", dieCodename: "N48R" },
  { start: 1, hex: "E38D32EA30", dieCodename: "N48R" },
  { start: 1, hex: "F38E32EA30", dieCodename: "N48R" },
  { start: 1, hex: "C30832E630", dieCodename: "B57T" },
  { start: 1, hex: "D38932E630", dieCodename: "B57T" },
  { start: 1, hex: "E38A32E630", dieCodename: "B57T" },
  { start: 1, hex: "D30832E830", dieCodename: "B58R" },
  { start: 1, hex: "E38932E830", dieCodename: "B58R" },
  { start: 1, hex: "F38A32E830", dieCodename: "B58R" },
  { start: 1, hex: "D30832E831", dieCodename: "B58R" },
  { start: 1, hex: "E38932E831", dieCodename: "B58R" },
  { start: 1, hex: "F38A32E831", dieCodename: "B58R" },
  { start: 1, hex: "D30C42EE30", dieCodename: "N58R" },
  { start: 1, hex: "E38D42EE30", dieCodename: "N58R" },
  { start: 1, hex: "F38E42EE30", dieCodename: "N58R" },
  { start: 1, hex: "D30C42EE31", dieCodename: "N58R" },
  { start: 1, hex: "E38D42EE31", dieCodename: "N58R" },
  { start: 1, hex: "F38E42EE31", dieCodename: "N58R" },
  { start: 1, hex: "D30832E834", dieCodename: "B68S" },
  { start: 1, hex: "E38932E834", dieCodename: "B68S" },
  { start: 1, hex: "F38A32E834", dieCodename: "B68S" },
  { start: 1, hex: "D30832E835", dieCodename: "B68S" },
  { start: 1, hex: "E38932E835", dieCodename: "B68S" },
  { start: 1, hex: "F38A32E835", dieCodename: "B68S" },
  { start: 1, hex: "D5943E74", dieCodename: "L52A" },
  { start: 1, hex: "D7D53E78", dieCodename: "L52A" },
  { start: 1, hex: "48002689", dieCodename: "M62A" },
  { start: 1, hex: "6801A689", dieCodename: "M62A" },
  { start: 1, hex: "68044689", dieCodename: "L63B" },
  { start: 1, hex: "8805C689", dieCodename: "L63B" },
  { start: 1, hex: "680446A9", dieCodename: "L63B" },
  { start: 1, hex: "680027A9", dieCodename: "M73A" },
  { start: 1, hex: "8801A7A9", dieCodename: "M73A" },
  { start: 1, hex: "682027A9", dieCodename: "M73A" },
  { start: 1, hex: "68044AA9", dieCodename: "L73A" },
  { start: 1, hex: "8805CAA9", dieCodename: "L73A" },
  { start: 1, hex: "88044BA900", dieCodename: "L74A" },
  { start: 1, hex: "A805CBA900", dieCodename: "L74A" },
  { start: 1, hex: "88244BA900", dieCodename: "L74A" },
  { start: 1, hex: "88244BA984", dieCodename: "L84A" },
  { start: 1, hex: "64444BA9", dieCodename: "L84A" },
  { start: 1, hex: "84C54BA9", dieCodename: "L84A" },
  { start: 1, hex: "64643CA1", dieCodename: "L84C" },
  { start: 1, hex: "64643CA5", dieCodename: "L84C" },
  { start: 1, hex: "84E53CA5", dieCodename: "L84C" },
  { start: 1, hex: "84643CA5", dieCodename: "L85A" },
  { start: 1, hex: "A4E53CA5", dieCodename: "L85A" },
  { start: 1, hex: "84643CA9", dieCodename: "L85C" },
  { start: 1, hex: "A4E53CA9", dieCodename: "L85C" },
  { start: 1, hex: "846454A9", dieCodename: "L95B" },
  { start: 1, hex: "A4E554A9", dieCodename: "L95B" },
  { start: 1, hex: "6808568A", dieCodename: "B63A" },
  { start: 1, hex: "88085FA9", dieCodename: "B74A" },
  { start: 1, hex: "88085F89", dieCodename: "B74A" },
  { start: 1, hex: "88285FA9", dieCodename: "B74A" },
  { start: 1, hex: "A809DF89", dieCodename: "B74A" },
  { start: 1, hex: "A809DFA9", dieCodename: "B74A" },
  { start: 1, hex: "847863A9", dieCodename: "B85T" },
  { start: 1, hex: "84787BA9", dieCodename: "B85T" },
  { start: 1, hex: "A4F963A9", dieCodename: "B85T" },
  { start: 1, hex: "A4F97BA9", dieCodename: "B85T" },
  { start: 1, hex: "844863A9", dieCodename: "B95A" },
  { start: 1, hex: "644432A5", dieCodename: "L04A" },
  { start: 1, hex: "844434AA", dieCodename: "L05B" },
  { start: 1, hex: "845832A1", dieCodename: "B05A" },
  { start: 1, hex: "A46434AA", dieCodename: "L05A" },
  { start: 1, hex: "A4E4348A", dieCodename: "L06A" },
  { start: 1, hex: "A46432AA", dieCodename: "L06B" },
  { start: 1, hex: "C4E532AA", dieCodename: "L06B" },
  { start: 1, hex: "B47832AA", dieCodename: "B0KB" },
  { start: 1, hex: "CCF932AA", dieCodename: "B0KB" },
  { start: 1, hex: "A40832A1", dieCodename: "B16A" },
  { start: 1, hex: "A48832A1", dieCodename: "B16A" },
  { start: 1, hex: "C48932A1", dieCodename: "B16A" },
  { start: 1, hex: "C40832A6", dieCodename: "B17A" },
  { start: 1, hex: "D48932A6", dieCodename: "B17A" },
  { start: 1, hex: "E48A32A6", dieCodename: "B17A" },
  { start: 1, hex: "D40C32AA", dieCodename: "N18A" },
  { start: 1, hex: "C41832A2", dieCodename: "B27A" },
  { start: 1, hex: "D49932A2", dieCodename: "B27A" },
  { start: 1, hex: "E49A32A2", dieCodename: "B27A" },
  { start: 1, hex: "C30832E600", dieCodename: "B27B" },
  { start: 1, hex: "D38932E6", dieCodename: "B27B" },
  { start: 1, hex: "E38A32E6", dieCodename: "B27B" },
  { start: 1, hex: "D31C32C6", dieCodename: "N28A" },
  { start: 1, hex: "D39C32C6", dieCodename: "N28A" },
  { start: 1, hex: "E39D32C6", dieCodename: "N28A" },
  { start: 1, hex: "F39E32C6", dieCodename: "N28A" },
  { start: 1, hex: "A36032C6", dieCodename: "M26A" },
  { start: 1, hex: "A37832E5", dieCodename: "B36R" },
  { start: 1, hex: "C37832EA", dieCodename: "B37R" },
  { start: 0, hex: "89D3AC32C6", dieCodename: "N38A" },
  { start: 0, hex: "89E3AD32C6", dieCodename: "N38A" },
  { start: 0, hex: "89D3AC32C2", dieCodename: "N38B" },
  { start: 0, hex: "89E3AD32C2", dieCodename: "N38B" },
  { start: 0, hex: "89092832C2", dieCodename: "N4PA" },
  { start: 0, hex: "89092932C2", dieCodename: "N4PA" },
  { start: 0, hex: "89092A32C2", dieCodename: "N4PA" },
  { start: 0, hex: "89092B32C2", dieCodename: "N4PA" },
  { start: 0, hex: "89050432C2", dieCodename: "N4PA" },
  { start: 0, hex: "89050532C2", dieCodename: "N4PA" },
  { start: 0, hex: "89050632C2", dieCodename: "N4PA" },
  { start: 0, hex: "89050732C2", dieCodename: "N4PA" }
];

const MICRON_LIKE_DENSITY_BY_BYTE2: Record<number, number> = {
  0x05: 1024 * GBIT_TO_MBIT,
  0x09: 1365 * GBIT_TO_MBIT,
  0x48: 16 * GBIT_TO_MBIT,
  0xd5: 16 * GBIT_TO_MBIT,
  0x68: 32 * GBIT_TO_MBIT,
  0xd7: 32 * GBIT_TO_MBIT,
  0x64: 64 * GBIT_TO_MBIT,
  0x88: 64 * GBIT_TO_MBIT,
  0xd9: 64 * GBIT_TO_MBIT,
  0x84: 128 * GBIT_TO_MBIT,
  0xa8: 128 * GBIT_TO_MBIT,
  0xa3: 256 * GBIT_TO_MBIT,
  0xa4: 256 * GBIT_TO_MBIT,
  0xb4: 384 * GBIT_TO_MBIT,
  0xc3: 512 * GBIT_TO_MBIT,
  0xc4: 512 * GBIT_TO_MBIT,
  0xcc: 768 * GBIT_TO_MBIT,
  0xd3: 1024 * GBIT_TO_MBIT,
  0xd4: 1024 * GBIT_TO_MBIT,
  0xe3: 2048 * GBIT_TO_MBIT,
  0xe4: 2048 * GBIT_TO_MBIT,
  0xf3: 4096 * GBIT_TO_MBIT
};

const MICRON_LIKE_STACKED_DENSITY_BYTE2 = new Set([0x05, 0x09]);

const KIOXIA_LIKE_PROCESS_BY_MASKED_BYTE6: Record<number, string> = {
  0x21: "BiCS2",
  0x22: "BiCS3",
  0x23: "BiCS4",
  0x24: "BiCS5",
  0x25: "BiCS6",
  0x26: "BiCS8"
};

const KIOXIA_LIKE_DENSITY_BY_BYTE2: Record<number, number> = {
  0x3a: 128 * GBIT_TO_MBIT,
  0x4a: 128 * GBIT_TO_MBIT,
  0x4c: 128 * GBIT_TO_MBIT,
  0x3c: 256 * GBIT_TO_MBIT,
  0x3d: 256 * GBIT_TO_MBIT,
  0x3e: 512 * GBIT_TO_MBIT,
  0x4e: 512 * GBIT_TO_MBIT,
  0x48: 1024 * GBIT_TO_MBIT,
  0x49: 2048 * GBIT_TO_MBIT,
  0x73: 1365 * GBIT_TO_MBIT,
  0x7a: 1365 * GBIT_TO_MBIT,
  0xd3: 8 * GBIT_TO_MBIT,
  0xd5: 16 * GBIT_TO_MBIT,
  0xd7: 32 * GBIT_TO_MBIT,
  0xde: 64 * GBIT_TO_MBIT
};

const SKHYNIX_PROCESS_BY_BYTE6: Record<number, string> = {
  0x25: "HY16",
  0x40: "HY16",
  0x41: "HY41",
  0x42: "HY32",
  0x43: "HY26",
  0x44: "HY20",
  0x45: "HY16",
  0x48: "HY16",
  0x49: "HY16",
  0x4a: "HY16",
  0x50: "HY14",
  0x60: "HYV1",
  0x65: "HY16",
  0x70: "HYV2",
  0x80: "HYV3",
  0x90: "HYV4",
  0xa0: "HYV5",
  0xa2: "HYV5",
  0xb0: "HYV6",
  0xb2: "HYV6",
  0xc0: "HYV7",
  0xc3: "HY26",
  0xc4: "HY20",
  0xd0: "HYV8",
  0xe0: "HY14",
  0xe5: "HY16"
};

const SKHYNIX_DENSITY_BY_BYTE2: Record<number, number> = {
  0x3a: 128 * GBIT_TO_MBIT,
  0x5a: 128 * GBIT_TO_MBIT,
  0x3c: 256 * GBIT_TO_MBIT,
  0x5c: 256 * GBIT_TO_MBIT,
  0x3e: 512 * GBIT_TO_MBIT,
  0x5e: 512 * GBIT_TO_MBIT,
  0x7e: 512 * GBIT_TO_MBIT,
  0x89: 1024 * GBIT_TO_MBIT,
  0xd3: 8 * GBIT_TO_MBIT,
  0xd5: 16 * GBIT_TO_MBIT,
  0xd7: 32 * GBIT_TO_MBIT,
  0xde: 64 * GBIT_TO_MBIT,
  0xee: 64 * GBIT_TO_MBIT
};

const SKHYNIX_STACKED_PROCESS_BYTE6 = new Set([0x70, 0x80, 0x90, 0xa0, 0xa2, 0xb0, 0xb2, 0xc0, 0xc2, 0xd0]);

const SAMSUNG_PROCESS_BY_BYTE6: Record<number, string> = {
  0xc1: "SSV6",
  0xc7: "SSV1"
};

const SAMSUNG_LARGE_DIE_PROCESS_BY_BYTE6: Record<number, string> = {
  0xc1: "SSV7",
  0xc2: "SSV6P",
  0xc3: "SSV9",
  0xcf: "SSV8",
  0xd2: "SSV6P",
  0xdf: "SSV8"
};

const SAMSUNG_PROCESS_BY_MASKED_BYTE6: Record<number, string> = {
  0x40: "SS51",
  0x41: "SS42",
  0x42: "SS32",
  0x43: "SS27",
  0x44: "SS21",
  0x45: "SS19",
  0x46: "SS16",
  0x47: "SSV4",
  0x48: "SSV2",
  0x49: "SSV3",
  0x4a: "SS14",
  0x4b: "SSV4",
  0x4c: "SSV5",
  0x4d: "SSV6",
  0x4e: "SSV7"
};

const SAMSUNG_DENSITY_BY_BYTE2: Record<number, number> = {
  0x11: 4096 * GBIT_TO_MBIT,
  0x1a: 128 * GBIT_TO_MBIT,
  0x3a: 128 * GBIT_TO_MBIT,
  0x1c: 256 * GBIT_TO_MBIT,
  0x3c: 256 * GBIT_TO_MBIT,
  0x5c: 256 * GBIT_TO_MBIT,
  0x1e: 512 * GBIT_TO_MBIT,
  0x5e: 512 * GBIT_TO_MBIT,
  0x1f: 1024 * GBIT_TO_MBIT,
  0x5f: 1024 * GBIT_TO_MBIT,
  0x51: 2048 * GBIT_TO_MBIT,
  0xd3: 8 * GBIT_TO_MBIT,
  0xd5: 16 * GBIT_TO_MBIT,
  0xd7: 32 * GBIT_TO_MBIT,
  0xde: 64 * GBIT_TO_MBIT
};

const SAMSUNG_LARGE_DIE_THRESHOLD_MBIT = 512 * GBIT_TO_MBIT;

const YMTC_PROCESS_INFO_BY_KEY: Record<YmtcProcessKey, YmtcProcessInfo> = {
  "X0-A030": {
    die_codename: "DBS",
    generation_info: "Gen 1",
    layer_count: 32,
    cell_level: 2,
    die_density: "64Gb",
    plane_count: 1,
    speed_grade: "Max Speed=533MT/s"
  },
  "X1-9050": {
    die_codename: "JGS",
    generation_info: "Gen 2 Xtacking 1.0",
    layer_count: 64,
    cell_level: 3,
    die_density: "256Gb",
    plane_count: 2,
    speed_grade: "ONFI 4.0; Max Speed=800MT/s"
  },
  "X2-9060": {
    die_codename: "TAS",
    generation_info: "Gen 3 Xtacking 2.0",
    layer_count: 128,
    cell_level: 3,
    die_density: "512Gb",
    plane_count: 4,
    speed_grade: "ONFI 4.1; Max Speed=1600MT/s"
  },
  "X2-6070": {
    die_codename: "HUS",
    generation_info: "Gen 3 Xtacking 2.0",
    layer_count: 128,
    cell_level: 4,
    die_density: "1.33Tb",
    plane_count: 6,
    speed_grade: "ONFI 4.1; Max Speed=1200MT/s"
  },
  "X3-9060": {
    die_codename: "WYS",
    generation_info: "Gen 4 Xtacking 3.0",
    layer_count: 128,
    cell_level: 3,
    die_density: "512Gb",
    plane_count: 4,
    speed_grade: "ONFI 5.0; Max Speed=2400MT/s"
  },
  "X3-9070": {
    die_codename: "WDS",
    generation_info: "Gen 4 Xtacking 3.0",
    layer_count: 232,
    cell_level: 3,
    die_density: "1Tb",
    plane_count: 6,
    speed_grade: "ONFI 5.0; Max Speed=2400MT/s"
  },
  "X3-6070": {
    die_codename: "EMS",
    generation_info: "Gen 4 Xtacking 3.0",
    layer_count: 232,
    cell_level: 4,
    die_density: "1Tb",
    plane_count: 4,
    speed_grade: "ONFI 5.0; Max Speed=2400MT/s"
  },
  "X4-9060": {
    die_codename: "WTS",
    generation_info: "Gen 5 Xtacking 4.0",
    layer_count: 160,
    cell_level: 3,
    die_density: "512Gb",
    plane_count: 4,
    speed_grade: "ONFI 5.1; Max Speed=3600MT/s"
  },
  "X4-9070": {
    die_codename: "SQS",
    generation_info: "Gen 5 Xtacking 4.0",
    layer_count: 267,
    cell_level: 3,
    die_density: "1Tb",
    plane_count: 6
  },
  "X4-6080": {
    die_codename: "PTS",
    generation_info: "Gen 5 Xtacking 4.0",
    layer_count: 267,
    cell_level: 4,
    die_density: "2Tb"
  }
};

const YMTC_GENERATION_BY_LAYER_CODE: Record<number, string> = {
  0: "Gen 1",
  1: "Gen 2 Xtacking 1.0",
  2: "Gen 3 Xtacking 2.0",
  3: "Gen 4 Xtacking 3.0",
  4: "Gen 5 Xtacking 4.0"
};

const YMTC_PROCESS_LOOKUPS: YmtcProcessLookup[] = [
  {
    start: 1,
    hex: "C3482510",
    processKey: "X1-9050",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "1152 pages"
  },
  {
    start: 1,
    hex: "D5588D20",
    processKey: "X2-6070",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "3048 pages"
  },
  {
    start: 1,
    hex: "C4284920",
    processKey: "X2-9060",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "2304 pages"
  },
  {
    start: 1,
    hex: "C5294920",
    processKey: "X2-9060",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "2304 pages"
  },
  {
    start: 1,
    hex: "C4284930",
    processKey: "X3-9060",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "2304 pages"
  },
  {
    start: 1,
    hex: "C5294930",
    processKey: "X3-9060",
    page_size: 16384,
    redundant_area_size: "2048B",
    pages_per_block: "2304 pages"
  },
  {
    start: 1,
    hex: "C5587130",
    processKey: "X3-9070",
    page_size: 16384,
    redundant_area_size: "1984B",
    pages_per_block: "4176 pages"
  },
  {
    start: 1,
    hex: "C6597130",
    processKey: "X3-9070",
    page_size: 16384,
    redundant_area_size: "1984B",
    pages_per_block: "4176 pages"
  },
  {
    start: 1,
    hex: "C55C5530",
    processKey: "X3-6070",
    page_size: 16384,
    redundant_area_size: "2432B",
    pages_per_block: "5544 pages"
  }
];

const YMTC_DENSITY_BY_BYTE2: Record<number, number> = {
  0xc3: 256 * GBIT_TO_MBIT,
  0xc4: 512 * GBIT_TO_MBIT,
  0xc5: 1024 * GBIT_TO_MBIT,
  0xc6: 2048 * GBIT_TO_MBIT,
  0xd5: 1365 * GBIT_TO_MBIT
};

function lookupProcess<T extends { start: number; hex: string }>(id: string, lookups: T[]): T | undefined {
  const normalized = id.toUpperCase();
  let best: T | undefined;
  for (const lookup of lookups) {
    const start = lookup.start * 2;
    if (normalized.slice(start, start + lookup.hex.length) === lookup.hex) {
      if (!best || lookup.hex.length > best.hex.length) {
        best = lookup;
      }
    }
  }
  return best;
}

function lookupDieCodename(id: string, lookups: ProcessLookup[]): string | undefined {
  return lookupProcess(id, lookups)?.dieCodename;
}

function lookupNumber(table: Record<number, number>, byte: number): number | undefined {
  if (!Number.isFinite(byte)) {
    return undefined;
  }
  return table[byte];
}

function lookupString(table: Record<number, string>, byte: number): string | undefined {
  if (!Number.isFinite(byte)) {
    return undefined;
  }
  return table[byte];
}

function dieCountFromFlashId(id: string): number {
  return 1 << (flashIdByteAt(id, 3) & 0x03);
}

function numericDraftField(info: IdentifierDecodeDraft, key: "density" | "die_count" | "cell_level"): number | undefined {
  const value = draftField(info, key);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  if (key === "cell_level") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "SLC") {
      return 1;
    }
    if (normalized === "MLC") {
      return 2;
    }
    if (normalized === "TLC") {
      return 3;
    }
    if (normalized === "QLC") {
      return 4;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isSamsungLarge3dCell(info: IdentifierDecodeDraft): boolean {
  const cellLevel = numericDraftField(info, "cell_level");
  return cellLevel === 3 || cellLevel === 4;
}

function samsungLargeDieCodename(id: string, info: IdentifierDecodeDraft): string | undefined {
  const density = numericDraftField(info, "density");
  const dieCount = numericDraftField(info, "die_count");
  if (density === undefined || dieCount === undefined || dieCount <= 0 || !isSamsungLarge3dCell(info)) {
    return undefined;
  }
  if (density / dieCount < SAMSUNG_LARGE_DIE_THRESHOLD_MBIT) {
    return undefined;
  }
  return lookupString(SAMSUNG_LARGE_DIE_PROCESS_BY_BYTE6, flashIdByteAt(id, 6));
}

function clonePartDraft(info: PartDecodeDraft): PartDecodeDraft {
  return {
    ...info,
    device: { ...info.device },
    fields: { ...(info.fields ?? {}) },
    identifiers: info.identifiers ? { flashIds: [...(info.identifiers.flashIds ?? [])] } : undefined,
    controllers: info.controllers ? [...info.controllers] : undefined,
    components: info.components ? [...info.components] : undefined,
    meta: info.meta ? { ...info.meta } : undefined,
    warnings: info.warnings ? [...info.warnings] : undefined
  };
}

function cloneIdentifierDraft(info: IdentifierDecodeDraft): IdentifierDecodeDraft {
  return {
    ...info,
    device: { ...info.device },
    fields: { ...(info.fields ?? {}) },
    identifiers: info.identifiers ? { partNumbers: [...(info.identifiers.partNumbers ?? [])] } : undefined,
    controllers: info.controllers ? [...info.controllers] : undefined,
    meta: info.meta ? { ...info.meta } : undefined,
    warnings: info.warnings ? [...info.warnings] : undefined
  };
}

function patchIntelPartNumberDieCodename(info: PartDecodeDraft): PartDecodeDraft | null {
  if (draftVendor(info) !== "intel") {
    return null;
  }

  const normalized = normalizePartNumber(draftPartNumber(info));
  let dieCodename: string | undefined;
  if (normalized.includes("QKA")) {
    dieCodename = "N38B";
  } else if (normalized.includes("QK1")) {
    dieCodename = "N38A";
  } else if (normalized.includes("QL1")) {
    dieCodename = "N4PA";
  }

  if (!dieCodename || draftField(info, "die_codename") === dieCodename) {
    return null;
  }
  const next = clonePartDraft(info);
  setDraftField(next, "die_codename", dieCodename);
  return next;
}

function patchMicronLike(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const dieCodename = lookupDieCodename(id, MICRON_LIKE_PROCESS_LOOKUPS);
  if (dieCodename) {
    setDraftField(next, "die_codename", dieCodename);
    changed = true;
  }

  const byte2 = flashIdByteAt(id, 2);
  const density = lookupNumber(MICRON_LIKE_DENSITY_BY_BYTE2, byte2);
  if (density !== undefined) {
    const stackedMultiplier = MICRON_LIKE_STACKED_DENSITY_BYTE2.has(byte2) ? dieCountFromFlashId(id) : 1;
    setDraftField(next, "density", density * stackedMultiplier);
    changed = true;
  }

  return changed ? next : null;
}

function patchSamsung(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const density = lookupNumber(SAMSUNG_DENSITY_BY_BYTE2, flashIdByteAt(id, 2));
  if (density !== undefined) {
    setDraftField(next, "density", density);
    changed = true;
  }

  const byte6 = flashIdByteAt(id, 6);
  const dieCodename =
    samsungLargeDieCodename(id, next) ??
    (!draftField(next, "die_codename")
      ? lookupString(SAMSUNG_PROCESS_BY_BYTE6, byte6) ?? lookupString(SAMSUNG_PROCESS_BY_MASKED_BYTE6, byte6 & 0x7f)
      : undefined);
  if (dieCodename) {
    setDraftField(next, "die_codename", dieCodename);
    changed = true;
  }

  return changed ? next : null;
}

function patchSkhynix(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const density = lookupNumber(SKHYNIX_DENSITY_BY_BYTE2, flashIdByteAt(id, 2));
  if (density !== undefined) {
    const stackedMultiplier = SKHYNIX_STACKED_PROCESS_BYTE6.has(flashIdByteAt(id, 6)) ? dieCountFromFlashId(id) : 1;
    setDraftField(next, "density", density * stackedMultiplier);
    changed = true;
  }

  const dieCodename = lookupString(SKHYNIX_PROCESS_BY_BYTE6, flashIdByteAt(id, 6));
  if (dieCodename) {
    setDraftField(next, "die_codename", dieCodename);
    changed = true;
  }

  const spp = draftField(info, "simultaneously_programmed_pages");
  if (typeof spp === "number" && Number.isFinite(spp) && spp > 0) {
    setDraftField(next, "plane_count", spp);
    changed = true;
  }

  // Some newer IDs need vendor-specific cleanup after bitfield decoding.
  if (flashIdByteAt(id, 6) >= 0x50) {
    for (const key of [
      "block_size",
      "blocks_per_lun",
      "pages_per_block",
      "simultaneously_programmed_pages",
      "redundant_area_size",
      "timing_mode_async",
      "edo",
      "interleave",
      "cache",
      "ecc_level",
      "revision",
      "enterprise",
      "interface_type"
    ] as const) {
      deleteDraftField(next, key);
    }
    changed = true;
  }

  return changed ? next : null;
}

function patchKioxiaLike(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const density = lookupNumber(KIOXIA_LIKE_DENSITY_BY_BYTE2, flashIdByteAt(id, 2));
  if (density !== undefined) {
    setDraftField(next, "density", density);
    changed = true;
  }

  const maskedByte6 = flashIdByteAt(id, 6) & 0x27;
  const processFamily = lookupString(KIOXIA_LIKE_PROCESS_BY_MASKED_BYTE6, maskedByte6);
  if (processFamily) {
    const vendorPrefix = draftVendor(info) === "sndk" ? "S" : "K";
    setDraftField(next, "die_codename", `${vendorPrefix}${processFamily}`);
    changed = true;
  }

  const plane = typeof draftField(info, "plane_count") === "number" ? draftField(info, "plane_count") as number : null;
  const die = typeof draftField(info, "die_count") === "number" ? draftField(info, "die_count") as number : null;
  if (plane && die && plane > 0 && die > 0) {
    const div = plane / die;
    if (Number.isInteger(div) && div > 0) {
      setDraftField(next, "plane_count", div);
      changed = true;
    }
  }

  return changed ? next : null;
}

function patchYmtc(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const density = lookupNumber(YMTC_DENSITY_BY_BYTE2, flashIdByteAt(id, 2));
  if (density !== undefined) {
    setDraftField(next, "density", density);
    changed = true;
  }

  const layerCode = (flashIdByteAt(id, 5) >> 4) & 0x07;
  const generationInfo = lookupString(YMTC_GENERATION_BY_LAYER_CODE, layerCode);
  if (generationInfo) {
    setDraftField(next, "generation_info", generationInfo);
    changed = true;
  }

  const processInfo = lookupProcess(id, YMTC_PROCESS_LOOKUPS);
  if (processInfo) {
    const processFields = YMTC_PROCESS_INFO_BY_KEY[processInfo.processKey];
    setDraftField(next, "die_codename", processFields.die_codename);
    setDraftField(next, "process_alias", processFields.process_alias ?? processInfo.processKey);
    setDraftField(next, "generation_info", processFields.generation_info);
    setDraftField(next, "layer_count", processFields.layer_count);
    setDraftField(next, "cell_level", processFields.cell_level);
    setDraftField(next, "die_density", processFields.die_density);
    setDraftField(next, "plane_count", processFields.plane_count);
    setDraftField(next, "speed_grade", processFields.speed_grade);
    setDraftField(next, "page_size", processInfo.page_size);
    setDraftField(next, "redundant_area_size", processInfo.redundant_area_size);
    setDraftField(next, "pages_per_block", processInfo.pages_per_block);
    changed = true;
  }

  return changed ? next : null;
}

export function createDefaultIdentifierPostprocessor(): DecodeDraftPostprocessor {
  return {
    partInfo: (info): PartDecodeDraft => {
      const micronPatch = patchMicronPartNumberDieCodename(info);
      const afterMicron = micronPatch ? { ...clonePartDraft(info), fields: { ...(info.fields ?? {}), ...(micronPatch.fields ?? {}) } } : info;
      return patchIntelPartNumberDieCodename(afterMicron) ?? afterMicron;
    },
    identifierInfo: (info): IdentifierDecodeDraft => {
      const vendor = draftVendor(info);

      let patch: IdentifierDecodeDraft | null = null;
      if (vendor === "micron" || vendor === "intel" || vendor === "spectek") patch = patchMicronLike(info);
      else if (vendor === "samsung") patch = patchSamsung(info);
      else if (vendor === "skhynix") patch = patchSkhynix(info);
      else if (vendor === "kioxia" || vendor === "sndk") patch = patchKioxiaLike(info);
      else if (vendor === "ymtc") patch = patchYmtc(info);

      return patch ?? info;
    }
  } satisfies DecodeDraftPostprocessor;
}
