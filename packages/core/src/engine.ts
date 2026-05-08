import { LANGUAGES, UNKNOWN } from "./constants";
import { buildDefaultDecoders } from "./decoders";
import { buildFdb, buildMdb, findFlashIdRecord, findPartNumberAcrossVendors, getPartNumberRecord } from "./fdb";
import { createDefaultFlashIdProcessor } from "./flashid/postprocess";
import { inferVendorFromFlashId } from "./flashid/vendor";
import { applyMicronFbgaMeta, parseKnownMicronFbgaCode, parseMicronFbgaCode } from "./micron/fbga";
import { translateString as doTranslateString, translateValue } from "./translate";
import { normalizeFlashId, normalizePartNumber, padFlashId } from "./utils/normalize";
import { contains } from "./utils/string";
import type {
  DecodeOptions,
  EngineOptions,
  FlashDetectorEngine,
  FlashDetectorInfo,
  FlashIdDecoder,
  FlashIdInfo,
  FlashInfo,
  KnownPartNumberEntry,
  LangPacks,
  MicronDramFbgaEntry,
  PartNumberRecord,
  PartNumberDecoder,
  ProcessorEndpoint,
  ProcessorRequestContext,
  ProcessorHooks,
  SearchOptions
} from "./types";

function cloneObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getHumanReadableDensity(density: number, useByte = false): string {
  const unit = useByte ? ["MB", "GB", "TB"] : ["Mb", "Gb", "Tb"];
  let numeric = useByte ? density / 8 : density;
  let idx = 0;
  while (numeric >= 1024 && unit[idx + 1]) {
    numeric /= 1024;
    idx += 1;
  }
  return `${numeric}${unit[idx]}`;
}

const vendorAliases: Record<string, string[]> = {
  biwin: ["biwin"],
  intel: ["intel"],
  kingston: ["kingston"],
  kioxia: ["kioxia", "toshiba"],
  longsys: ["longsys", "foresee", "lexar"],
  micron: ["micron"],
  samsung: ["samsung"],
  sndk: ["sandisk", "western digital", "wd"],
  skhynix: ["sk hynix", "skhynix"],
  spectek: ["spectek"],
  ymtc: ["ymtc"]
};

function normalizeInfoText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .replaceAll(/\be\s+mmc\b/g, "emmc")
    .replaceAll(/\be\s+mcp\b/g, "emcp")
    .replaceAll(/\bu\s+mcp\b/g, "umcp")
    .replaceAll(/\bv(?=\d)/g, "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function aliasesForVendor(vendor: unknown): string[] {
  if (typeof vendor !== "string") {
    return [];
  }
  return vendorAliases[vendor] ?? [vendor];
}

function removeVendorPrefix(value: string, vendor: unknown): string {
  let normalized = normalizeInfoText(value);
  for (const alias of aliasesForVendor(vendor)) {
    const aliasText = normalizeInfoText(alias);
    if (aliasText.length > 0 && normalized.startsWith(`${aliasText} `)) {
      normalized = normalized.slice(aliasText.length + 1);
      break;
    }
  }
  return normalized;
}

function isRedundantSystem(value: unknown, info: FlashInfo): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  const type = normalizeInfoText(info.type);
  const aliases = aliasesForVendor(info.vendor).map((alias) => normalizeInfoText(alias)).filter((alias) => alias.length > 0);

  if (type.length > 0 && text === type) {
    return true;
  }
  if (aliases.includes(text)) {
    return true;
  }
  if (aliases.some((alias) => text === `${alias} managed nand`)) {
    return true;
  }
  if (type.length > 0 && aliases.some((alias) => text === `${alias} ${type}`)) {
    return true;
  }
  return false;
}

function isRedundantManagedFamily(value: unknown, info: FlashInfo, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  return (
    text === normalizeInfoText(info.type) ||
    text === normalizeInfoText(extra.system) ||
    text === normalizeInfoText(extra.product_family)
  );
}

function isRedundantGroup(value: unknown, info: FlashInfo): boolean {
  const text = normalizeInfoText(value);
  const type = normalizeInfoText(info.type);
  if (text.length === 0 || type.length === 0) {
    return false;
  }
  return text === type || text === `${type} flash`;
}

function matchesProcessNode(value: unknown, info: FlashInfo): boolean {
  const text = normalizeInfoText(value);
  const processNode = normalizeInfoText(info.processNode);
  return text.length > 0 && processNode.length > 0 && text === processNode;
}

function isRedundantNandTechnology(value: unknown, info: FlashInfo, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  if (matchesProcessNode(value, info) || text === normalizeInfoText(extra.generation_info)) {
    return true;
  }

  const processNode = normalizeInfoText(info.processNode);
  return text === "bics flash" && processNode.startsWith("bics");
}

function isManagedNandType(info: FlashInfo): boolean {
  return ["emmc", "ufs", "emcp", "umcp", "inand", "e2nand"].includes(normalizeInfoText(info.type));
}

