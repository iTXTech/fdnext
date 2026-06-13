import assert from "node:assert/strict";
import {
  assertDecodedField,
  assertDecodedFieldAbsent,
  assertDecodedPartNumber,
  assertDram,
  assertFieldBlock,
  assertSearchMarkingRelation,
  assertSearchPnFirst,
  assertSearchPnIncludes,
  assertSpectekSearchMarkingRelation,
  assertStackedDram,
  assertUnknown,
  dramPnJson,
  mdbJson,
  micronDramFbgaEntries,
  micronFbgaCodesJson,
  resourceEntries,
  searchFbgaParts
} from "./_helpers";
import spectekDramRules from "../../../src/decodepack/rules/packs/spectek-dram-token.json" with { type: "json" };

const spectekComponentPrefixMeanings = {
  PNL: "No SpecTek Logo",
  PRA: "SpecTek Mark Assembly, 8 chip only",
  PRN: "SpecTek Mark; 8 chip only",
  PRM: "Logo Blast Mark, 8 chip only",
  SGG: "SpecTek Mark; component sale",
  SMG: "Logo Blast Mark; component sale",
  SNL: "Micron tested OC Materials, no logo",
  SUM: "Marked TP/DG/SSMB",
  SUU: "Unmarked TP/DG",
  SCD: "Crucial FBGA code, Micron logo for SSDs",
  SCM: "Crucial FBGA code, Micron logo",
  SCT: "Crucial C build",
  SMC: "Crucial Ballistix (prime marked)",
  SMD: "Crucial Micron Marked w/CPG FBGA Code for SSDs",
  SMM: "Crucial Micron Marked/Reball w/CPG FBGA Code",
  SMU: "Crucial Ballistix (prime unmarked)",
  SM: "Legacy SpecTek mark",
  SU: "Legacy SpecTek mark",
  XAA: "SpecTek Generic (Generic Mark)",
  XBA: "SpecTek Generic (3 line Mark)",
  XCB: "Chip on Board (3 line Mark)",
  XCBB: "Chip on Board Reconfigured Component"
} as const;

