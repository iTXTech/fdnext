import {
  mergeFdnextFdbgenV1Document,
  parseFdnextFdbgenV1,
  type FdnextFdbgenV1Document,
  type FdnextFdbgenV1Entry
} from "../fdbgen-v1";
import {
  cleanSupportListPartNumber,
  isSupportedSupportListFlashId,
  normalizeSupportListFlashId,
  parseSupportListControllerList,
  resolveSupportListPartRecord
} from "../support-list";
import { inferVendorFromPartNumber } from "../vendors";
import type { ControllerGenerator, ControllerMergeContext } from "./types";

const PHISON_ALIAS_VENDOR = "phison";
const UNTRUSTED_PHISON_PART_NUMBER = /^(?:NOMARKING|NO[-_]?MARKING|UNKNOWN|UNMARKED|NA|N\/A|NONE|NULL)(?:[0-9A-Z]*)$/;

function partReference(vendor: string, partNumber: string): string {
  return `${vendor} ${partNumber}`;
}

function cleanPhisonAliasPartNumber(rawPartNumber: unknown, id: string): string | undefined {
  const raw = String(rawPartNumber ?? "").trim();
  if (!raw || /[^\x20-\x7E]/.test(raw)) {
    return undefined;
  }
  const partNumber = cleanSupportListPartNumber(raw);
  if (
    !partNumber ||
    partNumber.length < 4 ||
    /[^\x20-\x7E]/.test(partNumber) ||
    partNumber.includes("\\") ||
    partNumber.includes("--") ||
    partNumber.includes(id) ||
    /^[0-9]+$/.test(partNumber) ||
    UNTRUSTED_PHISON_PART_NUMBER.test(partNumber)
  ) {
    return undefined;
  }
  return partNumber;
}

function collectOriginalPartReferences(context: ControllerMergeContext, document: FdnextFdbgenV1Document): Map<string, string[]> {
  const references = new Map<string, string[]>();
  for (const entry of document.entries) {
    const id = normalizeSupportListFlashId(entry.flashId, true);
    if (!id || !isSupportedSupportListFlashId(id)) {
      continue;
    }
    const resolved = resolveSupportListPartRecord(context, entry.vendor, entry.partNumber, id);
    if (!resolved) {
      continue;
    }
    const refs = references.get(id) ?? [];
    refs.push(partReference(resolved.vendor, resolved.partNumber));
    references.set(id, refs);
  }
  return references;
}

function splitPartReference(ref: string): { vendor: string; partNumber: string } | null {
  const match = /^(\S+)\s+(.+)$/.exec(ref.trim());
  return match?.[1] && match[2] ? { vendor: match[1], partNumber: match[2] } : null;
}

function trustedContextPartReferences(context: ControllerMergeContext, id: string): string[] {
  const refs: string[] = [];
  for (const ref of context.findPartReferencesByFlashId(id, { excludeVendor: PHISON_ALIAS_VENDOR })) {
    const parsed = splitPartReference(ref);
    if (!parsed) {
      continue;
    }
    const resolved = resolveSupportListPartRecord(context, parsed.vendor, parsed.partNumber, id);
    if (resolved) {
      refs.push(partReference(resolved.vendor, resolved.partNumber));
    }
  }
  return refs;
}

function originalPartReferencesForId(context: ControllerMergeContext, originalRefsById: Map<string, string[]>, id: string): string[] {
  return [...new Set([...(originalRefsById.get(id) ?? []), ...trustedContextPartReferences(context, id)])];
}

function mergePhisonAlias(
  context: ControllerMergeContext,
  entry: FdnextFdbgenV1Entry,
  originalRefsById: Map<string, string[]>
): boolean {
  const id = normalizeSupportListFlashId(entry.flashId, true);
  if (!id || !isSupportedSupportListFlashId(id)) {
    return false;
  }
  if (resolveSupportListPartRecord(context, entry.vendor, entry.partNumber, id)) {
    return false;
  }
  const partNumber = cleanPhisonAliasPartNumber(entry.partNumber, id);
  if (!partNumber) {
    return false;
  }
  const inferredVendor = inferVendorFromPartNumber(partNumber);
  if (inferredVendor && inferredVendor !== PHISON_ALIAS_VENDOR) {
    return false;
  }
  const controllers = parseSupportListControllerList(entry.controllers);
  if (controllers.length === 0) {
    return false;
  }
  const originalRefs = originalPartReferencesForId(context, originalRefsById, id);
  context.mergePartPayload(PHISON_ALIAS_VENDOR, partNumber, {
    f: [id],
    t: controllers,
    ...(originalRefs.length > 0 ? { a: originalRefs } : {})
  });
  context.mergeFlashPayload(id, { t: controllers });
  return true;
}

function mergePhisonFdnextFdbgenV1(context: ControllerMergeContext, document: FdnextFdbgenV1Document): void {
  const originalRefsById = collectOriginalPartReferences(context, document);
  mergeFdnextFdbgenV1Document(context, document);
  const aliasControllers = new Set<string>();
  for (const entry of document.entries) {
    if (mergePhisonAlias(context, entry, originalRefsById)) {
      for (const controller of entry.controllers) {
        aliasControllers.add(controller);
      }
    }
  }
  if (aliasControllers.size > 0) {
    context.addInfoController([...aliasControllers]);
  }
}

function mergePhison(context: ControllerMergeContext, data: string): void {
  const parsed = JSON.parse(data);
  const fdnextDocument = parseFdnextFdbgenV1(parsed);
  if (fdnextDocument) {
    mergePhisonFdnextFdbgenV1(context, fdnextDocument);
    return;
  }

  const controllers = ["PS3111", "INIC6081"];
  context.addInfoController(controllers);
  const flashes = Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
  for (const flash of flashes) {
    const vendor = String(flash.Vendor ?? "").toLowerCase().replace("hynix", "skhynix");
    const flashId = String(flash.FlashId ?? "").slice(0, 12);
    context.addControllersToMatchingFlashId(vendor, flashId, controllers);
  }
}

export const phisonController: ControllerGenerator = {
  id: "phison",
  directories: ["ps"],
  mergeFile(context, file) {
    mergePhison(context, file.data);
  }
};
