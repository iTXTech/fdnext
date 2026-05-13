import { normalizeFdbVendorName } from "../normalize";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeMaxiotek(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = `MK${filename.split("_")[0] ?? filename}`.toUpperCase();
  context.addInfoController(controller);
  const parsed = context.parseIni(data);
  for (const [section, values] of Object.entries(parsed)) {
    const rawVendorKey = section.trim().toLowerCase();
    const vendor = normalizeFdbVendorName(section);
    if (vendor === "version" || vendor === "vendor" || !vendor) {
      continue;
    }
    let recordIndex = 0;
    for (const flash of Object.values(values)) {
      recordIndex += 1;
      const fields = flash
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const id = fields
        .filter((item) => item.length === 4 && item.startsWith("0x"))
        .map((item) => item.slice(2, 4))
        .join("");
      if (!id || /^0+$/.test(id)) {
        continue;
      }
      let partNumber = fields[1] ?? "";
      if (rawVendorKey === "sandisk") {
        const idx = partNumber.indexOf("0");
        if (idx !== -1) {
          partNumber = `${partNumber.slice(0, idx)}-${partNumber.slice(idx)}`;
        }
      } else if (vendor === "kioxia" && partNumber.length > 15) {
        partNumber = partNumber.slice(0, 15);
      } else {
        partNumber = context.normalizeKnownPackage(vendor, partNumber);
      }
      context.withSource({ recordIndex, raw: flash }, () => {
        context.mergePartPayload(vendor, partNumber, { t: [controller] });
        if (id.length === 12) {
          context.addPartId(vendor, partNumber, id, [controller]);
        }
      });
    }
  }
}

export const maxiotekController: ControllerGenerator = {
  id: "maxiotek",
  directories: ["mk"],
  mergeFile(context, file) {
    mergeMaxiotek(context, file.data, file.filename);
  }
};
