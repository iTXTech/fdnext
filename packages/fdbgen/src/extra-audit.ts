import { validateExtraPayload, validateFdbPayload, normalizeExtraPayload, normalizeFdbPayload } from "./extra";
import {
  classifyFdbPartNumber,
  normalizeFdbFlashId,
  normalizeFdbPartNumber,
  normalizeFdbVendorName
} from "./normalize";
import { partNameAuditSignals } from "./part-name-rules";
import type { ExtraPayload, FlashIdPayload, PartNumberPayload } from "./types";
import { isCompatibleVendor } from "./vendor-compat";
import { inferVendorFromPartNumber } from "./vendors";

export type ExtraAuditSeverity = "error" | "warning" | "info";

export interface ExtraAuditIssue {
  code: string;
  severity: ExtraAuditSeverity;
  message: string;
  count: number;
  samples: string[];
}

export interface ExtraAuditSummary {
  candidateVendors: number;
  candidatePartNumbers: number;
  candidateFlashIdRefs: number;
  baseExtraPartNumbers?: number;
  baseFdbPartNumbers?: number;
  decodepackChecked: number;
}

export interface ExtraAuditDecodeResult {
  status: string;
  vendor?: string;
  chipKind?: string;
  productType?: string;
  fields?: Record<string, unknown>;
}

export type ExtraAuditDecodePart = (
  partNumber: string,
  vendor: string,
  payload: PartNumberPayload
) => ExtraAuditDecodeResult | null | undefined;

export interface ExtraAuditOptions {
  baseExtra?: unknown;
  baseFdb?: unknown;
  decodePart?: ExtraAuditDecodePart;
  maxSamples?: number;
}

export interface ExtraAuditResult {
  summary: ExtraAuditSummary;
  issues: ExtraAuditIssue[];
  ok: boolean;
}

interface PartRecord {
  vendor: string;
  partNumber: string;
  payload: PartNumberPayload;
}

const DEFAULT_MAX_SAMPLES = 8;
const SEVERITY_ORDER: Record<ExtraAuditSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};
const COMPARE_FIELDS = ["id", "fid", "f", "a", "l", "c", "t", "m", "d", "e", "r", "n"] as const;

class IssueCollector {
  private readonly issues = new Map<string, ExtraAuditIssue>();

  public constructor(private readonly maxSamples: number) {}

  public add(code: string, severity: ExtraAuditSeverity, message: string, sample?: string): void {
    const issue =
      this.issues.get(code) ??
      ({
        code,
        severity,
        message,
        count: 0,
        samples: []
      } satisfies ExtraAuditIssue);
    issue.count += 1;
    if (sample && issue.samples.length < this.maxSamples && !issue.samples.includes(sample)) {
      issue.samples.push(sample);
    }
    this.issues.set(code, issue);
  }

