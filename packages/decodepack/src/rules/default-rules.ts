import type { PartDecodeSpec } from "../types";
import micronManagedTokenRules from "./packs/micron-managed-token.json" with { type: "json" };
import micronEmmcTokenRules from "./packs/micron-emmc-token.json" with { type: "json" };
import micronEmcpTokenRules from "./packs/micron-emcp-token.json" with { type: "json" };
import micronDramTokenRules from "./packs/micron-dram-token.json" with { type: "json" };
import micronRawTokenRules from "./packs/micron-raw-token.json" with { type: "json" };
import intelRawTokenRules from "./packs/intel-raw-token.json" with { type: "json" };
import samsungUfsTokenRules from "./packs/samsung-ufs-token.json" with { type: "json" };
import samsungEmmcTokenRules from "./packs/samsung-emmc-token.json" with { type: "json" };
import samsungEmcpTokenRules from "./packs/samsung-emcp-token.json" with { type: "json" };
import samsungDramTokenRules from "./packs/samsung-dram-token.json" with { type: "json" };
import samsungRawTokenRules from "./packs/samsung-raw-token.json" with { type: "json" };
import nanyaDramTokenRules from "./packs/nanya-dram-token.json" with { type: "json" };
import elpidaDramTokenRules from "./packs/elpida-dram-token.json" with { type: "json" };
import cxmtDramTokenRules from "./packs/cxmt-dram-token.json" with { type: "json" };
import issiDramTokenRules from "./packs/issi-dram-token.json" with { type: "json" };
import winbondDramTokenRules from "./packs/winbond-dram-token.json" with { type: "json" };
import esmtDramTokenRules from "./packs/esmt-dram-token.json" with { type: "json" };
import etronDramTokenRules from "./packs/etron-dram-token.json" with { type: "json" };
import skhynixDramTokenRules from "./packs/skhynix-dram-token.json" with { type: "json" };
import skhynix4dTokenRules from "./packs/skhynix-4d-token.json" with { type: "json" };
import skhynix3dTokenRules from "./packs/skhynix-3d-token.json" with { type: "json" };
import skhynixLegacyTokenRules from "./packs/skhynix-legacy-token.json" with { type: "json" };
import skhynixUfsTokenRules from "./packs/skhynix-ufs-token.json" with { type: "json" };
import skhynixEmmcTokenRules from "./packs/skhynix-emmc-token.json" with { type: "json" };
import skhynixEmcpTokenRules from "./packs/skhynix-emcp-token.json" with { type: "json" };
import skhynixUmcpTokenRules from "./packs/skhynix-umcp-token.json" with { type: "json" };
import skhynixE2nandTokenRules from "./packs/skhynix-e2nand-token.json" with { type: "json" };
import skhynixRawTokenRules from "./packs/skhynix-raw-token.json" with { type: "json" };
import kioxiaManagedTokenRules from "./packs/kioxia-managed-token.json" with { type: "json" };
import kioxiaUfsTokenRules from "./packs/kioxia-ufs-token.json" with { type: "json" };
import kioxiaRawTokenRules from "./packs/kioxia-raw-token.json" with { type: "json" };
import sandiskInandEmmcTokenRules from "./packs/sandisk-inand-emmc-token.json" with { type: "json" };
import sandiskInandUfsTokenRules from "./packs/sandisk-inand-ufs-token.json" with { type: "json" };
import sandiskInandTokenRules from "./packs/sandisk-inand-token.json" with { type: "json" };
import sandiskIssdTokenRules from "./packs/sandisk-issd-token.json" with { type: "json" };
import sandiskMarkingTokenRules from "./packs/sandisk-marking-token.json" with { type: "json" };
import sandiskRawTokenRules from "./packs/sandisk-raw-token.json" with { type: "json" };
import siliconMotionManagedTokenRules from "./packs/siliconmotion-managed-token.json" with { type: "json" };
import kingstonEmmcTokenRules from "./packs/kingston-emmc-token.json" with { type: "json" };
import kingstonUfsTokenRules from "./packs/kingston-ufs-token.json" with { type: "json" };
import kingstonEmcpTokenRules from "./packs/kingston-emcp-token.json" with { type: "json" };
import longsysEmmcTokenRules from "./packs/longsys-emmc-token.json" with { type: "json" };
import longsysUfsTokenRules from "./packs/longsys-ufs-token.json" with { type: "json" };
import longsysEmcpTokenRules from "./packs/longsys-emcp-token.json" with { type: "json" };
import biwinEmmcTokenRules from "./packs/biwin-emmc-token.json" with { type: "json" };
import biwinUfsTokenRules from "./packs/biwin-ufs-token.json" with { type: "json" };
import biwinEmcpTokenRules from "./packs/biwin-emcp-token.json" with { type: "json" };
import ymtcProcessTokenRules from "./packs/ymtc-process-token.json" with { type: "json" };
import ymtcNandTokenRules from "./packs/ymtc-nand-token.json" with { type: "json" };
import ymtcUnimosTokenRules from "./packs/ymtc-unimos-token.json" with { type: "json" };
import ymtcEmmcTokenRules from "./packs/ymtc-emmc-token.json" with { type: "json" };
import ymtcUfsTokenRules from "./packs/ymtc-ufs-token.json" with { type: "json" };
import phisonTokenRules from "./packs/phison-token.json" with { type: "json" };
import spectekDramTokenRules from "./packs/spectek-dram-token.json" with { type: "json" };
import spectekRawTokenRules from "./packs/spectek-raw-token.json" with { type: "json" };
import vendorPrefixRules from "./packs/vendor-prefix.json" with { type: "json" };

