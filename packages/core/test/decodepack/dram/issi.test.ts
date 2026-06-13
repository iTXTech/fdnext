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

assertDram("IS43QR8K02S2A", {
  vendor: "issi",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "BGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Config Code": "2G8 S2",
    "Die Revision": "A"
  }
});

assertDram("IS43TR16512S2DL", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96, 9x13",
  extra: {
    "DRAM Type": "DDR3",
    "Config Code": "512M16 S2",
    "Die Revision": "D"
  }
});

assertDram("IS43TR81280CL-107MBLI-TR", {
  vendor: "issi",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Config Code": "128M8",
    "Die Revision": "C",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Package Code": "B (BGA)",
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS41LV8100B-7BBLI-TR", {
  vendor: "issi",
  densityMbit: 8,
  density: "8Mb",
  widthField: "x8",
  voltage: "3.3V",
  package: "BGA",
  extra: {
    "DRAM Type": "Asynchronous DRAM",
    "Config Code": "1M8",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)",
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +85C)"
  }
});

assertDram("IS42S16100B-7BB", {
  vendor: "issi",
  densityMbit: 16,
  density: "16Mb",
  widthField: "x16",
  voltage: "3.3V SDR",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "Config Code": "1M16",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS45S16100B-7BB", {
  vendor: "issi",
  densityMbit: 16,
  density: "16Mb",
  widthField: "x16",
  voltage: "3.3V SDR",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "Config Code": "1M16",
    "Die Revision": "B",
    "DRAM Speed": "143MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS46DR16128A-25BB", {
  vendor: "issi",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "DDR2",
  package: "BGA",
  extra: {
    "DRAM Type": "DDR2",
    "Config Code": "128M16",
    "Die Revision": "A",
    "DRAM Speed": "400MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS46LD16128A-25BB", {
  vendor: "issi",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "LPDDR2",
  package: "BGA",
  extra: {
    "DRAM Type": "LPDDR2",
    "Config Code": "128M16",
    "Die Revision": "A",
    "DRAM Speed": "400MHz",
    "CAS Latency": 3,
    "Package Code": "B (BGA)"
  }
});

assertDram("IS43LQ16512B-046BLI", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4/LPDDR4X-4266",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "Channel Count": 1,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS43LQ32512A-053BLI", {
  vendor: "issi",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4/LPDDR4X-3733",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS46LQ32K01S2A-046BLA2", {
  vendor: "issi",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4/LPDDR4X-4266",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "CS Count": 2,
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Automotive Grade (-40C to +105C)"
  }
});

assertDram("IS46LQ32K02S2A-053BLA3", {
  vendor: "issi",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4/LPDDR4X-3733",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "CS Count": 2,
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Automotive Grade (-40C to +125C)"
  }
});

assertDram("IS46LQ32256A-062BHLA2", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V VDDQ",
  package: "BGA-200, 1.2 max thickness 0.4 diameter",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4-3200",
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Automotive Grade (-40C to +105C)"
  }
});

assertDram("IS46LQ32256AL-062BLA3", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 0.57-0.65V VDDQ",
  package: "BGA-200, 1.1 max thickness 0.35 diameter",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Speed": "LPDDR4X-3200",
    "Channel Count": 2,
    "Bank Count": 8,
    "Operation Temperature": "Automotive Grade (-40C to +125C)"
  }
});

assertDram("IS43LQ32256BL", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Config Code": "2x16 256M",
    "DRAM Speed": "LPDDR4X-3733/3200"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("IS43LQ32K01B-046BLI", {
  vendor: "issi",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "DRAM Speed": "LPDDR4/LPDDR4X-4266",
    "Operation Temperature": "Industrial Grade (-40C to +95C)",
    "Channel Count": 2
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("IS46LQ32K01B-053BLA3", {
  vendor: "issi",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.70-1.95V VDD1 / 1.06-1.17V VDD2 / 1.06-1.17V or 0.57-0.65V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Generation": "LPDDR4/LPDDR4X",
    "DRAM Speed": "LPDDR4/LPDDR4X-3733",
    "Operation Temperature": "Automotive Grade (-40C to +125C)",
    "Channel Count": 2
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("IS43QR81024B-062AABLI", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "BGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Die Revision": "B",
    "DRAM Speed": "1600MHz (DDR-3200)",
    "CAS Latency": 22,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS43TR16128DL-107MBLI", {
  vendor: "issi",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "D",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS43TR16256B-093NBL", {
  vendor: "issi",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "BGA-96, 9x13",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "B",
    "DRAM Speed": "1066MHz (DDR-2133)",
    "CAS Latency": 14,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA"
  }
});

assertDram("IS43TR85120BL-107MBLI", {
  vendor: "issi",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "B",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +95C)"
  }
});

assertDram("IS46TR16512BL-107MBLA25", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96, 10x14",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "B",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Automotive Grade (-40C to +115C)"
  }
});

assertDram("IS46TR81024B-125KBLA2", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "BGA-78, 10x14",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "B",
    "DRAM Speed": "800MHz (DDR-1600)",
    "CAS Latency": 11,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Automotive Grade (-40C to +105C)"
  }
});

assertDram("IS43TR16512S2DL-107MBLI", {
  vendor: "issi",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96, 9x13",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "D",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Industrial Grade (-40C to +95C)",
    "CS Count": 2
  }
});

assertDram("IS46TR16640CL-125JB2LA2", {
  vendor: "issi",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "C",
    "DRAM Speed": "800MHz (DDR-1600)",
    "CAS Latency": 10,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Automotive Grade (-40C to +105C)"
  }
});

assertDram("IS46TR81280C-125JBLA25", {
  vendor: "issi",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "BGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "C",
    "DRAM Speed": "800MHz (DDR-1600)",
    "CAS Latency": 10,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Automotive Grade (-40C to +115C)"
  }
});

assertDram("IS46TR16256DL-107MBLA3", {
  vendor: "issi",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-96, 7.5x13",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "D",
    "DRAM Speed": "933MHz (DDR-1866)",
    "CAS Latency": 13,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA",
    "Operation Temperature": "Automotive Grade (-40C to +125C)"
  }
});

assertDram("IS43TR85120DL-125KBL", {
  vendor: "issi",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V or 1.5V VDD",
  package: "BGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Die Revision": "D",
    "DRAM Speed": "800MHz (DDR-1600)",
    "CAS Latency": 11,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA"
  }
});

assertDram("IS43QR16256B-083RBL", {
  vendor: "issi",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96, 7.5x13.5, 0.8 pitch",
  extra: {
    "DRAM Type": "DDR4",
    "Die Revision": "B",
    "DRAM Speed": "1200MHz (DDR-2400)",
    "CAS Latency": 16,
    "Solder Type": "100% matte Sn for non-BGA or SnAgCu for BGA"
  }
});
