import type { FlashIdInfo, ProcessorHooks } from "../types";
import { flashIdByteAt } from "./bytes";

function isExtRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function patchSamsung(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  // Legacy behavior: some Samsung IDs use 0xDE as a special density code.
  if (flashIdByteAt(info.id, 2) === 0xde) {
    return { density: 65536 };
  }
  return null;
}

function patchSkhynix(info: FlashIdInfo): Partial<FlashIdInfo> | null {
  const patch: Partial<FlashIdInfo> = {};
  let changed = false;

  if (isExtRecord(info.ext)) {
    const spp = info.ext.simultaneouslyProgrammedPages;
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
  const plane = typeof info.plane === "number" ? info.plane : null;
  const die = typeof info.die === "number" ? info.die : null;
  if (!plane || !die || plane <= 0 || die <= 0) {
    return null;
  }
  const div = plane / die;
  if (Number.isInteger(div) && div > 0) {
    return { plane: div };
  }
  return null;
}

export function createDefaultFlashIdProcessor(): ProcessorHooks {
  return {
    flashIdInfo: (info): FlashIdInfo => {
      const vendor = info.vendor;

      let patch: Partial<FlashIdInfo> | null = null;
      if (vendor === "samsung") patch = patchSamsung(info);
      else if (vendor === "skhynix") patch = patchSkhynix(info);
      else if (vendor === "kioxia" || vendor === "sndk") patch = patchKioxiaLike(info);

      if (!patch) {
        return info;
      }
      return { ...info, ...patch };
    }
  } satisfies ProcessorHooks;
}
