import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergePhison(context: ControllerMergeContext, data: string): void {
  const controllers = ["PS3111", "INIC6081"];
  context.addInfoController(controllers);
  const parsed = JSON.parse(data);
  const flashes = Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
  for (const flash of flashes) {
    const vendor = String(flash.Vendor ?? "").toLowerCase().replace("hynix", "skhynix");
    const flashId = String(flash.FlashId ?? "").slice(0, 12);
    context.addControllersToMatchingFlashId(vendor, flashId, controllers);
  }
}

export const phisonController: ControllerGenerator = {
  id: "phison",
  directories: ["ps"],
  mergeFile(context, file) {
    mergePhison(context, file.data);
  }
};
