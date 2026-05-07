import type { ControllerGenerator, ControllerMergeContext } from "./types";

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
    const vendor = (record[0] ?? "").toLowerCase().replace("hynix", "skhynix");
    let flashId = (record[4] ?? "").replace(/[\/\s]/g, "");
    if (flashId.length > 12) {
      flashId = flashId.slice(0, 12);
    }
    if (!context.vendorExists(vendor)) {
      continue;
    }
    const supported = record
      .slice(9)
      .map((value, index) => (value === "Y" ? controllers[index] : undefined))
      .filter((item): item is string => !!item);
    if (context.addControllersToMatchingFlashId(vendor, flashId, supported)) {
      continue;
    }
    let partNumber = (record[3] ?? "").replaceAll("(T)", "").replaceAll("(TOG)", "").replaceAll("(TOG", "");
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
      continue;
    }
    const nearTail = partNumber[partNumber.length - 2];
    if (nearTail === "_" || nearTail === "*") {
      partNumber = partNumber.slice(0, -2);
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

export const chipsBankController: ControllerGenerator = {
  id: "chips-bank",
  directories: ["cbm"],
  mergeFile(context, file) {
    mergeChipsBank(context, file.data);
  }
};
