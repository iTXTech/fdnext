import { normalizeFdbVendorName } from "../normalize";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeSandForce(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data);
  dataLines.shift();
  for (let index = 0; index < dataLines.length; index += 1) {
    const rawConfig = dataLines[index] ?? "";
    if (!rawConfig.trim()) {
      continue;
    }
    const config = rawConfig.replace(/\(.*?\)/g, "").split(",");
    const firmwareType = config[2] ?? "";
    const controllerPart = firmwareType.split("-")[1];
    if (!controllerPart) {
      continue;
    }
    const controller = `SF${controllerPart}`;
    context.addInfoController(controller);
    const rawVendorKey = (config[4] ?? "").trim().toLowerCase();
    const vendor = normalizeFdbVendorName(config[4]);
    let partNumber = (config[7] ?? "").trim();
    if (partNumber.length <= 3 || partNumber.toLowerCase().includes("custom")) {
      continue;
    }
    if (vendor === "skhynix" || vendor === "samsung") {
      partNumber = partNumber.split("-")[0] ?? partNumber;
    }
    if (vendor === "micron" || vendor === "skhynix") {
      partNumber = context.normalizeKnownPackage(vendor, partNumber);
    }
    if (rawVendorKey === "sandisk" && partNumber.length <= 9) {
      continue;
    }
    context.withSource({ line: index + 2, raw: rawConfig }, () => {
      context.mergePartPayload(vendor, partNumber, { t: [controller] });
    });
  }
}

export const sandForceController: ControllerGenerator = {
  id: "sand-force",
  directories: ["sf"],
  mergeFile(context, file) {
    mergeSandForce(context, file.data);
  }
};
