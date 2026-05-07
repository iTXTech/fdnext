import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import type { ExtraPayload, FdbInfoPayload, FlashIdPayload, GenerateFdbOptions, PartNumberPayload } from "./types";

const VENDOR_PATCH: Record<string, string> = {
  sandisk: "sndk",
  "san disk": "sndk",
  sndk: "sndk",
  westerndigital: "sndk",
  "western digital": "sndk",
  wd: "sndk",
  toshiba: "kioxia",
  "toshiba-iver": "kioxia",
  hynix: "skhynix",
  septeck: "spectek",
  stm: "st"
};

type PartNumberMap = Map<string, PartNumberPayload>;
type VendorMap = Map<string, PartNumberMap>;
type FlashIdMap = Map<string, FlashIdPayload>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_PATCH[key] ?? key;
}

function normalizePartNumber(partNumber: string): string {
  return partNumber
    .trim()
    .toUpperCase()
    .replace(/\uFFFD/g, "-")
    .replace(/[ ,&.|]/g, "");
}

function inferVendorFromPartNumber(partNumber: string): string | null {
  if (/^(MT29|MTFC|MTFD|NW[0-9A-Z]{3,})/.test(partNumber)) {
    return "micron";
  }
  if (/^(K9|KLM|KLU|KMD|KMF|KMN|KMV)/.test(partNumber)) {
    return "samsung";
  }
  if (/^(HY27|H27|H25|H26|H2D|H2J|H9T|HYNIX)/.test(partNumber)) {
    return "skhynix";
  }
  if (/^(TC58|TH58)/.test(partNumber)) {
    return "kioxia";
  }
  if (/^(SD|S34|S35|SANDISK|SNDK|DFT|MDT|05[0-9]{3})/.test(partNumber)) {
    return "sndk";
  }
  if (/^(JS29F|I29F|PF29F|PC29F|PD29F)/.test(partNumber)) {
    return "intel";
  }
  if (/^(FBNL|FNNL|FNN|FXXL)/.test(partNumber)) {
    return "spectek";
  }
  if (/^(NAND|M29F)/.test(partNumber)) {
    return "st";
  }
  if (/^(YM|YMN|XT)/.test(partNumber)) {
    return "ymtc";
  }
  if (/^[TIKHDCN][APCOKFTBY][135678ABC][0-9A-Z]{7}$/.test(partNumber)) {
    return "phison";
  }
  return null;
}

function normalizeFlashId(id: string): string | null {
  const normalized = id.replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length % 2 !== 0 || normalized.length < 4 || normalized.length > 16) {
    return null;
  }
  return /^[0-9A-F]+$/.test(normalized) ? normalized : null;
}

function toStringArray(value: unknown, toUpper = false): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    out.push(toUpper ? text.toUpperCase() : text);
  }
  return out;
}

function toFlashIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const normalized = normalizeFlashId(String(item));
    if (normalized) {
      out.push(normalized);
    }
  }
  return out;
}

function normalizePartReference(value: unknown): string | null {
  const text = String(value).trim();
  const match = /^(\S+)\s+(.+)$/.exec(text);
  if (!match) {
    return null;
  }
  const partNumber = normalizePartNumber(match[2] ?? "");
  const vendor = inferVendorFromPartNumber(partNumber) ?? normalizeVendor(match[1] ?? "");
  if (!vendor || !partNumber) {
    return null;
  }
  return `${vendor} ${partNumber}`;
}

function toPartReferenceArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    const normalized = normalizePartReference(item);
    if (normalized) {
      out.push(normalized);
    }
  }
  return out;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mergeStringArray(target: string[] | undefined, source: string[], toUpper = false): string[] {
  const set = new Set<string>();
  for (const item of target ?? []) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    set.add(toUpper ? text.toUpperCase() : text);
  }
  for (const item of source) {
    const text = String(item).trim();
    if (!text) {
      continue;
    }
    set.add(toUpper ? text.toUpperCase() : text);
  }
  return [...set];
}

