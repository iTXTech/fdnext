import { LANGUAGES, UNKNOWN } from "./constants.js";
import { buildDefaultDecoders } from "./decoders.js";
import { buildFdb, buildMdb, findFlashIdRecord, findPartNumberAcrossVendors, getPartNumberRecord } from "./fdb.js";
import { buildDefaultFlashIdDecoders } from "./flash-id-decoders.js";
import { translateString as doTranslateString, translateValue } from "./translate.js";
import { normalizeFlashId, normalizePartNumber, padFlashId } from "./utils/normalize.js";
import { contains } from "./utils/string.js";
import type {
  DecodeOptions,
  EngineOptions,
  FlashDetectorEngine,
  FlashDetectorInfo,
  FlashIdDecoder,
  FlashIdInfo,
  FlashInfo,
  LangPacks,
  PartNumberDecoder,
  ProcessorHooks,
  SearchOptions
} from "./types.js";

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

function toPublicFlashInfo(info: FlashInfo, langPacks: LangPacks, fallbackLang: string, lang?: string | null): FlashInfo {
  const output = cloneObject(info);
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
      outputRecord[key] = null;
    }
  }
  const interfaceValue = output.interface;

  if (typeof output.density === "number" && output.density > 0) {
    output.rawDensity = output.density;
    output.density = getHumanReadableDensity(output.density);
  } else if (output.density == null) {
    output.density = UNKNOWN;
  }

  if (output.deviceWidth === -1) {
    output.deviceWidth = UNKNOWN;
  } else if (typeof output.deviceWidth === "number") {
    output.deviceWidth = `x${output.deviceWidth}`;
  }

  for (const [key, value] of Object.entries(output)) {
    if (value == null) {
      output[key] = UNKNOWN;
    }
  }

  const translated = translateValue(langPacks, fallbackLang, output, lang, true) as FlashInfo;
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

