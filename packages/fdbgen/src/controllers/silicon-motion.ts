import { normalizeFdbVendorName } from "../normalize";
import { inferVendorFromPartNumber } from "../vendors";
import type { ControllerGenerator, ControllerMergeContext } from "./types";
import type { FlashIdPayload } from "../types";

function mergeForceFlash(context: ControllerMergeContext, data: string): void {
  const dataLines = context.lines(data);
  for (let i = 0; i < dataLines.length; i += 1) {
    const line = dataLines[i] ?? "";
    const eq = line.indexOf("=");
    if (eq === -1 || line.slice(eq + 1).includes(",")) {
      continue;
    }
    const bytes = line.split("_")[0]?.split(",").map(context.cleanHexByte).filter(Boolean) ?? [];
    if (bytes.length !== 6) {
      continue;
    }
    const id = bytes.join("");
    const index = (dataLines[i + 1] ?? "").split("=").slice(1).join("=");
    const flash: FlashIdPayload = {};
    const pageMatch = /(\d+)Page/.exec(index);
    if (pageMatch?.[1]) {
      flash.p = Number.parseInt(pageMatch[1], 10);
    }
    for (const size of ["12", "16", "4", "8", "2"]) {
      if (index.includes(`${size}K`)) {
        flash.s = Number.parseInt(size, 10);
        break;
      }
    }

    const info = index.split(",");
    const rawPn = (info.at(-1) ?? "").split("(")[0]?.replace(/\s+/g, "").split("_")[0] ?? "";
    const rawVendor = (info[0] ?? "").split("_")[0] ?? "";
    let vendor = normalizeFdbVendorName(rawVendor.replaceAll(" ", ""));
    if (/\d$/.test(vendor)) {
      vendor = vendor.slice(0, -1);
    }
    const partNumber = context.normalizeKnownPackage(vendor, rawPn);
    context.withSource({ line: i + 1, raw: [line, dataLines[i + 1], dataLines[i + 2]].filter(Boolean).join(" | ") }, () => {
      if (partNumber) {
        context.addPartId(vendor, partNumber, id);
      } else {
        context.mergeFlashPayload(id, flash);
      }

      const blockBytes = (dataLines[i + 2] ?? "").split("=").slice(1).join("=").split(",");
      const blockHigh = blockBytes[11];
      const blockLow = blockBytes[12];
      if (blockHigh && blockLow) {
        const blocks = Number.parseInt(`${blockHigh}${blockLow}`, 16);
        if (Number.isFinite(blocks) && blocks > 0) {
          flash.b = blocks;
        }
      }
      context.mergeFlashPayload(id, flash);
    });
  }
}

function mergeUfd(context: ControllerMergeContext, data: string, filename: string): void {
  const controller = `SM${filename.replace(/^flash_/, "").replace(/\.dbf$/i, "")}`;
  context.addInfoController(controller);

  const dataLines = context.lines(data);
  for (let lineIndex = 0; lineIndex < dataLines.length; lineIndex += 1) {
    const line = dataLines[lineIndex] ?? "";
    if (!line.startsWith("@")) {
      continue;
    }
    const record = line.slice(2);
    const marker = record.indexOf("// ");
    if (marker === -1) {
      continue;
    }
    const id = record
      .slice(0, marker)
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .map(context.cleanHexByte)
      .join("");
    let text = record.slice(marker + 3).trim();
    const nestedComment = text.indexOf("//");
    const remark = nestedComment === -1 ? "" : text.slice(nestedComment + 2).trim();
    text = text
      .replace(/3D V(\d)/g, "3DV$1")
      .replace(remark, "")
      .replaceAll("NEW DATE CODE", "")
      .replaceAll("OLD DATE CODE", "")
      .replaceAll(" - ", "-")
      .replaceAll("L84A HP", "L84A_HP")
      .replaceAll("SanDisk SanDisk", "SanDisk")
      .replaceAll("-ES", "ES");
    const fields = text
      .split(/\s+/)
      .map((item) => item.trim().replace(/[\/,]/g, ""))
      .filter(Boolean);
    if (!fields[2] || (fields[1] ?? "").endsWith("nm")) {
      continue;
    }
    if ((fields[2] ?? "").length !== 5) {
      fields.splice(2, 0, "");
    }
    let vendor = normalizeFdbVendorName(fields[0]);
    let rawPartNumber = fields[1] ?? "";
    const inferredFirstFieldVendor = inferVendorFromPartNumber(fields[0] ?? "");
    if (!context.vendorExists(vendor) && inferredFirstFieldVendor) {
      vendor = inferredFirstFieldVendor;
      rawPartNumber = fields[0] ?? "";
    }
    if ((fields[3] ?? "").endsWith("LC")) {
      const cellLevel = fields[3] ?? "";
      fields[3] = fields[4] ?? "";
      fields[4] = cellLevel;
    } else if (fields[5] && fields[5].length < 5) {
      fields[3] = `${fields[3] ?? ""} ${fields[5]}`.trim();
      fields[5] = "";
    }
    const partNumber = context.normalizeKnownPackage(vendor, rawPartNumber);
    context.withSource({ line: lineIndex + 1, raw: line }, () => {
      context.addPartId(vendor, partNumber, id, [controller]);
      if (fields[3]) {
        context.mergePartPayload(vendor, partNumber, { l: fields[3], ...(remark ? { m: remark } : {}) });
      } else if (remark) {
        context.mergePartPayload(vendor, partNumber, { m: remark });
      }
    });
  }
}

