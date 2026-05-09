import type { InternalPartInfo } from "../types";
import { normalizePartNumber } from "../utils/normalize";

const GBIT_TO_MBIT = 1024;

const DENSITY_BY_CODE: Record<string, number> = {
  "1G": 1 * GBIT_TO_MBIT,
  "2G": 2 * GBIT_TO_MBIT,
  "4G": 4 * GBIT_TO_MBIT,
  "8G": 8 * GBIT_TO_MBIT,
  "16G": 16 * GBIT_TO_MBIT,
  "32G": 32 * GBIT_TO_MBIT,
  "42G": 42 * GBIT_TO_MBIT,
  "64G": 64 * GBIT_TO_MBIT,
  "84G": 84 * GBIT_TO_MBIT,
  "128G": 128 * GBIT_TO_MBIT,
  "168G": 168 * GBIT_TO_MBIT,
  "256G": 256 * GBIT_TO_MBIT,
  "336G": 336 * GBIT_TO_MBIT,
  "384G": 384 * GBIT_TO_MBIT,
  "512G": 512 * GBIT_TO_MBIT,
  "768G": 768 * GBIT_TO_MBIT,
  "1T": 1024 * GBIT_TO_MBIT,
  "1T2": 1152 * GBIT_TO_MBIT,
  "1HT": 1536 * GBIT_TO_MBIT,
  "2T": 2048 * GBIT_TO_MBIT,
  "3T": 3072 * GBIT_TO_MBIT,
  "4T": 4096 * GBIT_TO_MBIT,
  "6T": 6144 * GBIT_TO_MBIT,
  "8T": 8192 * GBIT_TO_MBIT,
  "16T": 16384 * GBIT_TO_MBIT,
  "32T": 32768 * GBIT_TO_MBIT
};

const DENSITY_CODES = Object.keys(DENSITY_BY_CODE).sort((a, b) => b.length - a.length);

const CELL_LEVEL_BY_CODE: Record<string, string> = {
  A: "SLC",
  C: "MLC",
  E: "TLC",
  G: "QLC"
};

const DIE_COUNT_BY_CLASSIFICATION: Record<string, number> = {
  A: 1,
  B: 1,
  C: 3,
  D: 2,
  E: 2,
  F: 2,
  G: 3,
  H: 4,
  J: 4,
  K: 4,
  L: 4,
  M: 4,
  N: 6,
  P: 8,
  Q: 8,
  R: 8,
  S: 16,
  T: 16,
  U: 8,
  V: 16,
  W: 16,
  X: 4,
  Y: 11,
  "1": 16,
  "2": 64,
  "3": 8,
  "4": 4
};

const PROCESS_NODE_BY_DIE_CAP_CELL_DIE: Record<string, string> = {
  "1:SLC:D": "M68A 34nm",
  "1:SLC:E": "M68M 34nm",
  "1:SLC:F": "M78A 25nm",
  "2:SLC:E": "M69A 34nm",
  "2:SLC:F": "M79M 25nm",
  "2:SLC:G": "M79A 25nm",
  "4:SLC:D": "M60A 34nm",
  "4:SLC:E": "M70M 25nm",
  "4:SLC:F": "M70A 25nm",
  "8:SLC:B": "M61A 34nm",
  "8:SLC:C": "M71M 25nm",
  "16:SLC:B": "M62B 34nm",
  "16:MLC:B": "L62A 34nm",
  "16:SLC:C": "M72A 25nm",
  "16:MLC:C": "L72A 25nm",
  "32:MLC:A": "L63A 34nm",
  "32:TLC:A": "B63A 34nm",
  "32:SLC:A": "M73A 25nm",
  "32:MLC:B": "L63B 34nm",
  "32:SLC:B": "M83A 20nm",
  "32:MLC:C": "L73A 25nm",
  "32:SLC:D": "M83C 20nm",
  "32:MLC:D": "L83A 20nm",
  "42:MLC:A": "L7BT 25nm",
  "64:MLC:A": "L74A 25nm",
  "64:TLC:A": "B74A 25nm",
  "64:SLC:A": "M84A 20nm",
  "64:SLC:B": "M84C 20nm",
  "64:MLC:B": "L84A/L84B 20nm",
  "64:MLC:D": "L84C 20nm",
  "64:MLC:E": "L84D 20nm",
  "64:MLC:F": "L94C 16nm",
  "64:MLC:G": "L04A FG-32L",
  "128:MLC:A": "L85A 20nm",
  "128:TLC:A": "B85T 20nm",
  "128:MLC:B": "L85C 20nm",
  "128:TLC:B": "B95A 16nm",
  "128:MLC:C": "L95B 16nm",
  "128:TLC:D": "B05A FG-32L",
  "128:MLC:E": "L05B FG-32L",
  "256:TLC:A": "B16A FG-64L",
  "256:MLC:B": "L06B FG-32L",
  "256:TLC:B": "B16C FG-64L",
  "256:TLC:C": "B36R/B16E RG-128L/FG-64L",
  "384:TLC:B": "B0KB FG-32L",
  "512:TLC:A": "B17A FG-64L",
  "512:TLC:B": "B27A FG-96L",
  "512:TLC:C": "B27B FG-96L",
  "512:TLC:D": "B37R RG-128L",
  "512:TLC:E": "B47R RG-176L",
  "512:TLC:F": "B57R RG-232L",
  "512:TLC:G": "B27C FG-96L",
  "512:TLC:K": "B47T RG-176L",
  "512:TLC:L": "B57T RG-232L",
  "1024:QLC:A": "N18A FG-64L",
  "1024:QLC:B": "N28A FG-96L",
  "1024:QLC:C": "N48R RG-176L",
  "1024:TLC:C": "B58R RG-232L",
  "1024:QLC:D": "N58R RG-232L",
  "1024:TLC:E": "B68S RG-2yyL",
  "2048:QLC:?": "N69R RG-2yyL"
};

function parseMicronProcessKey(partNumber: string): string | null {
  const normalized = normalizePartNumber(partNumber);
  let rest: string;
  if (normalized.startsWith("MT29")) {
    rest = normalized.slice(4);
  } else if (normalized.startsWith("29")) {
    rest = normalized.slice(2);
  } else {
    return null;
  }

  const nandType = rest[0];
  if (nandType !== "F" && nandType !== "E") {
    return null;
  }
  rest = rest.slice(1);

  const densityCode = DENSITY_CODES.find((code) => rest.startsWith(code));
  if (!densityCode) {
    return null;
  }
  rest = rest.slice(densityCode.length);

  if (rest.length < 6) {
    return null;
  }
  rest = rest.slice(2);

  const cellLevel = CELL_LEVEL_BY_CODE[rest[0] ?? ""];
  const dieCount = DIE_COUNT_BY_CLASSIFICATION[rest[1] ?? ""];
  const dieCode = rest[3] ?? "";
  const density = DENSITY_BY_CODE[densityCode];
  if (!cellLevel || !dieCount || !density || !dieCode) {
    return null;
  }

  const dieCapacity = density / dieCount / GBIT_TO_MBIT;
  if (!Number.isInteger(dieCapacity)) {
    return null;
  }
  return `${dieCapacity}:${cellLevel}:${dieCode}`;
}

export function patchMicronPartNumberProcessNode(info: InternalPartInfo): Partial<InternalPartInfo> | null {
  if (info.vendor !== "micron") {
    return null;
  }

  const key = parseMicronProcessKey(info.partNumber);
  if (!key) {
    return null;
  }

  const processNode = PROCESS_NODE_BY_DIE_CAP_CELL_DIE[key];
  return processNode && info.processNode !== processNode ? { processNode } : null;
}
