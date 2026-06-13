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

assertDram("W668GG6TB-06", {
  vendor: "winbond",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "VFBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "CAS Latency": 22,
    "Operation Temperature": "Commercial (0C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W664GG6RB", {
  vendor: "winbond",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "VFBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR4"
  },
  absentExtra: ["DRAM Speed", "CAS Latency", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W664GG8RB06J", {
  vendor: "winbond",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "VFBGA-78, 7.5x11",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "CAS Latency": 22,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W631GG6NB", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "VFBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR3",
    "Bank Count": 8
  },
  absentExtra: ["DRAM Speed", "CAS Latency", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W631GG8NB09J", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "VFBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "CAS Latency": 14,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W631GU6NB09J", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "VFBGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "CAS Latency": 14,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W639H6RBVADI", {
  vendor: "winbond",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "VFBGA-178, 11x11.5",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-2133",
    "Bank Count": 2,
    "Operation Temperature": "Industrial (-40C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W63AH2NBVACE", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "VFBGA-178, 11x11.5",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-1866",
    "Bank Count": 8,
    "Operation Temperature": "Extended (-25C~85C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66AP6NB", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  extra: {
    "DRAM Type": "LPDDR4",
    "Bank Count": 8,
    "Channel Count": 1
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66BP2NQ", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  extra: {
    "DRAM Type": "LPDDR4",
    "Bank Count": 8,
    "Channel Count": 2
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66AQ6NB", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Bank Count": 8,
    "Channel Count": 1
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66BQ2NQ", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Bank Count": 8,
    "Channel Count": 2
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66BP6RB", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD1, 1.1V VDD2, 1.1V VDDQ (LPDDR4) or 0.6V VDDQ (LPDDR4X)",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/4X Combo",
    "Bank Count": 8,
    "Channel Count": 1,
    "Special Option": "LPDDR4 mode at 1.1V VDDQ; LPDDR4X mode at 0.6V VDDQ"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66CP2RQ", {
  vendor: "winbond",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1, 1.1V VDD2, 1.1V VDDQ (LPDDR4) or 0.6V VDDQ (LPDDR4X)",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/4X Combo",
    "Bank Count": 8,
    "Channel Count": 2,
    "Special Option": "LPDDR4 mode at 1.1V VDDQ; LPDDR4X mode at 0.6V VDDQ"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature", "DRAM Die Stack"]
});

assertDram("W66AP6NBHAHI", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "VFBGA-100, 10x7.5, 1.0 thickness",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4-4267",
    "Bank Count": 8,
    "Channel Count": 1,
    "Operation Temperature": "Industrial (-40C~95C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66AQ6NBQAGJ", {
  vendor: "winbond",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "TFBGA-200, 10x14.5, 1.1 thickness",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-3733",
    "Bank Count": 8,
    "Channel Count": 1,
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66BP6RBHAHJ", {
  vendor: "winbond",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD1, 1.1V VDD2, 1.1V VDDQ (LPDDR4) or 0.6V VDDQ (LPDDR4X)",
  package: "VFBGA-100, 10x7.5, 1.0 thickness",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/4X Combo",
    "DRAM Speed": "LPDDR4/4X-4267",
    "Bank Count": 8,
    "Channel Count": 1,
    "Operation Temperature": "Industrial Plus (-40C~105C)",
    "Special Option": "LPDDR4 mode at 1.1V VDDQ; LPDDR4X mode at 0.6V VDDQ"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66CP2RQQAFJ", {
  vendor: "winbond",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1, 1.1V VDD2, 1.1V VDDQ (LPDDR4) or 0.6V VDDQ (LPDDR4X)",
  package: "TFBGA-200, 10x14.5, 1.1 thickness",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/4X Combo",
    "DRAM Speed": "LPDDR4/4X-3200",
    "Bank Count": 8,
    "Channel Count": 2,
    "Operation Temperature": "Industrial Plus (-40C~105C)",
    "Special Option": "LPDDR4 mode at 1.1V VDDQ; LPDDR4X mode at 0.6V VDDQ"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("W66DP2RQQAHJ", {
  vendor: "winbond",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "WFBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Industrial Plus (-40C~105C)"
  },
  absentExtra: ["DRAM Die Stack"]
});
