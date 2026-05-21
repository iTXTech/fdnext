import { deleteDraftField, draftField, draftIdentifier, draftVendor, setDraftField } from "../draft";
import type { IdentifierDecodeDraft, PartDecodeDraft } from "../types";
import { flashIdByteAt } from "./bytes";

interface DecodeDraftPostprocessor {
  partInfo?(partInfo: PartDecodeDraft): PartDecodeDraft;
  identifierInfo?(identifierInfo: IdentifierDecodeDraft): IdentifierDecodeDraft;
}

type ProcessLookup = {
  start: number;
  hex: string;
  dieCodename: string;
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

const YMTC_PROCESS_LOOKUPS: ProcessLookup[] = [
  { start: 1, hex: "C3482510", dieCodename: "JGS" },
  { start: 1, hex: "D5588D20", dieCodename: "HUS" },
  { start: 1, hex: "C4284920", dieCodename: "TAS" },
  { start: 1, hex: "C5294920", dieCodename: "TAS" },
  { start: 1, hex: "C4284930", dieCodename: "WYS" },
  { start: 1, hex: "C5294930", dieCodename: "WYS" },
  { start: 1, hex: "C5587130", dieCodename: "WDS" },
  { start: 1, hex: "C6597130", dieCodename: "WDS" },
  { start: 1, hex: "C55C5530", dieCodename: "EMS" }
];

const SKHYNIX_STACKED_PROCESS_BYTE6 = new Set([0x70, 0x80, 0x90, 0xa0, 0xa2, 0xb0, 0xb2, 0xc0, 0xc2, 0xd0]);

const SAMSUNG_CONFIRMED_QLC_DIE_PROFILES: Record<string, string> = {
  SSV4: "SSV4Q",
  SSV5: "SSV5Q",
  SSV7: "SSV7Q",
  SSV9: "SSV9Q"
};

const NAND_PROFILE_ENRICHED_FIELDS = [
  "process_alias",
  "generation_info",
  "layer_count",
  "cell_level",
  "die_density",
  "plane_count",
  "speed_grade",
  "page_size",
  "redundant_area_size",
  "pages_per_block"
] as const;

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

function clonePartDraft(info: PartDecodeDraft): PartDecodeDraft {
  return {
    ...info,
    device: { ...info.device },
    fields: { ...(info.fields ?? {}) },
    identifiers: info.identifiers
      ? {
          flashIds: [...(info.identifiers.flashIds ?? [])],
          partNumbers: [...(info.identifiers.partNumbers ?? [])]
        }
      : undefined,
    controllers: info.controllers ? [...info.controllers] : undefined,
    components: info.components
      ? info.components.map((component) => ({
          ...component,
          device: component.device ? { ...component.device } : undefined,
          fields: component.fields ? { ...component.fields } : undefined
        }))
      : undefined,
    meta: info.meta ? { ...info.meta } : undefined,
    warnings: info.warnings ? [...info.warnings] : undefined
  };
}

function isSamsungQlcCell(value: unknown): boolean {
  if (value === 4) {
    return true;
  }
  return typeof value === "string" && ["4", "QLC"].includes(value.trim().toUpperCase());
}

function samsungQlcDieProfile(info: IdentifierDecodeDraft | PartDecodeDraft): string | undefined {
  if (draftVendor(info) !== "samsung" || !isSamsungQlcCell(draftField(info, "cell_level"))) {
    return undefined;
  }
  const dieCodename = draftField(info, "die_codename");
  if (typeof dieCodename !== "string") {
    return undefined;
  }
  return SAMSUNG_CONFIRMED_QLC_DIE_PROFILES[dieCodename.trim().toUpperCase()];
}

function patchSamsungQlcPart(info: PartDecodeDraft): PartDecodeDraft | null {
  const dieCodename = samsungQlcDieProfile(info);
  if (!dieCodename) {
    return null;
  }

  const next = clonePartDraft(info);
  setDraftField(next, "die_codename", dieCodename);
  for (const key of NAND_PROFILE_ENRICHED_FIELDS) {
    deleteDraftField(next, key);
  }
  return next;
}

function patchSamsungQlcIdentifier(info: IdentifierDecodeDraft): IdentifierDecodeDraft | null {
  const dieCodename = samsungQlcDieProfile(info);
  if (!dieCodename) {
    return null;
  }

  const next = cloneIdentifierDraft(info);
  setDraftField(next, "die_codename", dieCodename);
  for (const key of NAND_PROFILE_ENRICHED_FIELDS) {
    deleteDraftField(next, key);
  }
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
  const dieCodename = lookupDieCodename(draftIdentifier(info), YMTC_PROCESS_LOOKUPS);
  if (!dieCodename) {
    return null;
  }

  const next = cloneIdentifierDraft(info);
  setDraftField(next, "die_codename", dieCodename);
  for (const key of NAND_PROFILE_ENRICHED_FIELDS) {
    deleteDraftField(next, key);
  }
  return next;
}

export function createDefaultIdentifierPostprocessor(): DecodeDraftPostprocessor {
  return {
    partInfo: (info): PartDecodeDraft => {
      if (draftVendor(info) !== "samsung") {
        return info;
      }
      return patchSamsungQlcPart(info) ?? info;
    },
    identifierInfo: (info): IdentifierDecodeDraft => {
      const vendor = draftVendor(info);

      let patch: IdentifierDecodeDraft | null = null;
      if (vendor === "micron" || vendor === "intel" || vendor === "spectek") patch = patchMicronLike(info);
      else if (vendor === "samsung") patch = patchSamsungQlcIdentifier(info);
      else if (vendor === "skhynix") patch = patchSkhynix(info);
      else if (vendor === "kioxia" || vendor === "sndk") patch = patchKioxiaLike(info);
      else if (vendor === "ymtc") patch = patchYmtc(info);

      return patch ?? info;
    }
  } satisfies DecodeDraftPostprocessor;
}
