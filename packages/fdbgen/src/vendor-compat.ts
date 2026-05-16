const VENDOR_COMPATIBILITY: Record<string, readonly string[]> = {
  intel: ["intel", "micron", "spectek"],
  kioxia: ["kioxia", "sndk"],
  micron: ["micron", "spectek", "intel"],
  sndk: ["sndk", "kioxia"],
  spectek: ["spectek", "micron", "intel"]
};

export function isCompatibleVendor(actualVendor: string, inferredVendor: string): boolean {
  if (actualVendor === inferredVendor) {
    return true;
  }
  return (VENDOR_COMPATIBILITY[inferredVendor] ?? [inferredVendor]).includes(actualVendor);
}
