import { mergeFdnextFdbgenV1SupportList, type FdnextFdbgenV1Entry } from "../fdbgen-v1";
import { vendorFromSupportListFlashId } from "../support-list";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

const CHIPS_BANK_FLASH_ID_BYTES = 6;
const CHIPS_BANK_FLASH_ID_HEX_LENGTH = CHIPS_BANK_FLASH_ID_BYTES * 2;

function normalizeChipsBankVendor(value: string): string {
  return value.toLowerCase().replace("hynix", "skhynix");
}

function normalizeChipsBankFlashId(value: unknown): string | undefined {
  const normalized = String(value ?? "")
    .replace(/[\s:_/-]+/g, "")
    .toUpperCase();
  if (normalized.length < CHIPS_BANK_FLASH_ID_HEX_LENGTH || normalized.length % 2 !== 0 || !/^[0-9A-F]+$/.test(normalized)) {
    return undefined;
  }
  return normalized.slice(0, CHIPS_BANK_FLASH_ID_HEX_LENGTH);
}

function cleanChipsBankPartNumber(context: ControllerMergeContext, rawVendor: string, rawPartNumber: string): string {
  const vendor = normalizeChipsBankVendor(rawVendor);
  let partNumber = rawPartNumber.replaceAll("(T)", "").replaceAll("(TOG)", "").replaceAll("(TOG", "");
  if (vendor === "spectek") {
    partNumber = context.normalizeKnownPackage("spectek", partNumber);
  } else if (vendor === "micron") {
    partNumber = context.normalizeKnownPackage("micron", partNumber);
    partNumber = partNumber.split("(")[0] ?? partNumber;
  } else if (vendor === "toshiba" || vendor === "intel") {
    partNumber = partNumber.split("(")[0] ?? partNumber;
  } else if (vendor === "mira" || vendor === "powerchip") {
    partNumber = "";
  } else if (vendor === "skhynix") {
    partNumber = context.normalizeKnownPackage("skhynix", partNumber);
  }
  if (!partNumber) {
    return "";
  }
  const nearTail = partNumber[partNumber.length - 2];
  if (nearTail === "_" || nearTail === "*") {
    partNumber = partNumber.slice(0, -2);
  }
  return partNumber;
}

function mapChipsBankJsonEntry(entry: FdnextFdbgenV1Entry, context: ControllerMergeContext): FdnextFdbgenV1Entry {
  const flashId = normalizeChipsBankFlashId(entry.flashId);
  const idVendor = flashId ? vendorFromSupportListFlashId(flashId) : "";
  const vendor = entry.vendor ? normalizeChipsBankVendor(entry.vendor) : (idVendor ?? "");
  const partNumber = entry.partNumber ? cleanChipsBankPartNumber(context, vendor, entry.partNumber) : "";
  return {
    ...entry,
    ...(flashId ? { flashId } : { flashId: undefined }),
    ...(vendor ? { vendor } : {}),
    ...(partNumber ? { partNumber } : { partNumber: undefined })
  };
}

function mergeChipsBank(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data);
  const controllers = (dataLines.shift() ?? "").split(",").map((item) => `CBM${item.trim()}`).filter((item) => item !== "CBM");
  context.addInfoController(controllers);
  for (const rawRecord of dataLines) {
    if (!rawRecord.trim()) {
      continue;
    }
    const record = rawRecord.split(",");
    record.shift();
    const vendor = normalizeChipsBankVendor(record[0] ?? "");
    const flashId = normalizeChipsBankFlashId(record[4]);
    if (!flashId || !context.vendorExists(vendor)) {
      continue;
    }
    const supported = record
      .slice(9)
      .map((value, index) => (value === "Y" ? controllers[index] : undefined))
      .filter((item): item is string => !!item);
    if (context.addControllersToMatchingFlashId(vendor, flashId, supported)) {
      continue;
    }
    const partNumber = cleanChipsBankPartNumber(context, vendor, record[3] ?? "");
    if (!partNumber) {
      continue;
    }
    const pageSizeRaw = (record[2] ?? "").split("-")[1] ?? "";
    let pageSize = 0;
    if (pageSizeRaw.endsWith("K")) {
      pageSize = Number.parseFloat(pageSizeRaw.slice(0, -1));
    } else if (/^\d+(\.\d+)?$/.test(pageSizeRaw)) {
      pageSize = Number.parseFloat(pageSizeRaw) / 1024;
    }
    context.addPartId(vendor, partNumber, flashId, supported);
    context.mergePartPayload(vendor, partNumber, {
      ...(record[7] ? { l: record[7] } : {}),
      c: (record[2] ?? "").split("-")[0],
      t: supported
    });
    context.mergeFlashPayload(flashId, { ...(pageSize > 0 ? { s: pageSize } : {}), t: supported });
  }
}

function mergeChipsBankJson(context: ControllerMergeContext, data: string): void {
  mergeFdnextFdbgenV1SupportList(context, JSON.parse(data) as unknown, {
    requireSupportedFlashIdPrefix: false,
    mapEntry: mapChipsBankJsonEntry
  });
}

export const chipsBankController: ControllerGenerator = {
  id: "chips-bank",
  directories: ["cbm"],
  mergeFile(context, file) {
    if (file.filename.toLowerCase().endsWith(".json")) {
      mergeChipsBankJson(context, file.data);
      return;
    }
    mergeChipsBank(context, file.data);
  }
};