const spectekComponentPackageExpectations = {
  AT: ["VFBGA-78/117, 7.5x11.5x1", 1],
  BAF: ["FBGA-78/117, 10.5x11x1.2", 2],
  CF: ["FBGA-60/99, 8x10x1.2", 1],
  CHB: ["FBGA-96/144, 9.5x14x1.2", 2],
  CLU: ["TFBGA-78/117, 7.5x11x1.2", 4],
  DA: ["TFBGA-78/117, 8x10.5x1.2", 1],
  DGA: ["TFBGA-96/144, 9.5x14x1.2", 2],
  DS: ["FBGA-78/117, 9.5x11.5x1.2", 1],
  DVN: ["TFBGA-78/117, 7.5x11.5x1.2", 2],
  EB: ["FBGA-60/99, 9x11.5x1.2", 1],
  EF: ["TFBGA-78/117, 8x10.5x1.2", 1],
  EFN: ["VFBGA-78/117, 7.5x11x1", 4],
  FS: ["FBGA-96/144, 9x14x1.2", 1],
  FSE: ["FBGA-78/117, 9.5x13x1.2", 2],
  GE: ["TFBGA-96/144, 9x14x1.2", 1],
  HA: ["FBGA-96/144, 9x14x1.2", 1],
  HB: ["VFBGA-82/143, 9x11x1.0", 1],
  HBA: ["TFBGA-96/144, 9.5x14x1.2", 2],
  HC: ["VFBGA-102/153, 9x14x1.0", 1],
  HD: ["VFBGA-102/153, 7.5x14x1.0", 1],
  HM: ["VFBGA-102/153, 8.5x14x1.0", 1],
  HPR: ["TFBGA-78/117, 8x12x1.2", 2],
  HX: ["FBGA-78/117, 9x11.5x1.2", 1],
  JC: ["TFBGA-78/117, 9x11x1.2", 1],
  JF: ["VFBGA-82, 9.5x11", 1],
  JP: ["FBGA-78/117, 8x11.5x1.2", 1],
  JT: ["TFBGA-96/144, 8x14x1.2", 1],
  JY: ["TFBGA-96/144, 8x14x1.2", 1],
  KD: ["TFBGA-96/144, 9x13x1.2", 1],
  KJR: ["FBGA-78/117, 9.5x13x1.2", 2],
  KL: ["TFBGA-78/117, 9x11x1.2", 1],
  KNR: ["TFBGA-96, 7.5x13.5x1.2", 2],
  KVA: ["TFBGA-78/117, 8x12x1.2", 4],
  LY: ["TFBGA-96/144, 7.5x13.5x1.2", 1],
  NEA: ["TFBGA-78/117, 7.5x11x1.2", 2],
  NF: ["FBGA-84/135, 8x12.5x1.2", 1],
  NRE: ["FBGA-78/117, 8x12x1.2", 2],
  PA: ["BGA-168/169, 13.5x13.5x1.2", 1],
  PM: ["FBGA-78/117, 9x13.2x1.2", 1],
  RC: ["TFBGA-96/144, 10x13x1.2", 1],
  RFE: ["FBGA-78/117, 8x10.5x1.45", 4],
  RG: ["FBGA-78/117, 7.5x10.6x1.2", 1],
  RH: ["FBGA-78/117, 9x10.5x1.2", 1],
  RHF: ["FBGA-78, 9x10.5", 1],
  RKB: ["TFBGA-78/117, 8x10.5x1.2", 2],
  RW: ["VFBGA-78/117, 8x11x1.0", 1],
  RV: ["VFBGA-102/153, 8x14x1.0", 1],
  RZ: ["VFBGA-78/117, 7.5x11x1.0", 1],
  SA: ["TFBGA-78/117, 7.5x11x1.2", 1],
  SH: ["FBGA-60/117, 8x10x1.2", 1],
  SKL: ["TFBGA-96/144, 10.5x13x1.2", 2],
  SMA: ["TFBGA-78/117, 9.5x11.5x1.45", 4],
  SN: ["FBGA-78/117, 9x13.2x1.2", 1],
  ST: ["VFBGA-78/117, 7.5x11.2x1.0", 1],
  TB: ["TFBGA-96/144, 7.5x13x1.2", 1],
  TBB: ["TFBGA-96/144, 7.5x13x1.2", 2],
  THD: ["FBGA-78/117, 9x11.5x1.2", 2],
  THE: ["FBGA-78/112, 10.5x12x1.2", 2],
  THN: ["FBGA-63/99, 8x10x1.2", 2],
  TRF: ["FBGA-78/117, 9.5x11.5x1.2", 2],
  TW: ["FBGA-96/144, 8x14x1.2", 1],
  VA: ["TFBGA-78/117, 10x11x1.2", 1],
  VNE: ["TFBGA-78/117, 10x11x1.2", 2],
  VRN: ["TFBGA-96/144, 8x14x1.2", 2],
  WBU: ["FBGA-96/144, 8x14x1.2", 2],
  WE: ["TFBGA-78/117, 8x12x1.2", 1],
  WPF: ["TFBGA-96/144, 10.5x13x1.2", 4],
  WTR: ["FBGA-63/99, 9x11.5x1.2", 2]
} as const satisfies Record<string, readonly [string, number]>;

function tableKeys(table: unknown): string[] {
  if (Array.isArray(table)) {
    return table.flatMap((entry) => {
      if (typeof entry === "string") {
        return [entry];
      }
      if (entry && typeof entry === "object" && !Array.isArray(entry) && Array.isArray((entry as { keys?: unknown }).keys)) {
        return ((entry as { keys: unknown[] }).keys).filter((key): key is string => typeof key === "string");
      }
      return [];
    });
  }
  if (table && typeof table === "object") {
    return Object.keys(table);
  }
  return [];
}

