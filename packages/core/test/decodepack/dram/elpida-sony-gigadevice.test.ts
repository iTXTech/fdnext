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

assertDram("EDS1216AATA-75", {
  vendor: "elpida",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "TSOP-II-54",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "AATA",
    "Config Code": "1216",
    "DRAM Speed": "133MHz"
  }
});

assertDram("EDD2516AKTA-5B", {
  vendor: "elpida",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-II-66",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "AKTA",
    "Config Code": "2516",
    "DRAM Speed": "DDR-400"
  }
});

assertDram("EDE1116ACBG-8E", {
  vendor: "elpida",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "ACBG",
    "Config Code": "1116",
    "DRAM Speed": "DDR2-800"
  }
});

assertDram("EDJ4208BASE-GN", {
  vendor: "elpida",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BASE",
    "Config Code": "4208",
    "DRAM Speed": "DDR3-1600K (11-11-11)"
  }
});

assertDram("EDF8164A3MA-GD-F", {
  vendor: "elpida",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-216",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "A3MA",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR3-1066"
  }
});

assertDram("EDB8164B3PF-8D", {
  vendor: "elpida",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-216",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "B3PF",
    "Config Code": "8164",
    "DRAM Speed": "LPDDR2-1066"
  }
});

assertDram("EDW2032BBBG-60", {
  vendor: "elpida",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "FBGA-170",
  extra: {
    "DRAM Type": "GDDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BBBG",
    "Config Code": "2032",
    "DRAM Speed": "GDDR5-6Gbps"
  }
});

assertDram("CXDQ3BFAM-CJ", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FAM",
    "Config Code": "3B",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("CXDQ3BFAM", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FAM",
    "Config Code": "3B"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("CXDQ3A8AM-CQ-A", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "8AM",
    "Config Code": "3A",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "A-die"
  }
});

assertDram("CXDQ3A8AM-IJ-A", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "8AM",
    "Config Code": "3A",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Die Revision": "A-die"
  }
});

assertDram("CXDQ3BFAM-WG", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FAM",
    "Config Code": "3B",
    "DRAM Speed": "DDR4-2666 18-18-18",
    "Operation Temperature": "Wide (-40C~95C)"
  },
  absentExtra: ["Die Revision", "Process Node"]
});

assertDram("CXDQ3A8AM-WG", {
  vendor: "cxmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Speed": "DDR4-2666 18-18-18",
    "Operation Temperature": "Wide (-40C~95C)"
  },
  absentExtra: ["Die Revision", "Process Node"]
});

assertDram("CXDQ4A8AM-CJ-M", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "8AM",
    "Config Code": "4A",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "M-die",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDR4E8BM-CS-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BM",
    "Config Code": "4E8",
    "DRAM Speed": "DDR5-5600",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "Rev A",
    "Process Node": "CXMT G4 / 16nm-class"
  }
});

assertDram("CXDR4E8BM-CR-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BM",
    "Config Code": "4E8",
    "DRAM Speed": "DDR5-4800",
    "Operation Temperature": "Commercial (0C~95C)",
    "Die Revision": "Rev A",
    "Process Node": "CXMT G4 / 16nm-class"
  }
});

assertDram("CXDR4E8BM-UP-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82, 9x11",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BM",
    "Config Code": "4E8",
    "DRAM Speed": "DDR5-4800",
    "Die Revision": "Rev A",
    "Process Node": "CXMT G4 / 16nm-class"
  }
});

assertDram("CDTQ", {
  vendor: "cxmt",
  densityMbit: 98304,
  density: "96Gb",
  widthField: "Unknown",
  voltage: "Unknown",
  package: "BGA, PoP MCP",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Density": "12Gb",
    "Package Code": "CDTQ",
    "DRAM Generation": "CXMT G3",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCAM-MK", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Package Code": "CAM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDBBCCAM-MK", {
  vendor: "cxmt",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB4CBAM-MK-A", {
  vendor: "cxmt",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "BAM",
    "Config Code": "4C",
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCBM-MA-A", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Package Code": "CBM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CBAM-MA-B", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB5CCBM-MK-A", {
  vendor: "cxmt",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Package Code": "CBM",
    "Config Code": "5C",
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G3 / 18nm-class"
  }
});

assertDram("CXDB6CCBM-MA-A", {
  vendor: "cxmt",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C",
    "Process Node": "CXMT G4"
  }
});

assertDram("GDP0BFLM-CB", {
  vendor: "gigadevice",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("GDP1BFLA-CA", {
  vendor: "gigadevice",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("GDP2A8LM-WA", {
  vendor: "gigadevice",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V / 1.5V",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-2133 14-14-14",
    "Operation Temperature": "Wide (-40C~95C)"
  }
});

assertDram("GDP2BFLM-WB", {
  vendor: "gigadevice",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Wide (-40C~95C)"
  }
});

assertDram("GDP3BELM-CB", {
  vendor: "gigadevice",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~95C)",
    "Special Option": "DDP"
  }
});
assertDecodedField("GDP3BELM-CB", "dram_die_count", 2);

assertDram("GDQ3A8AM-CQ", {
  vendor: "gigadevice",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("GDQ3BFAM-IJ", {
  vendor: "gigadevice",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Industrial II (-40C~105C)"
  }
});

assertDram("GDQ2BFAC-WQ", {
  vendor: "gigadevice",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Industrial I (-40C~95C)"
  }
});

assertDram("GDQ2BFAA-CE", {
  vendor: "gigadevice",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("GDB5CBQN-ML", {
  vendor: "gigadevice",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 1.1V and 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4X-4266",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("GDB5CCQN-MK", {
  vendor: "gigadevice",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 1.1V and 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-3733",
    "Operation Temperature": "-25C~85C"
  }
});
