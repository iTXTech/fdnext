import { mergeFdnextFdbgenV1SupportList } from "../fdbgen-v1";
import { normalizeFdbVendorName } from "../normalize";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeAlcorMicro(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data);
  const controllers = (dataLines.shift() ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  context.addInfoController(controllers);
  for (let index = 0; index < dataLines.length; index += 1) {
    const rawRecord = dataLines[index] ?? "";
    if (!rawRecord.trim()) {
      continue;
    }
    const record = rawRecord.split(",");
    const vendor = normalizeFdbVendorName(record[0]);
    let partNumber = (record[3] ?? "").trim();
    let processNode = (record[4] ?? "").trim();
    processNode = processNode.length > 1 ? processNode : "";
    const supported = record
      .slice(6)
      .map((value, index) => (value === "Y" ? controllers[index] : undefined))
      .filter((item): item is string => !!item);
    if (vendor === "skhynix") {
      partNumber = partNumber.split("-")[0] ?? partNumber;
    }
    partNumber = context.normalizeKnownPackage(vendor, partNumber);
    context.withSource({ line: index + 2, raw: rawRecord }, () => {
      context.mergePartPayload(vendor, partNumber, {
        c: record[1],
        ...(processNode ? { l: processNode } : {}),
        t: supported
      });
    });
  }
}

export const alcorMicroController: ControllerGenerator = {
  id: "alcor-micro",
  directories: ["al"],
  mergeFile(context, file) {
    if (file.filename.toLowerCase().endsWith(".json")) {
      mergeFdnextFdbgenV1SupportList(context, JSON.parse(file.data) as unknown);
      return;
    }
    mergeAlcorMicro(context, file.data);
  }
};
