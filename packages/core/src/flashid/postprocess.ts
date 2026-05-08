import { patchMicronPartNumberProcessNode } from "../micron/process-node";
import type { FlashIdInfo, FlashInfo, ProcessorHooks } from "../types";
import { normalizePartNumber } from "../utils/normalize";
import { flashIdByteAt } from "./bytes";

type ProcessLookup = {
  start: number;
  hex: string;
  processNode: string;
};

const GBIT_TO_MBIT = 1024;

const MICRON_LIKE_PROCESS_LOOKUPS: ProcessLookup[] = [
  { start: 1, hex: "48002689", processNode: "34nm(M62A)" },
  { start: 1, hex: "6801A689", processNode: "34nm(M62A)" },
  { start: 1, hex: "68044689", processNode: "34nm(L63B)" },
  { start: 1, hex: "8805C689", processNode: "34nm(L63B)" },
  { start: 1, hex: "680446A9", processNode: "34nm(L63B)" },
  { start: 1, hex: "680027A9", processNode: "25nm(M73A)" },
  { start: 1, hex: "8801A7A9", processNode: "25nm(M73A)" },
  { start: 1, hex: "682027A9", processNode: "25nm(M73A)" },
  { start: 1, hex: "68044AA9", processNode: "25nm(L73A)" },
  { start: 1, hex: "8805CAA9", processNode: "25nm(L73A)" },
  { start: 1, hex: "88044BA900", processNode: "25nm(L74A)" },
  { start: 1, hex: "A805CBA900", processNode: "25nm(L74A)" },
  { start: 1, hex: "88244BA900", processNode: "25nm(L74A)" },
  { start: 1, hex: "88244BA984", processNode: "20nm(L84A)" },
  { start: 1, hex: "64444BA9", processNode: "20nm(L84A)" },
  { start: 1, hex: "84C54BA9", processNode: "20nm(L84A)" },
  { start: 1, hex: "64643CA1", processNode: "20nm(L84C)" },
  { start: 1, hex: "64643CA5", processNode: "20nm(L84C)" },
  { start: 1, hex: "84E53CA5", processNode: "20nm(L84C)" },
  { start: 1, hex: "84643CA5", processNode: "20nm(L85A)" },
  { start: 1, hex: "A4E53CA5", processNode: "20nm(L85A)" },
  { start: 1, hex: "84643CA9", processNode: "20nm(L85C)" },
  { start: 1, hex: "A4E53CA9", processNode: "20nm(L85C)" },
  { start: 1, hex: "846454A9", processNode: "16nm(L95B)" },
  { start: 1, hex: "A4E554A9", processNode: "16nm(L95B)" },
  { start: 1, hex: "6808568A", processNode: "34nm(B63A)" },
  { start: 1, hex: "88085FA9", processNode: "25nm(B74A)" },
  { start: 1, hex: "88085F89", processNode: "25nm(B74A)" },
  { start: 1, hex: "88285FA9", processNode: "25nm(B74A)" },
  { start: 1, hex: "A809DF89", processNode: "25nm(B74A)" },
  { start: 1, hex: "A809DFA9", processNode: "25nm(B74A)" },
  { start: 1, hex: "847863A9", processNode: "20nm(B85T)" },
  { start: 1, hex: "84787BA9", processNode: "20nm(B85T)" },
  { start: 1, hex: "A4F963A9", processNode: "20nm(B85T)" },
  { start: 1, hex: "A4F97BA9", processNode: "20nm(B85T)" },
  { start: 1, hex: "844863A9", processNode: "16nm(B95A)" },
  { start: 1, hex: "644432A5", processNode: "32L(L04A)" },
  { start: 1, hex: "844434AA", processNode: "32L(L05B)" },
  { start: 1, hex: "845832A1", processNode: "32L(B05A)" },
  { start: 1, hex: "A46434AA", processNode: "32L(L05A)" },
  { start: 1, hex: "A4E4348A", processNode: "32L(L06A)" },
  { start: 1, hex: "A46432AA", processNode: "32L(L06B)" },
  { start: 1, hex: "C4E532AA", processNode: "32L(L06B)" },
  { start: 1, hex: "B47832AA", processNode: "32L(B0KB)" },
  { start: 1, hex: "CCF932AA", processNode: "32L(B0KB)" },
  { start: 1, hex: "A40832A1", processNode: "64L(B16A)" },
  { start: 1, hex: "A48832A1", processNode: "64L(B16A)" },
  { start: 1, hex: "C48932A1", processNode: "64L(B16A)" },
  { start: 1, hex: "C40832A6", processNode: "64L(B17A)" },
  { start: 1, hex: "D48932A6", processNode: "64L(B17A)" },
  { start: 1, hex: "E48A32A6", processNode: "64L(B17A)" },
  { start: 1, hex: "D40C32AA", processNode: "64L(N18A)" },
  { start: 1, hex: "C41832A2", processNode: "96L(B27A)" },
  { start: 1, hex: "D49932A2", processNode: "96L(B27A)" },
  { start: 1, hex: "E49A32A2", processNode: "96L(B27A)" },
  { start: 1, hex: "C30832E6", processNode: "96L(B27B)" },
  { start: 1, hex: "D38932E6", processNode: "96L(B27B)" },
  { start: 1, hex: "E38A32E6", processNode: "96L(B27B)" },
  { start: 1, hex: "D31C32C6", processNode: "96L(N28A)" },
  { start: 1, hex: "D39C32C6", processNode: "96L(N28A)" },
  { start: 1, hex: "E39D32C6", processNode: "96L(N28A)" },
  { start: 1, hex: "F39E32C6", processNode: "96L(N28A)" },
  { start: 1, hex: "A36032C6", processNode: "96L(M26A)" },
  { start: 1, hex: "A37832E5", processNode: "128L(B36R)" },
  { start: 1, hex: "C37832EA", processNode: "128L(B37R)" },
  { start: 1, hex: "C30832EA", processNode: "176L(B47R)" },
  { start: 1, hex: "D38932EA", processNode: "176L(B47R)" },
  { start: 1, hex: "E38A32EA", processNode: "176L(B47R)" },
  { start: 1, hex: "D30C32EA", processNode: "176L(N48R)" },
  { start: 1, hex: "D30832E8", processNode: "232L(B58R)" },
  { start: 1, hex: "E38932E8", processNode: "232L(B58R)" },
  { start: 1, hex: "F38A32E8", processNode: "232L(B58R)" },
  { start: 0, hex: "89D3AC32C600", processNode: "N38A 144L" },
  { start: 0, hex: "89E3AD32C600", processNode: "N38A 144L" },
  { start: 0, hex: "89F3AE32C600", processNode: "N38A 144L" },
  { start: 0, hex: "89D3AC32C204", processNode: "N38B 144L" },
  { start: 0, hex: "89E3AD32C204", processNode: "N38B 144L" },
  { start: 0, hex: "89F3AE32C204", processNode: "N38B 144L" },
  { start: 0, hex: "89092832C200", processNode: "N4PA 192L" },
  { start: 0, hex: "89092932C200", processNode: "N4PA 192L" },
  { start: 0, hex: "89092A32C200", processNode: "N4PA 192L" }
];