export function createEngine(options: EngineOptions = {}): FlashDetectorEngine {
  const fallbackLang = options.fallbackLang && LANGUAGES.includes(options.fallbackLang as (typeof LANGUAGES)[number])
    ? options.fallbackLang
    : LANGUAGES[0];

  const rawFdb = (options.resources?.fdbRaw ?? {}) as Record<string, unknown>;
  const rawMdb = (options.resources?.mdbRaw ?? {}) as Record<string, unknown>;
  const langRaw = (options.resources?.langRaw ?? {}) as LangPacks;

  const fdb = buildFdb(rawFdb);
  const mdb = buildMdb(rawMdb);
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
  const defaultFlashIdDecoders = buildDefaultFlashIdDecoders();
  flashIdDecoders.unshift(...defaultFlashIdDecoders);
  flashIdDecoders.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  let cachedInfo: FlashDetectorInfo | null = null;

  const translateString = (key: string, lang?: string | null) => doTranslateString(langPacks, fallbackLang, key, lang);

  const inferVendorFromId = (id: string): string => {
    const vendorCode = id.slice(0, 2);
    switch (vendorCode) {
      case "2C":
        return "micron";
      case "EC":
        return "samsung";
      case "AD":
        return "hynix";
      case "98":
        return "kioxia";
      case "89":
        return "intel";
      case "45":
      case "EF":
        return "westerndigital";
      default:
        return UNKNOWN;
    }
  };

  const combineFromFdb = (info: FlashInfo): FlashInfo => {
    const byVendor = getPartNumberRecord(fdb, info.vendor, info.partNumber);
    const byAny = byVendor ? undefined : findPartNumberAcrossVendors(fdb, info.partNumber);
    const record = byVendor ?? byAny?.record;

    if (!record) {
      return info;
    }

    if (byAny?.vendor && info.vendor === UNKNOWN) {
      info.vendor = byAny.vendor;
    }

    info.flashId = record.id ?? [];
    info.controller = record.t ?? [];

    if ((info.processNode == null || info.processNode === UNKNOWN) && record.l) {
      info.processNode = record.l;
    }

    if (info.cellLevel == null && record.c) {
      info.cellLevel = record.c;
    }

    if (record.m) {
      info.remark = record.m;
    }

    const classification = info.classification ?? {};
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

  const applyFlashIdProcessors = (info: FlashIdInfo): FlashIdInfo => {
    let next = info;
    for (const processor of processors) {
      if (processor.flashIdInfo) {
        next = processor.flashIdInfo(next);
      }
    }
    return next;
  };

  return {
    getVersion(): string {
      return String(fdb.info.version);
    },

    getInfo(): FlashDetectorInfo {
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
    },

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
    },

    detect(partNumber: string, opts: DecodeOptions = {}): FlashInfo {
      const normalized = normalizePartNumber(partNumber);
      let info: FlashInfo | null = null;

      for (const decoder of decoders) {
        if (decoder.check(normalized)) {
          const decoded = decoder.decode(normalized);
          if (decoded) {
            info = {
              partNumber: normalized,
              vendor: UNKNOWN,
              ...decoded
            };
            break;
          }
        }
      }

      if (!info) {
        const found = findPartNumberAcrossVendors(fdb, normalized);
        info = {
          partNumber: normalized,
          vendor: found?.vendor ?? UNKNOWN
        };
      }

      if (opts.combineFdb ?? true) {
        combineFromFdb(info);
      }

      const processed = applyFlashInfoProcessors(info);
      return toPublicFlashInfo(processed, langPacks, fallbackLang, opts.lang);
    },

    decodeFlashId(id: string, opts: DecodeOptions = {}): FlashIdInfo {
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
          vendor: inferVendorFromId(padded)
        };
      }

      const flashIdRecord = findFlashIdRecord(fdb, padded);
      if (flashIdRecord) {
        info.controllers = flashIdRecord.t ?? [];
        info.partNumbers = flashIdRecord.n ?? [];
      }

      const processed = applyFlashIdProcessors(info);
      return toPublicFlashIdInfo(processed, langPacks, fallbackLang, opts.lang);
    },

    searchPartNumber(pn: string, opts: SearchOptions = {}): string[] {
      const query = normalizePartNumber(pn);
      const partMatch = opts.partialMatch ?? true;
      const limit = opts.limit ?? 0;
      const result: string[] = [];

      for (const [vendor, partNumbers] of fdb.vendors.entries()) {
        for (const partNumber of partNumbers.keys()) {
          if (limit > 0 && result.length >= limit) {
            return result;
          }
          const hit = partMatch ? contains(partNumber, query) : partNumber === query;
          if (hit) {
            result.push(`${translateString(vendor, opts.lang)} ${partNumber}`);
          }
        }
      }

      for (const [code, partNumber] of Object.entries(mdb.micron)) {
        if (limit > 0 && result.length >= limit) {
          break;
        }
        if (contains(partNumber, query)) {
          result.push(`${translateString("micron", opts.lang)} ${code} ${partNumber}`);
        }
      }

      for (const [code, partNumbers] of Object.entries(mdb.spectek)) {
        if (limit > 0 && result.length >= limit) {
          break;
        }
        for (const partNumber of partNumbers) {
          if (limit > 0 && result.length >= limit) {
            break;
          }
          if (contains(partNumber, query)) {
            result.push(`${translateString("spectek", opts.lang)} ${code} ${partNumber}`);
          }
        }
      }

      return result;
    },

    searchFlashId(id: string, opts: SearchOptions = {}): Record<string, unknown> | import("./types.js").FlashIdRecord | [] {
      const query = normalizeFlashId(id);
      const partMatch = opts.partialMatch ?? true;
      const limit = opts.limit ?? 0;

      if (!partMatch) {
        const exact = findFlashIdRecord(fdb, query);
        return exact ?? [];
      }

      const result: Record<string, unknown> = {};

      for (const [flashId, record] of fdb.flashIds.entries()) {
        if (limit > 0 && Object.keys(result).length >= limit) {
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
          pagesPerBlock: record.p,
          blocks: record.b,
          controllers: record.t ?? []
        };

        result[flashId] = translateValue(langPacks, fallbackLang, data, opts.lang, false);
      }

      return result;
    },

    searchMicronFbgaCode(code: string): string[] {
      const target = code.toUpperCase();
      if (mdb.micron[target]) {
        return [mdb.micron[target]];
      }
      if (mdb.spectek[target]) {
        return [...mdb.spectek[target]];
      }
      return [];
    },

    getSummary(partNumber: string, lang?: string | null): string {
      const info = this.detect(partNumber, { lang, combineFdb: true });
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
    },

    getIdSummary(id: string, lang?: string | null): string {
      const info = this.decodeFlashId(id, { lang, combineFdb: true });
      const base = translateString("idSummary", lang);

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
    },

    translateString
  };
}