function mergePartNumber(target: PartNumberPayload | undefined, source: unknown): PartNumberPayload {
  const src = asRecord(source);
  const out: PartNumberPayload = { ...(target ?? {}) };

  const ids = toFlashIdArray(src.id);
  if (ids.length > 0) {
    out.id = mergeStringArray(out.id, ids, true);
  }
  const forcedIds = toFlashIdArray(src.fid);
  if (forcedIds.length > 0) {
    out.id = forcedIds;
  }

  const controllers = toStringArray(src.t, false);
  if (controllers.length > 0) {
    out.t = mergeStringArray(out.t, controllers, false);
  }

  if (typeof src.l === "string") {
    out.l = src.l;
  }
  if (typeof src.c === "string") {
    out.c = src.c;
  }
  if (typeof src.m === "string") {
    out.m = src.m;
  }

  const d = toOptionalNumber(src.d);
  const e = toOptionalNumber(src.e);
  const r = toOptionalNumber(src.r);
  const n = toOptionalNumber(src.n);
  if (d !== undefined) out.d = d;
  if (e !== undefined) out.e = e;
  if (r !== undefined) out.r = r;
  if (n !== undefined) out.n = n;

  return out;
}

function mergeFlashId(target: FlashIdPayload | undefined, source: unknown): FlashIdPayload {
  const src = asRecord(source);
  const out: FlashIdPayload = { ...(target ?? {}) };

  const partNumbers = toPartReferenceArray(src.n);
  if (partNumbers.length > 0) {
    out.n = mergeStringArray(out.n, partNumbers, false);
  }

  const controllers = toStringArray(src.t, false);
  if (controllers.length > 0) {
    out.t = mergeStringArray(out.t, controllers, false);
  }

  const s = toOptionalNumber(src.s);
  const p = toOptionalNumber(src.p);
  const b = toOptionalNumber(src.b);
  if (s !== undefined) out.s = s;
  if (p !== undefined) out.p = p;
  if (b !== undefined) out.b = b;

  return out;
}

function ensureVendor(vendors: VendorMap, vendor: string): PartNumberMap {
  const normalized = normalizeVendor(vendor);
  const existing = vendors.get(normalized);
  if (existing) {
    return existing;
  }
  const created = new Map<string, PartNumberPayload>();
  vendors.set(normalized, created);
  return created;
}

function mergeVendorRecord(vendors: VendorMap, vendor: string, record: unknown): void {
  const normalizedVendor = normalizeVendor(vendor);
  for (const [pn, payload] of Object.entries(asRecord(record))) {
    const normalizedPn = normalizePartNumber(pn);
    if (!normalizedPn) {
      continue;
    }
    const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? normalizedVendor;
    const vendorMap = ensureVendor(vendors, correctedVendor);
    const next = mergePartNumber(vendorMap.get(normalizedPn), payload);
    vendorMap.set(normalizedPn, next);
  }
}

function mergeIddbRecord(iddb: FlashIdMap, record: unknown): void {
  for (const [flashId, payload] of Object.entries(asRecord(record))) {
    const normalizedId = normalizeFlashId(flashId);
    if (!normalizedId) {
      continue;
    }
    const next = mergeFlashId(iddb.get(normalizedId), payload);
    iddb.set(normalizedId, next);
  }
}

function addInfoController(info: FdbInfoPayload, controller: string | string[]): void {
  const controllers = info.controllers ?? [];
  for (const item of Array.isArray(controller) ? controller : [controller]) {
    const text = String(item).trim();
    if (text && !controllers.includes(text)) {
      controllers.push(text);
    }
  }
  info.controllers = controllers;
}

function mergePartPayload(vendors: VendorMap, vendor: string, partNumber: string, payload: PartNumberPayload): PartNumberPayload | null {
  const normalizedPn = normalizePartNumber(partNumber);
  if (!normalizedPn) {
    return null;
  }
  const correctedVendor = inferVendorFromPartNumber(normalizedPn) ?? normalizeVendor(vendor);
  const vendorMap = ensureVendor(vendors, correctedVendor);
  const next = mergePartNumber(vendorMap.get(normalizedPn), payload);
  vendorMap.set(normalizedPn, next);
  return next;
}

function mergeFlashPayload(iddb: FlashIdMap, id: string, payload: FlashIdPayload): FlashIdPayload | null {
  const normalizedId = normalizeFlashId(id);
  if (!normalizedId) {
    return null;
  }
  const next = mergeFlashId(iddb.get(normalizedId), payload);
  iddb.set(normalizedId, next);
  return next;
}

function addPartId(vendors: VendorMap, iddb: FlashIdMap, vendor: string, partNumber: string, id: string, controllers: string[] = []): void {
  const normalizedId = normalizeFlashId(id);
  if (!normalizedId) {
    return;
  }
  mergePartPayload(vendors, vendor, partNumber, { id: [normalizedId], ...(controllers.length > 0 ? { t: controllers } : {}) });
  mergeFlashPayload(iddb, normalizedId, { ...(controllers.length > 0 ? { t: controllers } : {}) });
}

