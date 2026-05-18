export const UNKNOWN = "Unknown";

export const VENDOR_PATCH: Record<string, string> = {
  sandisk: "sndk",
  "san disk": "sndk",
  sndk: "sndk",
  westerndigital: "sndk",
  "western digital": "sndk",
  wd: "sndk",
  toshiba: "kioxia",
  "toshiba-iver": "kioxia",
  hynix: "skhynix",
  "giga device": "gigadevice",
  gd: "gigadevice",
  "兆易创新": "gigadevice",
  septeck: "spectek",
  stm: "st"
};

export const LANGUAGES = ["chs", "eng"] as const;
