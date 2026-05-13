import { mergeFdnextFdbgenV1SupportList } from "../fdbgen-v1";
import { normalizeFdbVendorName } from "../normalize";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

function mergeInnostorIni(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = `IS${filename.split("_")[0] ?? filename}`;
  context.addInfoController(controller);
  const filtered = context.lines(data).filter((line) => !line.startsWith("//") && !line.startsWith("~")).join("\n");
  const parsed = context.parseIni(filtered);
  let recordIndex = 0;
  for (const flash of Object.values(parsed)) {
    recordIndex += 1;
    if (!flash.Vendor) {
      continue;
    }
    const vendor = normalizeFdbVendorName(flash.Vendor);
    const flashId = flash.FlashID ?? "";
    context.withSource({ recordIndex, raw: JSON.stringify(flash) }, () => {
      context.addControllersToMatchingFlashId(vendor, flashId, [controller], {
        s: Math.round(Number.parseFloat(flash.PageSize ?? "0") / 1024),
        p: Number.parseInt(flash.Pagesperblock ?? "0", 10),
        b: Number.parseInt(flash.Blocks ?? "0", 10)
      });
    });
  }
}

function mergeInnostorJson(context: ControllerMergeContext, data: string): void {
  mergeFdnextFdbgenV1SupportList(context, JSON.parse(data) as unknown);
}

export const innostorController: ControllerGenerator = {
  id: "innostor",
  directories: ["is"],
  mergeFile(context, file) {
    if (file.filename.toLowerCase().endsWith(".json")) {
      mergeInnostorJson(context, file.data);
      return;
    }
    mergeInnostorIni(context, file.data, file.filename);
  }
};
