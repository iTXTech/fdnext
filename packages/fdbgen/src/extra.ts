import { DEFAULT_FDB_AUDIT_VENDORS } from "./audit";
import { isGeneratedFdbDieProfile } from "./nand-die-profile";
import {
  normalizeFdbControllerName,
  normalizeFdbFlashId,
  normalizeFdbPartNumber,
  normalizeFdbPartReference,
  normalizeFdbVendorName
} from "./normalize";
import { isStrictSupportListFlashIdVendorCompatible } from "./support-list";
import type { ExtraPayload, FdbInfoPayload, FlashIdPayload, PartNumberPayload } from "./types";
import { FDNEXT_FDB_EXTRA_SCHEMA_VERSION, FDNEXT_FDB_SCHEMA_VERSION } from "./types";

export type PayloadValidationSeverity = "error" | "warning";

export interface PayloadValidationIssue {
  code: string;
  severity: PayloadValidationSeverity;
  path: string;
  message: string;
}

export interface PayloadValidationResult {
  ok: boolean;
  errors: PayloadValidationIssue[];
  warnings: PayloadValidationIssue[];
}

const EXTRA_ROOT_KEYS = new Set(["schemaVersion", "priority", "info", "controllerBlacklist", "vendors", "iddb"]);
const PART_FIELDS = new Set(["id", "fid", "f", "a", "l", "c", "t", "m", "d", "e", "r", "n"]);
const FDB_PART_FIELDS = new Set([...PART_FIELDS].filter((field) => field !== "fid"));
const FLASH_FIELDS = new Set(["s", "p", "b", "t", "n"]);
const KNOWN_VENDORS = new Set<string>(DEFAULT_FDB_AUDIT_VENDORS);
const FLASH_ID_6_BYTE_OR_LONGER = /^(?:[0-9A-Fa-f]{2}){6,}$/;
const FLASH_ID_6_BYTE = /^[0-9A-F]{12}$/;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value.trim();
  return text ? text : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function normalizeStringArray(value: unknown, upper = false): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const raw = readString(item);
    if (!raw) {
      continue;
    }
    const text = upper ? raw.toUpperCase() : raw;
    if (!seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
  }
  return out;
}

function normalizeFlashIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const normalized = normalizeFdbFlashId(item);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

function normalizePartReferenceArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const normalized = normalizeFdbPartReference(item);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}

