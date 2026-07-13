import type { IdentifierDecodeSpec } from "../types";

import micronIntelRules from "./packs/micron-inteldef.json" with { type: "json" };
import intelRules from "./packs/intel.json" with { type: "json" };
import samsungRules from "./packs/samsung.json" with { type: "json" };
import skhynixRules from "./packs/skhynix.json" with { type: "json" };
import kioxiaRules from "./packs/kioxia.json" with { type: "json" };
import sandiskRules from "./packs/sandisk.json" with { type: "json" };
import ymtcRules from "./packs/ymtc.json" with { type: "json" };
import spectekRules from "./packs/spectek.json" with { type: "json" };
import winbondRules from "./packs/winbond.json" with { type: "json" };
import macronixRules from "./packs/macronix.json" with { type: "json" };
import issiRules from "./packs/issi.json" with { type: "json" };
import esmtRules from "./packs/esmt.json" with { type: "json" };

export const defaultIdentifierDecodeSpecs = [
  ...micronIntelRules,
  ...intelRules,
  ...samsungRules,
  ...skhynixRules,
  ...kioxiaRules,
  ...sandiskRules,
  ...ymtcRules,
  ...spectekRules,
  ...winbondRules,
  ...macronixRules,
  ...issiRules,
  ...esmtRules
] as IdentifierDecodeSpec[];
