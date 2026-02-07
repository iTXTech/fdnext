import type { DslRule } from "../types";
import micronTokenRules from "./packs/micron-token.json" with { type: "json" };
import vendorPrefixRules from "./packs/vendor-prefix.json" with { type: "json" };

export const defaultDslRules = [...micronTokenRules, ...vendorPrefixRules] as DslRule[];
