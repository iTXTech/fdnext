import { intelVendor } from "./intel";
import { kioxiaVendor } from "./kioxia";
import { micronVendor } from "./micron";
import { phisonVendor } from "./phison";
import { samsungVendor } from "./samsung";
import { skhynixVendor } from "./skhynix";
import { sndkVendor } from "./sndk";
import { spectekVendor } from "./spectek";
import { stVendor } from "./st";
import type { VendorDecoder } from "./types";
import { ymtcVendor } from "./ymtc";

const VENDOR_DECODERS: readonly VendorDecoder[] = [
  micronVendor,
  samsungVendor,
  skhynixVendor,
  kioxiaVendor,
  sndkVendor,
  intelVendor,
  spectekVendor,
  stVendor,
  ymtcVendor,
  phisonVendor
];

const VENDOR_ALIAS = new Map<string, string>();

for (const decoder of VENDOR_DECODERS) {
  VENDOR_ALIAS.set(decoder.id, decoder.id);
  for (const alias of decoder.aliases ?? []) {
    VENDOR_ALIAS.set(alias, decoder.id);
  }
}

export function normalizeVendor(vendor: string): string {
  const key = vendor.trim().toLowerCase();
  return VENDOR_ALIAS.get(key) ?? key;
}

export function inferVendorFromPartNumber(partNumber: string): string | null {
  return VENDOR_DECODERS.find((decoder) => decoder.identify?.(partNumber))?.id ?? null;
}

export function normalizeKnownPackage(vendor: string, partNumber: string): string {
  const normalizedVendor = normalizeVendor(vendor);
  const decoder = VENDOR_DECODERS.find((item) => item.id === normalizedVendor);
  return decoder?.normalizePartNumber?.(partNumber) ?? partNumber;
}

export type { VendorDecoder } from "./types";