function pruneRedundantExtraInfo(info: FlashInfo): void {
  const extra = info.extraInfo;
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return;
  }

  const productVersion = extra.product_version;
  const storageInterface = extra.storage_interface;
  const productFamily = extra.product_family;
  const managedNandType = isManagedNandType(info);

  if (isRedundantSystem(extra.system, info)) {
    delete extra.system;
  }
  if (isRedundantManagedFamily(extra.managed_family, info, extra)) {
    delete extra.managed_family;
  }
  if (isRedundantGroup(extra.group, info)) {
    delete extra.group;
  }
  if (managedNandType && matchesProcessNode(extra.generation_info, info)) {
    delete extra.generation_info;
  }
  if (managedNandType && isRedundantNandTechnology(extra.nand_technology, info, extra)) {
    delete extra.nand_technology;
  }

  const productVersionText = normalizeInfoText(productVersion);
  if (
    productVersionText.length > 0 &&
    (productVersionText === normalizeInfoText(storageInterface) || productVersionText === normalizeInfoText(info.type))
  ) {
    delete extra.product_version;
  }

  const productFamilyText = removeVendorPrefix(String(productFamily ?? ""), info.vendor);
  if (
    productFamilyText.length > 0 &&
    (productFamilyText === normalizeInfoText(productVersion) ||
      productFamilyText === normalizeInfoText(storageInterface) ||
      productFamilyText === normalizeInfoText(info.type))
  ) {
    delete extra.product_family;
  }

  if (managedNandType && normalizeInfoText(storageInterface) === normalizeInfoText(info.type)) {
    delete extra.storage_interface;
  }
}

function toPublicFlashInfo(info: FlashInfo, langPacks: LangPacks, fallbackLang: string, lang?: string | null): FlashInfo {
  const output = cloneObject(info);
  const defaultValues: Record<string, unknown> = {
    extraInfo: [],
    flashId: [],
    controller: [],
    url: [],
    urls: []
  };
  const requiredKeys = [
    "partNumber",
    "vendor",
    "type",
    "density",
    "deviceWidth",
    "processNode",
    "cellLevel",
    "classification",
    "voltage",
    "generation",
    "interface",
    "package",
    "extraInfo",
    "flashId",
    "controller",
    "remark",
    "url",
    "urls"
  ] as const;
  const outputRecord = output as Record<string, unknown>;
  for (const key of requiredKeys) {
    if (!(key in outputRecord)) {
      outputRecord[key] = key in defaultValues ? defaultValues[key] : null;
    }
  }
  const interfaceValue = output.interface;
  const classification = output.classification;
  if (classification && typeof classification === "object" && !Array.isArray(classification)) {
    const record = classification as Record<string, unknown>;
    for (const key of ["ce", "ch", "die", "rb"] as const) {
      if (!(key in record)) record[key] = -1;
    }
  }

  if (typeof output.density === "number" && output.density > 0) {
    output.rawDensity = output.density;
    output.density = getHumanReadableDensity(output.density);
  } else if (output.density == null || (typeof output.density === "number" && output.density <= 0)) {
    output.density = UNKNOWN;
  }

  if (output.deviceWidth === -1) {
    output.deviceWidth = UNKNOWN;
  } else if (typeof output.deviceWidth === "number") {
    output.deviceWidth = `x${output.deviceWidth}`;
  }

  if (typeof output.cellLevel === "number") {
    const cellLevelMap: Record<number, string> = {
      1: "SLC",
      2: "MLC",
      3: "TLC",
      4: "QLC"
    };
    output.cellLevel = cellLevelMap[output.cellLevel] ?? output.cellLevel;
  }

  if (typeof output.generation === "number") {
    output.generation = String(output.generation);
  }

  pruneRedundantExtraInfo(output);

  // PHP json_encode(empty associative array) yields [], not {}.
  if (output.extraInfo && typeof output.extraInfo === "object" && !Array.isArray(output.extraInfo)) {
    if (Object.keys(output.extraInfo).length === 0) output.extraInfo = [];
  }
  if (output.url && typeof output.url === "object" && !Array.isArray(output.url)) {
    if (Object.keys(output.url).length === 0) output.url = [];
  }

  for (const [key, value] of Object.entries(output)) {
    if (value == null) {
      output[key] = UNKNOWN;
    }
  }

  const translated = translateValue(langPacks, fallbackLang, output, lang, true) as FlashInfo;
  translated.controller = Array.isArray(output.controller) ? output.controller : [];
  translated.interface = interfaceValue;
  translated.rawVendor = info.vendor;
  return translated;
}

