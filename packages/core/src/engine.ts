import { LANGUAGES, UNKNOWN } from "./constants";
import { buildDefaultDecoders } from "./decoders";
import {
  draftDensity,
  draftField,
  draftFields,
  draftIdentifier,
  draftPartNumber,
  draftVendor,
  mergeDraftStringArray,
  setDraftField
} from "./draft";
import { buildFdb, buildMdb, findFlashIdRecord, findPartNumberAcrossVendors, getPartNumberRecord } from "./fdb";
import { createDefaultIdentifierPostprocessor } from "./flashid/postprocess";
import { inferVendorFromFlashId } from "./flashid/vendor";
import { applyMicronFbgaMeta, parseKnownMicronFbgaCode, parseMicronFbgaCode } from "./micron/fbga";
import {
  buildNormalizedIndexes,
  classifyPart,
  type PartClassificationCandidate
} from "./part-index";
import {
  buildCapabilities,
  buildPartCandidate,
  buildIdentifierDecodeResult,
  buildIdentifierSearchResult,
  buildPartDecodeResult,
  buildPartSearchResult,
  type PartSearchSuggestion
} from "./result-builder";
import { translateString as doTranslateString } from "./translate";
import { normalizeFlashId, normalizePartNumber, padFlashId } from "./utils/normalize";
import { contains } from "./utils/string";
import type {
  PartDecodeOptions,
  EngineOptions,
  FdnextEngine,
  IdentifierDecoder,
  FdbDataset,
  IdentifierDecodeDraft,
  KnownPartNumberEntry,
  LangPacks,
  MdbDataset,
  PartDecodeDraft,
  PartNumberRecord,
  PartNumberDecoder,
  ProcessorOperationContext,
  ProcessorHooks,
  SearchOptions
} from "./types";
import type {
  DecodeIdentifierInput,
  DecodePartInput,
  Candidate,
  FdnextCapabilities,
  FdnextOperation,
  FdnextResult,
  IdentifierDecodeResult,
  IdentifierSearchResult,
  OperationConstraints,
  PartDecodeResult,
  PartSearchResult,
  ResultWarning,
  SearchIdentifiersInput,
  SearchPartsInput
} from "./result";
import { FDNEXT_BUILD_METADATA, FDNEXT_VERSION } from "./result";

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
  esmt: ["esmt", "elite semiconductor"],
  etron: ["etron", "etron technology"],
  intel: ["intel"],
  issi: ["issi"],
  kingston: ["kingston"],
  kioxia: ["kioxia", "toshiba"],
  longsys: ["longsys", "foresee", "lexar"],
  micron: ["micron"],
  samsung: ["samsung"],
  siliconmotion: ["silicon motion", "smi"],
  sndk: ["sandisk", "western digital", "wd"],
  skhynix: ["sk hynix", "skhynix"],
  spectek: ["spectek"],
  winbond: ["winbond"],
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function partTypeText(info: PartDecodeDraft): string {
  return normalizeInfoText(
    info.device.productType ??
    draftField(info, "product_type") ??
    draftField(info, "dram_type") ??
    info.device.chipKind
  );
}

function isRedundantManagedFamily(value: unknown, info: PartDecodeDraft, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  return (
    text === partTypeText(info) ||
    text === normalizeInfoText(extra.product_family)
  );
}

function matchesProcessNode(value: unknown, info: PartDecodeDraft): boolean {
  const text = normalizeInfoText(value);
  const processNode = normalizeInfoText(draftField(info, "process_node"));
  return text.length > 0 && processNode.length > 0 && text === processNode;
}

function isRedundantNandTechnology(value: unknown, info: PartDecodeDraft, extra: Record<string, unknown>): boolean {
  const text = normalizeInfoText(value);
  if (text.length === 0) {
    return false;
  }
  if (matchesProcessNode(value, info) || text === normalizeInfoText(extra.generation_info)) {
    return true;
  }

  const processNode = normalizeInfoText(draftField(info, "process_node"));
  return text === "bics flash" && processNode.startsWith("bics");
}

function isManagedNandType(info: PartDecodeDraft): boolean {
  return info.device.chipKind === "managed_nand" ||
    ["emmc", "ufs", "sata", "nvme", "emcp", "umcp", "e2nand"].includes(partTypeText(info));
}

function parseDramDieStackCount(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.toLowerCase();
  if (/\bsingle\s+die\b/.test(text)) {
    return 1;
  }

  const numeric = /\b(\d+)\s*-?\s*die(?:s)?\b/.exec(text);
  if (numeric) {
    return Number.parseInt(numeric[1] ?? "", 10);
  }

  if (/\bddp\b/.test(text)) return 2;
  if (/\bqdp\b/.test(text)) return 4;
  if (/\bodp\b/.test(text)) return 8;
  if (/\bhdp\b/.test(text)) return 16;
  return undefined;
}