export const defaultPartDecodeSpecs = [
  ...micronManagedTokenRules,
  ...micronEmmcTokenRules,
  ...micronEmcpTokenRules,
  ...micronDramTokenRules,
  ...micronRawTokenRules,
  ...intelRawTokenRules,
  ...samsungUfsTokenRules,
  ...samsungEmmcTokenRules,
  ...samsungEmcpTokenRules,
  ...samsungDramTokenRules,
  ...samsungRawTokenRules,
  ...nanyaDramTokenRules,
  ...elpidaDramTokenRules,
  ...cxmtDramTokenRules,
  ...issiDramTokenRules,
  ...winbondDramTokenRules,
  ...esmtDramTokenRules,
  ...etronDramTokenRules,
  ...skhynixDramTokenRules,
  ...skhynix4dTokenRules,
  ...skhynix3dTokenRules,
  ...skhynixLegacyTokenRules,
  ...skhynixUfsTokenRules,
  ...skhynixEmmcTokenRules,
  ...skhynixEmcpTokenRules,
  ...skhynixUmcpTokenRules,
  ...skhynixE2nandTokenRules,
  ...skhynixRawTokenRules,
  ...kioxiaManagedTokenRules,
  ...kioxiaUfsTokenRules,
  ...kioxiaRawTokenRules,
  ...sandiskInandEmmcTokenRules,
  ...sandiskInandUfsTokenRules,
  ...sandiskInandTokenRules,
  ...sandiskIssdTokenRules,
  ...sandiskMarkingTokenRules,
  ...sandiskRawTokenRules,
  ...siliconMotionManagedTokenRules,
  ...kingstonEmmcTokenRules,
  ...kingstonUfsTokenRules,
  ...kingstonEmcpTokenRules,
  ...longsysEmmcTokenRules,
  ...longsysUfsTokenRules,
  ...longsysEmcpTokenRules,
  ...biwinEmmcTokenRules,
  ...biwinUfsTokenRules,
  ...biwinEmcpTokenRules,
  ...ymtcProcessTokenRules,
  ...ymtcNandTokenRules,
  ...ymtcUnimosTokenRules,
  ...ymtcEmmcTokenRules,
  ...ymtcUfsTokenRules,
  ...phisonTokenRules,
  ...spectekDramTokenRules,
  ...spectekRawTokenRules,
  ...vendorPrefixRules
] as PartDecodeSpec[];
