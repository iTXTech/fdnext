import { UNKNOWN } from "../constants";

export function inferVendorFromFlashId(id: string): string {
  const vendorCode = id.slice(0, 2);
  switch (vendorCode) {
    case "01":
      return "spansion";
    case "04":
      return "fujitsu";
    case "07":
      return "renesas";
    case "20":
      return "st";
    case "2C":
      return "micron";
    case "4A":
      return "smic";
    case "51":
      return "qimonda";
    case "EC":
      return "samsung";
    case "AD":
      return "skhynix";
    case "92":
      return "powerchip";
    case "98":
      return "kioxia";
    case "89":
      return "intel";
    case "9B":
      return "ymtc";
    case "B5":
      return "spectek";
    case "45":
      return "sndk";
    case "C2":
      return "mxic";
    case "C8":
      return "mira";
    case "EF":
      return "winbond";
    default:
      return UNKNOWN;
  }
}