const spectekComponentRule = (spectekDramRules as Array<{ id: string; tokenDecoder?: { tables?: Record<string, unknown> } }>).find(
  (rule) => rule.id === "vendor.spectek.dram.component.v1"
);
assert.ok(spectekComponentRule?.tokenDecoder?.tables, "SpecTek component DRAM rule should expose token tables");
const spectekComponentTables = spectekComponentRule.tokenDecoder.tables;
const spectekPackageFormat = /^\w*BGA-[0-9/]+, [0-9]+(?:\.[0-9]+)?(?:x[0-9]+(?:\.[0-9]+)?){1,2}$/;

for (const rule of spectekDramRules as Array<{ id: string; tokenDecoder?: { tables?: Record<string, unknown> } }>) {
  for (const tableName of ["packageObj", "profiledPackageObj"]) {
    const table = rule.tokenDecoder?.tables?.[tableName];
    if (!table || typeof table !== "object" || Array.isArray(table)) {
      continue;
    }
    for (const [code, value] of Object.entries(table)) {
      if (!value || typeof value !== "object" || Array.isArray(value) || typeof (value as { package?: unknown }).package !== "string") {
        continue;
      }
      assert.match(
        (value as { package: string }).package,
        spectekPackageFormat,
        `${rule.id} ${tableName}.${code} package should use xxBGA-xx, dim format`
      );
    }
  }
}

assert.deepEqual(
  Object.keys(spectekComponentPrefixMeanings).filter((prefix) => !tableKeys(spectekComponentTables.prefixToken).includes(prefix)),
  [],
  "SpecTek component DRAM should cover all PNS component mark prefixes"
);
assert.deepEqual(
  Object.keys(spectekComponentPrefixMeanings).filter((prefix) => !Object.hasOwn(spectekComponentTables.prefixObj as Record<string, unknown>, prefix)),
  [],
  "SpecTek component DRAM should preserve prefix meanings"
);
assert.deepEqual(
  Object.keys(spectekComponentPackageExpectations).filter((code) => !tableKeys(spectekComponentTables.packageToken).includes(code)),
  [],
  "SpecTek component DRAM should tokenize all current PNS package codes"
);
assert.deepEqual(
  Object.keys(spectekComponentPackageExpectations).filter((code) => !Object.hasOwn(spectekComponentTables.packageObj as Record<string, unknown>, code)),
  [],
  "SpecTek component DRAM should expose all current PNS package descriptions"
);

for (const [prefix, meaning] of Object.entries(spectekComponentPrefixMeanings)) {
  const partNumber = `${prefix}1G8V91AG8SN-107`;
  assertDecodedFieldAbsent(partNumber, "marking_code");
  assertDecodedField(partNumber, "special_option", meaning);
}

for (const [packageCode, [packageText, dieCount]] of Object.entries(spectekComponentPackageExpectations)) {
  const partNumber = `PRN1G8V91AG8${packageCode}-107`;
  assertDecodedField(partNumber, "package", packageText);
  assertDecodedField(partNumber, "die_count", dieCount);
}