function mergeStringArray(target: string[] | undefined, source: string[] | undefined): string[] | undefined {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of [...(target ?? []), ...(source ?? [])]) {
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

function normalizeInfoPayload(value: unknown): FdbInfoPayload | undefined {
  const source = asRecord(value);
  if (!source) {
    return undefined;
  }
  const info: FdbInfoPayload = {};
  const name = readString(source.name);
  const website = readString(source.website);
  const controllers = normalizeStringArray(source.controllers);
  if (name) info.name = name;
  if (website) info.website = website;
  if (controllers.length > 0) info.controllers = controllers;
  return Object.keys(info).length > 0 ? info : undefined;
}

function normalizePartPayload(value: unknown): PartNumberPayload {
  const source = asRecord(value) ?? {};
  const out: PartNumberPayload = {};
  const ids = normalizeFlashIdArray(source.id);
  const forcedIds = normalizeFlashIdArray(source.fid);
  const linkedIds = normalizeFlashIdArray(source.f);
  const aliases = normalizePartReferenceArray(source.a);
  const controllers = normalizeStringArray(source.t);
  const processNode = readString(source.l);
  const cellLevel = readString(source.c);
  const metadata = readString(source.m);

  if (ids.length > 0) out.id = ids;
  if (forcedIds.length > 0) out.fid = forcedIds;
  if (linkedIds.length > 0) out.f = linkedIds;
  if (aliases.length > 0) out.a = aliases;
  if (processNode) out.l = processNode;
  if (cellLevel) out.c = cellLevel;
  if (controllers.length > 0) out.t = controllers;
  if (metadata) out.m = metadata;

  for (const field of ["d", "e", "r", "n"] as const) {
    const value = readNumber(source[field]);
    if (value !== undefined && value > 0) {
      out[field] = value;
    }
  }
  return out;
}

function mergePartPayload(target: PartNumberPayload | undefined, source: PartNumberPayload): PartNumberPayload {
  const out: PartNumberPayload = { ...(target ?? {}) };
  out.id = mergeStringArray(out.id, source.id);
  out.fid = mergeStringArray(out.fid, source.fid);
  out.f = mergeStringArray(out.f, source.f);
  out.a = mergeStringArray(out.a, source.a);
  out.t = mergeStringArray(out.t, source.t);
  for (const field of ["l", "c", "m"] as const) {
    if (source[field]) {
      out[field] = source[field];
    }
  }
  for (const field of ["d", "e", "r", "n"] as const) {
    if (source[field] !== undefined) {
      out[field] = source[field];
    }
  }
  return stripUndefinedArrays(out);
}

function stripUndefinedArrays(payload: PartNumberPayload): PartNumberPayload {
  const out: PartNumberPayload = { ...payload };
  for (const field of ["id", "fid", "f", "a", "t"] as const) {
    if (!out[field] || out[field]?.length === 0) {
      delete out[field];
    }
  }
  return out;
}

function normalizeFlashPayload(value: unknown): FlashIdPayload {
  const source = asRecord(value) ?? {};
  const out: FlashIdPayload = {};
  const controllers = normalizeStringArray(source.t);
  const references = normalizePartReferenceArray(source.n);
  if (controllers.length > 0) out.t = controllers;
  if (references.length > 0) out.n = references;
  for (const field of ["s", "p", "b"] as const) {
    const value = readNumber(source[field]);
    if (value !== undefined) {
      out[field] = value;
    }
  }
  return out;
}

function mergeFlashPayload(target: FlashIdPayload | undefined, source: FlashIdPayload): FlashIdPayload {
  const out: FlashIdPayload = { ...(target ?? {}) };
  out.t = mergeStringArray(out.t, source.t);
  out.n = mergeStringArray(out.n, source.n);
  for (const field of ["s", "p", "b"] as const) {
    if (source[field] !== undefined) {
      out[field] = source[field];
    }
  }
  if (!out.t || out.t.length === 0) delete out.t;
  if (!out.n || out.n.length === 0) delete out.n;
  return out;
}

function normalizeVendorRecords(records: Record<string, unknown>): Record<string, PartNumberPayload> {
  const out: Record<string, PartNumberPayload> = {};
  for (const [rawPartNumber, rawPayload] of Object.entries(records)) {
    const partNumber = normalizeFdbPartNumber(rawPartNumber);
    if (!partNumber) {
      continue;
    }
    const payload = normalizePartPayload(rawPayload);
    out[partNumber] = mergePartPayload(out[partNumber], payload);
  }
  return out;
}

function mergeVendorBucket(target: ExtraPayload, vendor: string, records: unknown): void {
  const normalizedVendor = normalizeFdbVendorName(vendor);
  const source = asRecord(records);
  if (!normalizedVendor || !source) {
    return;
  }
  const normalizedRecords = normalizeVendorRecords(source);
  if (Object.keys(normalizedRecords).length === 0) {
    return;
  }
  const vendors = target.vendors ?? {};
  const targetRecords = vendors[normalizedVendor] ?? {};
  for (const [partNumber, payload] of Object.entries(normalizedRecords)) {
    targetRecords[partNumber] = mergePartPayload(targetRecords[partNumber], payload);
  }
  vendors[normalizedVendor] = targetRecords;
  target.vendors = vendors;
}

export function normalizeExtraPayload(input: unknown): ExtraPayload {
  const source = asRecord(input);
  if (!source) {
    return {};
  }

  const out: ExtraPayload = {};
  if (source.schemaVersion === FDNEXT_FDB_EXTRA_SCHEMA_VERSION) {
    out.schemaVersion = FDNEXT_FDB_EXTRA_SCHEMA_VERSION;
  }
  if (typeof source.priority === "number" && Number.isFinite(source.priority)) {
    out.priority = source.priority;
  }
  const info = normalizeInfoPayload(source.info);
  const controllerBlacklist = normalizeStringArray(source.controllerBlacklist).map((item) => normalizeFdbControllerName(item));
  if (info) out.info = info;
  if (controllerBlacklist.length > 0) out.controllerBlacklist = controllerBlacklist;

  const wrappedVendors = asRecord(source.vendors);
  if (wrappedVendors) {
    for (const [vendor, records] of Object.entries(wrappedVendors)) {
      mergeVendorBucket(out, vendor, records);
    }
  }

  for (const [vendor, records] of Object.entries(source)) {
    if (!EXTRA_ROOT_KEYS.has(vendor)) {
      mergeVendorBucket(out, vendor, records);
    }
  }

  const rawIddb = asRecord(source.iddb);
  if (rawIddb) {
    const iddb: Record<string, FlashIdPayload> = {};
    for (const [rawFlashId, rawPayload] of Object.entries(rawIddb)) {
      const flashId = normalizeFdbFlashId(rawFlashId);
      if (!flashId) {
        continue;
      }
      iddb[flashId] = mergeFlashPayload(iddb[flashId], normalizeFlashPayload(rawPayload));
    }
    if (Object.keys(iddb).length > 0) {
      out.iddb = iddb;
    }
  }

  return out;
}

export function normalizeFdbPayload(input: unknown): ExtraPayload {
  return normalizeExtraPayload(input);
}

export function parseExtraPayload(input: unknown): ExtraPayload {
  const validation = validateExtraPayload(input);
  if (!validation.ok) {
    throw new Error(formatValidationErrors("extra.json", validation));
  }
  return normalizeExtraPayload(input);
}

export function parseExtraPayloadJson(data: string): ExtraPayload {
  return parseExtraPayload(JSON.parse(data) as unknown);
}

function addIssue(
  issues: PayloadValidationIssue[],
  severity: PayloadValidationSeverity,
  code: string,
  path: string,
  message: string
): void {
  issues.push({ severity, code, path, message });
}

function validateKnownVendor(issues: PayloadValidationIssue[], vendor: string, path: string, strictNormalized: boolean): void {
  const normalized = normalizeFdbVendorName(vendor);
  if (!normalized || !KNOWN_VENDORS.has(normalized)) {
    addIssue(issues, "error", "vendor.unknown", path, "Vendor bucket must be a known FDB vendor.");
    return;
  }
  if (strictNormalized && vendor !== normalized) {
    addIssue(issues, "error", "vendor.not_normalized", path, `Vendor bucket must use normalized key '${normalized}'.`);
  } else if (!strictNormalized && vendor !== normalized) {
    addIssue(issues, "warning", "vendor.not_normalized", path, `Vendor bucket should use normalized key '${normalized}'.`);
  }
}

function validateStringArrayField(issues: PayloadValidationIssue[], value: unknown, path: string): void {
  if (!Array.isArray(value)) {
    addIssue(issues, "error", "field.invalid_array", path, "Field must be an array.");
    return;
  }
  for (let index = 0; index < value.length; index += 1) {
    if (readString(value[index]) === undefined) {
      addIssue(issues, "error", "field.invalid_string", `${path}/${index}`, "Array items must be non-empty strings.");
    }
  }
}

function validateFlashIdArrayField(
  issues: PayloadValidationIssue[],
  value: unknown,
  path: string,
  generated: boolean
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, "error", "field.invalid_array", path, "Flash ID field must be an array.");
    return;
  }
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (typeof item !== "string") {
      addIssue(issues, "error", "flash_id.invalid_value", `${path}/${index}`, "Flash ID values must be strings.");
      continue;
    }
    const pattern = generated ? FLASH_ID_6_BYTE : FLASH_ID_6_BYTE_OR_LONGER;
    if (!pattern.test(item)) {
      addIssue(
        issues,
        "error",
        generated ? "flash_id.invalid_generated_value" : "flash_id.invalid_value",
        `${path}/${index}`,
        generated ? "Generated FDB Flash IDs must be normalized 6-byte / 12-hex strings." : "Flash IDs must be at least 6 bytes / 12 hex."
      );
    }
  }
}

