import type { ControllerGenerator, ControllerMergeContext } from "./types";
import type { FlashIdPayload } from "../types";

const VENDOR_BY_ID_PREFIX: Record<string, string> = {
  "2C": "micron",
  "45": "sndk",
  "89": "intel",
  "98": "kioxia",
  "9B": "ymtc",
  AD: "skhynix",
  B5: "spectek",
  EC: "samsung"
};

const PART_PREFIX_BY_VENDOR: Record<string, RegExp> = {
  intel: /^(?:JS29F|I29F|PF29F|PC29F|PD29F)/,
  kioxia: /^(?:TC58|TH58|THG)/,
  micron: /^(?:MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/,
  samsung: /^(?:K9|KLM|KLU|KMD|KMF|KMN|KMV)/,
  skhynix: /^(?:HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/,
  sndk: /^(?:SD[A-Z0-9]{3,}|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/,
  spectek: /^(?:FBNL|FNNL|FNN|FXXL)/,
  ymtc: /^(?:YM|YMN|XT)/
};

function controllerFromFilename(filename: string): string {
  return (filename.split("_")[0] ?? filename).replace(/\.ini$/i, "").toUpperCase();
}

function parseNumber(value: string | undefined): number | undefined {
  const match = /^\s*(\d+(?:\.\d+)?)/.exec(value ?? "");
  if (!match?.[1]) {
    return undefined;
  }
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function flashPayload(values: Record<string, string>, controller: string): FlashIdPayload {
  const sectorsPerPage = parseNumber(values.SECTOR_OF_PAGE);
  const pageSize = sectorsPerPage === undefined ? undefined : sectorsPerPage / 2;
  return {
    ...(pageSize && pageSize > 0 ? { s: pageSize } : {}),
    t: [controller]
  };
}

function stripDecorators(partNumber: string): string {
  return partNumber
    .trim()
    .split(";")[0]!
    .replace(/\s+/g, "")
    .replace(/\(.*$/, "")
    .replace(/^[=_-]+|[=_-]+$/g, "")
    .toUpperCase();
}

function normalizeSndkPartNumber(partNumber: string): string {
  let normalized = partNumber
    .replace(/_1V[28](?=-)/gi, "")
    .replace(/[_-]1V[28](?=[_-]|$)/gi, "");
  normalized = normalized.replace(/^([A-Z0-9]+)_([0-9]+G(?:B|CE)?)(?=$|[_-])/, "$1-$2");
  normalized = normalized.replace(/^([A-Z0-9]+)-([0-9]+G(?:B|CE)?)(?:[_-].*)?$/, "$1-$2");
  normalized = normalized.replace(/[_-](?:\d+LUN|[0-9][A-Z][0-9]{2}|[0-9A-F]{2}|DDR|ED3|TOG|[1-9])(?:[_-].*)?$/i, "");
  normalized = normalized.replace(/-(?:3D|BICS)[A-Z0-9-]*$/i, "");
  return normalized;
}

function normalizeYeestorPartNumber(context: ControllerMergeContext, vendor: string, rawPartNumber: string): string {
  let partNumber = stripDecorators(rawPartNumber);
  if (!partNumber) {
    return "";
  }

  if (vendor === "sndk") {
    partNumber = normalizeSndkPartNumber(partNumber);
  } else if (vendor === "kioxia") {
    partNumber = partNumber.split(/[-_]/)[0] ?? partNumber;
  } else if (vendor === "samsung" || vendor === "intel" || vendor === "ymtc") {
    partNumber = partNumber.split("_")[0] ?? partNumber;
  }

  partNumber = context.normalizeKnownPackage(vendor, partNumber);
  return PART_PREFIX_BY_VENDOR[vendor]?.test(partNumber) ? partNumber : "";
}

function mergeYeestor(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = controllerFromFilename(filename);
  context.addInfoController(controller);

  const parsed = context.parseIni(data);
  for (const [section, values] of Object.entries(parsed)) {
    const id = section.trim().toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(id)) {
      continue;
    }

    const vendor = VENDOR_BY_ID_PREFIX[id.slice(0, 2)];
    const payload = flashPayload(values, controller);
    if (!vendor) {
      context.mergeFlashPayload(id, payload);
      continue;
    }

    const partNumbers = Object.entries(values)
      .filter(([key]) => /^FLASH_NAME(?:_\d+)?$/.test(key))
      .map(([, value]) => normalizeYeestorPartNumber(context, vendor, value))
      .filter((value, index, array) => value && array.indexOf(value) === index);

    if (partNumbers.length === 0) {
      context.mergeFlashPayload(id, payload);
      continue;
    }

    for (const partNumber of partNumbers) {
      context.addPartId(vendor, partNumber, id, [controller]);
    }
    context.mergeFlashPayload(id, payload);
  }
}

export const yeestorController: ControllerGenerator = {
  id: "yeestor",
  directories: ["ys"],
  mergeFile(context, file) {
    mergeYeestor(context, file.data, file.filename);
  }
};