function lines(data: string): string[] {
  return data.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function cleanHexByte(value: string | undefined): string {
  const text = (value ?? "").trim().replace(/^0x/i, "").toUpperCase();
  return text.length === 1 ? `0${text}` : text.slice(-2);
}

function parseIni(data: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let section = "";
  for (const rawLine of lines(data)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) {
      continue;
    }
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch?.[1]) {
      section = sectionMatch[1];
      result[section] ??= {};
      continue;
    }
    const eq = line.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    const values = (result[section] ??= {});
    values[key] = value;
  }
  return result;
}

const MICRON_PACKAGE_SUFFIXES = new Set([
  "WP",
  "WC",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "D1",
  "D4",
  "D5",
  "D6",
  "D7",
  "G1",
  "G2",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "H7",
  "H8",
  "H9",
  "HC",
  "J1",
  "J2",
  "J3",
  "J4",
  "J5",
  "J6",
  "J7",
  "J9",
  "K3",
  "K4",
  "K6",
  "K7",
  "K8",
  "K9",
  "L4",
  "M4",
  "M5",
  "M8",
  "M9",
  "MD"
]);

function removeSpectekPackage(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  const suffix = base.slice(-2).toUpperCase();
  return MICRON_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
}

function removeMicronPackage(partNumber: string): string {
  if (/^(FN|FT|FB|FX|CB)/.test(partNumber)) {
    return removeSpectekPackage(partNumber);
  }
  const idx = partNumber.indexOf("08");
  if (idx !== -1 && partNumber.length - idx >= 8) {
    return partNumber.slice(0, idx + 7);
  }
  return partNumber;
}

function removeSkhynixPackage(partNumber: string): string {
  return partNumber.startsWith("H27") || partNumber.startsWith("H25") ? partNumber.slice(0, 10) : partNumber;
}

function removeKnownPackage(vendor: string, partNumber: string): string {
  const normalizedVendor = normalizeVendor(vendor);
  if (normalizedVendor === "micron") {
    return removeMicronPackage(partNumber);
  }
  if (normalizedVendor === "skhynix") {
    return removeSkhynixPackage(partNumber);
  }
  if (normalizedVendor === "spectek") {
    return removeSpectekPackage(partNumber);
  }
  return partNumber;
}

function vendorExists(vendors: VendorMap, vendor: string): boolean {
  return vendors.has(normalizeVendor(vendor));
}

function forEachPartWithVendor(vendors: VendorMap, vendor: string, fn: (partNumber: string, payload: PartNumberPayload) => boolean | void): void {
  const records = vendors.get(normalizeVendor(vendor));
  if (!records) {
    return;
  }
  for (const [partNumber, payload] of records.entries()) {
    if (fn(partNumber, payload) === false) {
      return;
    }
  }
}