function validateOwnedFlashIdArrayField(
  issues: PayloadValidationIssue[],
  value: unknown,
  path: string,
  vendor: string
): void {
  if (!Array.isArray(value)) {
    return;
  }
  const normalizedVendor = normalizeFdbVendorName(vendor);
  for (let index = 0; index < value.length; index += 1) {
    const flashId = normalizeFdbFlashId(value[index]);
    if (flashId && normalizedVendor && !isStrictSupportListFlashIdVendorCompatible(normalizedVendor, flashId)) {
      addIssue(issues, "error", "part.flash_id_vendor_mismatch", `${path}/${index}`, "Generated FDB PN id values must belong to the same vendor bucket.");
    }
  }
}

function validateNumberField(issues: PayloadValidationIssue[], value: unknown, path: string, min: number): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    addIssue(issues, "error", "field.invalid_integer", path, `Field must be an integer >= ${min}.`);
  }
}

function validatePartPayload(
  issues: PayloadValidationIssue[],
  value: unknown,
  path: string,
  options: { generated: boolean; vendor?: string }
): void {
  const source = asRecord(value);
  if (!source) {
    addIssue(issues, "error", "part.invalid_payload", path, "Part-number payload must be a JSON object.");
    return;
  }
  const allowedFields = options.generated ? FDB_PART_FIELDS : PART_FIELDS;
  for (const key of Object.keys(source)) {
    if (!allowedFields.has(key)) {
      addIssue(issues, "error", "part.unknown_field", `${path}/${key}`, `Unknown part-number payload field '${key}'.`);
    }
  }
  if (options.generated && Object.hasOwn(source, "fid")) {
    addIssue(issues, "error", "part.fid_forbidden", `${path}/fid`, "Generated fdb.json must not contain fid.");
  }
  if (!options.generated && Object.hasOwn(source, "id") && Object.hasOwn(source, "fid")) {
    addIssue(issues, "error", "part.id_fid_conflict", path, "extra.json part payload must not contain id and fid at the same time.");
  }
  for (const field of ["id", "fid", "f"] as const) {
    if (Object.hasOwn(source, field)) {
      validateFlashIdArrayField(issues, source[field], `${path}/${field}`, options.generated);
      if (options.generated && field === "id" && options.vendor) {
        validateOwnedFlashIdArrayField(issues, source[field], `${path}/${field}`, options.vendor);
      }
    }
  }
  for (const field of ["a", "t"] as const) {
    if (Object.hasOwn(source, field)) {
      validateStringArrayField(issues, source[field], `${path}/${field}`);
    }
  }
  for (const field of ["l", "c", "m"] as const) {
    if (Object.hasOwn(source, field) && readString(source[field]) === undefined) {
      addIssue(issues, "error", "field.invalid_string", `${path}/${field}`, "Field must be a non-empty string.");
    }
  }
  const processProfile = readString(source.l);
  if (options.generated && processProfile && !isGeneratedFdbDieProfile(processProfile)) {
    addIssue(issues, "error", "part.invalid_die_profile", `${path}/l`, "Generated fdb.json l field must be a nand.die_profile key.");
  }
  for (const field of ["d", "e", "r", "n"] as const) {
    if (Object.hasOwn(source, field)) {
      validateNumberField(issues, source[field], `${path}/${field}`, 1);
    }
  }
}

