export interface VendorDecoder {
  id: string;
  aliases?: readonly string[];
  identify?(partNumber: string): boolean;
  normalizePartNumber?(partNumber: string): string;
}
