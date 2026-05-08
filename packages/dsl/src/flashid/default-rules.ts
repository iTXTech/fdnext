import type { FlashIdDslRule } from "../types";

import micronIntelRules from "./packs/micron-inteldef.json" with { type: "json" };
import intelRules from "./packs/intel.json" with { type: "json" };
import samsungRules from "./packs/samsung.json" with { type: "json" };
import skhynixRules from "./packs/skhynix.json" with { type: "json" };
import kioxiaRules from "./packs/kioxia.json" with { type: "json" };
import sandiskRules from "./packs/sandisk.json" with { type: "json" };
import ymtcRules from "./packs/ymtc.json" with { type: "json" };
import spectekRules from "./packs/spectek.json" with { type: "json" };

export const defaultFlashIdRules = [
  ...micronIntelRules,
  ...intelRules,
  ...samsungRules,
  ...skhynixRules,
  ...kioxiaRules,
  ...sandiskRules,
  ...ymtcRules,
  ...spectekRules
] as FlashIdDslRule[];
