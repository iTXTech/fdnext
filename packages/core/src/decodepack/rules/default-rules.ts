import type { PartDecodeSpec } from "../types";
import micronManagedTokenRules from "./packs/micron-managed-token.json" with { type: "json" };
import micronXpointTokenRules from "./packs/micron-xpoint-token.json" with { type: "json" };
import micronSsdTokenRules from "./packs/micron-ssd-token.json" with { type: "json" };
import micronEmmcTokenRules from "./packs/micron-emmc-token.json" with { type: "json" };
import micronEmcpTokenRules from "./packs/micron-emcp-token.json" with { type: "json" };
import micronDramTokenRules from "./packs/micron-dram-token.json" with { type: "json" };
import micronHbmTokenRules from "./packs/micron-hbm-token.json" with { type: "json" };
import micronHmcTokenRules from "./packs/micron-hmc-token.json" with { type: "json" };
import micronRawStructuredTokenRules from "./packs/micron-raw-structured-token.json" with { type: "json" };
import micronRawTokenRules from "./packs/micron-raw-token.json" with { type: "json" };
import intelRawTokenRules from "./packs/intel-raw-token.json" with { type: "json" };
import samsungUfsTokenRules from "./packs/samsung-ufs-token.json" with { type: "json" };
import samsungEmmcTokenRules from "./packs/samsung-emmc-token.json" with { type: "json" };
import samsungLegacyEmcpTokenRules from "./packs/samsung-legacy-emcp-token.json" with { type: "json" };
import samsungMcpTokenRules from "./packs/samsung-mcp-token.json" with { type: "json" };
import samsungHbmTokenRules from "./packs/samsung-hbm-token.json" with { type: "json" };
import samsungDramTokenRules from "./packs/samsung-dram-token.json" with { type: "json" };
import samsungRawTokenRules from "./packs/samsung-raw-token.json" with { type: "json" };
import nanyaDramTokenRules from "./packs/nanya-dram-token.json" with { type: "json" };
import elpidaDramTokenRules from "./packs/elpida-dram-token.json" with { type: "json" };
import cxmtDramTokenRules from "./packs/cxmt-dram-token.json" with { type: "json" };
import gigadeviceDramTokenRules from "./packs/gigadevice-dram-token.json" with { type: "json" };
import issiDramTokenRules from "./packs/issi-dram-token.json" with { type: "json" };
import issiEmmcTokenRules from "./packs/issi-emmc-token.json" with { type: "json" };
import issiUfsTokenRules from "./packs/issi-ufs-token.json" with { type: "json" };
import issiNandTokenRules from "./packs/issi-nand-token.json" with { type: "json" };
import winbondDramTokenRules from "./packs/winbond-dram-token.json" with { type: "json" };
import winbondNandTokenRules from "./packs/winbond-nand-token.json" with { type: "json" };
import macronixNandTokenRules from "./packs/macronix-nand-token.json" with { type: "json" };
import esmtDramTokenRules from "./packs/esmt-dram-token.json" with { type: "json" };
import esmtEmmcTokenRules from "./packs/esmt-emmc-token.json" with { type: "json" };
import esmtRawTokenRules from "./packs/esmt-raw-token.json" with { type: "json" };
import etronDramTokenRules from "./packs/etron-dram-token.json" with { type: "json" };
import skhynixDramTokenRules from "./packs/skhynix-dram-token.json" with { type: "json" };
import skhynixHbmTokenRules from "./packs/skhynix-hbm-token.json" with { type: "json" };
import skhynixLpddr4xTokenRules from "./packs/skhynix-lpddr4x-token.json" with { type: "json" };
import skhynixDdr4_32gbTokenRules from "./packs/skhynix-ddr4-32gb-token.json" with { type: "json" };
import skhynixH25TokenRules from "./packs/skhynix-h25-token.json" with { type: "json" };
import skhynixHy27RawNandTokenRules from "./packs/skhynix-hy27-raw-nand-token.json" with { type: "json" };
import skhynixUfsTokenRules from "./packs/skhynix-ufs-token.json" with { type: "json" };
import skhynixEmmcTokenRules from "./packs/skhynix-emmc-token.json" with { type: "json" };
import skhynixEmcpTokenRules from "./packs/skhynix-emcp-token.json" with { type: "json" };
import skhynixUmcpTokenRules from "./packs/skhynix-umcp-token.json" with { type: "json" };
import skhynixE2nandTokenRules from "./packs/skhynix-e2nand-token.json" with { type: "json" };
import skhynixH27RawNandTokenRules from "./packs/skhynix-h27-raw-nand-token.json" with { type: "json" };
import kioxiaManagedTokenRules from "./packs/kioxia-managed-token.json" with { type: "json" };
import kioxiaUfsTokenRules from "./packs/kioxia-ufs-token.json" with { type: "json" };
import kioxiaRawTokenRules from "./packs/kioxia-raw-token.json" with { type: "json" };
import sandiskInandManagedTokenRules from "./packs/sandisk-inand-managed-token.json" with { type: "json" };
import sandiskInandLegacyTokenRules from "./packs/sandisk-inand-legacy-token.json" with { type: "json" };
import sandiskIssdTokenRules from "./packs/sandisk-issd-token.json" with { type: "json" };
import sandiskMarkingTokenRules from "./packs/sandisk-marking-token.json" with { type: "json" };
import sandiskRawTokenRules from "./packs/sandisk-raw-token.json" with { type: "json" };
import siliconMotionManagedTokenRules from "./packs/siliconmotion-managed-token.json" with { type: "json" };
import kingstonEmmcTokenRules from "./packs/kingston-emmc-token.json" with { type: "json" };
import kingstonUfsTokenRules from "./packs/kingston-ufs-token.json" with { type: "json" };
import kingstonEmcpTokenRules from "./packs/kingston-emcp-token.json" with { type: "json" };
import kingstonEpopTokenRules from "./packs/kingston-epop-token.json" with { type: "json" };
import longsysEmmcTokenRules from "./packs/longsys-emmc-token.json" with { type: "json" };
import longsysUfsTokenRules from "./packs/longsys-ufs-token.json" with { type: "json" };
import longsysEmcpTokenRules from "./packs/longsys-emcp-token.json" with { type: "json" };
import longsysSpiNandTokenRules from "./packs/longsys-spi-nand-token.json" with { type: "json" };
import longsysDramTokenRules from "./packs/longsys-dram-token.json" with { type: "json" };
import biwinEmmcTokenRules from "./packs/biwin-emmc-token.json" with { type: "json" };
import biwinUfsTokenRules from "./packs/biwin-ufs-token.json" with { type: "json" };
import biwinEmcpTokenRules from "./packs/biwin-emcp-token.json" with { type: "json" };
import biwinEpopTokenRules from "./packs/biwin-epop-token.json" with { type: "json" };
import biwinDramTokenRules from "./packs/biwin-dram-token.json" with { type: "json" };
import ymtcProcessTokenRules from "./packs/ymtc-process-token.json" with { type: "json" };
import ymtcNandTokenRules from "./packs/ymtc-nand-token.json" with { type: "json" };
import ymtcUnimosTokenRules from "./packs/ymtc-unimos-token.json" with { type: "json" };
import ymtcEmmcTokenRules from "./packs/ymtc-emmc-token.json" with { type: "json" };
import ymtcUfsTokenRules from "./packs/ymtc-ufs-token.json" with { type: "json" };
import phisonTokenRules from "./packs/phison-token.json" with { type: "json" };
import spectekManagedTokenRules from "./packs/spectek-managed-token.json" with { type: "json" };
import spectekDramTokenRules from "./packs/spectek-dram-token.json" with { type: "json" };
import spectekRawTokenRules from "./packs/spectek-raw-token.json" with { type: "json" };
import vendorPrefixRules from "./packs/vendor-prefix.json" with { type: "json" };

