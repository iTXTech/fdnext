import type { FlashIdDslRule } from "../types";

import micronIntelRules from "./packs/micron-inteldef.json" with { type: "json" };

export const defaultFlashIdRules = [...micronIntelRules] as FlashIdDslRule[];