function validateFlashPayload(issues: PayloadValidationIssue[], value: unknown, path: string): void {
  const source = asRecord(value);
  if (!source) {
    addIssue(issues, "error", "iddb.invalid_payload", path, "iddb payload must be a JSON object.");
    return;
  }
  for (const key of Object.keys(source)) {
    if (!FLASH_FIELDS.has(key)) {
      addIssue(issues, "error", "iddb.unknown_field", `${path}/${key}`, `Unknown iddb payload field '${key}'.`);
    }
  }
  for (const field of ["s", "p", "b"] as const) {
    if (Object.hasOwn(source, field)) {
      validateNumberField(issues, source[field], `${path}/${field}`, 0);
    }
  }
  for (const field of ["t", "n"] as const) {
    if (Object.hasOwn(source, field)) {
      validateStringArrayField(issues, source[field], `${path}/${field}`);
    }
  }
}

function validateExtraInfoPayload(issues: PayloadValidationIssue[], value: unknown, path: string): void {
  const source = asRecord(value);
  if (!source) {
    addIssue(issues, "error", "info.invalid_payload", path, "info must be a JSON object.");
    return;
  }
  for (const [key, item] of Object.entries(source)) {
    if (key === "controllers") {
      validateStringArrayField(issues, item, `${path}/${key}`);
      continue;
    }
    if ((key === "name" || key === "website") && typeof item === "string") {
      continue;
    }
    addIssue(issues, "error", "info.unknown_field", `${path}/${key}`, `Unknown info field '${key}'.`);
  }
}

