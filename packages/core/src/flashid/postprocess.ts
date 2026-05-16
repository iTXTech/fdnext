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

const SKHYNIX_STACKED_PROCESS_BYTE6 = new Set([0x70, 0x80, 0x90, 0xa0, 0xa2, 0xb0, 0xb2, 0xc0, 0xc2, 0xd0]);

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

function numericDraftField(info: IdentifierDecodeDraft, key: "density" | "die_count"): number | undefined {
  const value = draftField(info, key);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  return changed ? next : null;
}

function patchSkhynix(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const next = cloneIdentifierDraft(info);
  let changed = false;
  const id = draftIdentifier(info);

  const density = numericDraftField(info, "density");
  const dieCount = numericDraftField(info, "die_count");
  if (SKHYNIX_STACKED_PROCESS_BYTE6.has(flashIdByteAt(id, 6)) && density !== undefined && dieCount !== undefined && dieCount > 1) {
    setDraftField(next, "density", density * dieCount);
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
      else if (vendor === "skhynix") patch = patchSkhynix(info);
      else if (vendor === "kioxia" || vendor === "sndk") patch = patchKioxiaLike(info);
      else if (vendor === "ymtc") patch = patchYmtc(info);

      return patch ?? info;
    }
  } satisfies DecodeDraftPostprocessor;
}