export const defaultPartDecodeSpecs = [
  ...micronXpointTokenRules,
  ...micronManagedTokenRules,
  ...micronSsdTokenRules,
  ...micronEmmcTokenRules,
  ...micronEmcpTokenRules,
  ...micronDramTokenRules,
  ...micronHbmTokenRules,
  ...micronHmcTokenRules,
  ...micronRawStructuredTokenRules,
  ...micronRawTokenRules,
  ...intelRawTokenRules,
  ...samsungUfsTokenRules,
  ...samsungEmmcTokenRules,
  ...samsungLegacyEmcpTokenRules,
  ...samsungMcpTokenRules,
  ...samsungHbmTokenRules,
  ...samsungDramTokenRules,
  ...samsungRawTokenRules,
  ...nanyaDramTokenRules,
  ...elpidaDramTokenRules,
  ...cxmtDramTokenRules,
  ...gigadeviceDramTokenRules,
  ...issiDramTokenRules,
  ...issiEmmcTokenRules,
  ...issiUfsTokenRules,
  ...issiNandTokenRules,
  ...winbondDramTokenRules,
  ...winbondNandTokenRules,
  ...macronixNandTokenRules,
  ...esmtDramTokenRules,
  ...esmtEmmcTokenRules,
  ...esmtRawTokenRules,
  ...etronDramTokenRules,
  ...skhynixDramTokenRules,
  ...skhynixHbmTokenRules,
  ...skhynixLpddr4xTokenRules,
  ...skhynixDdr4_32gbTokenRules,
  ...skhynixH25TokenRules,
  ...skhynixHy27RawNandTokenRules,
  ...skhynixUfsTokenRules,
  ...skhynixEmmcTokenRules,
  ...skhynixEmcpTokenRules,
  ...skhynixUmcpTokenRules,
  ...skhynixE2nandTokenRules,
  ...skhynixH27RawNandTokenRules,
  ...kioxiaManagedTokenRules,
  ...kioxiaUfsTokenRules,
  ...kioxiaRawTokenRules,
  ...sandiskInandManagedTokenRules,
  ...sandiskInandLegacyTokenRules,
  ...sandiskIssdTokenRules,
  ...sandiskMarkingTokenRules,
  ...sandiskRawTokenRules,
  ...siliconMotionManagedTokenRules,
  ...kingstonEmmcTokenRules,
  ...kingstonUfsTokenRules,
  ...kingstonEmcpTokenRules,
  ...kingstonEpopTokenRules,
  ...longsysEmmcTokenRules,
  ...longsysUfsTokenRules,
  ...longsysEmcpTokenRules,
  ...longsysSpiNandTokenRules,
  ...longsysDramTokenRules,
  ...biwinEmmcTokenRules,
  ...biwinUfsTokenRules,
  ...biwinEmcpTokenRules,
  ...biwinEpopTokenRules,
  ...biwinDramTokenRules,
  ...ymtcProcessTokenRules,
  ...ymtcNandTokenRules,
  ...ymtcUnimosTokenRules,
  ...ymtcEmmcTokenRules,
  ...ymtcUfsTokenRules,
  ...phisonTokenRules,
  ...spectekManagedTokenRules,
  ...spectekDramTokenRules,
  ...spectekRawTokenRules,
  ...vendorPrefixRules
] as PartDecodeSpec[];
