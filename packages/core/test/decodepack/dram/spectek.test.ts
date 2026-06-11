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
  detect,
  dramPnJson,
  mdbJson,
  micronDramFbgaEntries,
  micronFbgaCodesJson,
  resourceEntries,
  searchFbgaParts
} from "./_helpers";

assertDram("PRA128M8V88AG8GQF", {
  vendor: "spectek",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V",
  package: "FBGA 78/117B, 8x10.5MM",
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
  package: "FBGA 78/117B, 8x10.5MM",
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
  package: "Unknown",
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
  package: "Unknown",
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
  package: "Unknown",
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
  package: "VFBGA 78/117B, 7.5x11x1.0",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-5600"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertDram("PU001", {
  vendor: "spectek",
  densityMbit: 12288,
  density: "12Gb",
  widthField: "x16",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR",
    "Marking Code": "PU001"
  },
  absentExtra: ["Config Code", "Package Code"]
});
assertSpectekSearchMarkingRelation("PB001", "SM512M322C0FD4LH6");
assertSpectekSearchMarkingRelation("PU001", "SM768M16Y2BMD1FDS");
assertDram("SN512M32Z42MD1DNQ-053BT", {
  vendor: "spectek",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.1V VDD / 0.6V VDDQ",
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
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
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
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
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
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
  package: "VFBGA 200/264-ball, 10.0x14.5x0.95",
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
  package: "WFBGA 200/264-ball, 10x14.5x0.8 .325mm",
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
  package: "TFBGA 315/315-ball, 12.4x15.0x1.1",
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
  package: "TFBGA 315/315-ball, 12.4x15.0x1.1",
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
  package: "FBGA 78/117B, 9x13.2x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "933MHz (DDR-1866)"
  },
  absentExtra: ["Config Code", "Package Code"]
});
