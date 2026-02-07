import type { PartNumberDecoder } from "./types.js";

export function buildDefaultDecoders(): PartNumberDecoder[] {
  return [
    { id: "prefix.micron", priority: 100, check: (pn) => pn.startsWith("MT"), decode: () => ({ vendor: "micron", type: "nand" }) },
    { id: "prefix.samsung", priority: 90, check: (pn) => pn.startsWith("K"), decode: () => ({ vendor: "samsung" }) },
    { id: "prefix.skhynix", priority: 90, check: (pn) => pn.startsWith("H") || pn.startsWith("HY"), decode: () => ({ vendor: "skhynix" }) },
    { id: "prefix.kioxia", priority: 90, check: (pn) => pn.startsWith("TC58") || pn.startsWith("TH58"), decode: () => ({ vendor: "kioxia" }) },
    { id: "prefix.wd", priority: 85, check: (pn) => pn.startsWith("SD") || pn.startsWith("S34") || pn.startsWith("S35"), decode: () => ({ vendor: "westerndigital" }) },
    { id: "prefix.intel", priority: 80, check: (pn) => pn.startsWith("JS") || pn.startsWith("29F"), decode: () => ({ vendor: "intel" }) },
    { id: "prefix.ymtc", priority: 70, check: (pn) => pn.startsWith("XT"), decode: () => ({ vendor: "ymtc" }) },
    { id: "prefix.phison", priority: 70, check: (pn) => pn.startsWith("PH"), decode: () => ({ vendor: "phison" }) }
  ];
}
