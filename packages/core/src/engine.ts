import { LANGUAGES, UNKNOWN } from "./constants";
import { buildDefaultDecoders } from "./decoders";
import { buildFdb, buildMdb, findFlashIdRecord, findPartNumberAcrossVendors, getPartNumberRecord } from "./fdb";
import { createDefaultFlashIdProcessor } from "./flashid/postprocess";
import { inferVendorFromFlashId } from "./flashid/vendor";
import { applyMicronFbgaMeta, parseMicronFbgaCode } from "./micron/fbga";
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
  LangPacks,
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

  const combineFromFdb = (info: FlashInfo): FlashInfo => {
    // PHP uses `self::` in Micron::getFlashInfoFromFdb(), so SpecTek (which inherits it) looks up Micron FDB entries
    // instead of SpecTek ones. This means SpecTek part numbers generally do not get FDB-combined fields in PHP.
    if (info.vendor === "spectek") {
      return info;
    }

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
        if (!resolved) {
          return { partNumber: fbga.display, vendor: UNKNOWN };
        }

        const base = detectRaw(resolved, opts, false);
        return applyMicronFbgaMeta(base, fbga, resolved);
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
      combineFromFdb(info);
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
        pagesPerBlock: record.p,
        blocks: record.b,
        controllers: record.t ?? []
      };

      result[flashId] = translateValue(langPacks, fallbackLang, data, opts.lang, false);
      resultCount += 1;
    }

    return result;
  };

  const searchMicronFbgaCode = (code: string): string[] => {
    const target = code.toUpperCase();
    if (mdb.micron[target]) {
      return [mdb.micron[target]];
    }
    if (mdb.spectek[target]) {
      return [...mdb.spectek[target]];
    }
    return [];
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
