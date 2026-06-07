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

assertDram("EM63B085TS", {
  vendor: "etron",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200/166/143MHz",
    "Operation Temperature": "Automotive (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6HE16EWBH", {
  vendor: "etron",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "96-ball 7.5 x 13 x 1.0mm FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L 1866/1600/1333MHz",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6A8160TSC-4G", {
  vendor: "etron",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-500 (250MHz)",
    "Operation Temperature": "Commercial (0C~70C)"
  },
  absentExtra: ["DRAM Die Stack", "Speed Grade"]
});

assertDram("EM68A16CBQC-18H", {
  vendor: "etron",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball 8 x 12.5 x 1.2mm FBGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 (533MHz)",
    "Operation Temperature": "Commercial (0C~85C)"
  },
  absentExtra: ["DRAM Die Stack", "Speed Grade"]
});

assertDram("EM6GC16EWBH-09H", {
  vendor: "etron",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball 7.5 x 13 x 1.0mm FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2133 (1066MHz)",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack", "Speed Grade"]
});

assertDram("EM6GF08EBAHC-10BSH", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "78-ball 7.5 x 10.5 x 1.2mm FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 (933MHz)",
    "DRAM Die Stack": "2 dies",
    "Operation Temperature": "Automotive Grade2"
  },
  absentExtra: ["Speed Grade"]
});

assertDram("EM6HD08EWAHK-15AH", {
  vendor: "etron",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "78-ball 7.5 x 10.5 x 1.0mm FBGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1333 (667MHz)",
    "Operation Temperature": "Automotive Grade3"
  },
  absentExtra: ["DRAM Die Stack", "Speed Grade"]
});

assertDram("EM6OF08NWALE", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball 7.5 x 11 x 1.2mm FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4 3200/2666/2400MHz",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6OE08NWALB-08H", {
  vendor: "etron",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball 7.5 x 11 x 1.2mm FBGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2400 (1200MHz)",
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack", "Speed Grade"]
});

assertDram("EM6KA32HVAFA-18H", {
  vendor: "etron",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "134-ball 10 x 11.5 x 1.0mm FBGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066 (533MHz)",
    "Interface Type": "HSUL_12",
    "Bank Count": 4,
    "Operation Temperature": "Commercial (-25C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6PF32MBAJB", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball 10 x 14.5 x 1.1mm FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "BAJB",
    "Config Code": "F32M",
    "DRAM Speed": "LPDDR4/LPDDR4X 4266/3733/3200MHz",
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Commercial (0C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("EM6PF32MBAJB-46SH", {
  vendor: "etron",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "200-ball 10 x 14.5 x 1.1mm FBGA",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4266 (2133MHz)",
    "DRAM Die Stack": "2 dies",
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Commercial (-25C~85C)"
  }
});

assertDram("EM6LE16MVAJA-62BPH", {
  vendor: "etron",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "200-ball 10 x 14.5 x 0.8mm FBGA",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4-3200 (1600MHz)",
    "Channel Count": 1,
    "Bank Count": 8,
    "Operation Temperature": "Automotive A2 (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDecodedFieldAbsent("EM6PF32MBAJB-99H", "dram_speed");
assertDecodedFieldAbsent("EM6OF08NWALE-99H", "dram_speed");
assertDecodedFieldAbsent("EM6GC16EWBH-99H", "dram_speed");
assertDecodedFieldAbsent("EM6GC16EWBH-99H", "speed_grade");