const MICRON_LIKE_DENSITY_BY_BYTE2: Record<number, number> = {
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

const KIOXIA_LIKE_PROCESS_BY_MASKED_BYTE6: Record<number, string> = {
  0x00: "A19nm",
  0x01: "15nm",
  0x02: "70nm",
  0x03: "56nm",
  0x04: "43nm",
  0x05: "32nm",
  0x06: "24nm",
  0x07: "19nm",
  0x21: "BiCS2 48L",
  0x22: "BiCS3 64L",
  0x23: "BiCS4 96L",
  0x24: "BiCS5 112L",
  0x25: "BiCS6 162L",
  0x26: "BiCS8 218L"
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
  0x25: "16nm",
  0x40: "16nm",
  0x41: "41nm",
  0x42: "32nm",
  0x43: "26nm",
  0x44: "20nm",
  0x45: "16nm",
  0x48: "16nm",
  0x49: "16nm",
  0x4a: "16nm",
  0x50: "14nm",
  0x60: "3DV1",
  0x65: "16nm",
  0x70: "36L 3DV2",
  0x80: "48L 3DV3",
  0x90: "72L 3DV4",
  0xa0: "96L 3DV5",
  0xa2: "96L 3DV5",
  0xb0: "128L 3DV6",
  0xb2: "128L 3DV6",
  0xc0: "176L 3DV7",
  0xc3: "26nm",
  0xc4: "20nm",
  0xd0: "238L 3DV8",
  0xe0: "14nm",
  0xe5: "16nm"
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

const SAMSUNG_PROCESS_BY_MASKED_BYTE6: Record<number, string> = {
  0x40: "51nm",
  0x41: "42nm",
  0x42: "32nm",
  0x43: "27nm",
  0x44: "21nm",
  0x45: "19nm",
  0x46: "16nm",
  0x47: "124L 3DV4",
  0x48: "32L 3DV2",
  0x49: "48L 3DV3",
  0x4a: "14nm",
  0x4b: "64L 3DV4",
  0x4c: "92L 3DV5",
  0x4d: "136L 3DV6",
  0x4e: "3DV7"
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

const YMTC_PROCESS_BY_LAYER_CODE: Record<number, string> = {
  1: "64L 3DV2",
  2: "128L 3DV3",
  3: "3DV4",
  4: "3DV5"
};

const YMTC_PROCESS_LOOKUPS: ProcessLookup[] = [
  { start: 1, hex: "C3482510", processNode: "(x1-9050)" },
  { start: 1, hex: "D5588D20", processNode: "(x2-6070)" },
  { start: 1, hex: "C4284920", processNode: "(x2-9060)" },
  { start: 1, hex: "C5294920", processNode: "(x2-9060)" },
  { start: 1, hex: "C4284930", processNode: "-128L(x3-9060)" },
  { start: 1, hex: "C5587130", processNode: "-232L(x3-9070)" }
];

const YMTC_DENSITY_BY_BYTE2: Record<number, number> = {
  0xc3: 256 * GBIT_TO_MBIT,
  0xc4: 512 * GBIT_TO_MBIT,
  0xc5: 1024 * GBIT_TO_MBIT,
  0xc6: 2048 * GBIT_TO_MBIT,
  0xd5: 1365 * GBIT_TO_MBIT
};

function isExtRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function lookupProcessNode(id: string, lookups: ProcessLookup[]): string | undefined {
  const normalized = id.toUpperCase();
  for (const lookup of lookups) {
    const start = lookup.start * 2;
    if (normalized.slice(start, start + lookup.hex.length) === lookup.hex) {
      return lookup.processNode;
    }
  }
  return undefined;
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

function patchIntelPartNumberProcessNode(info: FlashInfo): Partial<FlashInfo> | null {
  if (info.vendor !== "intel") {
    return null;
  }

  const normalized = normalizePartNumber(info.partNumber);
  let processNode: string | undefined;
  if (normalized.includes("QKA")) {
    processNode = "N38B 144L";
  } else if (normalized.includes("QK1")) {
    processNode = "N38A 144L";
  } else if (normalized.includes("QL1")) {
    processNode = "N4PA 192L";
  }

  if (!processNode || info.processNode === processNode) {
    return null;
  }
  return { processNode };
}

function patchMicronLike(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  const processNode = lookupProcessNode(info.id, MICRON_LIKE_PROCESS_LOOKUPS);
  if (processNode) {
    patch.processNode = processNode;
    changed = true;
  }

  const density = lookupNumber(MICRON_LIKE_DENSITY_BY_BYTE2, flashIdByteAt(info.id, 2));
  if (density !== undefined) {
    patch.density = density;
    changed = true;
  }

  return changed ? patch : null;
}

function patchSamsung(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  const density = lookupNumber(SAMSUNG_DENSITY_BY_BYTE2, flashIdByteAt(info.id, 2));
  if (density !== undefined) {
    patch.density = density;
    changed = true;
  }

  const maskedByte6 = flashIdByteAt(info.id, 6) & 0x7f;
  const processNode = lookupString(SAMSUNG_PROCESS_BY_MASKED_BYTE6, maskedByte6);
  if (processNode) {
    patch.processNode = processNode;
    changed = true;
  }

  return changed ? patch : null;
}

function patchSkhynix(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  const density = lookupNumber(SKHYNIX_DENSITY_BY_BYTE2, flashIdByteAt(info.id, 2));
  if (density !== undefined) {
    patch.density = density;
    changed = true;
  }

  const processNode = lookupString(SKHYNIX_PROCESS_BY_BYTE6, flashIdByteAt(info.id, 6));
  if (processNode) {
    patch.processNode = processNode;
    changed = true;
  }

  if (isExtRecord(info.ext)) {
    const spp = info.ext.simultaneously_programmed_pages;
    if (typeof spp === "number" && Number.isFinite(spp) && spp > 0) {
      patch.plane = spp;
      changed = true;
    }
  }

  // For some newer IDs, the PHP reference clears ext and blockSize.
  if (flashIdByteAt(info.id, 6) >= 0x50) {
    patch.ext = [];
    patch.blockSize = undefined;
    changed = true;
  }

  return changed ? patch : null;
}

function patchKioxiaLike(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  const density = lookupNumber(KIOXIA_LIKE_DENSITY_BY_BYTE2, flashIdByteAt(info.id, 2));
  if (density !== undefined) {
    patch.density = density;
    changed = true;
  }

  const maskedByte6 = flashIdByteAt(info.id, 6) & 0x27;
  const processNode = lookupString(KIOXIA_LIKE_PROCESS_BY_MASKED_BYTE6, maskedByte6);
  if (processNode) {
    patch.processNode = processNode;
    changed = true;
  }

  const plane = typeof info.plane === "number" ? info.plane : null;
  const die = typeof info.die === "number" ? info.die : null;
  if (plane && die && plane > 0 && die > 0) {
    const div = plane / die;
    if (Number.isInteger(div) && div > 0) {
      patch.plane = div;
      changed = true;
    }
  }

  return changed ? patch : null;
}

function joinYmtcProcess(base: string | undefined, suffix: string | undefined): string | undefined {
  if (!suffix) {
    return base;
  }
  if (!base) {
    return suffix.startsWith("-") ? suffix.slice(1) : suffix;
  }
  return suffix.startsWith("-") ? `${base}${suffix}` : `${base} ${suffix}`;
}

function patchYmtc(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  const density = lookupNumber(YMTC_DENSITY_BY_BYTE2, flashIdByteAt(info.id, 2));
  if (density !== undefined) {
    patch.density = density;
    changed = true;
  }

  const layerCode = (flashIdByteAt(info.id, 5) >> 4) & 0x07;
  const baseProcessNode = lookupString(YMTC_PROCESS_BY_LAYER_CODE, layerCode);
  const processSuffix = lookupProcessNode(info.id, YMTC_PROCESS_LOOKUPS);
  const processNode = joinYmtcProcess(baseProcessNode, processSuffix);
  if (processNode) {
    patch.processNode = processNode;
    changed = true;
  }

  if (info.id.toUpperCase().startsWith("9BD5588D20")) {
    patch.cellLevel = 4;
    changed = true;
  }

  return changed ? patch : null;
}

export function createDefaultFlashIdProcessor(): ProcessorHooks {
  return {
    flashInfo: (info): FlashInfo => {
      const micronPatch = patchMicronPartNumberProcessNode(info);
      const intelPatch = patchIntelPartNumberProcessNode(info);
      if (!micronPatch && !intelPatch) {
        return info;
      }
      return { ...info, ...micronPatch, ...intelPatch };
    },
    flashIdInfo: (info): FlashIdInfo => {
      const vendor = info.vendor;

      let patch: Partial<FlashIdInfo> | null = null;
      if (vendor === "micron" || vendor === "intel" || vendor === "spectek") patch = patchMicronLike(info);
      else if (vendor === "samsung") patch = patchSamsung(info);
      else if (vendor === "skhynix") patch = patchSkhynix(info);
      else if (vendor === "kioxia" || vendor === "sndk") patch = patchKioxiaLike(info);
      else if (vendor === "ymtc") patch = patchYmtc(info);

      if (!patch) {
        return info;
      }
      return { ...info, ...patch };
    }
  } satisfies ProcessorHooks;
}
