import type { DslRule } from "../types.js";

export const defaultDslRules: DslRule[] = [
  {
    id: "vendor.micron.prefix.mt",
    priority: 200,
    normalize: ["trim", "uppercase", { remove: [" ", ",", "&", ".", "|"] }],
    match: { kind: "prefix", value: "MT" },
    set: { vendor: "micron", type: "nand" }
  },
  {
    id: "vendor.kioxia.prefix.tc58",
    priority: 150,
    normalize: ["trim", "uppercase", { remove: [" ", ",", "&", ".", "|"] }],
    match: { kind: "prefix", value: "TC58" },
    set: { vendor: "kioxia" }
  }
];
