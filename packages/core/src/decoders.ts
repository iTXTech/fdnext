import { UNKNOWN } from "./constants.js";
import type { Classification, FlashInfo, PartNumberDecoder } from "./types.js";

const MICRON_DENSITY: Record<string, number> = {
  "1G": 1 * 1024,
  "2G": 2 * 1024,
  "4G": 4 * 1024,
  "8G": 8 * 1024,
  "16G": 16 * 1024,
  "21G": 21 * 1024,
  "32G": 32 * 1024,
  "42G": 42 * 1024,
  "64G": 64 * 1024,
  "84G": 84 * 1024,
  "128G": 128 * 1024,
  "168G": 168 * 1024,
  "192G": 192 * 1024,
  "256G": 256 * 1024,
  "336G": 336 * 1024,
  "384G": 384 * 1024,
  "512G": 512 * 1024,
  "768G": 768 * 1024,
  "1T": 1024 * 1024,
  "1T2": 1.125 * 1024 * 1024,
  "1HT": 1.5 * 1024 * 1024,
  "2T": 2 * 1024 * 1024,
  "3T": 3 * 1024 * 1024,
  "4T": 4 * 1024 * 1024,
  "6T": 6 * 1024 * 1024,
  "8T": 8 * 1024 * 1024,
  "16T": 16 * 1024 * 1024
};

const MICRON_CLASSIFICATION: Record<string, [number, number, number, number]> = {
  A: [1, 0, 0, 1],
  B: [1, 1, 1, 1],
  D: [2, 1, 1, 1],
  E: [2, 2, 2, 2],
  F: [2, 2, 2, 1],
  G: [3, 3, 3, 3],
  J: [4, 2, 2, 1],
  K: [4, 2, 2, 2],
  L: [4, 4, 4, 4],
  M: [4, 4, 4, 2],
  Q: [8, 4, 4, 4],
  R: [8, 2, 2, 2],
  T: [16, 8, 4, 2],
  U: [8, 4, 4, 2],
  V: [16, 8, 4, 4],
  C: [3, 3, -1, 2],
  H: [4, 1, -1, 1],
  N: [6, 6, -1, 3],
  P: [8, 8, -1, 2],
  W: [16, 4, -1, 2],
  X: [4, 4, -1, 2],
  Y: [11, 7, -1, 4],
  "1": [16, 2, -1, 1],
  "2": [64, 8, -1, 2],
  "3": [8, 4, -1, 2],
  "4": [4, 4, -1, 1],
  S: [16, 4, -1, 4]
};

const MICRON_VOLTAGE: Record<string, string> = {
  A: "Vcc: 3.3V (2.70–3.60V), VccQ: 3.3V (2.70–3.60V)",
  B: "1.8V (1.70–1.95V)",
  C: "Vcc: 3.3V (2.70–3.60V), VccQ: 1.8V (1.70–1.95V)",
  E: "Vcc: 3.3V (2.70–3.60V), VccQ: 3.3V (2.70–3.60V) or 1.8V (1.70–1.95V)",
  F: "Vcc: 3.3V (2.50–3.60V), VccQ: 1.2V (1.14–1.26V)",
  G: "Vcc: 3.3V (2.60–3.60V), VccQ: 1.8V (1.70–1.95V)",
  H: "Vcc: 3.3V (2.50–3.60V), VccQ: 1.2V (1.14–1.26) or 1.8V (1.70–1.95V)",
  J: "Vcc: 3.3V (2.50–3.60V), VccQ: 1.8V (1.70–1.95V)",
  K: "Vcc: 3.3V (2.60–3.60V), VccQ: 3.3V (2.60–3.60V)",
  L: "Vcc: 2.5V (2.35–3.60V), VccQ: 1.2V (1.14–1.26V)"
};

const MICRON_GENERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6
};

const MICRON_INTERFACE: Record<string, [boolean, boolean, boolean]> = {
  A: [false, true, false],
  B: [true, true, false],
  C: [true, false, false],
  D: [false, false, true],
  E: [true, true, false],
  F: [true, true, false],
  G: [true, true, false],
  M: [false, false, false],
  N: [true, true, false],
  H: [true, true, false]
};

const MICRON_PACKAGE: Record<string, string> = {
  WP: "48-pin TSOP I Center Package Leads (CPL) PB free",
  WC: "48-pin TSOP I Off-center Package Leads (OCPL) PB free"
};

const CELL_LEVEL: Record<string, string> = {
  A: "SLC",
  C: "MLC",
  E: "TLC",
  G: "QLC"
};