function toPublicFlashIdInfo(info: FlashIdInfo, langPacks: LangPacks, fallbackLang: string, lang?: string | null): FlashIdInfo {
  const output = cloneObject(info);
  const defaultValues: Record<string, unknown> = {
    ext: {},
    controllers: [],
    partNumbers: [],
    url: [],
    urls: []
  };
  const requiredKeys = [
    "id",
    "vendor",
    "density",
    "die",
    "plane",
    "pageSize",
    "blockSize",
    "processNode",
    "cellLevel",
    "voltage",
    "ext",
    "controllers",
    "partNumbers",
    "url",
    "urls"
  ] as const;
  const outputRecord = output as Record<string, unknown>;
  for (const key of requiredKeys) {
    if (!(key in outputRecord)) {
      outputRecord[key] = key in defaultValues ? defaultValues[key] : null;
    }
  }

  for (const [key, value] of Object.entries(output)) {
    if (value == null) {
      output[key] = UNKNOWN;
    }
  }

  // PHP json_encode(empty associative array) yields [], not {}.
  if (output.ext && typeof output.ext === "object" && !Array.isArray(output.ext)) {
    if (Object.keys(output.ext).length === 0) output.ext = [];
  }

  const translated = translateValue(langPacks, fallbackLang, output, lang, false) as FlashIdInfo;
  const cellLevelMap: Record<number, string> = {
    1: "SLC",
    2: "MLC",
    3: "TLC",
    4: "QLC"
  };
  if (typeof translated.cellLevel === "number") {
    translated.cellLevel = cellLevelMap[translated.cellLevel] ?? translated.cellLevel;
  }
  if (Array.isArray(translated.partNumbers)) {
    translated.partNumbers = translated.partNumbers.map((item) => {
      if (typeof item !== "string") {
        return String(item);
      }
      const [vendor, ...rest] = item.split(" ");
      if (!vendor || rest.length === 0) {
        return item;
      }
      return `${doTranslateString(langPacks, fallbackLang, vendor, lang)} ${rest.join(" ")}`;
    });
  }
  if (translated.ext && typeof translated.ext === "object" && !Array.isArray(translated.ext)) {
    const mappedExt: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(translated.ext)) {
      mappedExt[doTranslateString(langPacks, fallbackLang, key, lang)] = value;
    }
    translated.ext = mappedExt;
  }
  translated.rawVendor = info.vendor;
  return translated;
}

function inferSingleVendorFromPartReferences(refs: string[] | undefined): string | undefined {
  const vendors = new Set<string>();
  for (const ref of refs ?? []) {
    const match = /^(\S+)\s+/.exec(ref);
    if (match?.[1] && match[1] !== UNKNOWN) {
      vendors.add(match[1]);
    }
  }
  return vendors.size === 1 ? [...vendors][0] : undefined;
}

function mergeStringArray(target: string[] | undefined, source: string[] | undefined): string[] {
  const merged = new Set<string>();
  for (const item of [...(target ?? []), ...(source ?? [])]) {
    const text = String(item).trim();
    if (text) {
      merged.add(text);
    }
  }
  return [...merged];
}

function buildKnownPartNumbers(raw: Record<string, unknown>): KnownPartNumberEntry[] {
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const entries: KnownPartNumberEntry[] = [];
  const seen = new Set<string>();

  for (const item of rawEntries) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const pn = typeof record.pn === "string" ? normalizePartNumber(record.pn) : "";
    const vendor = typeof record.vendor === "string" ? record.vendor.trim() : "";
    const type = typeof record.type === "string" ? record.type.trim() : "";
    const standard = typeof record.standard === "string" ? record.standard.trim() : "";
    if (!pn || !vendor) {
      continue;
    }

    const key = `${vendor}\0${pn}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push({
      pn,
      vendor,
      ...(type ? { type } : {}),
      ...(standard ? { standard } : {})
    });
  }

  return entries;
}

function buildMicronDramFbgaCodes(raw: Record<string, unknown>): Map<string, string[]> {
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const entries = new Map<string, string[]>();
  const seen = new Set<string>();

  for (const item of rawEntries) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Partial<MicronDramFbgaEntry>;
    const code = typeof record.code === "string" ? record.code.toUpperCase().replace(/[^0-9A-Z]/g, "") : "";
    const pn = typeof record.pn === "string" ? normalizePartNumber(record.pn) : "";
    if (code.length !== 5 || !pn) {
      continue;
    }

    const key = `${code}\0${pn}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const partNumbers = entries.get(code);
    if (partNumbers) {
      partNumbers.push(pn);
    } else {
      entries.set(code, [pn]);
    }
  }

  return entries;
}