assertDram("PRA128M8V88AG8GQF", {
  vendor: "spectek",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA-78/117, 8x10.5",
  extra: {
    "DRAM Type": "DDR3"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PE010", {
  vendor: "spectek",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA-78/117, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PE010"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SU512M8V80A11ARH", {
  vendor: "spectek",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "Unknown",
  extra: {
    "DRAM Type": "DDR3"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PE002", {
  vendor: "spectek",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PE002"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertSpectekSearchMarkingRelation("PE010", "PRA128M8V88AG8GQF");
assertDram("PB001", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "Unknown",
  extra: {
    "DRAM Type": "DDR3",
    "Marking Code": "PB001"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRM2G8Y52KBFRZ-56B", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V",
  package: "VFBGA-78/117, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-5600 CL46"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRN1G8Y52KB8RZ-64B", {
  vendor: "spectek",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.1V",
  package: "VFBGA-78/117, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-6400 CL52",
    "Special Option": "SpecTek Mark; 8 chip only"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRN4G8Y53AB8AT-64B", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.1V",
  package: "VFBGA-78/117, 7.5x11.5x1",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-6400 CL52",
    "Special Option": "SpecTek Mark; 8 chip only"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRM4G8Y53BB8AT-72B", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.1V",
  package: "VFBGA-78/117, 7.5x11.5x1",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-7200 CL58",
    "Special Option": "Logo Blast Mark, 8 chip only"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SNL2G8Y52KPNRZ-60P", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.25V",
  package: "VFBGA-78/117, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "OC DDR5-6000 CL36",
    "Special Option": "Micron tested OC Materials, no logo; OC Trimmed"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SNL2G8Y52KPNRZ-64P", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.25V",
  package: "VFBGA-78/117, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "OC DDR5-6400 CL38",
    "Special Option": "Micron tested OC Materials, no logo; OC Trimmed"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRA512M8V80AG8RHF-15E", {
  vendor: "spectek",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA-78, 9x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "667MHz (DDR3-1333) CL9",
    "Special Option": "SpecTek Mark Assembly, 8 chip only"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PU001", {
  vendor: "spectek",
  densityMbit: 12288,
  density: "12Gb",
  widthField: "x16",
  voltage: "1.05V VDD / 0.5V VDDQ",
  extra: {
    "DRAM Type": "LPDDR",
    "Marking Code": "PU001"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM8G32Y52PDAFDV-UT", {
  vendor: "spectek",
  densityMbit: 262144,
  density: "256Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "LFBGA-315, 12.4x15.0x1.30",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Speed Grade": "UT Untested"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDecodedField("SM8G32Y52PDAFDV-UT", "die_count", 16);
assertSpectekSearchMarkingRelation("PB001", "SM512M322C0FD4LH6");
assertSpectekSearchMarkingRelation("PU001", "SM768M16Y2BMD1FDS");
assertDram("SN512M32Z42MD1DNQ-053BT", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA-200/264, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1866MHz (LPDDR4-3733)",
    "Speed Grade": "BT Fully Tested at 70 degrees"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SN512M32Z42MD1DNQ053BT", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA-200/264, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1866MHz (LPDDR4-3733)",
    "Speed Grade": "BT Fully Tested at 70 degrees"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Z11MD4DDT-062BTA", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA-200/264, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1600MHz (LPDDR4-3200)",
    "Speed Grade": "BT Fully Tested at 70 degrees",
    "Special Option": "1 rank, 1 CS, ODT=Vss, 2 RESET, 2 ZQ"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Z11MD4DDT062BTA", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA-200/264, 10.0x14.5x0.95",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1600MHz (LPDDR4-3200)",
    "Speed Grade": "BT Fully Tested at 70 degrees",
    "Special Option": "1 rank, 1 CS, ODT=Vss, 2 RESET, 2 ZQ"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Z11MD4DDS-062BTA", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "WFBGA-200/264, 10x14.5x0.8",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "1600MHz (LPDDR4-3200)",
    "Speed Grade": "BT Fully Tested at 70 degrees",
    "Special Option": "1 rank, 1 CS, ODT=Vss, 2 RESET, 2 ZQ"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Y11MD4BDS-023FTB", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V",
  package: "TFBGA-315/315, 12.4x15.0x1.1",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "4266MHz (LPDDR5-8533)",
    "Speed Grade": "FT Fully Tested at 90 degrees",
    "Special Option": "Solder Down"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("SM1G32Y11MD4BDS023FTB", {
  vendor: "spectek",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.1V",
  package: "TFBGA-315/315, 12.4x15.0x1.1",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "4266MHz (LPDDR5-8533)",
    "Speed Grade": "FT Fully Tested at 90 degrees",
    "Special Option": "Solder Down"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PRN1G8V91AG8SN-107", {
  vendor: "spectek",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA-78/117, 9x13.2x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "933MHz (DDR-1866)"
  },
  absentExtra: ["Config Code", "Package Code"]
});
