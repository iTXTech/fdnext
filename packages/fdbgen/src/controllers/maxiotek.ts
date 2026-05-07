import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeMaxiotek(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = `MK${filename.split("_")[0] ?? filename}`.toUpperCase();
  context.addInfoController(controller);
  const parsed = context.parseIni(data);
  for (const [section, values] of Object.entries(parsed)) {
    const vendor = section.toLowerCase().replace("hynix", "skhynix");
    if (vendor === "version" || vendor === "vendor" || !vendor) {
      continue;
    }
    for (const flash of Object.values(values)) {
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
      if (vendor === "sandisk") {
        const idx = partNumber.indexOf("0");
        if (idx !== -1) {
          partNumber = `${partNumber.slice(0, idx)}-${partNumber.slice(idx)}`;
        }
      } else if (vendor === "toshiba" && partNumber.length > 15) {
        partNumber = partNumber.slice(0, 15);
      } else {
        partNumber = context.normalizeKnownPackage(vendor, partNumber);
      }
      context.mergePartPayload(vendor, partNumber, { t: [controller] });
      if (id.length === 12) {
        context.addPartId(vendor, partNumber, id, [controller]);
      }
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