  public list(): ExtraAuditIssue[] {
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
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function payloads(input: ExtraPayload | undefined): PartRecord[] {
  const records: PartRecord[] = [];
  for (const [vendor, parts] of Object.entries(input?.vendors ?? {})) {
    for (const [partNumber, payload] of Object.entries(parts)) {
      records.push({ vendor, partNumber, payload });
    }
  }
  return records.sort((left, right) => `${left.vendor} ${left.partNumber}`.localeCompare(`${right.vendor} ${right.partNumber}`));
}

function partKey(vendor: string, partNumber: string): string {
  return `${normalizeFdbVendorName(vendor)} ${normalizeFdbPartNumber(partNumber)}`;
}

function payloadPartMap(input: ExtraPayload | undefined): Map<string, PartRecord> {
  const map = new Map<string, PartRecord>();
  for (const record of payloads(input)) {
    map.set(partKey(record.vendor, record.partNumber), record);
  }
  return map;
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify([...value].sort());
  }
  return JSON.stringify(value ?? null);
}

function formatValue(value: unknown): string {
  return Array.isArray(value) ? `[${value.join(", ")}]` : String(value ?? "missing");
}

function canonicalIds(payload: PartNumberPayload): string[] {
  return payload.fid && payload.fid.length > 0 ? payload.fid : payload.id ?? [];
}

function hasCanonicalIds(payload: PartNumberPayload | undefined): boolean {
  return payload ? canonicalIds(payload).length > 0 : false;
}

function allFlashIds(payload: PartNumberPayload): string[] {
  return [...new Set([...(payload.fid ?? []), ...(payload.id ?? []), ...(payload.f ?? [])])];
}

function countPartNumbers(input: ExtraPayload | undefined): number {
  return payloads(input).length;
}

function countFlashIdRefs(input: ExtraPayload): number {
  return payloads(input).reduce((total, record) => total + allFlashIds(record.payload).length, 0);
}

function buildIdFanout(input: ExtraPayload | undefined): Map<string, Set<string>> {
  const fanout = new Map<string, Set<string>>();
  for (const record of payloads(input)) {
    for (const id of allFlashIds(record.payload)) {
      const normalized = normalizeFdbFlashId(id);
      if (!normalized) {
        continue;
      }
      const refs = fanout.get(normalized) ?? new Set<string>();
      refs.add(`${record.vendor} ${record.partNumber}`);
      fanout.set(normalized, refs);
    }
  }
  return fanout;
}

function protectedByHigherPriorityBase(candidate: ExtraPayload, baseExtra: ExtraPayload | undefined, record: PartRecord): boolean {
  if (!baseExtra || (baseExtra.priority ?? 0) <= (candidate.priority ?? 0)) {
    return false;
  }
  const base = payloadPartMap(baseExtra).get(partKey(record.vendor, record.partNumber));
  return hasCanonicalIds(base?.payload);
}

function iddbRecord(input: ExtraPayload | undefined, flashId: string): FlashIdPayload | undefined {
  return input?.iddb?.[flashId];
}

function addValidationIssues(collector: IssueCollector, label: string, validation: ReturnType<typeof validateExtraPayload>): void {
  for (const issue of [...validation.errors, ...validation.warnings]) {
    collector.add(`${label}.${issue.code}`, issue.severity, issue.message, `${issue.path || "/"} ${issue.code}`);
  }
}

function auditRawPartQuality(collector: IssueCollector, raw: unknown): void {
  const source = asRecord(raw);
  if (!source) {
    return;
  }
  const entries: Array<{ vendor: string; records: Record<string, unknown>; path: string }> = [];
  const wrapped = asRecord(source.vendors);
  if (wrapped) {
    for (const [vendor, records] of Object.entries(wrapped)) {
      const bucket = asRecord(records);
      if (bucket) entries.push({ vendor, records: bucket, path: `/vendors/${vendor}` });
    }
  }
  for (const [vendor, records] of Object.entries(source)) {
    if (vendor === "schemaVersion" || vendor === "priority" || vendor === "info" || vendor === "iddb" || vendor === "vendors" || vendor === "controllerBlacklist") {
      continue;
    }
    const bucket = asRecord(records);
    if (bucket) entries.push({ vendor, records: bucket, path: `/${vendor}` });
  }

  for (const { vendor, records, path } of entries) {
    const normalizedVendor = normalizeFdbVendorName(vendor);
    for (const [rawPartNumber, payload] of Object.entries(records)) {
      const partNumber = normalizeFdbPartNumber(rawPartNumber) || rawPartNumber.trim().toUpperCase();
      const sample = `${path}/${rawPartNumber}`;
      if (!partNumber) {
        collector.add("part.invalid_key", "error", "Part-number keys must normalize to a usable PN.", sample);
        continue;
      }
      for (const signal of partNameAuditSignals(partNumber)) {
        collector.add(signal.code, "warning", signal.message, `${normalizedVendor} ${partNumber}`);
      }
      const classification = classifyFdbPartNumber(partNumber);
      if (classification.kind !== "exact_pn") {
        collector.add("part.synthetic", "warning", "Synthetic labels and description fragments should not be merged into authoritative PN tables.", `${normalizedVendor} ${partNumber}`);
      }
      const inferredVendor = inferVendorFromPartNumber(partNumber);
      if (inferredVendor && !isCompatibleVendor(normalizedVendor, inferredVendor)) {
        collector.add("part.vendor_mismatch", "error", "Deterministic PN prefixes should be stored under their inferred vendor bucket.", `${normalizedVendor} ${partNumber} -> ${inferredVendor}`);
      }
      const rawPayload = asRecord(payload);
      const ids = rawPayload ? [...asStringArray(rawPayload.id), ...asStringArray(rawPayload.fid), ...asStringArray(rawPayload.f)] : [];
      for (const id of ids) {
        if (!normalizeFdbFlashId(id)) {
          collector.add("flash_id.invalid_value", "error", "Flash ID values must be at least 6 bytes / 12 hex and normalize to generated FDB IDs.", `${normalizedVendor} ${partNumber} -> ${id}`);
        }
      }
    }
  }
}

function auditAgainstBaseExtra(collector: IssueCollector, candidate: ExtraPayload, baseExtra: ExtraPayload | undefined): void {
  if (!baseExtra) {
    return;
  }
  const baseMap = payloadPartMap(baseExtra);
  for (const record of payloads(candidate)) {
    const base = baseMap.get(partKey(record.vendor, record.partNumber));
    if (!base) {
      continue;
    }
    for (const field of COMPARE_FIELDS) {
      const candidateValue = record.payload[field];
      const baseValue = base.payload[field];
      const baseProtectsField = (baseExtra.priority ?? 0) > (candidate.priority ?? 0) && baseValue !== undefined;
      if (candidateValue !== undefined && baseValue !== undefined && stableValue(candidateValue) !== stableValue(baseValue)) {
        if (baseProtectsField) {
          continue;
        }
        collector.add(
          field === "fid" || field === "id" ? "extra.base_id_conflict" : "extra.base_field_conflict",
          "warning",
          "Candidate extra payload differs from the existing extra.json record for the same vendor PN.",
          `${record.vendor} ${record.partNumber}.${field}: candidate=${formatValue(candidateValue)} base=${formatValue(baseValue)}`
        );
      }
      if ((field === "a" || field === "t") && candidateValue === undefined && baseValue !== undefined) {
        collector.add(
          "extra.base_missing_linkage",
          "info",
          "Existing extra.json has aliases or controller support that the candidate record does not carry.",
          `${record.vendor} ${record.partNumber}.${field}: base=${formatValue(baseValue)}`
        );
      }
    }
    const forced = record.payload.fid;
    const existingIds = base.payload.fid ?? base.payload.id;
    if (
      forced &&
      forced.length > 0 &&
      existingIds &&
      stableValue(forced) !== stableValue(existingIds) &&
      (baseExtra.priority ?? 0) <= (candidate.priority ?? 0)
    ) {
      collector.add(
        "extra.fid_overrides_base",
        "warning",
        "Candidate fid will directly override existing extra.json ID data for the same PN.",
        `${record.vendor} ${record.partNumber}: fid=${formatValue(forced)} base=${formatValue(existingIds)}`
      );
    }
  }
}

function auditAgainstFdb(
  collector: IssueCollector,
  candidate: ExtraPayload,
  fdb: ExtraPayload | undefined,
  baseExtra: ExtraPayload | undefined
): void {
  if (!fdb) {
    return;
  }
  const fdbMap = payloadPartMap(fdb);
  const idFanout = buildIdFanout(fdb);
  for (const record of payloads(candidate)) {
    const fdbRecord = fdbMap.get(partKey(record.vendor, record.partNumber));
    const candidateIds = canonicalIds(record.payload);
    if (candidateIds.length === 0) {
      continue;
    }
    if (protectedByHigherPriorityBase(candidate, baseExtra, record)) {
      continue;
    }
    const fdbIds = fdbRecord?.payload.id ?? [];
    if (fdbRecord && fdbIds.length > 0 && stableValue(candidateIds) !== stableValue(fdbIds)) {
      collector.add(
        "fdb.id_override",
        "warning",
        "Candidate fid/id will change the generated fdb.json ID list for an existing PN.",
        `${record.vendor} ${record.partNumber}: candidate=${formatValue(candidateIds)} fdb=${formatValue(fdbIds)}`
      );
      for (const oldId of fdbIds.filter((id) => !candidateIds.includes(id))) {
        const oldPayload = iddbRecord(fdb, oldId);
        if ((oldPayload?.t ?? []).length > 0) {
          collector.add(
            "fdb.override_controller_support",
            "warning",
            "An overwritten Flash ID has controller support in generated fdb.json.",
            `${record.vendor} ${record.partNumber}: ${oldId} controllers=${formatValue(oldPayload?.t)}`
          );
        }
        const otherRefs = (oldPayload?.n ?? []).filter((ref) => partKey(record.vendor, record.partNumber) !== partKey(ref.split(" ")[0] ?? "", ref.split(" ").slice(1).join(" ")));
        if (otherRefs.length > 0) {
          collector.add(
            "fdb.override_referenced_id",
            "warning",
            "An overwritten Flash ID is still referenced by other PN records.",
            `${record.vendor} ${record.partNumber}: ${oldId} refs=${formatValue(otherRefs)}`
          );
        }
      }
    }
    for (const id of candidateIds) {
      const refs = idFanout.get(id);
      if (!refs || refs.size === 0) {
        continue;
      }
      const ownKey = `${record.vendor} ${record.partNumber}`;
      const otherRefs = [...refs].filter((ref) => ref !== ownKey);
      if (otherRefs.length > 0) {
        collector.add(
          fdbRecord ? "fdb.id_fanout" : "fdb.new_part_existing_id",
          "info",
          "Candidate Flash ID is already used by other generated FDB part records.",
          `${record.vendor} ${record.partNumber}: ${id} refs=${formatValue(otherRefs)}`
        );
      }
    }
  }
}

function normalizeTextValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return text || undefined;
}

