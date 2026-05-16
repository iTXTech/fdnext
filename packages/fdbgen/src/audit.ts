import { readFileSync } from "node:fs";
import { hasFlashPayloadControllers, hasFlashPayloadPartReferences } from "./flash-payload";
import {
  FDB_FLASH_ID_HEX_LENGTH,
  classifyFdbPartNumber,
  normalizeFdbPartKey,
  normalizeFdbPartNumber,
  normalizeFdbPartReference
} from "./normalize";
import { isGeneratedFdbDieProfile } from "./nand-die-profile";
import { hasVendorIdentityConflict, partNameAuditSignals } from "./part-name-rules";
import { isControllerOnlyPartPayload } from "./part-payload";
import type { FdbProvenanceRecord, FdbProvenanceSource, FdbProvenanceTrace } from "./trace";
import type { FlashIdPayload, PartNumberPayload } from "./types";
import { isCompatibleVendor } from "./vendor-compat";
import { inferVendorFromPartNumber } from "./vendors";

export type FdbAuditSeverity = "error" | "warning" | "info";

export interface FdbAuditOptions {
  maxSamples?: number;
  knownVendors?: readonly string[];
  trace?: FdbProvenanceTrace;
}

export interface FdbAuditIssueSource {
  sample: string;
  decision?: string;
  source?: FdbProvenanceSource;
  raw?: Record<string, unknown>;
  normalized?: Record<string, unknown>;
}

export interface FdbAuditIssue {
  code: string;
  severity: FdbAuditSeverity;
  message: string;
  count: number;
  samples: string[];
  sources: FdbAuditIssueSource[];
}

export interface FdbAuditSummary {
  name?: string;
  version?: string;
  controllers: number;
  vendors: number;
  partNumbers: number;
  flashIds: number;
  flashIdReferences: number;
  iddbPartReferences: number;
}

export interface FdbAuditVendorStats {
  vendor: string;
  partNumbers: number;
  flashIdReferences: number;
  syntheticPartNumbers: number;
  controllerOnlyPartNumbers: number;
}

export interface FdbAuditFanout {
  flashId: string;
  partNumbers: number;
  controllers: number;
  samples: string[];
}

export interface FdbAuditResult {
  summary: FdbAuditSummary;
  issues: FdbAuditIssue[];
  vendorStats: FdbAuditVendorStats[];
  topFlashIdFanout: FdbAuditFanout[];
  ok: boolean;
}

export const DEFAULT_FDB_AUDIT_VENDORS = [
  "ato",
  "fidelix",
  "infineon",
  "intel",
  "kioxia",
  "memoright",
  "micron",
  "mira",
  "mxic",
  "pfc",
  "phison",
  "powerchip",
  "renesas",
  "samsung",
  "skhynix",
  "smic",
  "sndk",
  "spansion",
  "spectek",
  "st",
  "winbond",
  "ymtc"
] as const;

const HEX_FLASH_ID = new RegExp(`^[0-9A-F]{${FDB_FLASH_ID_HEX_LENGTH}}$`);
const PUBLIC_ROOT_KEYS = new Set(["schemaVersion", "info", "iddb"]);
const DEFAULT_MAX_SAMPLES = 8;

const SEVERITY_ORDER: Record<FdbAuditSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

class IssueCollector {
  private readonly issues = new Map<string, FdbAuditIssue>();

  public constructor(private readonly maxSamples: number) {}

  public add(code: string, severity: FdbAuditSeverity, message: string, sample?: string, trace?: FdbProvenanceRecord): void {
    const existing = this.issues.get(code);
    const issue =
      existing ??
      ({
        code,
        severity,
        message,
        count: 0,
        samples: [],
        sources: []
      } satisfies FdbAuditIssue);

    issue.count += 1;
    if (sample && issue.samples.length < this.maxSamples && !issue.samples.includes(sample)) {
      issue.samples.push(sample);
    }
    if (sample && trace && issue.sources.length < this.maxSamples) {
      issue.sources.push({
        sample,
        decision: trace.decision,
        source: trace.source,
        raw: trace.raw,
        normalized: trace.normalized
      });
    }
    if (!existing) {
      this.issues.set(code, issue);
    }
  }

