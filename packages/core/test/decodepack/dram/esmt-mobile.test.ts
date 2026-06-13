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

assertDram("M14D128168A-1.8BIG2Y", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "BGA-84, A max=1.2",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 (533MHz, 7-7-7)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M52D2561616A-7BG2F", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-54",
  extra: {
    "DRAM Type": "LPSDR",
    "DRAM Speed": "Mobile SDR 143MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M52D5121632A-5BG", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-54",
  extra: {
    "DRAM Type": "LPSDR",
    "DRAM Speed": "Mobile SDR 200MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M53D256328A-5BIG2F", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "FBGA-90",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 200MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M53D256328A-5BG2F", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "FBGA-144",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 200MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M53D2561616A-7.5BG2F", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "BGA-60",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 133MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M53D5121632A-7.5BG", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "BGA-60",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 133MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M53D5123216A-5BG", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "FBGA-144",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR 200MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M52D5123216A-6BIG", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "BGA-90",
  extra: {
    "DRAM Type": "LPSDR",
    "DRAM Speed": "Mobile SDR 166MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M54D1G1664A-1.8BKIG", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-134",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066 (533MHz, RL8/WL4)",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M54D2G3264A-1.8BKG", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-134",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066 (533MHz, RL8/WL4)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M54D2G16128A-3BKG", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-134",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-667 (333MHz, RL5/WL2)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M55D4G32128A-GFBG2R", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-178",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-2133 (1066MHz, RL16/WL8)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M52S32321A-7.5BIG", {
  vendor: "esmt",
  densityMbit: 32,
  density: "32Mb",
  widthField: "x32",
  voltage: "2.5V VDD",
  package: "VFBGA-90",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 133MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M56Z8G32256A(2H)", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4/LPDDR4X-4266 (2133MHz)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M56Z8G32256A-SMBYIG", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-3733 (1866MHz)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M56Z8G32256A-TNBYG2H", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4/LPDDR4X-4266 (2133MHz)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});