function mergeSsd(context: ControllerMergeContext, data: string, filename: string): void {
  const controllerFromFile = `SM${filename.split("_")[0] ?? filename}`;
  const defaultController = controllerFromFile === "SM2258XTLEGACY" ? "SM2258XT" : controllerFromFile;
  const prefix = defaultController === "SM2258XT" ? "B" : "A";
  context.addInfoController(defaultController);
  const controllerAliases: Record<string, string> = {
    "58XT": "2258XT",
    "2259AB": "2259",
    "2258AB": "2258"
  };
  const dataLines = context.lines(data.replace(/\r?\n\r?\n/g, "\n"));
  for (let i = 0; i < dataLines.length; i += 1) {
    const config = dataLines[i] ?? "";
    const next = dataLines[i + 1] ?? "";
    if (!config.startsWith(prefix) || next.startsWith(prefix) || config.endsWith("[END]")) {
      continue;
    }
    const value = next.split("=").slice(1).join("=");
    const flash = next.split("=")[0] ?? "";
    const [rawVendor, _density, ...pnParts] = flash.split(",");
    if (!rawVendor || pnParts.length === 0) {
      continue;
    }
    let controller = defaultController;
    const rawVendorKey = rawVendor.trim().toLowerCase();
    const vendor = normalizeFdbVendorName(rawVendor);
    let partNumber = pnParts.join(",");
    if (prefix === "B") {
      const match = /\(SM([^)]+)/.exec(partNumber);
      if (!match?.[1]) {
        continue;
      }
      const mapped = controllerAliases[match[1]] ?? match[1];
      controller = `SM${mapped}`;
      context.addInfoController(controller);
    }
    partNumber = partNumber.replace(/\(.*?\)/g, "").trim();
    if (rawVendorKey === "sandisk") {
      if (partNumber.startsWith("SNDK ") && partNumber.slice(5).length > 5) {
        partNumber = partNumber
          .slice(5)
          .replaceAll("  ", " ")
          .replaceAll(" ", "-")
          .replaceAll("-8G", "-008G")
          .replaceAll("-16G", "-016G")
          .replaceAll("-32G", "-032G")
          .replaceAll("-64G", "-064G");
      }
      const parts = partNumber.replaceAll("Toggle)", "").replaceAll(" ", "_").split("_");
      if ((parts.at(-1) ?? "").startsWith("DDR")) {
        parts.pop();
      }
      partNumber = parts.join("-").replaceAll("---", "-").replaceAll("--", "-").replace(/-$/, "");
    } else {
      for (const char of ["-", "_", " "]) {
        if (partNumber.includes(char)) {
          partNumber = partNumber.split(char)[0] ?? partNumber;
        }
      }
    }
    partNumber = context.normalizeKnownPackage(vendor, partNumber);
    const id = value.split(",").slice(0, 6).map(context.cleanHexByte).join("");
    context.withSource({ line: i + 2, raw: [config, next].filter(Boolean).join(" | ") }, () => {
      if (partNumber !== "TSB") {
        context.addPartId(vendor, partNumber, id, [controller]);
      } else {
        context.mergeFlashPayload(id, { t: [controller] });
      }
    });
  }
}

export const siliconMotionController: ControllerGenerator = {
  id: "silicon-motion",
  directories: ["smff", "smufd", "smssd"],
  mergeFile(context, file) {
    if (file.directory === "smff") {
      mergeForceFlash(context, file.data);
    } else if (file.directory === "smufd") {
      mergeUfd(context, file.data, file.filename);
    } else if (file.directory === "smssd") {
      mergeSsd(context, file.data, file.filename);
    }
  }
};
