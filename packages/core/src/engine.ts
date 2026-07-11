import { LANGUAGES, UNKNOWN } from "./constants";
import { getDefaultPreparedCatalog, getPreparedCatalogData, prepareCatalog } from "./catalog";
import { projectControllersByGroup } from "./controller-groups";
import type { CompileDecodePackResult } from "./decodepack/types";
import {
  draftDensity,
  draftField,
  draftVendor,
  setDraftField
} from "./draft";
import { buildCapabilitiesSnapshot } from "./engine/capabilities";
import { cloneObject, inferSingleVendorFromPartReferences, mergeStringArray } from "./engine/common";
import { defaultCompiledDecodePack } from "./engine/default-decodepack";
import { createFdbPartEnricher, findFdbPartRecords } from "./engine/fdb-part-enrichment";
import {
  applyDramClassification,
  applyDramPublicType,
  canonicalNandDieProfileKey,
  collectDecoderProfileTables,
  isFdnextFieldKey,
  parseDieDensityMbit,
  pruneRedundantFields
} from "./engine/field-normalization";
import { createPartDecoderDispatch } from "./engine/part-decoder-dispatch";
import { findFlashIdRecord } from "./fdb";
import { createDefaultIdentifierPostprocessor } from "./flashid/postprocess";
import { inferVendorFromFlashId } from "./flashid/vendor";
import { applyMicronFbgaMeta, parseKnownFiveDigitMicronFbgaCode, parseKnownMicronFbgaCode, parseMicronFbgaCode } from "./micron/fbga";
import {
  classifyPart,
  type PartClassificationCandidate
} from "./part-index";
import {
  buildPartCandidate,
  buildIdentifierDecodeResult,
  buildIdentifierSearchResult,
  buildPartDecodeResult,
  buildPartSearchResult,
  type PartSearchSuggestion
} from "./result-builder";
import { translateString as doTranslateString } from "./translate";
import { normalizeFlashId, normalizePartNumber, normalizePartNumberTokenKey, padFlashId } from "./utils/normalize";
import { contains } from "./utils/string";
import type {
  PartDecodeOptions,
  EngineOptions,
  FdnextEngine,
  IdentifierDecoder,
  IdentifierDecodeDraft,
  LangPacks,
  PartDecodeDraft,
  PartNumberDecoder,
  ProcessorOperationContext,
  ProcessorHooks,
  SearchOptions
} from "./types";
import type {
  CapabilitiesInput,
  DecodeIdentifierInput,
  DecodePartInput,
  Candidate,
  ControllerGroupSelection,
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

const PART_SEARCH_IDENTITY_PROJECTION = [
  "device.partNumber",
  "device.domain",
  "device.vendor",
  "device.chipKind",
  "device.productType"
] as const;

export const DEFAULT_PART_SEARCH_PROJECTION = [
  ...PART_SEARCH_IDENTITY_PROJECTION,
  "fields.product_type",
  "fields.dram_type",
  "fields.density",
  "fields.storage_density",
  "fields.dram_density",
  "fields.die_codename",
  "fields.die_density",
  "fields.die_count",
  "fields.cell_level",
  "meta.nandDieProfileKey"
] as const;

/**
 * Create an fdnext engine. Prefer one long-lived instance per process, application, worker isolate,
 * or frontend runtime; do not create a new engine for each decode/search operation.
 */
export function createEngine(options: EngineOptions = {}): FdnextEngine {
  const fallbackLang = options.fallbackLang && LANGUAGES.includes(options.fallbackLang as (typeof LANGUAGES)[number])
    ? options.fallbackLang
    : LANGUAGES[0];

  if (options.catalog && options.resources) {
    throw new TypeError("EngineOptions.catalog and EngineOptions.resources are mutually exclusive");
  }
  const preparedCatalog = options.catalog ?? (options.resources ? prepareCatalog(options.resources) : getDefaultPreparedCatalog());
  const {
    fdb,
    mdb,
    micronDramFbgaCodes,
    micronDramFbgaCodeSet,
    micronFbgaCodeSet,
    controllerGroups,
    normalizedIndexes,
    translationIndex,
    inventory
  } = getPreparedCatalogData(preparedCatalog);
  const langPacks: LangPacks = {
    [fallbackLang]: {},
    ...translationIndex
  };

  const processors: ProcessorHooks[] = [...(options.processors ?? [])];
  const partSearchProjection = [
    ...new Set([
      ...DEFAULT_PART_SEARCH_PROJECTION,
      ...(options.partSearchProjection ?? [])
    ])
  ];
  const internalDecodeHooks = [createDefaultIdentifierPostprocessor()];
  let defaultPack: CompileDecodePackResult | undefined;
  const getDefaultPack = () => (defaultPack ??= defaultCompiledDecodePack());
  const decoders: PartNumberDecoder[] = [...(options.decoders ?? getDefaultPack().partDecoders)].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  const partDecoderDispatch = createPartDecoderDispatch(decoders);
  const identifierDecoders: IdentifierDecoder[] = [...(options.identifierDecoders ?? getDefaultPack().identifierDecoders)].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
  const profileTables = collectDecoderProfileTables(options.profileTables, [...decoders, ...identifierDecoders]);
  const nandDieProfileTable = profileTables["nand.die_profile"] ?? {};
  const translateString = (key: string, lang?: string | null) => doTranslateString(langPacks, fallbackLang, key, lang);
  const resultBuilderContext = { langPacks, fallbackLang, translateString };
  const capabilityLanguages = (): string[] => [...new Set([fallbackLang, ...Object.keys(langPacks)])];
  const buildCachedCapabilities = (): Map<string, FdnextCapabilities> => {
    const snapshots = new Map<string, FdnextCapabilities>();
    for (const lang of capabilityLanguages()) {
      snapshots.set(lang, buildCapabilitiesSnapshot({
        fdb,
        inventory,
        controllerGroups,
        decoders,
        identifierDecoders,
        lang,
        translateString
      }));
    }
    return snapshots;
  };
  let cachedCapabilities = buildCachedCapabilities();
  const cachedCapabilitiesForLang = (lang?: string | null): FdnextCapabilities => {
    const targetLang = lang && cachedCapabilities.has(lang) ? lang : fallbackLang;
    return cachedCapabilities.get(targetLang) ?? cachedCapabilities.get(fallbackLang) ?? ([...cachedCapabilities.values()][0] as FdnextCapabilities);
  };

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
    input: DecodePartInput | SearchPartsInput | DecodeIdentifierInput | SearchIdentifiersInput | CapabilitiesInput | undefined,
    build: () => R
  ): R => {
    const query = input && "query" in input ? input.query : "";
    const context: ProcessorOperationContext = {
      operation,
      input,
      query,
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

  const enrichNandDieProfileFields = <T extends PartDecodeDraft | IdentifierDecodeDraft>(info: T): T => {
    const dieCodename = draftField(info, "die_codename");
    if (typeof dieCodename !== "string" || dieCodename.trim().length === 0 || dieCodename === UNKNOWN) {
      return info;
    }

    const profileKey = canonicalNandDieProfileKey(dieCodename, info, (candidate) => Object.hasOwn(nandDieProfileTable, candidate));
    if (typeof info.meta?.nandDieProfileKey === "string" && info.meta.nandDieProfileKey.trim()) {
      info.meta = {
        ...info.meta,
        nandDieProfileKey: profileKey
      };
    }
    if (profileKey !== dieCodename.trim()) {
      setDraftField(info, "die_codename", profileKey);
    }

    const profile = nandDieProfileTable[profileKey];
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return info;
    }

    for (const [key, value] of Object.entries(profile)) {
      if (value === undefined || !isFdnextFieldKey(key)) {
        continue;
      }
      if (key !== "die_codename" && draftField(info, key) !== undefined) {
        continue;
      }
      setDraftField(info, key, value);
    }
    return info;
  };

  const deriveNandDensityFromDieStack = <T extends PartDecodeDraft | IdentifierDecodeDraft>(info: T): T => {
    const currentDensity = draftDensity(info);
    if (
      (currentDensity !== undefined && draftVendor(info) !== "spectek") ||
      info.device.chipKind !== "raw_nand"
    ) {
      return info;
    }

    const dieCount = draftField(info, "die_count");
    if (typeof dieCount !== "number" || !Number.isFinite(dieCount) || dieCount <= 0) {
      return info;
    }

    const dieDensity = parseDieDensityMbit(draftField(info, "die_density"));
    if (dieDensity === undefined) {
      return info;
    }

    const derivedDensity = dieDensity * dieCount;
    if (currentDensity === undefined || currentDensity !== derivedDensity) {
      setDraftField(info, "density", derivedDensity);
    }
    return info;
  };

  const applyIdentifierInfoHooks = (info: IdentifierDecodeDraft): IdentifierDecodeDraft => {
    let next = info;
    for (const processor of internalDecodeHooks) {
      if (processor.identifierInfo) {
        next = processor.identifierInfo(next);
      }
    }
    return deriveNandDensityFromDieStack(enrichNandDieProfileFields(next));
  };

  const projectedControllers = (
    controllers: string[] | undefined,
    selection: ControllerGroupSelection | undefined
  ): string[] => projectControllersByGroup(controllers, controllerGroups, selection);

  const projectPartControllers = (info: PartDecodeDraft, selection: ControllerGroupSelection | undefined): PartDecodeDraft => ({
    ...info,
    controllers: projectedControllers(info.controllers, selection)
  });

  const projectIdentifierControllers = (
    info: IdentifierDecodeDraft,
    selection: ControllerGroupSelection | undefined
  ): IdentifierDecodeDraft => ({
    ...info,
    controllers: projectedControllers(info.controllers, selection)
  });

  const decodeNandFlashIdRaw = (id: string): IdentifierDecodeDraft => {
    const normalized = normalizeFlashId(id);
    const padded = padFlashId(normalized);
    let info: IdentifierDecodeDraft | null = null;

    for (const decoder of identifierDecoders) {
      if (decoder.idScheme !== "nand.flash_id") {
        continue;
      }
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

  const combineFromFdb = createFdbPartEnricher(fdb, decodeNandFlashIdRaw);

  const applyPartInfoHooks = (info: PartDecodeDraft): PartDecodeDraft => {
    let next = info;
    for (const processor of internalDecodeHooks) {
      if (processor.partInfo) {
        next = processor.partInfo(next);
      }
    }
    return deriveNandDensityFromDieStack(enrichNandDieProfileFields(next));
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
      ? {
          flashIds: mergeStringArray([], decoded.identifiers.flashIds),
          partNumbers: mergeStringArray([], decoded.identifiers.partNumbers)
        }
      : undefined,
    controllers: mergeStringArray([], decoded.controllers),
    components: decoded.components ? [...decoded.components] : undefined,
    meta: decoded.meta ? { ...decoded.meta } : undefined,
    warnings: decoded.warnings ? [...decoded.warnings] : undefined
  });

  const detectRaw = (partNumber: string, opts: PartDecodeOptions, allowMicronFbga: boolean): PartDecodeDraft => {
    if (allowMicronFbga) {
      const fbga = parseMicronFbgaCode(partNumber) ?? parseKnownFiveDigitMicronFbgaCode(partNumber, micronFbgaCodeSet);
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

      if (fbga) {
        return unknownPartDraft(fbga.display);
      }
    }

    let info: PartDecodeDraft | null = null;

    for (const decoder of partDecoderDispatch.candidates(normalizePartNumber(partNumber))) {
      const matched = decoder.match(partNumber);
      if (!matched) {
        continue;
      }
      const decoded = opts.projection && decoder.project
        ? decoder.project(matched, opts.projection)
        : decoder.decode(matched);
      if (decoded) {
        info = normalizePartDraft(partNumber, decoded);
        break;
      }
    }

    if (!info) {
      const knownDramFbga = /^(?:[0-9A-Z]{5}|[0-9A-Z]{10})$/.test(partNumber)
        ? parseKnownMicronFbgaCode(partNumber, micronDramFbgaCodeSet)
        : null;
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
    }

    if (!info) {
      const found = findFdbPartRecords(fdb, partNumber)[0];
      info = unknownPartDraft(partNumber, found?.vendor ?? UNKNOWN);
    }

    if (opts.combineFdb ?? true) {
      combineFromFdb(info, partNumber);
    }

    return applyPartInfoHooks(info);
  };

  const partDecoderPriority = (partNumber: string): number => {
    let priority = 0;
    for (const decoder of partDecoderDispatch.candidates(normalizePartNumber(partNumber))) {
      if (decoder.match(partNumber)) {
        priority = Math.max(priority, decoder.priority ?? 0);
      }
    }
    return priority;
  };

  const inspectPartForDecodeClassification = (partNumber: string): PartDecodeDraft => {
    const info = detectRaw(partNumber, { combineFdb: true }, true);
    applyDramClassification(info);
    applyDramPublicType(info);
    pruneRedundantFields(info);
    return info;
  };

  const inspectPartForSearchClassification = (partNumber: string): PartDecodeDraft => {
    const info = detectRaw(partNumber, { combineFdb: false, projection: partSearchProjection }, true);
    applyDramClassification(info);
    applyDramPublicType(info);
    pruneRedundantFields(info);
    return info;
  };

  const partClassificationOptions = (mode: "decode" | "search", limit?: number) => ({
    indexes: normalizedIndexes,
    mode,
    ...(limit ? { limit } : {}),
    inspectPart: mode === "search" ? inspectPartForSearchClassification : inspectPartForDecodeClassification,
    decoderPriority: mode === "search" ? () => 0 : partDecoderPriority
  });

  const suggestionFromPartCandidate = (candidate: PartClassificationCandidate): PartSearchSuggestion => {
    const info = candidate.info ?? inspectPartForSearchClassification(candidate.partNumber);
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

  const shouldDefaultToFirstMarkingCandidate = (
    candidates: PartClassificationCandidate[],
    selected: PartClassificationCandidate | undefined
  ): selected is PartClassificationCandidate => {
    if (!selected?.markingMatch || !selected.markingCode || candidates.length < 2) {
      return false;
    }
    return candidates.every((candidate) => (
      candidate.markingMatch &&
      candidate.markingCode === selected.markingCode
    ));
  };

  const decodeSelectedPartCandidate = (
    candidate: PartClassificationCandidate,
    input: DecodePartInput,
    normalized: string,
    warnings: ResultWarning[] = []
  ): PartDecodeResult => {
    const baseInfo = candidate.info ?? inspectPartForDecodeClassification(candidate.partNumber);
    const baseFields = { ...(baseInfo.fields ?? {}) };
    const hasDetailFields = Object.entries(baseFields).some(([key, value]) => key !== "marking_code" && value !== undefined);
    const candidateInfo = candidate.markingMatch
      ? {
          ...baseInfo,
          device: {
            ...baseInfo.device,
            vendor: draftVendor(baseInfo) === UNKNOWN ? candidate.vendor : baseInfo.device.vendor,
            chipKind: baseInfo.device.chipKind === "unknown" ? candidate.chipKind : baseInfo.device.chipKind,
            productType: baseInfo.device.productType ?? candidate.productType,
            partNumber: candidate.partNumber
          },
          fields: hasDetailFields ? baseFields : { ...baseFields, micron_part_number: candidate.partNumber }
        }
      : baseInfo;
    const info = withMarkingCode(candidateInfo, candidate.markingMatch ? candidate.markingCode : undefined);
    const result = buildPartDecodeResult(
      projectPartControllers(info, input.controllerGroup),
      {
        query: input.query,
        normalized: candidate.markingMatch ? candidate.markingCode ?? normalized : normalized,
        constraints: input.constraints as OperationConstraints | undefined,
        lang: input.lang,
        controllerGroup: input.controllerGroup
      },
      resultBuilderContext
    );
    result.warnings.push(...warnings, ...candidate.warnings);
    return result;
  };

  const hasPartConstraints = (input: DecodePartInput): boolean =>
    Boolean(input.constraints && Object.keys(input.constraints).length > 0);

  const isPotentialMarkingDecode = (normalized: string): boolean => {
    const fbga = parseMicronFbgaCode(normalized) ?? parseKnownFiveDigitMicronFbgaCode(normalized, micronFbgaCodeSet);
    if (fbga) {
      return true;
    }
    const key = normalized.length === 10 ? normalized.slice(5) : normalized;
    return key.length === 5 && (mdb.micron[key] !== undefined || mdb.spectek[key] !== undefined);
  };

  const tryFastPartDecode = (input: DecodePartInput, normalized: string): PartDecodeResult | undefined => {
    if (options.resources || options.decoders || hasPartConstraints(input) || isPotentialMarkingDecode(normalized)) {
      return undefined;
    }
    const info = inspectPartForDecodeClassification(normalized);
    const result = buildPartDecodeResult(
      projectPartControllers(info, input.controllerGroup),
      {
        query: input.query,
        normalized,
        lang: input.lang,
        controllerGroup: input.controllerGroup
      },
      resultBuilderContext
    );
    if (result.status === "ok") {
      return result;
    }
    const tokenKey = normalizePartNumberTokenKey(normalized);
    const hasIndexedCandidate = [normalized, tokenKey].some((key) =>
      normalizedIndexes.partExactIndex.has(key) || normalizedIndexes.markingExactIndex.has(key)
    );
    // Without an indexed resource candidate, classifyPart can only add the same fallback candidate
    // and repeat this inspection. Keep classification for custom catalog-only exact records.
    return hasIndexedCandidate ? undefined : result;
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
      suggestions: classification.candidates.map((candidate) => suggestionFromPartCandidate(candidate)),
      warnings: classification.warnings
    };
  };

  const searchNandFlashIds = (id: string, opts: SearchOptions = {}): string[] => {
    const query = normalizeFlashId(id);
    const partMatch = opts.partialMatch ?? true;
    const limit = opts.limit ?? 0;

    if (!partMatch) {
      return fdb.flashIds.has(query) ? [query] : [];
    }

    const result: string[] = [];

    for (const flashId of fdb.flashIds.keys()) {
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

  const decodeIdentifierDraft = (input: DecodeIdentifierInput): IdentifierDecodeDraft | null => {
    const idScheme = input.idScheme ?? input.constraints?.idScheme ?? "nand.flash_id";
    if (idScheme !== "nand.flash_id" || !isNandFlashIdShape(input.query)) {
      return null;
    }
    return projectIdentifierControllers(decodeNandFlashIdRaw(input.query), input.controllerGroup);
  };

  const getCapabilities = (input: CapabilitiesInput = {}): FdnextCapabilities =>
    runOperation("capabilities", input, () => cloneObject(cachedCapabilitiesForLang(input.lang)));

  const decodePartDraft = (input: DecodePartInput): PartDecodeDraft | null => {
    const normalized = normalizePartNumber(input.query);
    if (!normalized) {
      return null;
    }
    const classification = classifyPart(input.query, input.constraints, partClassificationOptions("decode"));
    if (classification.status === "not_found" || !classification.selected) {
      return null;
    }
    if (classification.status === "ambiguous" && !shouldDefaultToFirstMarkingCandidate(classification.candidates, classification.selected)) {
      return null;
    }
    const candidate = classification.selected;
    const baseInfo = candidate.info ?? inspectPartForDecodeClassification(candidate.partNumber);
    const baseFields = { ...(baseInfo.fields ?? {}) };
    const hasDetailFields = Object.entries(baseFields).some(([key, value]) => key !== "marking_code" && value !== undefined);
    const candidateInfo = candidate.markingMatch
      ? {
          ...baseInfo,
          device: {
            ...baseInfo.device,
            vendor: draftVendor(baseInfo) === UNKNOWN ? candidate.vendor : baseInfo.device.vendor,
            chipKind: baseInfo.device.chipKind === "unknown" ? candidate.chipKind : baseInfo.device.chipKind,
            productType: baseInfo.device.productType ?? candidate.productType,
            partNumber: candidate.partNumber
          },
          fields: hasDetailFields ? baseFields : { ...baseFields, micron_part_number: candidate.partNumber }
        }
      : baseInfo;
    const info = withMarkingCode(candidateInfo, candidate.markingMatch ? candidate.markingCode : undefined);
    if (classification.warnings.length > 0 || candidate.warnings.length > 0) {
      info.warnings = [...(info.warnings ?? []), ...classification.warnings, ...candidate.warnings];
    }
    return projectPartControllers(info, input.controllerGroup);
  };

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
            ...(input.controllerGroup ? { controllerGroup: input.controllerGroup } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          warnings: [{ code: "empty_query", message: "Part query is empty", severity: "warning" }]
        };
      }
      const fastResult = tryFastPartDecode(input, normalized);
      if (fastResult) {
        return fastResult;
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
            ...(input.controllerGroup ? { controllerGroup: input.controllerGroup } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          warnings: classification.warnings
        };
      }
      if (classification.status === "ambiguous") {
        if (shouldDefaultToFirstMarkingCandidate(classification.candidates, classification.selected)) {
          const result = decodeSelectedPartCandidate(classification.selected, input, normalized);
          result.candidates = publicCandidatesFromPartClassification(classification.candidates, input.lang);
          return result;
        }
        return {
          schemaVersion: "fdnext.result.v1",
          operation: "part.decode",
          status: "ambiguous",
          input: {
            query: input.query,
            normalized,
            ...(input.lang ? { lang: input.lang } : {}),
            ...(input.controllerGroup ? { controllerGroup: input.controllerGroup } : {}),
            constraints: input.constraints ?? {}
          },
          blocks: [],
          relations: [],
          candidates: publicCandidatesFromPartClassification(classification.candidates, input.lang),
          warnings: classification.warnings
        };
      }
      return decodeSelectedPartCandidate(classification.selected, input, normalized, classification.warnings);
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
      const info = projectIdentifierControllers(decodeNandFlashIdRaw(input.query), input.controllerGroup);
      return buildIdentifierDecodeResult(
        info,
        {
          query: input.query,
          normalized,
          constraints,
          lang: input.lang,
          controllerGroup: input.controllerGroup
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
        normalized
          ? searchNandFlashIds(normalized, { lang: input.lang, limit: input.limit })
              .map(decodeNandFlashIdSearchHit)
          : [],
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
    decodePartDraft,
    decodePart,
    searchParts,
    decodeIdentifierDraft,
    decodeIdentifier,
    searchIdentifiers
  };
}
