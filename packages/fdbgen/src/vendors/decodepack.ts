import { compileDecodePack, defaultDecodePack, readPartDecodeSpecTables } from "@itxtech/fdnext-core/decodepack";

const compiledDecodePack = compileDecodePack(defaultDecodePack);
const RAW_NAND_LOOKUP_PACKAGE_SPEC = /^vendor\.(?:micron\.(?:raw|hsc)|spectek\.(?:parent-density-token|token))\./;

function rawNandPackageSuffixesFromDecodePack(): Set<string> {
  const suffixes = new Set<string>();
  for (const { table } of readPartDecodeSpecTables(defaultDecodePack, {
    specId: RAW_NAND_LOOKUP_PACKAGE_SPEC,
    tableName: "package"
  })) {
    for (const key of Object.keys(table)) {
      if (/^[A-Z][0-9A-Z]$/.test(key)) {
        suffixes.add(key);
      }
    }
  }
  return suffixes;
}

const RAW_NAND_PACKAGE_SUFFIXES = rawNandPackageSuffixesFromDecodePack();

export function removeMicronPackageSuffix(partNumber: string): string {
  const base = partNumber.split("-")[0] ?? partNumber;
  const suffix = base.slice(-2);
  return RAW_NAND_PACKAGE_SUFFIXES.has(suffix) ? base.slice(0, -2) : base;
}

export function decodepackLookupPartNumber(vendor: string, partNumber: string): string {
  const normalizedVendor = vendor.trim().toLowerCase();
  for (const decoder of compiledDecodePack.partDecoders) {
    if (!decoder.check(partNumber)) {
      continue;
    }
    const draft = decoder.decode(partNumber);
    if (!draft) {
      continue;
    }
    const draftVendor = String(draft.device.vendor ?? "").trim().toLowerCase();
    if (draftVendor && draftVendor !== normalizedVendor) {
      continue;
    }
    for (const lookupPartNumber of draft.meta?.lookupPartNumbers ?? []) {
      const text = String(lookupPartNumber).trim();
      if (text) {
        return text;
      }
    }
    break;
  }
  return partNumber;
}