function validateVendorRecords(
  issues: PayloadValidationIssue[],
  vendor: string,
  records: unknown,
  path: string,
  options: { generated: boolean; strictNormalizedVendor: boolean },
  partKeys: Set<string>
): void {
  validateKnownVendor(issues, vendor, path, options.strictNormalizedVendor);
  const source = asRecord(records);
  if (!source) {
    addIssue(issues, "error", "vendor.invalid_payload", path, "Vendor payload must be a JSON object.");
    return;
  }
  for (const [partNumber, payload] of Object.entries(source)) {
    const normalizedVendor = normalizeFdbVendorName(vendor);
    const normalizedPartNumber = normalizeFdbPartNumber(partNumber);
    if (!normalizedPartNumber) {
      addIssue(issues, "error", "part.invalid_key", `${path}/${partNumber}`, "Part-number key cannot be normalized.");
    } else {
      partKeys.add(`${normalizedVendor} ${normalizedPartNumber}`);
    }
    validatePartPayload(issues, payload, `${path}/${partNumber}`, { generated: options.generated, vendor });
  }
}

function splitIssues(issues: PayloadValidationIssue[]): PayloadValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export function validateExtraPayload(input: unknown): PayloadValidationResult {
  const issues: PayloadValidationIssue[] = [];
  const source = asRecord(input);
  if (!source) {
    addIssue(issues, "error", "root.invalid_payload", "", "extra.json payload must be a JSON object.");
    return splitIssues(issues);
  }

  const partKeys = new Set<string>();
  if (source.schemaVersion !== undefined && source.schemaVersion !== FDNEXT_FDB_EXTRA_SCHEMA_VERSION) {
    addIssue(issues, "error", "schema_version.invalid", "/schemaVersion", `schemaVersion must be '${FDNEXT_FDB_EXTRA_SCHEMA_VERSION}'.`);
  }
  if (source.info !== undefined) {
    validateExtraInfoPayload(issues, source.info, "/info");
  }
  if (source.priority !== undefined && (typeof source.priority !== "number" || !Number.isFinite(source.priority))) {
    addIssue(issues, "error", "priority.invalid", "/priority", "extra priority must be a finite number.");
  }
  if (source.controllerBlacklist !== undefined) {
    validateStringArrayField(issues, source.controllerBlacklist, "/controllerBlacklist");
  }

  const wrappedVendors = asRecord(source.vendors);
  if (wrappedVendors) {
    for (const [vendor, records] of Object.entries(wrappedVendors)) {
      validateVendorRecords(issues, vendor, records, `/vendors/${vendor}`, { generated: false, strictNormalizedVendor: false }, partKeys);
    }
  } else if (source.vendors !== undefined) {
    addIssue(issues, "error", "vendors.invalid_payload", "/vendors", "vendors wrapper must be a JSON object.");
  }

  for (const [vendor, records] of Object.entries(source)) {
    if (!EXTRA_ROOT_KEYS.has(vendor)) {
      validateVendorRecords(issues, vendor, records, `/${vendor}`, { generated: false, strictNormalizedVendor: false }, partKeys);
    }
  }

  const rawIddb = asRecord(source.iddb);
  if (rawIddb) {
    for (const [flashId, payload] of Object.entries(rawIddb)) {
      if (!FLASH_ID_6_BYTE_OR_LONGER.test(flashId)) {
        addIssue(issues, "error", "flash_id.invalid_key", `/iddb/${flashId}`, "extra.json iddb keys must be at least 6 bytes / 12 hex.");
      }
      validateFlashPayload(issues, payload, `/iddb/${flashId}`);
    }
  } else if (source.iddb !== undefined) {
    addIssue(issues, "error", "iddb.invalid_payload", "/iddb", "iddb must be a JSON object.");
  }

  return splitIssues(issues);
}

