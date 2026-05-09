import { inferVendorFromPartNumber, normalizeVendor } from "../vendors";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

const CONTROLLER_MARK = /^Y$/i;
const PART_PREFIX_BY_VENDOR: Record<string, RegExp> = {
  intel: /^(?:JS29F|I29F|PF29F|PC29F|PD29F)/,
  kioxia: /^(?:TC58|TH58|THG)/,
  micron: /^(?:MT29|MTFC|MTFD|NW[0-9A-Z]{3,}|FNMB)/,
  samsung: /^(?:K9|KLM|KLU|KMD|KMF|KMN|KMV)/,
  skhynix: /^(?:HY27|H27|H25|H26|H2D|H2J|H9[ATHQ]|HYNIX)/,
  sndk: /^(?:SD[A-Z0-9]{3,}|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/,
  spectek: /^(?:FBNL|FNNL|FNN|FXXL)/,
  ymtc: /^(?:YM|YMN|KRN|XT)/
};

function cleanPartNumber(value: string): string {
  let partNumber = value
    .trim()
    .replaceAll(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();

  partNumber = partNumber.replace(/^L(?=(?:JS|PF|MT|FN|29F))/, "");
  partNumber = partNumber.replace(/^JF29F/, "JS29F");
  partNumber = partNumber.replace(/^((?:MT|JS|PF)29F[0-9]+)GB(?=08)/, "$1G");
  const paren = partNumber.indexOf("(");
  if (paren !== -1) {
    partNumber = partNumber.slice(0, paren);
  }
  partNumber = partNumber.replace(/_多BANK$/i, "");
  while (/_[A-Z0-9*]+$/.test(partNumber)) {
    partNumber = partNumber.replace(/_[A-Z0-9*]+$/, "");
  }
  partNumber = partNumber.replace(/\*[0-9A-Z]+$/i, "");
  return partNumber;
}

function vendorFromId(id: string): string | null {
  const prefix = id.slice(0, 2).toUpperCase();
  switch (prefix) {
    case "2C":
    case "B5":
      return "micron";
    case "45":
      return "sndk";
    case "89":
      return "intel";
    case "98":
      return "kioxia";
    case "9B":
      return "ymtc";
    case "AD":
      return "skhynix";
    case "EC":
      return "samsung";
    default:
      return null;
  }
}

function vendorCandidates(rawVendor: string, partNumber: string, id: string): string[] {
  const candidates = new Set<string>();
  const inferred = inferVendorFromPartNumber(partNumber);
  const idVendor = vendorFromId(id);
  if (inferred) candidates.add(inferred);
  if (idVendor) candidates.add(idVendor);

  const normalizedRaw = rawVendor.trim().toLowerCase();
  if (normalizedRaw === "micron/intel") {
    candidates.add("micron");
    candidates.add("intel");
    candidates.add("spectek");
  } else if (normalizedRaw === "sd/tc") {
    candidates.add("sndk");
    candidates.add("kioxia");
  } else if (normalizedRaw) {
    candidates.add(normalizeVendor(normalizedRaw.replace("hynix", "skhynix")));
  }

  return [...candidates];
}

function isSyntheticPartNumber(partNumber: string): boolean {
  return /^(?:INTEL[RL]?(?:_|$)|SPECTEK(?:_|$)|TOSHI-|TOSHIBA(?:_|$)|TC[-_]|TS_|SD-)/.test(partNumber) || /^29F/.test(partNumber);
}

function normalizeSupportedPartNumber(context: ControllerMergeContext, vendor: string, partNumber: string): string {
  const normalizedPartNumber = context.normalizeKnownPackage(vendor, partNumber);
  const partPrefix = PART_PREFIX_BY_VENDOR[vendor];
  return partPrefix?.test(normalizedPartNumber) ? normalizedPartNumber : "";
}

function choosePartRecord(
  context: ControllerMergeContext,
  rawVendor: string,
  partNumber: string,
  id: string
): { vendor: string; partNumber: string } | null {
  if (isSyntheticPartNumber(partNumber)) {
    return null;
  }
  const candidates = vendorCandidates(rawVendor, partNumber, id);
  for (const candidate of candidates) {
    const normalizedPartNumber = normalizeSupportedPartNumber(context, candidate, partNumber);
    if (normalizedPartNumber) {
      return { vendor: candidate, partNumber: normalizedPartNumber };
    }
  }
  return null;
}

function mergeFirstChip(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data).filter((line) => line.trim().length > 0);
  const header = dataLines.shift()?.split("\t").map((item) => item.trim()) ?? [];
  const controllerColumns = header
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => /^[A-Z]{2,}\d+[A-Z0-9]*$/.test(name));
  const controllers = controllerColumns.map(({ name }) => name);
  context.addInfoController(controllers);

  for (const line of dataLines) {
    const fields = line.split("\t").map((item) => item.trim());
    const rawVendor = fields[0] ?? "";
    const rawPartNumber = fields[1] ?? "";
    const id = fields[2] ?? "";
    const cellLevel = fields[4] ?? "";
    const supported = controllerColumns
      .filter(({ index }) => CONTROLLER_MARK.test(fields[index] ?? ""))
      .map(({ name }) => name);
    if (supported.length === 0) {
      continue;
    }

    const partNumber = cleanPartNumber(rawPartNumber);
    const candidates = vendorCandidates(rawVendor, partNumber, id);
    const matchedExisting = candidates.some((vendor) => context.addControllersToMatchingFlashId(vendor, id, supported));
    if (matchedExisting) {
      continue;
    }

    const partRecord = choosePartRecord(context, rawVendor, partNumber, id);
    if (partRecord) {
      const { vendor, partNumber: normalizedPartNumber } = partRecord;
      context.addPartId(vendor, normalizedPartNumber, id, supported);
      if (cellLevel) {
        context.mergePartPayload(vendor, normalizedPartNumber, { c: cellLevel, t: supported });
      }
    } else {
      context.mergeFlashPayload(id, { t: supported });
    }
  }
}

export const firstChipController: ControllerGenerator = {
  id: "first-chip",
  directories: ["fc"],
  mergeFile(context, file) {
    mergeFirstChip(context, file.data);
  }
};