function addControllersToMatchingFlashId(
  vendors: VendorMap,
  iddb: FlashIdMap,
  vendor: string,
  flashIdPrefix: string,
  controllers: string[],
  patch?: FlashIdPayload
): boolean {
  const prefix = normalizeFlashId(flashIdPrefix);
  if (!prefix) {
    return false;
  }
  let found = false;
  forEachPartWithVendor(vendors, vendor, (_partNumber, payload) => {
    for (const id of payload.id ?? []) {
      if (!id.startsWith(prefix)) {
        continue;
      }
      payload.t = mergeStringArray(payload.t, controllers, false);
      mergeFlashPayload(iddb, id, { ...(patch ?? {}), t: controllers });
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
}

function mergeSiliconMotionForceFlash(vendors: VendorMap, iddb: FlashIdMap, data: string): void {
  const dataLines = lines(data);
  for (let i = 0; i < dataLines.length; i += 1) {
    const line = dataLines[i] ?? "";
    const eq = line.indexOf("=");
    if (eq === -1 || line.slice(eq + 1).includes(",")) {
      continue;
    }
    const bytes = line.split("_")[0]?.split(",").map(cleanHexByte).filter(Boolean) ?? [];
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
    let vendor = rawVendor.toLowerCase().replaceAll(" ", "");
    vendor = vendor.replace("tsb", "toshiba").replace("ss", "samsung").replace("hy", "hynix").replace("hynix", "skhynix");
    vendor = vendor.replace("skhynixnix", "skhynix");
    if (/\d$/.test(vendor)) {
      vendor = vendor.slice(0, -1);
    }
    const partNumber = removeKnownPackage(vendor, rawPn);
    if (partNumber) {
      addPartId(vendors, iddb, vendor, partNumber, id);
    } else {
      mergeFlashPayload(iddb, id, flash);
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
    mergeFlashPayload(iddb, id, flash);
  }
}

function mergeSiliconMotionUfd(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, data: string, filename: string): void {
  const controller = `SM${filename.replace(/^flash_/, "").replace(/\.dbf$/i, "")}`;
  addInfoController(info, controller);

  for (const line of lines(data)) {
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
      .map(cleanHexByte)
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
    let vendor = (fields[0] ?? "").toLowerCase().replace("samaung", "samsung").replace("hynix", "skhynix").replace("speteck", "spectek");
    if ((fields[3] ?? "").endsWith("LC")) {
      const cellLevel = fields[3] ?? "";
      fields[3] = fields[4] ?? "";
      fields[4] = cellLevel;
    } else if (fields[5] && fields[5].length < 5) {
      fields[3] = `${fields[3] ?? ""} ${fields[5]}`.trim();
      fields[5] = "";
    }
    const partNumber = removeKnownPackage(vendor, fields[1] ?? "");
    addPartId(vendors, iddb, vendor, partNumber, id, [controller]);
    if (fields[3]) {
      mergePartPayload(vendors, vendor, partNumber, { l: fields[3], ...(remark ? { m: remark } : {}) });
    } else if (remark) {
      mergePartPayload(vendors, vendor, partNumber, { m: remark });
    }
  }
}

function mergeSiliconMotionSsd(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, data: string, filename: string): void {
  const controllerFromFile = `SM${filename.split("_")[0] ?? filename}`;
  let defaultController = controllerFromFile === "SM2258XTLEGACY" ? "SM2258XT" : controllerFromFile;
  const prefix = defaultController === "SM2258XT" ? "B" : "A";
  addInfoController(info, defaultController);
  const controllerAliases: Record<string, string> = {
    "58XT": "2258XT",
    "2259AB": "2259",
    "2258AB": "2258"
  };
  const dataLines = lines(data.replace(/\r?\n\r?\n/g, "\n"));
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
    let vendor = rawVendor.toLowerCase().replace("hynix", "skhynix").replace("stm", "st").replace("power flash", "powerchip");
    let partNumber = pnParts.join(",");
    if (prefix === "B") {
      const match = /\(SM([^)]+)/.exec(partNumber);
      if (!match?.[1]) {
        continue;
      }
      const mapped = controllerAliases[match[1]] ?? match[1];
      controller = `SM${mapped}`;
      addInfoController(info, controller);
    }
    partNumber = partNumber.replace(/\(.*?\)/g, "").trim();
    if (vendor === "sandisk") {
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
    partNumber = removeKnownPackage(vendor, partNumber);
    const id = value.split(",").slice(0, 6).map(cleanHexByte).join("");
    if (partNumber !== "TSB") {
      addPartId(vendors, iddb, vendor, partNumber, id, [controller]);
    } else {
      mergeFlashPayload(iddb, id, { t: [controller] });
    }
  }
}

function mergeJMicronLike(
  vendors: VendorMap,
  iddb: FlashIdMap,
  info: FdbInfoPayload,
  data: string,
  filename: string,
  prefix: string,
  usePartNumber = true,
  ignoreSanDisk = false
): void {
  const controller = `${prefix}${filename.split("_")[0] ?? filename}`.toUpperCase();
  addInfoController(info, controller);
  const parsed = parseIni(data);
  for (const [section, values] of Object.entries(parsed)) {
    let vendor = section.toLowerCase().replace("hynix", "skhynix");
    if (vendor === "version" || vendor === "vendor" || !vendor) {
      continue;
    }
    for (const flash of Object.values(values)) {
      const fields = flash.split(/\s+/).map((item) => item.trim()).filter(Boolean);
      const id = fields
        .filter((item) => item.length === 4 && item.startsWith("0x"))
        .map((item) => item.slice(2, 4))
        .join("");
      if (!id || /^0+$/.test(id)) {
        continue;
      }
      let partNumber = fields[1] ?? "";
      if (usePartNumber && !(vendor === "sandisk" && ignoreSanDisk)) {
        if (vendor === "sandisk") {
          const idx = partNumber.indexOf("0");
          if (idx !== -1) {
            partNumber = `${partNumber.slice(0, idx)}-${partNumber.slice(idx)}`;
          }
        } else if (vendor === "toshiba" && partNumber.length > 15) {
          partNumber = partNumber.slice(0, 15);
        } else {
          partNumber = removeKnownPackage(vendor, partNumber);
        }
        mergePartPayload(vendors, vendor, partNumber, { t: [controller] });
        if (id.length === 12) {
          addPartId(vendors, iddb, vendor, partNumber, id, [controller]);
        }
      } else if (id.length === 12) {
        mergeFlashPayload(iddb, id, { t: [controller] });
      }
    }
  }
}

function mergeSandForce(vendors: VendorMap, info: FdbInfoPayload, data: string): void {
  const dataLines = lines(data);
  dataLines.shift();
  for (const rawConfig of dataLines) {
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
    addInfoController(info, controller);
    let vendor = (config[4] ?? "").toLowerCase().replace("hynix", "skhynix");
    let partNumber = (config[7] ?? "").trim();
    if (partNumber.length <= 3 || partNumber.toLowerCase().includes("custom")) {
      continue;
    }
    if (vendor === "skhynix" || vendor === "samsung") {
      partNumber = partNumber.split("-")[0] ?? partNumber;
    }
    if (vendor === "micron" || vendor === "skhynix") {
      partNumber = removeKnownPackage(vendor, partNumber);
    }
    if (vendor === "sandisk" && partNumber.length <= 9) {
      continue;
    }
    mergePartPayload(vendors, vendor, partNumber, { t: [controller] });
  }
}

function mergeAlcorMicro(vendors: VendorMap, info: FdbInfoPayload, data: string): void {
  const dataLines = lines(data);
  const controllers = (dataLines.shift() ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  addInfoController(info, controllers);
  for (const rawRecord of dataLines) {
    if (!rawRecord.trim()) {
      continue;
    }
    const record = rawRecord.split(",");
    let vendor = (record[0] ?? "").toLowerCase().replace("powerflash", "powerchip").replace("hynix", "skhynix");
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
    partNumber = removeKnownPackage(vendor, partNumber);
    mergePartPayload(vendors, vendor, partNumber, {
      c: record[1],
      ...(processNode ? { l: processNode } : {}),
      t: supported
    });
  }
}

function mergeChipsBank(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, data: string): void {
  const dataLines = lines(data);
  const controllers = (dataLines.shift() ?? "").split(",").map((item) => `CBM${item.trim()}`).filter((item) => item !== "CBM");
  addInfoController(info, controllers);
  for (const rawRecord of dataLines) {
    if (!rawRecord.trim()) {
      continue;
    }
    const record = rawRecord.split(",");
    record.shift();
    let vendor = (record[0] ?? "").toLowerCase().replace("hynix", "skhynix");
    let flashId = (record[4] ?? "").replace(/[\/\s]/g, "");
    if (flashId.length > 12) {
      flashId = flashId.slice(0, 12);
    }
    if (!vendorExists(vendors, vendor)) {
      continue;
    }
    const supported = record
      .slice(9)
      .map((value, index) => (value === "Y" ? controllers[index] : undefined))
      .filter((item): item is string => !!item);
    if (addControllersToMatchingFlashId(vendors, iddb, vendor, flashId, supported)) {
      continue;
    }
    let partNumber = (record[3] ?? "").replaceAll("(T)", "").replaceAll("(TOG)", "").replaceAll("(TOG", "");
    if (vendor === "spectek") {
      partNumber = removeSpectekPackage(partNumber);
    } else if (vendor === "micron") {
      partNumber = removeMicronPackage(partNumber);
      partNumber = partNumber.split("(")[0] ?? partNumber;
    } else if (vendor === "toshiba" || vendor === "intel") {
      partNumber = partNumber.split("(")[0] ?? partNumber;
    } else if (vendor === "mira" || vendor === "powerchip") {
      partNumber = "";
    } else if (vendor === "skhynix") {
      partNumber = removeSkhynixPackage(partNumber);
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
    addPartId(vendors, iddb, vendor, partNumber, flashId, supported);
    mergePartPayload(vendors, vendor, partNumber, {
      ...(record[7] ? { l: record[7] } : {}),
      c: (record[2] ?? "").split("-")[0],
      t: supported
    });
    mergeFlashPayload(iddb, flashId, { ...(pageSize > 0 ? { s: pageSize } : {}), t: supported });
  }
}

function mergeInnostor(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, data: string, filename: string): void {
  const controller = `IS${filename.split("_")[0] ?? filename}`;
  addInfoController(info, controller);
  const filtered = lines(data).filter((line) => !line.startsWith("//") && !line.startsWith("~")).join("\n");
  const parsed = parseIni(filtered);
  for (const flash of Object.values(parsed)) {
    if (!flash.Vendor) {
      continue;
    }
    const vendor = flash.Vendor.toLowerCase().replace("hynix", "skhynix").replace("psc", "powerchip");
    const flashId = flash.FlashID ?? "";
    addControllersToMatchingFlashId(vendors, iddb, vendor, flashId, [controller], {
      s: Math.round(Number.parseFloat(flash.PageSize ?? "0") / 1024),
      p: Number.parseInt(flash.Pagesperblock ?? "0", 10),
      b: Number.parseInt(flash.Blocks ?? "0", 10)
    });
  }
}

function mergePhisonSsd(vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload, data: string): void {
  const controllers = ["PS3111", "INIC6081"];
  addInfoController(info, controllers);
  const flashes = Array.isArray(JSON.parse(data)) ? (JSON.parse(data) as Array<Record<string, unknown>>) : [];
  for (const flash of flashes) {
    const vendor = String(flash.Vendor ?? "").toLowerCase().replace("hynix", "skhynix");
    const flashId = String(flash.FlashId ?? "").slice(0, 12);
    addControllersToMatchingFlashId(vendors, iddb, vendor, flashId, controllers);
  }
}

function loadRawInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap, info: FdbInfoPayload): boolean {
  const order = ["smff", "smufd", "smssd", "jm", "mk", "ma", "sf", "al", "cbm", "is", "ps"] as const;
  const hasRawDir = order.some((dir) => existsSync(resolve(inputDir, dir)));
  if (!hasRawDir) {
    return false;
  }
  for (const dir of order) {
    const dirPath = resolve(inputDir, dir);
    if (!existsSync(dirPath)) {
      continue;
    }
    for (const file of readdirSync(dirPath).filter((item) => item !== "." && item !== "..").sort()) {
      const data = readFileSync(resolve(dirPath, file), "utf8");
      if (dir === "smff") mergeSiliconMotionForceFlash(vendors, iddb, data);
      else if (dir === "smufd") mergeSiliconMotionUfd(vendors, iddb, info, data, file);
      else if (dir === "smssd") mergeSiliconMotionSsd(vendors, iddb, info, data, file);
      else if (dir === "jm") mergeJMicronLike(vendors, iddb, info, data, file, "JMF");
      else if (dir === "mk") mergeJMicronLike(vendors, iddb, info, data, file, "MK");
      else if (dir === "ma") mergeJMicronLike(vendors, iddb, info, data, file, "", !file.startsWith("map"), true);
      else if (dir === "sf") mergeSandForce(vendors, info, data);
      else if (dir === "al") mergeAlcorMicro(vendors, info, data);
      else if (dir === "cbm") mergeChipsBank(vendors, iddb, info, data);
      else if (dir === "is") mergeInnostor(vendors, iddb, info, data, file);
      else if (dir === "ps") mergePhisonSsd(vendors, iddb, info, data);
    }
  }
  return true;
}

function canonicalPartNumber(partNumber: string, records: PartNumberMap): string {
  const duplicateSuffix = /^(.*)_1$/.exec(partNumber);
  if (duplicateSuffix?.[1] && records.has(duplicateSuffix[1])) {
    return duplicateSuffix[1];
  }

  if (partNumber.endsWith("-")) {
    const withoutTrailingDash = partNumber.slice(0, -1);
    if (withoutTrailingDash && records.has(withoutTrailingDash)) {
      return withoutTrailingDash;
    }
  }

  return partNumber;
}

function canonicalizeVendorRecords(vendors: VendorMap): void {
  for (const records of vendors.values()) {
    for (const [partNumber, payload] of [...records.entries()]) {
      const canonical = canonicalPartNumber(partNumber, records);
      if (canonical === partNumber) {
        continue;
      }
      const existing = records.get(canonical);
      records.set(canonical, mergePartNumber(existing, payload));
      records.delete(partNumber);
    }
  }
}

function canonicalizePartReference(value: string, vendors: VendorMap): string | null {
  const normalized = normalizePartReference(value);
  if (!normalized) {
    return null;
  }
  const [vendor, partNumber] = normalized.split(" ", 2);
  if (!vendor || !partNumber) {
    return null;
  }
  const records = vendors.get(vendor);
  if (!records) {
    return null;
  }
  const canonical = records ? canonicalPartNumber(partNumber, records) : partNumber;
  if (!records.has(canonical)) {
    return null;
  }
  return `${vendor} ${canonical}`;
}

function canonicalizeIddbReferences(iddb: FlashIdMap, vendors: VendorMap): void {
  for (const [flashId, payload] of iddb.entries()) {
    const refs = (payload.n ?? []).map((item) => canonicalizePartReference(item, vendors)).filter((item): item is string => !!item);
    iddb.set(flashId, {
      ...payload,
      ...(refs.length > 0 ? { n: mergeStringArray([], refs, false) } : { n: undefined })
    });
  }
}

function readJsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => extname(file).toLowerCase() === ".json")
    .sort()
    .map((file) => resolve(dir, file));
}

function loadMeta(inputDir: string, metaFile?: string): FdbInfoPayload {
  const metaPath = metaFile ? resolve(metaFile) : resolve(inputDir, "meta.json");
  if (!existsSync(metaPath)) {
    return {};
  }
  const raw = asRecord(readJson(metaPath));
  if ("info" in raw) {
    return asRecord(raw.info) as FdbInfoPayload;
  }
  return raw as FdbInfoPayload;
}

function loadExtra(inputDir: string, extraFile?: string): ExtraPayload {
  const extraPath = extraFile ? resolve(extraFile) : resolve(inputDir, "extra.json");
  if (!existsSync(extraPath)) {
    return {};
  }
  return asRecord(readJson(extraPath)) as ExtraPayload;
}

function loadInputDirectory(inputDir: string, vendors: VendorMap, iddb: FlashIdMap): void {
  const fdbPath = resolve(inputDir, "fdb.json");
  if (existsSync(fdbPath)) {
    const source = asRecord(readJson(fdbPath));
    mergeIddbRecord(iddb, source.iddb);
    for (const [key, value] of Object.entries(source)) {
      if (key === "info" || key === "iddb") {
        continue;
      }
      mergeVendorRecord(vendors, key, value);
    }
  }

  const vendorsDir = resolve(inputDir, "vendors");
  if (existsSync(vendorsDir)) {
    for (const file of readJsonFiles(vendorsDir)) {
      const vendor = normalizeVendor(basename(file, ".json"));
      mergeVendorRecord(vendors, vendor, readJson(file));
    }
  }

  const iddbDir = resolve(inputDir, "iddb");
  if (existsSync(iddbDir)) {
    for (const file of readJsonFiles(iddbDir)) {
      mergeIddbRecord(iddb, readJson(file));
    }
  }

  const flashIdsDir = resolve(inputDir, "flashids");
  if (existsSync(flashIdsDir)) {
    for (const file of readJsonFiles(flashIdsDir)) {
      mergeIddbRecord(iddb, readJson(file));
    }
  }
}

function applyExtra(extra: ExtraPayload, vendors: VendorMap, iddb: FlashIdMap): void {
  const rawExtraVendors: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (key !== "info" && key !== "vendors" && key !== "iddb") {
      rawExtraVendors[key] = value;
    }
  }
  for (const [vendor, record] of Object.entries(rawExtraVendors)) {
    mergeVendorRecord(vendors, vendor, record);
  }

  if (extra.vendors) {
    for (const [vendor, record] of Object.entries(extra.vendors)) {
      mergeVendorRecord(vendors, vendor, record);
    }
  }
  if (extra.iddb) {
    mergeIddbRecord(iddb, extra.iddb);
  }
}

function sortObjectKeys<T>(input: Record<string, T>): Record<string, T> {
  const output: Record<string, T> = {};
  for (const key of Object.keys(input).sort()) {
    output[key] = input[key] as T;
  }
  return output;
}

function buildOutput(infoInput: FdbInfoPayload, vendors: VendorMap, iddb: FlashIdMap): Record<string, unknown> {
  const controllers = new Set<string>(toStringArray(infoInput.controllers, false));

  for (const [vendor, parts] of vendors.entries()) {
    for (const [partNumber, partInfo] of parts.entries()) {
      for (const controller of partInfo.t ?? []) {
        controllers.add(controller);
      }
      for (const id of partInfo.id ?? []) {
        const normalizedId = normalizeFlashId(id);
        if (!normalizedId) {
          continue;
        }
        const flash = iddb.get(normalizedId) ?? {};
        flash.n = mergeStringArray(flash.n, [`${vendor} ${partNumber}`], false);
        iddb.set(normalizedId, flash);
      }
    }
  }

  for (const flash of iddb.values()) {
    for (const controller of flash.t ?? []) {
      controllers.add(controller);
    }
  }

  const info = {
    name: infoInput.name ?? "iTXTech FlashDetector Flash Database",
    website: infoInput.website ?? "https://github.com/iTXTech/FlashDetector",
    version: infoInput.version ?? "Undefined",
    time: infoInput.time ?? new Date().toUTCString(),
    controllers: [...controllers].sort()
  };

  const outputIddb: Record<string, FlashIdPayload> = {};
  for (const [id, payload] of [...iddb.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    outputIddb[id] = {
      ...(payload.s !== undefined ? { s: payload.s } : {}),
      ...(payload.p !== undefined ? { p: payload.p } : {}),
      ...(payload.b !== undefined ? { b: payload.b } : {}),
      ...(payload.t && payload.t.length > 0 ? { t: [...new Set(payload.t)].sort() } : {}),
      ...(payload.n && payload.n.length > 0 ? { n: [...new Set(payload.n)].sort() } : {})
    };
  }

  const output: Record<string, unknown> = {
    info,
    iddb: outputIddb
  };

  for (const [vendor, records] of [...vendors.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const vendorOutput: Record<string, PartNumberPayload> = {};
    for (const [pn, payload] of [...records.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const normalized: PartNumberPayload = {
        ...(payload.id && payload.id.length > 0 ? { id: [...new Set(payload.id)].sort() } : {}),
        ...(payload.l !== undefined ? { l: payload.l } : {}),
        ...(payload.c !== undefined ? { c: payload.c } : {}),
        ...(payload.t && payload.t.length > 0 ? { t: [...new Set(payload.t)].sort() } : {}),
        ...(payload.m !== undefined ? { m: payload.m } : {}),
        ...(payload.d !== undefined ? { d: payload.d } : {}),
        ...(payload.e !== undefined ? { e: payload.e } : {}),
        ...(payload.r !== undefined ? { r: payload.r } : {}),
        ...(payload.n !== undefined ? { n: payload.n } : {})
      };
      vendorOutput[pn] = normalized;
    }
    output[vendor] = sortObjectKeys(vendorOutput);
  }

  return output;
}

export function generateFdb(options: GenerateFdbOptions): Record<string, unknown> {
  const inputDir = resolve(options.inputDir);
  if (!existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  const vendors: VendorMap = new Map();
  const iddb: FlashIdMap = new Map();
  const meta = loadMeta(inputDir, options.metaFile);
  const rawInfo: FdbInfoPayload = { ...meta };
  const usedRawInput = loadRawInputDirectory(inputDir, vendors, iddb, rawInfo);
  if (!usedRawInput) {
    loadInputDirectory(inputDir, vendors, iddb);
  }

  const extra = loadExtra(inputDir, options.extraFile);
  applyExtra(extra, vendors, iddb);
  canonicalizeVendorRecords(vendors);
  canonicalizeIddbReferences(iddb, vendors);

  const extraInfo = extra.info ?? {};
  const infoInput: FdbInfoPayload = {
    ...rawInfo,
    ...extraInfo,
    controllers: mergeStringArray(toStringArray(rawInfo.controllers, false), toStringArray(extraInfo.controllers, false), false),
    ...(options.name ? { name: options.name } : {}),
    ...(options.website ? { website: options.website } : {}),
    ...(options.version ? { version: options.version } : {}),
    ...(options.time ? { time: options.time } : {})
  };

  const output = buildOutput(infoInput, vendors, iddb);

  if (options.outputFile) {
    const outputFile = resolve(options.outputFile);
    mkdirSync(resolve(outputFile, ".."), { recursive: true });
    const formatted = (options.pretty ? JSON.stringify(output, null, 4) : JSON.stringify(output)).replace(/\//g, "\\/");
    writeFileSync(outputFile, `${formatted}\n`, "utf8");
  }

  return output;
}
