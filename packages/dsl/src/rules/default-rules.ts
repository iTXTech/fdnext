import type { DslRule } from "../types";
import micronTokenRules from "./packs/micron-token.json" with { type: "json" };
import intelTokenRules from "./packs/intel-token.json" with { type: "json" };
import samsungTokenRules from "./packs/samsung-token.json" with { type: "json" };
import skhynix3dTokenRules from "./packs/skhynix-3d-token.json" with { type: "json" };
import skhynixLegacyTokenRules from "./packs/skhynix-legacy-token.json" with { type: "json" };
import skhynixTokenRules from "./packs/skhynix-token.json" with { type: "json" };
import kioxiaTokenRules from "./packs/kioxia-token.json" with { type: "json" };
import westerndigitalTokenRules from "./packs/westerndigital-token.json" with { type: "json" };
import ymtcTokenRules from "./packs/ymtc-token.json" with { type: "json" };
import phisonTokenRules from "./packs/phison-token.json" with { type: "json" };
import spectekTokenRules from "./packs/spectek-token.json" with { type: "json" };
import vendorPrefixRules from "./packs/vendor-prefix.json" with { type: "json" };

export const defaultDslRules = [
  ...micronTokenRules,
  ...intelTokenRules,
  ...samsungTokenRules,
  ...skhynix3dTokenRules,
  ...skhynixLegacyTokenRules,
  ...skhynixTokenRules,
  ...kioxiaTokenRules,
  ...westerndigitalTokenRules,
  ...ymtcTokenRules,
  ...phisonTokenRules,
  ...spectekTokenRules,
  ...vendorPrefixRules
] as DslRule[];