function equivalentText(left: unknown, right: unknown): boolean {
  const a = normalizeTextValue(left);
  const b = normalizeTextValue(right);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

function fieldValue(fields: Record<string, unknown> | undefined, keys: readonly string[]): unknown {
  if (!fields) {
    return undefined;
  }
  for (const key of keys) {
    if (fields[key] !== undefined) {
      return fields[key];
    }
  }
  return undefined;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const match = /\d+/.exec(value);
    return match?.[0] ? Number.parseInt(match[0], 10) : undefined;
  }
  return undefined;
}

function cellValue(value: unknown): number | string | undefined {
  const text = normalizeTextValue(value);
  if (!text) {
    return undefined;
  }
  if (text === "slc") return 1;
  if (text === "mlc") return 2;
  if (text === "tlc") return 3;
  if (text === "qlc") return 4;
  const number = numericValue(value);
  return number ?? text;
}

function auditDecodepack(collector: IssueCollector, candidate: ExtraPayload, decodePart: ExtraAuditDecodePart | undefined): number {
  if (!decodePart) {
    return 0;
  }
  let checked = 0;
  for (const record of payloads(candidate)) {
    checked += 1;
    const decoded = decodePart(record.partNumber, record.vendor, record.payload);
    if (!decoded || decoded.status !== "ok") {
      collector.add(
        "decodepack.not_found",
        "info",
        "decodepack did not return an ok PN decode for a candidate extra record.",
        `${record.vendor} ${record.partNumber}: status=${decoded?.status ?? "missing"}`
      );
      continue;
    }
    if (decoded.vendor && !isCompatibleVendor(record.vendor, normalizeFdbVendorName(decoded.vendor))) {
      collector.add(
        "decodepack.vendor_conflict",
        "error",
        "decodepack PN vendor conflicts with the candidate extra vendor bucket.",
        `${record.vendor} ${record.partNumber}: decodepack=${decoded.vendor}`
      );
    }
    const decodedProcess = fieldValue(decoded.fields, ["process_node", "generation_info"]);
    if (record.payload.l && decodedProcess === undefined) {
      collector.add(
        "decodepack.missing_process",
        "info",
        "decodepack did not expose the process/generation carried by the candidate extra record.",
        `${record.vendor} ${record.partNumber}: extra=${record.payload.l}`
      );
    } else if (record.payload.l && decodedProcess !== undefined && !equivalentText(record.payload.l, decodedProcess)) {
      collector.add(
        "decodepack.process_conflict",
        "warning",
        "decodepack process/generation output conflicts with the candidate extra record.",
        `${record.vendor} ${record.partNumber}: extra=${record.payload.l} decodepack=${formatValue(decodedProcess)}`
      );
    }
    const candidateCell = cellValue(record.payload.c);
    const decodedCell = cellValue(fieldValue(decoded.fields, ["cell_level"]));
    if (candidateCell !== undefined && decodedCell !== undefined && candidateCell !== decodedCell) {
      collector.add(
        "decodepack.cell_conflict",
        "warning",
        "decodepack cell_level output conflicts with the candidate extra record.",
        `${record.vendor} ${record.partNumber}: extra=${record.payload.c} decodepack=${formatValue(fieldValue(decoded.fields, ["cell_level"]))}`
      );
    }
    const topologyFields = [
      ["d", ["die_count", "die_stack"]],
      ["e", ["ce_count"]],
      ["r", ["rb_count"]],
      ["n", ["channel_count"]]
    ] as const;
    for (const [candidateField, decodedKeys] of topologyFields) {
      const candidateValue = record.payload[candidateField];
      const decodedValue = numericValue(fieldValue(decoded.fields, decodedKeys));
      if (candidateValue !== undefined && decodedValue !== undefined && candidateValue !== decodedValue) {
        collector.add(
          "decodepack.topology_conflict",
          "warning",
          "decodepack topology output conflicts with the candidate extra record.",
          `${record.vendor} ${record.partNumber}.${candidateField}: extra=${candidateValue} decodepack=${decodedValue}`
        );
      }
    }
  }
  return checked;
}