  public list(): FdbAuditIssue[] {
    return [...this.issues.values()].sort((left, right) => {
      const severityDiff = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.code.localeCompare(right.code);
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function asPartPayload(value: unknown): PartNumberPayload | undefined {
  return asRecord(value) as PartNumberPayload | undefined;
}

function asFlashIdPayload(value: unknown): FlashIdPayload | undefined {
  return asRecord(value) as FlashIdPayload | undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function hasUnexpectedPunctuation(partNumber: string): boolean {
  return /[^A-Z0-9-]/.test(partNumber);
}

function addFlashIdReference(
  collector: IssueCollector,
  iddb: Record<string, unknown>,
  idFanout: Map<string, Set<string>>,
  referenceCount: { value: number },
  vendor: string,
  partNumber: string,
  flashId: string,
  field: "id" | "f",
  trace?: FdbProvenanceTrace
): void {
  referenceCount.value += 1;
  const sample = `${vendor} ${partNumber}.${field} -> ${flashId}`;
  const sourceTrace = trace?.part(vendor, partNumber)[0] ?? trace?.flash(flashId)[0];
  if (!HEX_FLASH_ID.test(flashId)) {
    collector.add("part.invalid_flash_id_ref", "error", "Part-number records must reference 6-byte / 12-hex Flash IDs.", sample, sourceTrace);
    return;
  }
  if (!iddb[flashId]) {
    collector.add("flash_id.missing_iddb", "error", "Part-number Flash ID references must exist in iddb.", sample, sourceTrace);
    return;
  }
  let fanout = idFanout.get(flashId);
  if (!fanout) {
    fanout = new Set<string>();
    idFanout.set(flashId, fanout);
  }
  fanout.add(`${vendor} ${partNumber}`);
}

export function auditFdb(input: unknown, options: FdbAuditOptions = {}): FdbAuditResult {
  const fdb = asRecord(input);
  if (!fdb) {
    throw new Error("FDB payload must be a JSON object");
  }

  const maxSamples = Math.max(1, options.maxSamples ?? DEFAULT_MAX_SAMPLES);
  const collector = new IssueCollector(maxSamples);
  const knownVendors = new Set(options.knownVendors ?? DEFAULT_FDB_AUDIT_VENDORS);
  const trace = options.trace;
  const info = asRecord(fdb.info) ?? {};
  const iddb = asRecord(fdb.iddb) ?? {};
  const controllerList = asStringArray(info.controllers);
  const vendorPayloads = new Map<string, Record<string, unknown>>();
  const allPartKeys = new Set<string>();

  for (const [key, value] of Object.entries(fdb)) {
    if (PUBLIC_ROOT_KEYS.has(key)) {
      continue;
    }
    const payload = asRecord(value);
    if (!payload) {
      collector.add("vendor.invalid_payload", "error", "Vendor payloads must be JSON objects.", key);
      continue;
    }
    vendorPayloads.set(key, payload);
    for (const partNumber of Object.keys(payload)) {
      allPartKeys.add(normalizeFdbPartKey(key, partNumber));
    }
  }

  const idFanout = new Map<string, Set<string>>();
  const vendorStats: FdbAuditVendorStats[] = [];
  const flashIdReferenceCount = { value: 0 };
  let partNumberCount = 0;

  for (const [vendor, payload] of vendorPayloads) {
    const stat: FdbAuditVendorStats = {
      vendor,
      partNumbers: 0,
      flashIdReferences: 0,
      syntheticPartNumbers: 0,
      controllerOnlyPartNumbers: 0
    };
    if (!knownVendors.has(vendor)) {
      const sampleParts = Object.keys(payload).slice(0, Math.min(3, maxSamples)).join(", ");
      const firstPart = Object.keys(payload)[0] ?? "";
      collector.add(
        "vendor.unknown",
        "warning",
        "Top-level vendor buckets should be normalized to the known FDB vendor set.",
        `${vendor} (${Object.keys(payload).length} parts): ${sampleParts}`,
        firstPart ? trace?.part(vendor, firstPart)[0] : undefined
      );
    }

    for (const [rawPartNumber, rawRecord] of Object.entries(payload)) {
      const partNumber = rawPartNumber.trim().toUpperCase();
      const record = asPartPayload(rawRecord);
      const partTrace = trace?.part(vendor, partNumber)[0];
      partNumberCount += 1;
      stat.partNumbers += 1;

      if (!record) {
        collector.add("part.invalid_payload", "error", "Part-number payloads must be JSON objects.", `${vendor} ${rawPartNumber}`, partTrace);
        continue;
      }

      if (rawPartNumber !== partNumber) {
        collector.add("part.non_canonical_key", "warning", "Part-number keys should be uppercase and trimmed.", `${vendor} ${rawPartNumber}`, partTrace);
      }
      if (partNumber.length < 5) {
        collector.add("part.too_short", "warning", "Very short part-number keys are usually date codes or controller-local labels.", `${vendor} ${partNumber}`, partTrace);
      }
      if (hasUnexpectedPunctuation(partNumber)) {
        collector.add("part.punctuation", "warning", "Part-number keys should avoid punctuation except hyphen.", `${vendor} ${partNumber}`, partTrace);
      }
      for (const signal of partNameAuditSignals(partNumber)) {
        collector.add(signal.code, "warning", signal.message, `${vendor} ${partNumber}`, partTrace);
      }
      const classification = classifyFdbPartNumber(partNumber);
      if (classification.kind === "synthetic_alias" || classification.kind === "family_label" || classification.kind === "date_code") {
        stat.syntheticPartNumbers += 1;
        collector.add("part.synthetic", "warning", "Synthetic labels and description fragments should not live in vendor PN tables.", `${vendor} ${partNumber}`, partTrace);
      }

      const inferredVendor = inferVendorFromPartNumber(partNumber);
      if (inferredVendor && !isCompatibleVendor(vendor, inferredVendor)) {
        collector.add("part.vendor_mismatch", "error", "Deterministic PN prefixes should be stored under their inferred vendor bucket.", `${vendor} ${partNumber} -> ${inferredVendor}`, partTrace);
      }
      if (
        hasVendorIdentityConflict({
          storedVendor: vendor,
          partNumber,
          rawVendor: partTrace?.raw?.vendor,
          flashIds: [...asStringArray(record.id), ...asStringArray(record.f)]
        })
      ) {
        collector.add(
          "part.vendor_identity_conflict",
          "warning",
          "Raw vendor and Flash ID vendor agree with each other but conflict with the stored PN vendor bucket.",
          `${vendor} ${partNumber}`,
          partTrace
        );
      }

      if (isControllerOnlyPartPayload(record)) {
        stat.controllerOnlyPartNumbers += 1;
        collector.add("part.controller_only", "info", "Controller-only PN records should be reduced or moved out of authoritative PN tables.", `${vendor} ${partNumber}`, partTrace);
      }
      if (record.l && !isGeneratedFdbDieProfile(record.l)) {
        collector.add(
          "part.invalid_die_profile",
          "error",
          "Generated FDB l fields must use a nand.die_profile key or an approved process fallback profile.",
          `${vendor} ${partNumber}.l=${record.l}`,
          partTrace
        );
      }

      for (const flashId of asStringArray(record.id)) {
        stat.flashIdReferences += 1;
        addFlashIdReference(collector, iddb, idFanout, flashIdReferenceCount, vendor, partNumber, flashId, "id", trace);
      }
      for (const flashId of asStringArray(record.f)) {
        stat.flashIdReferences += 1;
        addFlashIdReference(collector, iddb, idFanout, flashIdReferenceCount, vendor, partNumber, flashId, "f", trace);
      }
      for (const alias of asStringArray(record.a)) {
        const aliasKey = normalizeFdbPartReference(alias) ?? normalizeFdbPartKey(vendor, alias);
        if (!allPartKeys.has(aliasKey)) {
          collector.add("reference.missing_alias", "warning", "Part-number alias references should point to an existing PN record.", `${vendor} ${partNumber}.a -> ${alias}`, partTrace);
        }
      }
    }
    vendorStats.push(stat);
  }

  let iddbPartReferences = 0;
  for (const [flashId, rawRecord] of Object.entries(iddb)) {
    const record = asFlashIdPayload(rawRecord);
    const flashTrace = trace?.flash(flashId)[0];
    if (!HEX_FLASH_ID.test(flashId)) {
      collector.add("flash_id.invalid_key", "error", "iddb keys must be normalized to 6-byte / 12-hex Flash IDs.", flashId, flashTrace);
    }
    if (!record) {
      collector.add("iddb.invalid_payload", "error", "iddb payloads must be JSON objects.", flashId, flashTrace);
      continue;
    }

    const references = asStringArray(record.n);
    iddbPartReferences += references.length;
    if (!hasFlashPayloadPartReferences(record)) {
      collector.add("iddb.no_part_ref", "info", "Flash ID records without iddb.n cannot be reached from a canonical PN.", flashId, flashTrace);
    }
    for (const reference of references) {
      const normalized = normalizeFdbPartReference(reference);
      if (!normalized) {
        collector.add("reference.invalid_iddb_n", "error", "iddb.n entries must use '<vendor> <partNumber>' format.", `${flashId}.n -> ${reference}`, flashTrace);
        continue;
      }
      if (!allPartKeys.has(normalized)) {
        collector.add("reference.missing_iddb_n", "error", "iddb.n reverse references must point to existing vendor PN records.", `${flashId}.n -> ${reference}`, flashTrace);
      }
    }

    if (!hasFlashPayloadControllers(record)) {
      collector.add("iddb.no_controller", "info", "Flash ID records without controller support are lower-confidence lookup entries.", flashId, flashTrace);
    }
  }

  const topFlashIdFanout = [...idFanout.entries()]
    .filter(([, parts]) => parts.size > 1)
    .map(([flashId, parts]) => ({
      flashId,
      partNumbers: parts.size,
      controllers: asStringArray(asFlashIdPayload(iddb[flashId])?.t).length,
      samples: [...parts].sort().slice(0, maxSamples)
    }))
    .sort((left, right) => right.partNumbers - left.partNumbers || left.flashId.localeCompare(right.flashId))
    .slice(0, 10);

  const issues = collector.list();
  return {
    summary: {
      name: stringValue(info.name),
      version: stringValue(info.version),
      controllers: controllerList.length,
      vendors: vendorPayloads.size,
      partNumbers: partNumberCount,
      flashIds: Object.keys(iddb).length,
      flashIdReferences: flashIdReferenceCount.value,
      iddbPartReferences
    },
    issues,
    vendorStats: vendorStats.sort((left, right) => left.vendor.localeCompare(right.vendor)),
    topFlashIdFanout,
    ok: !issues.some((issue) => issue.severity === "error")
  };
}

export function auditFdbFile(file: string, options: FdbAuditOptions = {}): FdbAuditResult {
  return auditFdb(JSON.parse(readFileSync(file, "utf8")) as unknown, options);
}

function formatSource(source: FdbAuditIssueSource): string {
  const location = source.source
    ? [
        source.source.controller,
        source.source.file ?? source.source.filename,
        source.source.line !== undefined ? `line ${source.source.line}` : undefined,
        source.source.recordIndex !== undefined ? `record ${source.source.recordIndex}` : undefined
      ]
        .filter(Boolean)
        .join(" ")
    : "unknown source";
  const raw = source.source?.raw ? ` raw=${JSON.stringify(source.source.raw)}` : "";
  const normalized = source.normalized ? ` normalized=${JSON.stringify(source.normalized)}` : "";
  return `${source.sample} <= ${location} decision=${source.decision ?? "unknown"}${raw}${normalized}`;
}

export function formatFdbAuditText(result: FdbAuditResult, file?: string): string {
  const lines: string[] = [];
  const summary = result.summary;
  lines.push(file ? `FDB audit: ${file}` : "FDB audit");
  lines.push(
    `Summary: version=${summary.version ?? "unknown"} controllers=${summary.controllers} vendors=${summary.vendors} parts=${summary.partNumbers} flashIds=${summary.flashIds} flashIdRefs=${summary.flashIdReferences} iddbRefs=${summary.iddbPartReferences}`
  );
  lines.push(`Status: ${result.ok ? "no errors" : "has errors"}`);
  lines.push("");

  if (result.issues.length === 0) {
    lines.push("Issues: none");
  } else {
    lines.push("Issues:");
    for (const issue of result.issues) {
      lines.push(`  ${issue.severity.toUpperCase()} ${issue.code} count=${issue.count} - ${issue.message}`);
      for (const sample of issue.samples) {
        lines.push(`    - ${sample}`);
      }
      if (issue.sources.length > 0) {
        lines.push("    sources:");
        for (const source of issue.sources) {
          lines.push(`      - ${formatSource(source)}`);
        }
      }
    }
  }

  if (result.topFlashIdFanout.length > 0) {
    lines.push("");
    lines.push("Top Flash ID fanout:");
    for (const item of result.topFlashIdFanout) {
      lines.push(`  ${item.flashId} parts=${item.partNumbers} controllers=${item.controllers}`);
      for (const sample of item.samples) {
        lines.push(`    - ${sample}`);
      }
    }
  }

  return `${lines.join("\n")}\n`;
}