function shiftChars(value: string, count: number): [string, string] {
  if (count > value.length) {
    return ["", value];
  }
  return [value.slice(0, count), value.slice(count)];
}

function matchFromStart(value: string, table: Record<string, number>): [number | undefined, string] {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (value.startsWith(key)) {
      return [table[key], value.slice(key.length)];
    }
  }
  return [undefined, value];
}

function decodeMicron(partNumber: string): Partial<FlashInfo> | null {
  if (!(partNumber.startsWith("MT") || partNumber.startsWith("29"))) {
    return null;
  }

  let body = partNumber;
  if (!body.startsWith("29")) {
    [, body] = shiftChars(body, 2); // remove MT
  }
  [, body] = shiftChars(body, 2); // remove 29

  let token: string;
  [token, body] = shiftChars(body, 1);
  const enterprise = token === "E";

  const [density, afterDensity] = matchFromStart(body, MICRON_DENSITY);
  body = afterDensity;

  [token, body] = shiftChars(body, 2);
  const deviceWidth = token === "01" ? 1 : token === "08" ? 8 : token === "16" ? 16 : -1;

  [token, body] = shiftChars(body, 1);
  const cellLevel = CELL_LEVEL[token];

  [token, body] = shiftChars(body, 1);
  const classificationRaw = MICRON_CLASSIFICATION[token] ?? [-1, -1, -1, -1];
  const classification: Classification = {
    ce: classificationRaw[1],
    ch: classificationRaw[3],
    rb: classificationRaw[2],
    die: classificationRaw[0]
  };

  [token, body] = shiftChars(body, 1);
  const voltage = MICRON_VOLTAGE[token] ?? UNKNOWN;

  [token, body] = shiftChars(body, 1);
  const generation = MICRON_GENERATION[token] != null ? String(MICRON_GENERATION[token]) : undefined;

  [token, body] = shiftChars(body, 1);
  const ifDef = MICRON_INTERFACE[token] ?? [false, false, false];
  const interfaceValue = ifDef[2] ? { spi: true } : { async: ifDef[1], sync: ifDef[0] };

  [token] = shiftChars(body, 2);
  const pkg = MICRON_PACKAGE[token] ?? UNKNOWN;

  return {
    vendor: "micron",
    type: "nand",
    density,
    deviceWidth,
    cellLevel,
    classification,
    voltage,
    generation,
    interface: interfaceValue,
    package: pkg,
    extraInfo: {
      enterprise
    },
    url: {
      micron_website: `https://www.micron.com/support/tools-and-utilities/fbga?matpart=${partNumber}`
    },
    urls: [
      {
        url: `https://www.micron.com/support/tools-and-utilities/fbga?matpart=${partNumber}`,
        desc: "micron_website",
        img: "logo",
        hint: ""
      }
    ]
  };
}

export function buildDefaultDecoders(): PartNumberDecoder[] {
  return [
    {
      id: "micron.full",
      priority: 900,
      check: (pn) => pn.startsWith("MT") || pn.startsWith("29"),
      decode: (pn) => decodeMicron(pn)
    },
    { id: "prefix.micron", priority: 100, check: (pn) => pn.startsWith("MT"), decode: () => ({ vendor: "micron", type: "nand" }) },
    { id: "prefix.samsung", priority: 90, check: (pn) => pn.startsWith("K"), decode: () => ({ vendor: "samsung" }) },
    { id: "prefix.skhynix", priority: 90, check: (pn) => pn.startsWith("H") || pn.startsWith("HY"), decode: () => ({ vendor: "skhynix" }) },
    { id: "prefix.kioxia", priority: 90, check: (pn) => pn.startsWith("TC58") || pn.startsWith("TH58"), decode: () => ({ vendor: "kioxia" }) },
    { id: "prefix.wd", priority: 85, check: (pn) => pn.startsWith("SD") || pn.startsWith("S34") || pn.startsWith("S35"), decode: () => ({ vendor: "westerndigital" }) },
    { id: "prefix.intel", priority: 80, check: (pn) => pn.startsWith("JS") || pn.startsWith("29F"), decode: () => ({ vendor: "intel" }) },
    { id: "prefix.ymtc", priority: 70, check: (pn) => pn.startsWith("XT"), decode: () => ({ vendor: "ymtc" }) },
    { id: "prefix.phison", priority: 70, check: (pn) => pn.startsWith("PH"), decode: () => ({ vendor: "phison" }) }
  ];
}
