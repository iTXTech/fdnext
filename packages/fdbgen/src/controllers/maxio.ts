import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeMaxio(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = `${filename.split("_")[0] ?? filename}`.toUpperCase();
  const usePartNumber = !filename.startsWith("map");
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
      if (usePartNumber && vendor !== "sandisk") {
        if (vendor === "toshiba" && partNumber.length > 15) {
          partNumber = partNumber.slice(0, 15);
        } else {
          partNumber = context.normalizeKnownPackage(vendor, partNumber);
        }
        context.mergePartPayload(vendor, partNumber, { t: [controller] });
        if (id.length === 12) {
          context.addPartId(vendor, partNumber, id, [controller]);
        }
      } else if (id.length === 12) {
        context.mergeFlashPayload(id, { t: [controller] });
      }
    }
  }
}

export const maxioController: ControllerGenerator = {
  id: "maxio",
  directories: ["ma"],
  mergeFile(context, file) {
    mergeMaxio(context, file.data, file.filename);
  }
};