function parseDramCsCount(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const numeric = /\b(\d+)\s*cs\b/i.exec(value);
  return numeric ? Number.parseInt(numeric[1] ?? "", 10) : undefined;
}

function publicDramType(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const type = value.trim().replace(/\s+(?:sdram|sgram)$/i, "");
  return type.length > 0 ? type : undefined;
}

function isDdrFamilyDramType(value: unknown): boolean {
  const type = normalizeInfoText(value);
  return /^(?:ddr[2-5]?|lpddr[2-5]?x?|gddr[2-7]?x?)(?: (?:sdram|sgram))?$/.test(type);
}

function isPlainDdrDramType(value: unknown): boolean {
  const type = normalizeInfoText(value);
  return /^ddr[2-5]?(?: sdram)?$/.test(type);
}

function isKnownClassificationValue(value: unknown): boolean {
  if (value == null || value === -1 || value === UNKNOWN) {
    return false;
  }
  if (typeof value === "string") {
    return normalizeInfoText(value) !== normalizeInfoText(UNKNOWN);
  }
  return true;
}

function hasDramStackLayoutOption(value: unknown): boolean {
  return /\bstack(?:ed)?\b/.test(normalizeInfoText(value));
}

function applyDramClassification(info: PartDecodeDraft): void {
  if (info.device.chipKind !== "dram") {
    return;
  }

  const extra = draftFields(info);
  const die = parseDramDieStackCount(extra.dram_die_stack);
  const ce = parseDramCsCount(extra.dram_die_stack);
  const hasExplicitDramStack = isKnownClassificationValue(extra.dram_die_stack);
  const hasExplicitCeCount = isKnownClassificationValue(extra.ce_count);
  const hasStackLayoutOption = hasDramStackLayoutOption(extra.special_option);
  const defaultDieClassification = isDdrFamilyDramType(extra.dram_type);
  const defaultCeClassification = isPlainDdrDramType(extra.dram_type);
  if (die == null && ce == null && !defaultDieClassification && !defaultCeClassification) {
    return;
  }

  if (die != null) {
    setDraftField(info, "die_count", die);
  } else if (!hasExplicitDramStack && !hasExplicitCeCount && !hasStackLayoutOption && defaultDieClassification && !isKnownClassificationValue(draftField(info, "die_count"))) {
    setDraftField(info, "die_count", 1);
  }

  if (ce != null) {
    setDraftField(info, "ce_count", ce);
  } else if (defaultCeClassification && !isKnownClassificationValue(draftField(info, "ce_count"))) {
    setDraftField(info, "ce_count", 1);
  }
}

function applyDramPublicType(info: PartDecodeDraft): void {
  if (info.device.chipKind !== "dram") {
    return;
  }

  const extra = draftFields(info);
  const type = publicDramType(extra.dram_type);
  if (type) {
    setDraftField(info, "dram_type", type);
  }
}

function pruneRedundantFields(info: PartDecodeDraft): void {
  const extra = info.fields;
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return;
  }

  const productVersion = extra.product_version;
  const storageInterface = extra.storage_interface;
  const productFamily = extra.product_family;
  const managedNandType = isManagedNandType(info);

  if (isRedundantManagedFamily(extra.managed_family, info, extra)) {
    delete extra.managed_family;
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
    (productVersionText === normalizeInfoText(storageInterface) || productVersionText === partTypeText(info))
  ) {
    delete extra.product_version;
  }

  const productFamilyText = removeVendorPrefix(String(productFamily ?? ""), draftVendor(info));
  if (
    productFamilyText.length > 0 &&
    (productFamilyText === normalizeInfoText(productVersion) ||
      productFamilyText === normalizeInfoText(storageInterface) ||
      productFamilyText === partTypeText(info))
  ) {
    delete extra.product_family;
  }

  if (managedNandType && normalizeInfoText(storageInterface) === partTypeText(info)) {
    delete extra.storage_interface;
  }
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

function resourceEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const entries = (raw as Record<string, unknown>).entries;
  return Array.isArray(entries) ? entries : [];
}

function isDramPartNumber(partNumber: string): boolean {
  return /^(?:MT|CT)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^(?:ED|EE)(?:40|41|42|44|46|47|48|49|51|52|53|58|60|61|62|68)/.test(partNumber) ||
    /^ED(?:B|D|E|F|J|S|W)/.test(partNumber);
}

function isFiveDigitFbgaCode(value: string): boolean {
  return /^[0-9A-Z]{5}$/.test(value);
}