export function validateFdbPayload(input: unknown): PayloadValidationResult {
  const issues: PayloadValidationIssue[] = [];
  const source = asRecord(input);
  if (!source) {
    addIssue(issues, "error", "root.invalid_payload", "", "fdb.json payload must be a JSON object.");
    return splitIssues(issues);
  }

  const partKeys = new Set<string>();
  if (source.schemaVersion !== undefined && source.schemaVersion !== FDNEXT_FDB_SCHEMA_VERSION) {
    addIssue(issues, "error", "schema_version.invalid", "/schemaVersion", `schemaVersion must be '${FDNEXT_FDB_SCHEMA_VERSION}'.`);
  }
  for (const [vendor, records] of Object.entries(source)) {
    if (vendor === "schemaVersion" || vendor === "info" || vendor === "iddb") {
      continue;
    }
    validateVendorRecords(issues, vendor, records, `/${vendor}`, { generated: true, strictNormalizedVendor: true }, partKeys);
  }

  const rawIddb = asRecord(source.iddb);
  if (rawIddb) {
    for (const [flashId, payload] of Object.entries(rawIddb)) {
      if (!FLASH_ID_6_BYTE.test(flashId)) {
        addIssue(issues, "error", "flash_id.invalid_key", `/iddb/${flashId}`, "Generated FDB iddb keys must be normalized 6-byte / 12-hex strings.");
      }
      validateFlashPayload(issues, payload, `/iddb/${flashId}`);
      const references = asRecord(payload)?.n;
      if (!Array.isArray(references)) {
        continue;
      }
      for (let index = 0; index < references.length; index += 1) {
        const normalized = normalizeFdbPartReference(references[index]);
        if (!normalized) {
          addIssue(issues, "error", "reference.invalid_iddb_n", `/iddb/${flashId}/n/${index}`, "iddb.n entries must use '<vendor> <partNumber>' format.");
          continue;
        }
        if (!partKeys.has(normalized)) {
          addIssue(issues, "error", "reference.missing_iddb_n", `/iddb/${flashId}/n/${index}`, "iddb.n reverse references must point to an existing vendor PN record.");
        }
        const referenceVendor = normalized.split(" ", 1)[0] ?? "";
        if (!isStrictSupportListFlashIdVendorCompatible(referenceVendor, flashId)) {
          addIssue(issues, "error", "iddb.flash_id_vendor_mismatch", `/iddb/${flashId}/n/${index}`, "iddb.n reverse references must belong to the Flash ID vendor.");
        }
      }
    }
  } else if (source.iddb !== undefined) {
    addIssue(issues, "error", "iddb.invalid_payload", "/iddb", "iddb must be a JSON object.");
  }

  return splitIssues(issues);
}

export function formatValidationErrors(label: string, result: PayloadValidationResult): string {
  const issues = [...result.errors, ...result.warnings];
  if (issues.length === 0) {
    return `${label}: no validation issues`;
  }
  const lines = [`${label}: ${result.errors.length} errors, ${result.warnings.length} warnings`];
  for (const issue of issues.slice(0, 20)) {
    lines.push(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 20) {
    lines.push(`... ${issues.length - 20} more`);
  }
  return lines.join("\n");
}