export function createEngine(options: EngineOptions = {}): FlashDetectorEngine {
  const fallbackLang = options.fallbackLang && LANGUAGES.includes(options.fallbackLang as (typeof LANGUAGES)[number])
    ? options.fallbackLang
    : LANGUAGES[0];

  const rawFdb = (options.resources?.fdbRaw ?? {}) as Record<string, unknown>;
  const rawMdb = (options.resources?.mdbRaw ?? {}) as Record<string, unknown>;
  const rawManagedNandPn = (options.resources?.managedNandPnRaw ?? {}) as Record<string, unknown>;
  const rawDramPn = (options.resources?.dramPnRaw ?? {}) as Record<string, unknown>;
  const rawMicronDramFbga = (options.resources?.micronDramFbgaRaw ?? {}) as Record<string, unknown>;
  const langRaw = (options.resources?.langRaw ?? {}) as LangPacks;

  const fdb = buildFdb(rawFdb);
  const mdb = buildMdb(rawMdb);
  const managedNandPartNumbers = buildKnownPartNumbers(rawManagedNandPn);
  const dramPartNumbers = buildKnownPartNumbers(rawDramPn);
  const micronDramFbgaCodes = buildMicronDramFbgaCodes(rawMicronDramFbga);
  const micronDramFbgaCodeSet = new Set(micronDramFbgaCodes.keys());
  const langPacks: LangPacks = {
    [fallbackLang]: {},
    ...langRaw
  };

  const processors: ProcessorHooks[] = [...(options.processors ?? [])];
  const decoders: PartNumberDecoder[] = [...buildDefaultDecoders(), ...(options.decoders ?? [])].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  const flashIdDecoders: FlashIdDecoder[] = [...(options.flashIdDecoders ?? [])].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  let cachedInfo: FlashDetectorInfo | null = null;

  const translateString = (key: string, lang?: string | null) => doTranslateString(langPacks, fallbackLang, key, lang);

  // Default processors should run before user-injected ones.
  processors.unshift(createDefaultFlashIdProcessor());

  const applyFlashIdProcessors = (info: FlashIdInfo): FlashIdInfo => {
    let next = info;
    for (const processor of processors) {
      if (processor.flashIdInfo) {
        next = processor.flashIdInfo(next);
      }
    }
    return next;
  };

  const decodeFlashIdRaw = (id: string): FlashIdInfo => {
    const normalized = normalizeFlashId(id);
    const padded = padFlashId(normalized);
    let info: FlashIdInfo | null = null;

    for (const decoder of flashIdDecoders) {
      if (decoder.check(padded)) {
        const decoded = decoder.decode(padded);
        if (decoded) {
          info = {
            id: padded,
            vendor: UNKNOWN,
            ...decoded
          };
          break;
        }
      }
    }

    if (!info) {
      info = {
        id: padded,
        vendor: inferVendorFromFlashId(padded)
      };
    }

    const flashIdRecord = findFlashIdRecord(fdb, padded);
    if (flashIdRecord) {
      info.controllers = flashIdRecord.t ?? [];
      info.partNumbers = flashIdRecord.n ?? [];
      const fdbVendor = inferSingleVendorFromPartReferences(flashIdRecord.n);
      if (fdbVendor && info.vendor !== fdbVendor) {
        info.vendor = fdbVendor;
      }
    }

    return applyFlashIdProcessors(info);
  };

  const processNodeFromFlashIds = (ids: string[] | undefined): string | undefined => {
    const nodes = new Set<string>();
    for (const id of ids ?? []) {
      const decoded = decodeFlashIdRaw(id);
      const processNode = typeof decoded.processNode === "string" ? decoded.processNode.trim() : "";
      if (processNode && processNode !== UNKNOWN) {
        nodes.add(processNode);
      }
    }
    return nodes.size > 0 ? [...nodes].join(" / ") : undefined;
  };

  const matchingFdbRecords = (partNumbers: string[]): Array<{ vendor: string; record: PartNumberRecord }> => {
    const result: Array<{ vendor: string; record: PartNumberRecord }> = [];
    const seen = new Set<string>();
    for (const rawPartNumber of partNumbers) {
      for (const vendor of fdb.vendors.keys()) {
        const record = getPartNumberRecord(fdb, vendor, rawPartNumber);
        if (!record) {
          continue;
        }
        const key = `${vendor}\0${record.pn}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push({ vendor, record });
      }
    }
    return result;
  };

  const combineFromFdb = (info: FlashInfo, lookupPartNumber = info.partNumber): FlashInfo => {
    const lookupPartNumbers = [...new Set([info.partNumber, lookupPartNumber].map((item) => normalizePartNumber(item)).filter(Boolean))];
    const allMatches = matchingFdbRecords(lookupPartNumbers);
    const allControllers = allMatches.flatMap(({ record }) => record.t ?? []);
    if (allControllers.length > 0) {
      info.controller = mergeStringArray(info.controller, allControllers);
    }

    // PHP uses `self::` in Micron::getFlashInfoFromFdb(), so SpecTek (which inherits it) looks up Micron FDB entries
    // instead of SpecTek ones. This means SpecTek part numbers generally do not get FDB-combined fields in PHP.
    if (info.vendor === "spectek") {
      return info;
    }

    let byVendor: PartNumberRecord | undefined;
    for (const partNumber of lookupPartNumbers) {
      byVendor = getPartNumberRecord(fdb, info.vendor, partNumber);
      if (byVendor) {
        break;
      }
    }

    let byAny: { vendor: string; record: PartNumberRecord } | undefined;
    if (!byVendor) {
      for (const partNumber of lookupPartNumbers) {
        byAny = findPartNumberAcrossVendors(fdb, partNumber);
        if (byAny) {
          break;
        }
      }
    }
    const record = byVendor ?? byAny?.record;

    if (!record) {
      return info;
    }

    if (byAny?.vendor && info.vendor === UNKNOWN) {
      info.vendor = byAny.vendor;
    }

    info.flashId = record.id ?? [];
    info.controller = mergeStringArray(info.controller, record.t ?? []);

    if ((info.processNode == null || info.processNode === UNKNOWN) && record.l) {
      info.processNode = record.l;
    }

    if (info.processNode == null || info.processNode === UNKNOWN) {
      const processNode = processNodeFromFlashIds(record.id);
      if (processNode) {
        info.processNode = processNode;
      }
    }

    if (info.cellLevel == null && record.c) {
      info.cellLevel = record.c;
    }

    info.remark = record.m ?? "";

    if (info.vendor === "sndk" && typeof info.remark === "string" && info.remark.length > 0) {
      // Legacy SanDisk records encode special flags inside the remark string (e.g. "CODE/Txxxx/...").
      // It then moves those flags into extraInfo and cleans up the remark.
      const parts = info.remark.split("/");
      const remarkParts: string[] = [];
      const extraInfo =
        info.extraInfo && typeof info.extraInfo === "object" && !Array.isArray(info.extraInfo) ? (info.extraInfo as Record<string, unknown>) : {};
      for (const part of parts) {
        if (!part) continue;
        if (part === "CODE") {
          extraInfo.sandisk_code = true;
          continue;
        }
        if (/^T[0-9A-Z]{4}$/.test(part)) {
          extraInfo.kioxia = part.slice(1);
          continue;
        }
        remarkParts.push(part);
      }
      info.extraInfo = extraInfo;
      info.remark = remarkParts.join("/");
    }

    const classification = (info.classification && typeof info.classification === "object" ? info.classification : null) ?? {
      die: -1,
      ce: -1,
      rb: -1,
      ch: -1
    };
    for (const key of ["die", "ce", "rb", "ch"] as const) {
      if (!(key in (classification as Record<string, unknown>))) {
        (classification as Record<string, unknown>)[key] = -1;
      }
    }
    if (record.d != null && record.d !== -1) {
      classification.die = record.d;
    }
    if (record.e != null && record.e !== -1) {
      classification.ce = record.e;
    }
    if (record.r != null && record.r !== -1) {
      classification.rb = record.r;
    }
    if (record.n != null && record.n !== -1) {
      classification.ch = record.n;
    }
    info.classification = classification;

    return info;
  };

  const applyFlashInfoProcessors = (info: FlashInfo): FlashInfo => {
    let next = info;
    for (const processor of processors) {
      if (processor.flashInfo) {
        next = processor.flashInfo(next);
      }
    }
    return next;
  };

  const detectRaw = (partNumber: string, opts: DecodeOptions, allowMicronFbga: boolean): FlashInfo => {
    if (allowMicronFbga) {
      const fbga = parseMicronFbgaCode(partNumber);
      if (fbga) {
        const micronHit = mdb.micron[fbga.key];
        const spectekHit = mdb.spectek[fbga.key];
        const candidates = micronHit ? [micronHit] : spectekHit ? [...spectekHit] : [];
        const resolved = candidates[0];
        if (resolved) {
          const base = detectRaw(resolved, opts, false);
          const withMeta = applyMicronFbgaMeta(base, fbga, resolved);
          if (opts.combineFdb ?? true) {
            combineFromFdb(withMeta, partNumber);
          }
          return withMeta;
        }
      }

      const knownDramFbga = parseKnownMicronFbgaCode(partNumber, micronDramFbgaCodeSet);
      if (knownDramFbga) {
        const candidates = micronDramFbgaCodes.get(knownDramFbga.key) ?? [];
        for (const resolved of candidates) {
          const base = detectRaw(resolved, opts, false);
          if (base.vendor === UNKNOWN && base.rawVendor == null) {
            continue;
          }

          const withMeta = applyMicronFbgaMeta(base, knownDramFbga, resolved);
          if (opts.combineFdb ?? true) {
            combineFromFdb(withMeta, partNumber);
          }
          return withMeta;
        }

        return { partNumber: knownDramFbga.display, vendor: UNKNOWN };
      }

      if (fbga) {
        return { partNumber: fbga.display, vendor: UNKNOWN };
      }
    }

    let info: FlashInfo | null = null;

    for (const decoder of decoders) {
      if (decoder.check(partNumber)) {
        const decoded = decoder.decode(partNumber);
        if (decoded) {
          info = {
            partNumber,
            vendor: UNKNOWN,
            ...decoded
          };
          break;
        }
      }
    }

    if (!info) {
      const found = findPartNumberAcrossVendors(fdb, partNumber);
      info = {
        partNumber,
        vendor: found?.vendor ?? UNKNOWN
      };
    }

    if (opts.combineFdb ?? true) {
      combineFromFdb(info, partNumber);
    }

    return applyFlashInfoProcessors(info);
  };

  const detectPublic = (partNumber: string, opts: DecodeOptions, allowMicronFbga: boolean): FlashInfo => {
    const processed = detectRaw(partNumber, opts, allowMicronFbga);
    return toPublicFlashInfo(processed, langPacks, fallbackLang, opts.lang);
  };

  const getVersion = (): string => String(fdb.info.version);

  const getInfo = (): FlashDetectorInfo => {
    if (cachedInfo) {
      return cachedInfo;
    }

    let flashCnt = 0;
    for (const vendorMap of fdb.vendors.values()) {
      flashCnt += vendorMap.size;
    }

    let mdbCnt = 0;
    mdbCnt += Object.keys(mdb.micron).length;
    for (const values of Object.values(mdb.spectek)) {
      mdbCnt += values.length;
    }

    cachedInfo = {
      fdb: fdb.info,
      flash_cnt: flashCnt,
      id_cnt: fdb.flashIds.size,
      mdb_cnt: mdbCnt
    };

    return cachedInfo;
  };

  const detect = (partNumber: string, opts: DecodeOptions = {}): FlashInfo => {
    const normalized = normalizePartNumber(partNumber);
    return detectPublic(normalized, opts, true);
  };

  const decodeFlashId = (id: string, opts: DecodeOptions = {}): FlashIdInfo => {
    const processed = decodeFlashIdRaw(id);
    return toPublicFlashIdInfo(processed, langPacks, fallbackLang, opts.lang);
  };

  const searchPartNumber = (pn: string, opts: SearchOptions = {}): string[] => {
    const query = normalizePartNumber(pn);
    const partMatch = opts.partialMatch ?? true;
    const limit = opts.limit ?? 0;
    const result: string[] = [];
    const seenPartNumbers = new Set<string>();
    const seenFbgaSuggestions = new Set<string>();

    const atLimit = (): boolean => limit > 0 && result.length >= limit;
    const appendPartNumberSuggestion = (vendor: string, partNumber: string): void => {
      if (atLimit()) {
        return;
      }
      const normalizedPartNumber = normalizePartNumber(partNumber);
      if (!normalizedPartNumber) {
        return;
      }
      const key = `${vendor}\0${normalizedPartNumber}`;
      if (seenPartNumbers.has(key)) {
        return;
      }
      seenPartNumbers.add(key);
      result.push(`${translateString(vendor, opts.lang)} ${normalizedPartNumber}`);
    };
    const appendMicronFbgaSuggestion = (code: string, partNumber: string): void => {
      if (atLimit()) {
        return;
      }
      const normalizedPartNumber = normalizePartNumber(partNumber);
      const key = `${code}\0${normalizedPartNumber}`;
      if (!normalizedPartNumber || seenFbgaSuggestions.has(key)) {
        return;
      }
      seenFbgaSuggestions.add(key);
      result.push(`${translateString("micron", opts.lang)} ${code} ${normalizedPartNumber}`);
    };

    for (const entry of managedNandPartNumbers) {
      if (atLimit()) {
        return result;
      }
      const hit = partMatch ? contains(entry.pn, query) : entry.pn === query;
      if (hit) {
        appendPartNumberSuggestion(entry.vendor, entry.pn);
      }
    }

    for (const entry of dramPartNumbers) {
      if (atLimit()) {
        return result;
      }
      const hit = partMatch ? contains(entry.pn, query) : entry.pn === query;
      if (hit) {
        appendPartNumberSuggestion(entry.vendor, entry.pn);
      }
    }

    for (const [code, partNumbers] of micronDramFbgaCodes.entries()) {
      if (atLimit()) {
        return result;
      }
      const codeHit = contains(code, query);
      if (codeHit && (mdb.micron[code] || mdb.spectek[code])) {
        continue;
      }
      for (const partNumber of partNumbers) {
        if (atLimit()) {
          return result;
        }
        if (codeHit || contains(partNumber, query)) {
          appendMicronFbgaSuggestion(code, partNumber);
        }
      }
    }

    for (const [vendor, partNumbers] of fdb.vendors.entries()) {
      for (const partNumber of partNumbers.keys()) {
        if (atLimit()) {
          return result;
        }
        const hit = partMatch ? contains(partNumber, query) : partNumber === query;
        if (hit) {
          appendPartNumberSuggestion(vendor, partNumber);
        }
      }
    }

    for (const [code, partNumber] of Object.entries(mdb.micron)) {
      if (atLimit()) {
        break;
      }
      if (contains(partNumber, query)) {
        result.push(`${translateString("micron", opts.lang)} ${code} ${partNumber}`);
      }
    }

    for (const [code, partNumbers] of Object.entries(mdb.spectek)) {
      if (atLimit()) {
        break;
      }
      for (const partNumber of partNumbers) {
        if (atLimit()) {
          break;
        }
        if (contains(partNumber, query)) {
          result.push(`${translateString("spectek", opts.lang)} ${code} ${partNumber}`);
        }
      }
    }

    return result;
  };

  const searchFlashId = (id: string, opts: SearchOptions = {}): Record<string, unknown> | import("./types").FlashIdRecord | [] => {
    const query = normalizeFlashId(id);
    const partMatch = opts.partialMatch ?? true;
    const limit = opts.limit ?? 0;

    if (!partMatch) {
      const exact = findFlashIdRecord(fdb, query);
      return exact ?? [];
    }

    const result: Record<string, unknown> = {};
    let resultCount = 0;

    for (const [flashId, record] of fdb.flashIds.entries()) {
      if (limit > 0 && resultCount >= limit) {
        break;
      }
      if (!contains(flashId, query)) {
        continue;
      }

      let pageSize: string | number | undefined = record.s;
      if (pageSize != null && pageSize !== -1) {
        pageSize = pageSize < 1 ? `${pageSize * 1024}B` : `${pageSize}K`;
      }

      const data = {
        partNumbers: record.n ?? [],
        pageSize,
        pages_per_block: record.p,
        blocks: record.b,
        controllers: record.t ?? []
      };

      result[flashId] = translateValue(langPacks, fallbackLang, data, opts.lang, false);
      resultCount += 1;
    }

    return result;
  };

  const searchMicronFbgaCode = (code: string): string[] => {
    const knownDramFbga = parseKnownMicronFbgaCode(code, micronDramFbgaCodeSet);
    const parsed = knownDramFbga ?? parseMicronFbgaCode(code);
    const target = parsed?.key ?? code.toUpperCase();
    const result: string[] = [];
    const seen = new Set<string>();
    const append = (partNumber: string): void => {
      const normalized = normalizePartNumber(partNumber);
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      result.push(normalized);
    };

    if (mdb.micron[target]) {
      append(mdb.micron[target]);
    }
    if (mdb.spectek[target]) {
      for (const partNumber of mdb.spectek[target]) {
        append(partNumber);
      }
    }
    if (result.length > 0) {
      return result;
    }
    for (const partNumber of micronDramFbgaCodes.get(target) ?? []) {
      append(partNumber);
    }
    return result;
  };

  const getSummary = (partNumber: string, lang?: string | null): string => {
    const info = detect(partNumber, { lang, combineFdb: true });
    const base = translateString("summary", lang);
    const unknown = translateString(UNKNOWN, lang);

    const interfaceValue = typeof info.interface === "object" && info.interface ? info.interface : undefined;
    let sync = unknown;
    let async = unknown;
    if (interfaceValue && "toggle" in interfaceValue) {
      async = String(translateValue(langPacks, fallbackLang, true, lang));
      sync = String(translateValue(langPacks, fallbackLang, interfaceValue.toggle, lang));
    } else if (interfaceValue) {
      async = String(translateValue(langPacks, fallbackLang, interfaceValue.async, lang));
      sync = String(translateValue(langPacks, fallbackLang, interfaceValue.sync, lang));
    }

    const extraInfo =
      info.extraInfo && typeof info.extraInfo === "object"
        ? Object.entries(info.extraInfo)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(", ")
        : "";

    const replacements = [
      info.partNumber,
      info.vendor,
      info.type,
      info.density,
      info.deviceWidth,
      info.cellLevel,
      info.processNode,
      info.generation,
      sync,
      async,
      (info.classification as Record<string, unknown> | undefined)?.ce ?? unknown,
      (info.classification as Record<string, unknown> | undefined)?.ch ?? unknown,
      (info.classification as Record<string, unknown> | undefined)?.die ?? unknown,
      (info.classification as Record<string, unknown> | undefined)?.rb ?? unknown,
      info.voltage,
      info.package,
      Array.isArray(info.controller) ? info.controller.join(", ") : "",
      info.remark,
      extraInfo,
      Array.isArray(info.flashId) ? info.flashId.join(", ") : ""
    ];

    let result = base;
    for (let i = 0; i < replacements.length; i += 1) {
      result = result.replaceAll(`{${i}}`, String(replacements[i] ?? unknown));
    }
    return result;
  };

  const getIdSummary = (id: string, lang?: string | null): string => {
    const info = decodeFlashId(id, { lang, combineFdb: true });
    const base = translateString("id_summary", lang);

    const extInfo =
      info.ext && typeof info.ext === "object"
        ? Object.entries(info.ext)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(", ")
        : "";

    const density = typeof info.density === "number" ? getHumanReadableDensity(info.density) : info.density;

    const replacements = [
      info.id,
      info.vendor,
      info.cellLevel,
      density,
      info.processNode,
      info.die,
      info.plane,
      info.voltage,
      info.pageSize,
      info.blockSize,
      Array.isArray(info.controllers) ? info.controllers.join(", ") : "",
      extInfo,
      Array.isArray(info.partNumbers) ? info.partNumbers.join(", ") : ""
    ];

    let result = base;
    for (let i = 0; i < replacements.length; i += 1) {
      result = result.replaceAll(`{${i}}`, String(replacements[i] ?? UNKNOWN));
    }
    return result;
  };

  const getVendor = (partNumber: string): string => {
    const normalized = normalizePartNumber(partNumber);
    for (const decoder of decoders) {
      if (decoder.check(normalized)) {
        const decoded = decoder.decode(normalized);
        if (decoded && typeof decoded.vendor === "string" && decoded.vendor.length > 0) {
          return decoded.vendor;
        }
      }
    }
    return findPartNumberAcrossVendors(fdb, normalized)?.vendor ?? UNKNOWN;
  };

  const translate = (value: unknown, lang?: string | null): unknown => {
    return translateValue(langPacks, fallbackLang, value, lang, true);
  };

  const translateArray = (value: Record<string, unknown>, translateKey: boolean, lang?: string | null): Record<string, unknown> => {
    const translated = translateValue(langPacks, fallbackLang, value, lang, translateKey);
    if (translated && typeof translated === "object" && !Array.isArray(translated)) {
      return translated as Record<string, unknown>;
    }
    return {};
  };

  const dispatch = (
    endpoint: ProcessorEndpoint,
    context: Partial<Omit<ProcessorRequestContext, "endpoint">> = {}
  ): Record<string, unknown> => {
    const limitValue = context.limit;
    const requestContext: ProcessorRequestContext = {
      endpoint,
      query: context.query ?? "",
      remote: context.remote ?? "",
      userAgent: context.userAgent ?? "",
      serverName: context.serverName,
      lang: context.lang ?? null,
      pn: context.pn ?? null,
      id: context.id ?? null,
      limit: Number.isFinite(limitValue) ? Number(limitValue) : 0
    };

    const payload = (() => {
      switch (requestContext.endpoint) {
        case "index":
          return {
            result: true,
            time: Math.floor(Date.now() / 1000),
            server: requestContext.serverName ?? "FDWebServer-TS"
          };
        case "info":
          return { result: true, ver: getVersion(), info: getInfo() };
        case "decode":
          return requestContext.pn
            ? { result: true, data: detect(requestContext.pn, { lang: requestContext.lang, combineFdb: true }) }
            : { result: false, message: "Missing part number" };
        case "decodeId":
          return requestContext.id
            ? { result: true, data: decodeFlashId(requestContext.id, { lang: requestContext.lang, combineFdb: true }) }
            : { result: false, message: "Missing Flash Id" };
        case "searchPn":
          return requestContext.pn
            ? {
                result: true,
                data: searchPartNumber(requestContext.pn, {
                  lang: requestContext.lang,
                  partialMatch: true,
                  limit: requestContext.limit ?? 0
                })
              }
            : { result: false, message: "Missing part number" };
        case "searchId":
          return requestContext.id
            ? {
                result: true,
                data: searchFlashId(requestContext.id, {
                  lang: requestContext.lang,
                  partialMatch: true,
                  limit: requestContext.limit ?? 0
                })
              }
            : { result: false, message: "Missing Flash Id" };
        case "summary":
          return requestContext.pn
            ? { result: true, data: getSummary(requestContext.pn, requestContext.lang) }
            : { result: false, message: "Missing part number" };
        case "summaryId":
          return requestContext.id
            ? { result: true, data: getIdSummary(requestContext.id, requestContext.lang) }
            : { result: false, message: "Missing flash Id" };
      }
    })();

    for (const processor of processors) {
      const handler = processor[endpoint];
      if (typeof handler === "function") {
        const shouldContinue = handler(requestContext, payload);
        if (shouldContinue === false) {
          break;
        }
      }
    }

    return payload;
  };

  return {
    getVersion,
    getInfo,
    getVendor,
    getFdb: () => fdb,
    getMdb: () => mdb,
    getLang: () => langPacks,
    getProcessors: () => processors,
    detect,
    decodeFlashId,
    searchPartNumber,
    searchFlashId,
    searchMicronFbgaCode,
    getSummary,
    getIdSummary,
    translateString,
    translate,
    translateArray,
    getHumanReadableDensity,
    dispatch,
    registerDecoder(decoder: PartNumberDecoder): void {
      decoders.push(decoder);
      decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },
    registerFlashIdDecoder(decoder: FlashIdDecoder): void {
      flashIdDecoders.push(decoder);
      flashIdDecoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },
    registerProcessor(processor: ProcessorHooks): void {
      processors.push(processor);
    }
  };
}
