import { compileDecodePack, defaultDecodePack } from "@itxtech/fdnext-core/decodepack";

const compiledDecodePack = compileDecodePack(defaultDecodePack);

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
