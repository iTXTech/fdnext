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

assertDram("W9412G6KH", {
  vendor: "winbond",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-66, 400 mil",
  extra: {
    "DRAM Type": "DDR",
    "Bank Count": 4
  },
  absentExtra: ["DRAM Speed", "CAS Latency", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W9412G6KH-6I", {
  vendor: "winbond",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-66, 400 mil",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-333 CL3",
    "CAS Latency": 3,
    "Bank Count": 4,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W9425G6KH-5K", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-66, 400 mil",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-400 CL3",
    "CAS Latency": 3,
    "Bank Count": 4,
    "Operation Temperature": "Automotive AG2 (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W948D6KBHX", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "VFBGA-60",
  extra: {
    "DRAM Type": "LPDDR",
    "Bank Count": 4
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W948V6KBHX6I", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "VFBGA-60",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 166MHz",
    "Bank Count": 4,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W949D2DBJX5E", {
  vendor: "winbond",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "VFBGA-90",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 200MHz",
    "Bank Count": 4,
    "Operation Temperature": "Extended (-25C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W94AD6KBHX6I", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "VFBGA-60",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 166MHz",
    "Bank Count": 4,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W9712G6KB", {
  vendor: "winbond",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "TFBGA-84, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "Bank Count": 4
  },
  absentExtra: ["DRAM Speed", "CAS Latency", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W9712G6KB25I", {
  vendor: "winbond",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "TFBGA-84, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-800 5-5-5/6-6-6",
    "Bank Count": 4,
    "Operation Temperature": "Industrial (-40C~95C)"
  },
  absentExtra: ["CAS Latency", "DRAM Die Stack"]
});

assertDram("W971GG8NB18J", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.8V VDD",
  package: "TFBGA-60, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 6-6-6",
    "CAS Latency": 6,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W9725G8KB-3", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x8",
  voltage: "1.8V VDD",
  package: "TFBGA-60, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-667 5-5-5",
    "CAS Latency": 5,
    "Bank Count": 4,
    "Operation Temperature": "Commercial (0C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W972GG6KB18J", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "TFBGA-84, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 7-7-7",
    "CAS Latency": 7,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W972GG8KS", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.8V VDD",
  package: "TFBGA-60, 8x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "Bank Count": 8
  },
  absentExtra: ["DRAM Speed", "CAS Latency", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W978H6KB", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "VFBGA-134, 10x11.5",
  extra: {
    "DRAM Type": "LPDDR2",
    "Bank Count": 4
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W978H2KBVX1E", {
  vendor: "winbond",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "VFBGA-134, 10x11.5",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066",
    "Bank Count": 4,
    "Operation Temperature": "Extended (-25C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W979H6RBVA2I", {
  vendor: "winbond",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "VFBGA-134, 10x11.5",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-800",
    "Bank Count": 4,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W97AH6KB", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "VFBGA-134, 10x11.5",
  extra: {
    "DRAM Type": "LPDDR2",
    "Bank Count": 8
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W97AH2KBVX1I", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "VFBGA-134, 10x11.5",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066",
    "Bank Count": 8,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});