function buildKnownPartNumbers(raw: unknown): KnownPartNumberEntry[] {
  const rawEntries = resourceEntries(raw);
  const entries: KnownPartNumberEntry[] = [];
  const seen = new Set<string>();

  for (const item of rawEntries) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const pn = typeof record.pn === "string" ? normalizePartNumber(record.pn) : "";
    const vendor = typeof record.vendor === "string" ? record.vendor.trim() : "";
    if (!pn || !vendor) {
      continue;
    }

    const key = `${vendor}\0${pn}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push({ pn, vendor });
  }

  return entries;
}

function buildMicronDramFbgaCodes(raw: unknown): Map<string, string[]> {
  const entries = new Map<string, string[]>();
  const seen = new Set<string>();
  const rawObject = asRecord(raw);
  const rawMicron = asRecord(rawObject.micron);

  for (const [codeRaw, pnRaw] of Object.entries(rawMicron)) {
    const code = String(codeRaw).trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
    const pn = normalizePartNumber(String(pnRaw));
    if (!isFiveDigitFbgaCode(code) || !isDramPartNumber(pn) || seen.has(`${code}\0${pn}`)) {
      continue;
    }
    seen.add(`${code}\0${pn}`);
    const partNumbers = entries.get(code);
    if (partNumbers) {
      partNumbers.push(pn);
    } else {
      entries.set(code, [pn]);
    }
  }

  return entries;
}

function countFdbPartNumbers(fdb: FdbDataset): number {
  let count = 0;
  for (const partNumbers of fdb.vendors.values()) {
    count += partNumbers.size;
  }
  return count;
}

function collectFdbControllers(fdb: FdbDataset): string[] {
  const controllers = new Set<string>();
  for (const controller of fdb.info.controllers) {
    if (controller) {
      controllers.add(controller);
    }
  }
  for (const record of fdb.flashIds.values()) {
    for (const controller of record.t ?? []) {
      if (controller) {
        controllers.add(controller);
      }
    }
  }
  for (const partNumbers of fdb.vendors.values()) {
    for (const record of partNumbers.values()) {
      for (const controller of record.t ?? []) {
        if (controller) {
          controllers.add(controller);
        }
      }
    }
  }
  return [...controllers].sort((a, b) => a.localeCompare(b));
}

function decoderPriority(priority: number | undefined): { priority?: number } {
  return typeof priority === "number" ? { priority } : {};
}

function buildCapabilitiesSnapshot(input: {
  fdb: FdbDataset;
  mdb: MdbDataset;
  managedNandPartNumbers: KnownPartNumberEntry[];
  dramPartNumbers: KnownPartNumberEntry[];
  micronDramFbgaCodes: Map<string, string[]>;
  decoders: PartNumberDecoder[];
  identifierDecoders: IdentifierDecoder[];
}): FdnextCapabilities {
  const controllers = collectFdbControllers(input.fdb);
  const fdbPartNumberCount = countFdbPartNumbers(input.fdb);
  const managedNandPartNumberCount = input.managedNandPartNumbers.length;
  const dramPartNumberCount = input.dramPartNumbers.length;

  return buildCapabilities({
    server: {
      name: "fdnext-server",
      version: FDNEXT_VERSION,
      build: FDNEXT_BUILD_METADATA
    },
    fdb: {
      name: input.fdb.info.name,
      version: input.fdb.info.version,
      time: input.fdb.info.time,
      website: input.fdb.info.website
    },
    inventory: {
      controllers: {
        count: controllers.length,
        items: controllers
      },
      flashIds: {
        count: input.fdb.flashIds.size
      },
      partNumbers: {
        total: fdbPartNumberCount + managedNandPartNumberCount + dramPartNumberCount,
        fdb: fdbPartNumberCount,
        managedNand: managedNandPartNumberCount,
        dram: dramPartNumberCount
      },
      micronFbga: {
        total: Object.keys(input.mdb.micron).length,
        dramLookup: input.micronDramFbgaCodes.size
      }
    },
    decoders: {
      partNumber: input.decoders.map((decoder) => ({
        id: decoder.id,
        ...decoderPriority(decoder.priority)
      })),
      identifier: input.identifierDecoders.map((decoder) => ({
        id: decoder.id,
        idScheme: decoder.idScheme,
        ...decoderPriority(decoder.priority)
      }))
    }
  });
}

export function createEngine(options: EngineOptions = {}): FdnextEngine {
  const fallbackLang = options.fallbackLang && LANGUAGES.includes(options.fallbackLang as (typeof LANGUAGES)[number])
    ? options.fallbackLang
    : LANGUAGES[0];

  const resourceBundle = options.resources ?? {};
  const partResources = resourceBundle.partIndex ?? {};
  const identifierResources = resourceBundle.identifierIndex ?? {};
  const markingResources = resourceBundle.markingIndex ?? {};
  const rawPartFdb = (partResources.rawNand ?? {}) as Record<string, unknown>;
  const rawIdentifierFdb = (identifierResources.nandFlash ?? rawPartFdb) as Record<string, unknown>;
  const rawMdb = (markingResources.packageMarkings ?? {}) as Record<string, unknown>;
  const rawManagedNandPn = partResources.managedNand ?? [];
  const rawDramPn = partResources.dram ?? [];
  const translationIndex = (resourceBundle.translationIndex ?? {}) as LangPacks;

  const partFdb = buildFdb(rawPartFdb);
  const identifierFdb = rawIdentifierFdb === rawPartFdb ? partFdb : buildFdb(rawIdentifierFdb);
  const fdb = {
    info: partFdb.info,
    vendors: partFdb.vendors,
    flashIds: identifierFdb.flashIds
  };
  const mdb = buildMdb(rawMdb);
  const managedNandPartNumbers = buildKnownPartNumbers(rawManagedNandPn);
  const dramPartNumbers = buildKnownPartNumbers(rawDramPn);
  const micronDramFbgaCodes = buildMicronDramFbgaCodes(rawMdb);
  const micronDramFbgaCodeSet = new Set(micronDramFbgaCodes.keys());
  const normalizedIndexes = buildNormalizedIndexes({
    fdb,
    mdb,
    managedNandPartNumbers,
    dramPartNumbers,
    micronDramFbgaCodes
  });
  const langPacks: LangPacks = {
    [fallbackLang]: {},
    ...translationIndex
  };

  const processors: ProcessorHooks[] = [...(options.processors ?? [])];
  const internalDecodeHooks = [createDefaultIdentifierPostprocessor()];
  const decoders: PartNumberDecoder[] = [...buildDefaultDecoders(), ...(options.decoders ?? [])].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  const identifierDecoders: IdentifierDecoder[] = [...(options.identifierDecoders ?? [])].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  let cachedCapabilities = buildCapabilitiesSnapshot({
    fdb,
    mdb,
    managedNandPartNumbers,
    dramPartNumbers,
    micronDramFbgaCodes,
    decoders,
    identifierDecoders
  });
  const refreshCapabilities = (): void => {
    cachedCapabilities = buildCapabilitiesSnapshot({
      fdb,
      mdb,
      managedNandPartNumbers,
      dramPartNumbers,
      micronDramFbgaCodes,
      decoders,
      identifierDecoders
    });
  };

  const translateString = (key: string, lang?: string | null) => doTranslateString(langPacks, fallbackLang, key, lang);
  const resultBuilderContext = { langPacks, fallbackLang, translateString };

  const translateTemplate = (key: string, fallback: string, params: Record<string, string>, lang?: string | null): string => {
    const translated = translateString(key, lang);
    const template = translated && translated !== key ? translated : fallback;
    return template.replaceAll(/\{([a-zA-Z0-9_]+)\}/g, (_, param: string) => params[param] ?? "");
  };

  const localizeWarningMessage = (warning: ResultWarning, lang?: string | null): string => {
    if (warning.code === "constraint_mismatch") {
      const vendor = /^Vendor constraint (.+) does not match (.+)$/.exec(warning.message);
      if (vendor) {
        return translateTemplate(
          "warning.constraint_mismatch.vendor",
          "Vendor constraint {expected} does not match {actual}",
          { expected: vendor[1] ?? "", actual: vendor[2] ?? "" },
          lang
        );
      }
      const chipKind = /^Chip kind constraint (.+) does not match (.+)$/.exec(warning.message);
      if (chipKind) {
        return translateTemplate(
          "warning.constraint_mismatch.chip_kind",
          "Chip kind constraint {expected} does not match {actual}",
          { expected: chipKind[1] ?? "", actual: chipKind[2] ?? "" },
          lang
        );
      }
      const productType = /^Product type constraint (.+) does not match (.+)$/.exec(warning.message);
      if (productType) {
        return translateTemplate(
          "warning.constraint_mismatch.product_type",
          "Product type constraint {expected} does not match {actual}",
          { expected: productType[1] ?? "", actual: productType[2] ?? "" },
          lang
        );
      }
      if (warning.message === "No part candidate matched the requested strict constraints") {
        const translated = translateString("warning.constraint_mismatch.strict", lang);
        return translated && translated !== "warning.constraint_mismatch.strict"
          ? translated
          : "No part candidate matched the requested strict constraints";
      }
    }
    if (warning.code === "unsupported_id_scheme") {
      const idScheme = /^Unsupported identifier scheme: (.+)$/.exec(warning.message);
      return translateTemplate(
        "warning.unsupported_id_scheme",
        "Unsupported identifier scheme: {idScheme}",
        { idScheme: idScheme?.[1] ?? "" },
        lang
      );
    }
    if (warning.code === "invalid_nand_flash_id" && warning.message.includes("search")) {
      const translated = translateString("warning.invalid_nand_flash_id.search", lang);
      return translated && translated !== "warning.invalid_nand_flash_id.search"
        ? translated
        : "NAND Flash ID search requires a hexadecimal byte string";
    }
    const translated = translateString(`warning.${warning.code}`, lang);
    return translated && translated !== `warning.${warning.code}` ? translated : warning.message;
  };

  const localizeWarnings = (warnings: ResultWarning[], lang?: string | null): ResultWarning[] =>
    warnings.map((warning) => ({
      ...warning,
      message: localizeWarningMessage(warning, lang)
    }));

  const runOperation = <R extends FdnextResult | FdnextCapabilities>(
    operation: FdnextOperation | "capabilities",
    input: DecodePartInput | SearchPartsInput | DecodeIdentifierInput | SearchIdentifiersInput | undefined,
    build: () => R
  ): R => {
    const context: ProcessorOperationContext = {
      operation,
      input,
      query: input?.query ?? "",
      remote: "",
      userAgent: "",
      lang: input?.lang ?? null
    };
    for (const processor of processors) {
      if (processor.beforeOperation?.(context) === false) {
        break;
      }
    }

    let result = build();
    if ("warnings" in result && result.warnings.length > 0) {
      result = {
        ...result,
        warnings: localizeWarnings(result.warnings, context.lang)
      };
    }
    for (const processor of processors) {
      const next = processor.afterOperation?.(context, result);
      if (next) {
        result = next as R;
      }
    }
    return result;
  };

  const applyIdentifierInfoHooks = (info: IdentifierDecodeDraft): IdentifierDecodeDraft => {
    let next = info;
    for (const processor of internalDecodeHooks) {
      if (processor.identifierInfo) {
        next = processor.identifierInfo(next);
      }
    }
    return next;
  };

  const decodeNandFlashIdRaw = (id: string): IdentifierDecodeDraft => {
    const normalized = normalizeFlashId(id);
    const padded = padFlashId(normalized);
    let info: IdentifierDecodeDraft | null = null;

    for (const decoder of identifierDecoders) {
      if (decoder.idScheme === "nand.flash_id" && decoder.check(padded)) {
        const decoded = decoder.decode(padded);
        if (decoded) {
          info = {
            ...decoded,
            device: {
              ...decoded.device,
              domain: decoded.device.domain ?? "memory",
              chipKind: decoded.device.chipKind ?? "raw_nand",
              vendor: decoded.device.vendor ?? UNKNOWN,
              identifier: decoded.device.identifier ?? padded,
              idScheme: decoded.device.idScheme ?? "nand.flash_id"
            },
            fields: { ...(decoded.fields ?? {}) }
          };
          break;
        }
      }
    }

    if (!info) {
      info = {
        device: {
          identifier: padded,
          idScheme: "nand.flash_id",
          domain: "memory",
          chipKind: "raw_nand",
          vendor: inferVendorFromFlashId(padded)
        },
        fields: {}
      };
    }

    const flashIdRecord = findFlashIdRecord(fdb, padded);
    if (flashIdRecord) {
      info.controllers = mergeStringArray(info.controllers, flashIdRecord.t);
      info.identifiers = {
        ...(info.identifiers ?? {}),
        partNumbers: mergeStringArray(info.identifiers?.partNumbers, flashIdRecord.n)
      };
      const fdbVendor = inferSingleVendorFromPartReferences(flashIdRecord.n);
      if (fdbVendor && draftVendor(info) !== fdbVendor) {
        info.device.vendor = fdbVendor;
      }
    }

    return applyIdentifierInfoHooks(info);
  };

  const processNodeFromIdentifiers = (ids: string[] | undefined): string | undefined => {
    const nodes = new Set<string>();
    for (const id of ids ?? []) {
      const decoded = decodeNandFlashIdRaw(id);
      const processNode = typeof draftField(decoded, "process_node") === "string" ? String(draftField(decoded, "process_node")).trim() : "";
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

  const combineFromFdb = (info: PartDecodeDraft, lookupPartNumber = draftPartNumber(info)): PartDecodeDraft => {
    const lookupPartNumbers = [...new Set([draftPartNumber(info), lookupPartNumber].map((item) => normalizePartNumber(item)).filter(Boolean))];
    const allMatches = matchingFdbRecords(lookupPartNumbers);
    const allControllers = allMatches.flatMap(({ record }) => record.t ?? []);
    if (allControllers.length > 0) {
      info.controllers = mergeStringArray(info.controllers, allControllers);
    }

    // SpecTek package markings resolve through the Micron-like lookup path, while SpecTek PNs should not
    // inherit Micron FDB-combined fields.
    if (draftVendor(info) === "spectek") {
      return info;
    }

    let byVendor: PartNumberRecord | undefined;
    for (const partNumber of lookupPartNumbers) {
      byVendor = getPartNumberRecord(fdb, draftVendor(info), partNumber);
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

    if (!info.device.chipKind || info.device.chipKind === "unknown") {
      info.device.chipKind = "raw_nand";
    }

    if (byAny?.vendor && draftVendor(info) === UNKNOWN) {
      info.device.vendor = byAny.vendor;
    }

    info.identifiers = {
      ...(info.identifiers ?? {}),
      flashIds: mergeStringArray(info.identifiers?.flashIds, record.id ?? [])
    };
    info.controllers = mergeStringArray(info.controllers, record.t ?? []);
    for (const id of info.identifiers.flashIds ?? []) {
      info.controllers = mergeStringArray(info.controllers, findFlashIdRecord(fdb, id)?.t);
    }

    if (!isKnownClassificationValue(draftField(info, "process_node")) && record.l) {
      setDraftField(info, "process_node", record.l);
    }

    if (!isKnownClassificationValue(draftField(info, "process_node"))) {
      const processNode = processNodeFromIdentifiers(record.id);
      if (processNode) {
        setDraftField(info, "process_node", processNode);
      }
    }

    if (!isKnownClassificationValue(draftField(info, "cell_level")) && record.c) {
      setDraftField(info, "cell_level", record.c);
    }

    if (record.d != null && record.d !== -1) {
      setDraftField(info, "die_count", record.d);
    }
    if (record.e != null && record.e !== -1) {
      setDraftField(info, "ce_count", record.e);
    }
    if (record.r != null && record.r !== -1) {
      setDraftField(info, "rb_count", record.r);
    }
    if (record.n != null && record.n !== -1) {
      setDraftField(info, "channel_count", record.n);
    }

    return info;
  };

  const applyPartInfoHooks = (info: PartDecodeDraft): PartDecodeDraft => {
    let next = info;
    for (const processor of internalDecodeHooks) {
      if (processor.partInfo) {
        next = processor.partInfo(next);
      }
    }
    return next;
  };

  const unknownPartDraft = (partNumber: string, vendor = UNKNOWN): PartDecodeDraft => ({
    device: {
      partNumber,
      vendor,
      domain: "memory",
      chipKind: "unknown"
    },
    fields: {}
  });

  const normalizePartDraft = (partNumber: string, decoded: PartDecodeDraft): PartDecodeDraft => ({
    ...decoded,
    device: {
      ...decoded.device,
      domain: decoded.device.domain ?? "memory",
      chipKind: decoded.device.chipKind ?? "unknown",
      vendor: decoded.device.vendor ?? UNKNOWN,
      partNumber: decoded.device.partNumber ?? partNumber
    },
    fields: { ...(decoded.fields ?? {}) },
    identifiers: decoded.identifiers
      ? { flashIds: mergeStringArray([], decoded.identifiers.flashIds) }
      : undefined,
    controllers: mergeStringArray([], decoded.controllers),
    components: decoded.components ? [...decoded.components] : undefined,
    meta: decoded.meta ? { ...decoded.meta } : undefined,
    warnings: decoded.warnings ? [...decoded.warnings] : undefined
  });

  const detectRaw = (partNumber: string, opts: PartDecodeOptions, allowMicronFbga: boolean): PartDecodeDraft => {
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
          if (draftVendor(base) === UNKNOWN) {
            continue;
          }

          const withMeta = applyMicronFbgaMeta(base, knownDramFbga, resolved);
          if (opts.combineFdb ?? true) {
            combineFromFdb(withMeta, partNumber);
          }
          return withMeta;
        }

        return unknownPartDraft(knownDramFbga.display);
      }

      if (fbga) {
        return unknownPartDraft(fbga.display);
      }
    }

    let info: PartDecodeDraft | null = null;

    for (const decoder of decoders) {
      if (decoder.check(partNumber)) {
        const decoded = decoder.decode(partNumber);
        if (decoded) {
          info = normalizePartDraft(partNumber, decoded);
          break;
        }
      }
    }

    if (!info) {
      const found = findPartNumberAcrossVendors(fdb, partNumber);
      info = unknownPartDraft(partNumber, found?.vendor ?? UNKNOWN);
    }

    if (opts.combineFdb ?? true) {
      combineFromFdb(info, partNumber);
    }

    return applyPartInfoHooks(info);
  };

  const partDecoderPriority = (partNumber: string): number => {
    let priority = 0;
    for (const decoder of decoders) {
      if (decoder.check(partNumber)) {
        priority = Math.max(priority, decoder.priority ?? 0);
      }
    }
    return priority;
  };

  const inspectPartForClassification = (partNumber: string): PartDecodeDraft => {
    const info = detectRaw(partNumber, { combineFdb: true }, true);
    applyDramClassification(info);
    applyDramPublicType(info);
    pruneRedundantFields(info);
    return info;
  };

  const partClassificationOptions = (mode: "decode" | "search", limit?: number) => ({
    indexes: normalizedIndexes,
    mode,
    ...(limit ? { limit } : {}),
    inspectPart: inspectPartForClassification,
    decoderPriority: partDecoderPriority
  });

  const suggestionFromPartCandidate = (candidate: PartClassificationCandidate): PartSearchSuggestion => {
    const info = candidate.info ?? inspectPartForClassification(candidate.partNumber);
    const density = draftDensity(info);
    return {
      vendor: candidate.vendor,
      partNumber: candidate.partNumber,
      chipKind: candidate.chipKind,
      ...(candidate.productType ? { productType: candidate.productType } : {}),
      ...(candidate.markingCode ? { markingCode: candidate.markingCode } : {}),
      ...(density ? { density } : {}),
      ...(candidate.warnings.length > 0 ? { warnings: candidate.warnings } : {})
    };
  };

  const publicCandidatesFromPartClassification = (candidates: PartClassificationCandidate[], lang?: string | null): Candidate[] =>
    candidates.slice(0, 5).map((candidate) => buildPartCandidate(suggestionFromPartCandidate(candidate), resultBuilderContext, lang));

  const withMarkingCode = (info: PartDecodeDraft, markingCode: string | undefined): PartDecodeDraft => {
    if (!markingCode) {
      return info;
    }
    return {
      ...info,
      device: {
        ...info.device,
        markingCode
      },
      fields: {
        ...(info.fields ?? {}),
        marking_code: markingCode
      }
    };
  };

  const getVersion = (): string => String(fdb.info.version);

  const searchPartSuggestions = (
    query: string,
    constraints: Omit<OperationConstraints, "idScheme"> | undefined,
    opts: SearchOptions = {}
  ): { suggestions: PartSearchSuggestion[]; warnings: FdnextResult["warnings"] } => {
    const classification = classifyPart(query, constraints, {
      ...partClassificationOptions("search", opts.limit),
      partialMatch: opts.partialMatch
    });
    return {
      suggestions: classification.candidates.map(suggestionFromPartCandidate),
      warnings: classification.warnings
    };
  };

  const searchNandFlashIds = (id: string, opts: SearchOptions = {}): string[] => {
    const query = normalizeFlashId(id);
    const partMatch = opts.partialMatch ?? true;
    const limit = opts.limit ?? 0;

    if (!partMatch) {
      const exact = normalizedIndexes.identifierIndex.get(query);
      return exact ? [query] : [];
    }

    const result: string[] = [];

    for (const flashId of normalizedIndexes.identifierIndex.keys()) {
      if (limit > 0 && result.length >= limit) {
        break;
      }
      if (!contains(flashId, query)) {
        continue;
      }
      result.push(flashId);
    }

    return result;
  };

  const decodeNandFlashIdSearchHit = (id: string): IdentifierDecodeDraft => {
    const info = decodeNandFlashIdRaw(id);
    const exactRecord = findFlashIdRecord(fdb, id);
    if (!exactRecord) {
      return {
        ...info,
        device: {
          ...info.device,
          identifier: id
        }
      };
    }
    const fdbVendor = inferSingleVendorFromPartReferences(exactRecord.n);
    return {
      ...info,
      device: {
        ...info.device,
        identifier: id,
        ...(fdbVendor && draftVendor(info) !== fdbVendor ? { vendor: fdbVendor } : {})
      },
      controllers: mergeStringArray(info.controllers, exactRecord.t),
      identifiers: {
        ...(info.identifiers ?? {}),
        partNumbers: mergeStringArray(info.identifiers?.partNumbers, exactRecord.n)
      }
    };
  };

  const compactIdentifierInput = (query: string): string => query.toUpperCase().replaceAll(/[\s,._:-]+/g, "");

  const isNandFlashIdShape = (query: string): boolean => {
    const normalized = normalizeFlashId(query);
    const compact = compactIdentifierInput(query);
    return compact === normalized && normalized.length >= 2 && normalized.length <= 12 && normalized.length % 2 === 0;
  };

  const getCapabilities = (): FdnextCapabilities => runOperation("capabilities", undefined, () => cloneObject(cachedCapabilities));

  const decodePart = (input: DecodePartInput): PartDecodeResult => {
    return runOperation("part.decode", input, () => {
      const normalized = normalizePartNumber(input.query);
      if (!normalized) {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "part.decode",
          status: "invalid_input",
          input: {
            query: input.query,
            normalized: input.query,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          warnings: [{ code: "empty_query", message: "Part query is empty", severity: "warning" }]
        };
      }
      const classification = classifyPart(input.query, input.constraints, partClassificationOptions("decode"));
      if (classification.status === "not_found" || !classification.selected) {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "part.decode",
          status: "not_found",
          input: {
            query: input.query,
            normalized,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          warnings: classification.warnings
        };
      }
      if (classification.status === "ambiguous") {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "part.decode",
          status: "ambiguous",
          input: {
            query: input.query,
            normalized,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          candidates: publicCandidatesFromPartClassification(classification.candidates, input.lang),
          warnings: classification.warnings
        };
      }
      const info = withMarkingCode(
        classification.selected.info ?? inspectPartForClassification(classification.selected.partNumber),
        classification.selected.markingMatch ? classification.selected.markingCode : undefined
      );
      const result = buildPartDecodeResult(
        info,
        {
          query: input.query,
          normalized: classification.selected.markingMatch ? classification.selected.markingCode ?? normalized : normalized,
          constraints: input.constraints as OperationConstraints | undefined,
          lang: input.lang
        },
        resultBuilderContext
      );
      result.warnings.push(...classification.warnings, ...classification.selected.warnings);
      return result;
    });
  };

  const searchParts = (input: SearchPartsInput): PartSearchResult => {
    return runOperation("part.search", input, () => {
      const normalized = normalizePartNumber(input.query);
      const search = normalized
        ? searchPartSuggestions(input.query, input.constraints, { lang: input.lang, limit: input.limit })
        : { suggestions: [], warnings: [] };
      const result = buildPartSearchResult(
        search.suggestions,
        {
          query: input.query,
          normalized: normalized || input.query,
          constraints: input.constraints as OperationConstraints | undefined,
          lang: input.lang
        },
        resultBuilderContext
      );
      result.warnings.push(...search.warnings);
      return result;
    });
  };

  const decodeIdentifier = (input: DecodeIdentifierInput): IdentifierDecodeResult => {
    return runOperation("identifier.decode", input, () => {
      const idScheme = input.idScheme ?? input.constraints?.idScheme ?? "nand.flash_id";
      const normalized = normalizeFlashId(input.query);
      const constraints = { ...(input.constraints ?? {}), idScheme } as OperationConstraints;
      if (idScheme !== "nand.flash_id") {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "identifier.decode",
          status: "unsupported",
          input: {
            query: input.query,
            normalized: normalized || input.query,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints
          },
          blocks: [],
          relations: [],
          warnings: [{ code: "unsupported_id_scheme", message: `Unsupported identifier scheme: ${idScheme}`, severity: "warning" }]
        };
      }
      if (!isNandFlashIdShape(input.query)) {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "identifier.decode",
          status: "invalid_input",
          input: {
            query: input.query,
            normalized: normalized || input.query,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints
          },
          blocks: [],
          relations: [],
          warnings: [{ code: "invalid_nand_flash_id", message: "NAND Flash ID must be an even-length hexadecimal byte string", severity: "warning" }]
        };
      }
      const info = decodeNandFlashIdRaw(input.query);
      return buildIdentifierDecodeResult(
        info,
        {
          query: input.query,
          normalized,
          constraints,
          lang: input.lang
        },
        resultBuilderContext
      );
    });
  };

  const searchIdentifiers = (input: SearchIdentifiersInput): IdentifierSearchResult => {
    return runOperation("identifier.search", input, () => {
      const idScheme = input.idScheme ?? input.constraints?.idScheme ?? "nand.flash_id";
      const normalized = normalizeFlashId(input.query);
      const constraints = { ...(input.constraints ?? {}), idScheme } as OperationConstraints;
      if (idScheme !== "nand.flash_id") {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "identifier.search",
          status: "unsupported",
          input: {
            query: input.query,
            normalized: normalized || input.query,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints
          },
          items: [],
          warnings: [{ code: "unsupported_id_scheme", message: `Unsupported identifier scheme: ${idScheme}`, severity: "warning" }]
        };
      }
      if (!isNandFlashIdShape(input.query)) {
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "identifier.search",
          status: "invalid_input",
          input: {
            query: input.query,
            normalized: normalized || input.query,
            ...(input.lang ? { lang: input.lang } : {}),
            constraints
          },
          items: [],
          warnings: [{ code: "invalid_nand_flash_id", message: "NAND Flash ID search requires a hexadecimal byte string", severity: "warning" }]
        };
      }
      return buildIdentifierSearchResult(
        normalized ? searchNandFlashIds(normalized, { lang: input.lang, limit: input.limit }).map(decodeNandFlashIdSearchHit) : [],
        {
          query: input.query,
          normalized: normalized || input.query,
          constraints,
          lang: input.lang
        },
        resultBuilderContext
      );
    });
  };

  return {
    getVersion,
    getCapabilities,
    getFdb: () => fdb,
    getMdb: () => mdb,
    getLang: () => langPacks,
    getProcessors: () => processors,
    decodePart,
    searchParts,
    decodeIdentifier,
    searchIdentifiers,
    translateString,
    getHumanReadableDensity,
    registerDecoder(decoder: PartNumberDecoder): void {
      decoders.push(decoder);
      decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      refreshCapabilities();
    },
    registerIdentifierDecoder(decoder: IdentifierDecoder): void {
      identifierDecoders.push(decoder);
      identifierDecoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      refreshCapabilities();
    },
    registerProcessor(processor: ProcessorHooks): void {
      processors.push(processor);
    }
  };
}
