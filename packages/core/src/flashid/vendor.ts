import { UNKNOWN } from "../constants";

export function inferVendorFromFlashId(id: string): string {
  const vendorCode = id.slice(0, 2);
  switch (vendorCode) {
    case "2C":
      return "micron";
    case "EC":
      return "samsung";
    case "AD":
      return "skhynix";
    case "98":
      return "kioxia";
    case "89":
      return "intel";
    case "9B":
      return "ymtc";
    case "B5":
      return "spectek";
    case "45":
    case "EF":
      return "westerndigital";
    default:
      return UNKNOWN;
  }
}

