import {
  createEngine,
  type FdnextResourceBundle,
  type IdentifierDecodeDraft,
  type PartDecodeDraft
} from "@itxtech/fdnext-core";
import { nandDieProfileTable } from "@itxtech/fdnext-core/decodepack";
import { isCompatibleVendor } from "./vendor-compat";
import { normalizeVendor } from "./vendors";

export type RelationCompatibility = "compatible" | "conflict" | "unknown";
type Draft = PartDecodeDraft | IdentifierDecodeDraft;

export interface RelationFacts {
  rawNand: boolean;
  profileKeys: string[];
  nativeKeys: string[];
  diesPerCe?: number;
  nativeDieDensity?: number;
  nativeDensityFromProfile: boolean;
  densityPerCe?: number;
  cell?: number;
  layers?: number;
  technology?: string;
  reducedCapacity: boolean;
  capacityModeUnknown: boolean;
  partialPackage: boolean;
  issues: string[];
}

export interface RelationDecision {
  status: RelationCompatibility;
  conflicts: string[];
  unknowns: string[];
  matches: string[];
}

// These are documented operating forms of the same native die. No general
// manufacturer-prefix substitution or arbitrary capacity ratio implies a match.
const NATIVE_PSLC_PROFILES: Readonly<Record<string, string>> = { M16A: "N18A", M26A: "N28A" };

const emptyResources = {
  partIndex: { rawNand: {}, managedNand: [], dram: [] },
  identifierIndex: { nandFlash: {} },
  markingIndex: { packageMarkings: {} },
  vendorIndex: {}, controllerIndex: {}, translationIndex: {}
} satisfies FdnextResourceBundle;