export function auditExtra(candidateInput: unknown, options: ExtraAuditOptions = {}): ExtraAuditResult {
  const maxSamples = Math.max(1, options.maxSamples ?? DEFAULT_MAX_SAMPLES);
  const collector = new IssueCollector(maxSamples);
  const candidateValidation = validateExtraPayload(candidateInput);
  addValidationIssues(collector, "candidate", candidateValidation);
  if (options.baseFdb) {
    addValidationIssues(collector, "base_fdb", validateFdbPayload(options.baseFdb));
  }

  auditRawPartQuality(collector, candidateInput);

  const candidate = normalizeExtraPayload(candidateInput);
  const baseExtra = options.baseExtra ? normalizeExtraPayload(options.baseExtra) : undefined;
  const baseFdb = options.baseFdb ? normalizeFdbPayload(options.baseFdb) : undefined;
  auditAgainstBaseExtra(collector, candidate, baseExtra);
  auditAgainstFdb(collector, candidate, baseFdb, baseExtra);
  const decodepackChecked = auditDecodepack(collector, candidate, options.decodePart);
  const issues = collector.list();

  return {
    summary: {
      candidateVendors: Object.keys(candidate.vendors ?? {}).length,
      candidatePartNumbers: countPartNumbers(candidate),
      candidateFlashIdRefs: countFlashIdRefs(candidate),
      ...(baseExtra ? { baseExtraPartNumbers: countPartNumbers(baseExtra) } : {}),
      ...(baseFdb ? { baseFdbPartNumbers: countPartNumbers(baseFdb) } : {}),
      decodepackChecked
    },
    issues,
    ok: !issues.some((issue) => issue.severity === "error")
  };
}

export function formatExtraAuditText(result: ExtraAuditResult, label?: string): string {
  const lines: string[] = [];
  const summary = result.summary;
  lines.push(label ? `extra audit: ${label}` : "extra audit");
  lines.push(
    `Summary: candidateVendors=${summary.candidateVendors} candidateParts=${summary.candidatePartNumbers} candidateFlashIdRefs=${summary.candidateFlashIdRefs} baseExtraParts=${summary.baseExtraPartNumbers ?? 0} baseFdbParts=${summary.baseFdbPartNumbers ?? 0} decodepackChecked=${summary.decodepackChecked}`
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
    }
  }
  return `${lines.join("\n")}\n`;
}