function positive(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function integer(value: unknown): number | undefined {
  const number = positive(value);
  return number !== undefined && Number.isSafeInteger(number) ? number : undefined;
}

function cellLevel(value: unknown): number | undefined {
  return integer(value) ?? ({ SLC: 1, MLC: 2, TLC: 3, QLC: 4, PLC: 5 } as Record<string, number>)[String(value).toUpperCase()];
}

function uniqueValue<T>(values: Array<T | undefined>): T | undefined {
  const distinct = new Set(values);
  return distinct.size === 1 ? values[0] : undefined;
}

function quotient(numerator: number | undefined, denominator: number | undefined): number | undefined {
  return numerator !== undefined && denominator !== undefined && numerator % denominator === 0 ? numerator / denominator : undefined;
}

export function readRelationFacts(draft: Draft | null | undefined, side: "part" | "identifier"): RelationFacts {
  const fields = draft?.fields ?? {};
  const profileKeys = [...new Set([draft?.meta?.nandDieProfileKey, ...(draft?.meta?.nandDieProfileKeys ?? [])])]
    .filter((key): key is string => typeof key === "string" && Object.hasOwn(nandDieProfileTable, key));
  const nativeKeys = profileKeys.map(key => NATIVE_PSLC_PROFILES[key] ?? key);
  const profiles = nativeKeys.map(key => nandDieProfileTable[key]);
  const pslc = profileKeys.some(key => NATIVE_PSLC_PROFILES[key] !== undefined);
  const vendor = normalizeVendor(String(draft?.device.vendor ?? ""));
  const capacityModeUnknown = side === "identifier" && vendor === "spectek";
  const reducedCapacity = pslc || fields.half_page_and_size === true || fields.density_grade !== undefined;
  const partialPackage = fields.package_functionality_partial_type !== undefined && fields.package_functionality_partial_type !== "spectek_pfpt_a";
  const dieCount = integer(fields.die_count);
  const ceCount = integer(fields.ce_count);
  const density = positive(fields.density);
  const dieDensity = positive(fields.die_density);
  const diesPerCe = side === "identifier" ? dieCount : quotient(dieCount, ceCount);
  const densityPerCe = side === "identifier" ? density : quotient(density, ceCount);
  const profileDensity = uniqueValue(profiles.map(profile => profile?.die_density));
  const profileCell = uniqueValue(profiles.map(profile => profile?.cell_level));
  const cell = pslc ? profileCell : cellLevel(fields.cell_level);
  const issues: string[] = [];
  if (fields.density !== undefined && density === undefined) issues.push("invalid_density");
  if (fields.die_count !== undefined && dieCount === undefined) issues.push("invalid_die_count");
  if (side === "part" && dieCount !== undefined && ceCount !== undefined && diesPerCe === undefined) issues.push("invalid_ce_topology");
  if (!reducedCapacity && !capacityModeUnknown && density !== undefined && dieDensity !== undefined && dieCount !== undefined && density !== dieDensity * dieCount) {
    issues.push("density_stack_conflict");
  }
  if (!pslc && profileCell !== undefined && cell !== undefined && profileCell !== cell) issues.push("cell_profile_conflict");
  if (!reducedCapacity && profileDensity !== undefined && dieDensity !== undefined && profileDensity !== dieDensity) {
    issues.push("die_density_profile_conflict");
  }

  // Legacy generic bitfields and placeholder IDs do not establish geometry.
  // In particular, old Intel D3 / Hynix 79 overlap modern density codes.
  const rule = draft?.meta?.ruleId ?? "";
  const identifier = draft?.device.identifier ?? "";
  const placeholder = side === "identifier" && /^(?:98|EC)0000/.test(identifier);
  const oldHynix = side === "identifier" && /^AD79A500/.test(identifier);
  const legacyIntel = side === "identifier" && vendor === "intel" && rule === "flashid.intel.v1" && cell === 1 && !profileKeys.length;
  const knownGeometry = !placeholder && !oldHynix && !legacyIntel;
  if (placeholder) issues.push("placeholder_identifier");
  if (side === "identifier" && identifier.startsWith("50504E")) issues.push("managed_identifier_signature");
  if (oldHynix || (!knownGeometry && side === "identifier")) issues.push("unresolved_identifier_layout");
  const rawNand = draft?.device.chipKind === "raw_nand";
  if (!rawNand) issues.push("undecoded_or_non_raw_nand");

  // A native profile remains useful across grading. Effective density cannot
  // be promoted to native density for a reduced or partially enabled package.
  const nativeDieDensity = profileDensity ?? (!reducedCapacity && !partialPackage && !capacityModeUnknown
    ? dieDensity ?? quotient(density, dieCount)
    : undefined);
  return {
    rawNand, profileKeys, nativeKeys,
    ...(knownGeometry ? { diesPerCe, densityPerCe, nativeDieDensity, cell } : {}),
    layers: integer(fields.layer_count),
    technology: typeof fields.nand_technology === "string" ? fields.nand_technology : undefined,
    nativeDensityFromProfile: profileDensity !== undefined,
    reducedCapacity, capacityModeUnknown, partialPackage, issues
  };
}

function specificDie(key: string): boolean {
  return /^[BLMN]\d{2}[A-Z0-9]+$/.test(key);
}

function profileCompatibility(left: string, right: string): RelationCompatibility {
  if (left === right) return "compatible";
  if (specificDie(left) && specificDie(right)) return "conflict";
  const a = nandDieProfileTable[left];
  const b = nandDieProfileTable[right];
  // Family / process labels can establish a conflict, but equal labels do not
  // prove die identity (TSB24 vs TSB24A/B, BiCS generations, HYV8 densities).
  if (a?.die_codename && b?.die_codename && a.die_codename !== b.die_codename) return "conflict";
  return "unknown";
}

function compareProfiles(part: RelationFacts, identifier: RelationFacts): RelationCompatibility {
  if (!part.nativeKeys.length || !identifier.nativeKeys.length) return "unknown";
  const states = part.nativeKeys.flatMap(a => identifier.nativeKeys.map(b => profileCompatibility(a, b)));
  if (states.every(state => state === "conflict")) return "conflict";
  // An ambiguous profile set is not resolved by one possible match.
  return states.every(state => state === "compatible") ? "compatible" : "unknown";
}

export function compareRelationFacts(part: RelationFacts, identifier: RelationFacts): RelationDecision {
  const conflicts: string[] = [];
  const matches: string[] = [];
  const unknowns = [...part.issues.map(issue => `part.${issue}`), ...identifier.issues.map(issue => `identifier.${issue}`)];
  // Inconsistent decoder output needs correction at its source. It cannot be
  // used as independent evidence to delete a controller-observed association.
  if (!part.rawNand || !identifier.rawNand || unknowns.length) return { status: "unknown", conflicts, matches, unknowns };
  const profile = compareProfiles(part, identifier);
  (profile === "conflict" ? conflicts : profile === "compatible" ? matches : unknowns).push("die_profile");
  const compare = (reason: string, a: number | string | undefined, b: number | string | undefined, enabled = true) => {
    (enabled && a !== undefined && b !== undefined ? a === b ? matches : conflicts : unknowns).push(reason);
  };
  const reduced = part.reducedCapacity || identifier.reducedCapacity || part.capacityModeUnknown || identifier.capacityModeUnknown;
  const partial = part.partialPackage || identifier.partialPackage;
  // Some BiCS M/S products are operating forms. Without a native die mapping,
  // their different cell level / effective capacity is not a native conflict.
  const bicsMode = profile !== "conflict" && [...part.nativeKeys, ...identifier.nativeKeys].some(key => {
    const die = nandDieProfileTable[key];
    return die?.die_codename?.startsWith("BiCS") && (die.cell_level === 1 || die.cell_level === 2);
  });
  compare("cell_level", part.cell, identifier.cell, !bicsMode);
  compare("layer_count", part.layers, identifier.layers);
  compare("nand_technology", part.technology, identifier.technology);
  compare("native_die_density", part.nativeDieDensity, identifier.nativeDieDensity,
    !bicsMode && (!reduced || (part.nativeDensityFromProfile && identifier.nativeDensityFromProfile)));
  compare("dies_per_ce", part.diesPerCe, identifier.diesPerCe, !partial);
  compare("density_per_ce", part.densityPerCe, identifier.densityPerCe, !reduced && !partial && !bicsMode);
  return {
    status: conflicts.length ? "conflict" : profile === "compatible" && matches.includes("native_die_density") && matches.includes("cell_level") &&
      (partial || matches.includes("dies_per_ce")) ? "compatible" : "unknown",
    conflicts, matches, unknowns
  };
}

export function createRelationMatcher() {
  // Deliberately exclude the FDB being validated: a relation must not confirm
  // itself through PN/ID enrichment. Reuse one engine and its immutable rules.
  const engine = createEngine({ resources: emptyResources });
  const parts = new Map<string, RelationFacts>();
  const identifiers = new Map<string, RelationFacts>();
  const decisions = new Map<string, RelationDecision>();
  const partFacts = (vendor: string, partNumber: string): RelationFacts => {
    const normalized = normalizeVendor(vendor);
    const key = `${normalized} ${partNumber}`;
    let facts = parts.get(key);
    if (!facts) {
      const draft = engine.decodePartDraft({ query: partNumber, constraints: { vendor: normalized } });
      facts = readRelationFacts(draft, "part");
      const decodedVendor = normalizeVendor(String(draft?.device.vendor ?? ""));
      if (decodedVendor && decodedVendor !== "unknown" && !isCompatibleVendor(normalized, decodedVendor)) facts.issues.push("vendor_conflict");
      parts.set(key, facts);
    }
    return facts;
  };
  const identifierFacts = (flashId: string): RelationFacts => {
    let facts = identifiers.get(flashId);
    if (!facts) {
      facts = readRelationFacts(engine.decodeIdentifierDraft({ query: flashId, idScheme: "nand.flash_id" }), "identifier");
      identifiers.set(flashId, facts);
    }
    return facts;
  };
  return {
    partFacts, identifierFacts,
    evaluate(vendor: string, partNumber: string, flashId: string): RelationDecision {
      const key = `${vendor} ${partNumber} ${flashId}`;
      let decision = decisions.get(key);
      if (!decision) {
        decision = compareRelationFacts(partFacts(vendor, partNumber), identifierFacts(flashId));
        decisions.set(key, decision);
      }
      return decision;
    }
  };
}

let defaultMatcher: ReturnType<typeof createRelationMatcher> | undefined;
export function getDefaultRelationMatcher(): ReturnType<typeof createRelationMatcher> {
  return defaultMatcher ??= createRelationMatcher();
}
