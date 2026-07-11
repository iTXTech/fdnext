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

assertDram("NT5DS32M16CS-5T", {
  vendor: "nanya",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-II-66",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "CS",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400 3-3-3"
  }
});

assertDram("NT5TU32M16FG-ACI", {
  vendor: "nanya",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "BGA-84",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FG",
    "Config Code": "32M16",
    "DRAM Speed": "DDR2-800 5-5-5",
    "Operation Temperature": "Industrial (-40C~95C)"
  }
});

assertDram("NT5CB128M8GN-DI", {
  vendor: "nanya",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "VFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "GN",
    "Config Code": "128M8",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5CC64M16GP-EKI", {
  vendor: "nanya",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "VFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "GP",
    "Config Code": "64M16",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Industrial (-40C~95C)"
  }
});

assertDram("NT5CB128M16JR-DI", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "TFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600 11-11-11"
  }
});

assertDram("NT5CC128M16JR-DI", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "TFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600 11-11-11"
  }
});

assertDram("NT5CB256M8JQ-DIT", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "TFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "JQ",
    "Config Code": "256M8",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Quasi Industrial (-40C~95C)"
  }
});

assertDram("NT5CC128M16JR-DIB", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "TFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "JR",
    "Config Code": "128M16",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~95C)",
    "Special Option": "Reduced Standby"
  }
});

assertDram("NT5CB256M8IN-DIH", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "VFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "IN",
    "Config Code": "256M8",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Automotive Grade 2 (-40C~105C)"
  }
});

assertDram("NT5CB256M8FN-EJ", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "TFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FN",
    "Config Code": "256M8",
    "DRAM Speed": "DDR3-1866 12-12-12",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5CB512M8CN-AC", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "TFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "CN",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-800 5-5-5",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5CC256M16CP-FL", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "TFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "CP",
    "Config Code": "256M16",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5CC512M8EQ-DIB", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "TFBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "EQ",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~95C)",
    "Special Option": "Reduced Standby"
  }
});

assertDram("NT5CC256M16ER-EKT", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "TFBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "ER",
    "Config Code": "256M16",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Quasi Industrial (-40C~95C)"
  }
});

assertDram("NT5AD1024M8C3-HR", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD / 1.2V VDDQ / 2.5V VPP",
  package: "TFBGA-78, 7.50x12.00, 0.80 pitch",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "C3",
    "Config Code": "1024M8",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Commercial (0C~95C)",
    "Bank Count": 16,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "C-die (3rd version)"
  }
});

assertDram("NT5AD1024M8C3", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD / 1.2V VDDQ / 2.5V VPP",
  package: "TFBGA-78, 7.50x12.00, 0.80 pitch",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "C3",
    "Config Code": "1024M8",
    "Bank Count": 16,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "C-die (3rd version)"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("NT5AD256M16E4-HRT", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD / 1.2V VDDQ / 2.5V VPP",
  package: "TFBGA-96, 7.50x13.00, 0.80 pitch",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "E4",
    "Config Code": "256M16",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Quasi Industrial (-40C~95C)",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "E-die (5th version)"
  }
});

assertDram("NT5FF1024M16A4-Q5", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "BGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "A4",
    "Config Code": "1024M16",
    "DRAM Speed": "DDR5-5600",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5FF1024M16A4-N2", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "BGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "A4",
    "Config Code": "1024M16",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT5AD1024M8C3-IYW", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD / 1.2V VDDQ / 2.5V VPP",
  package: "TFBGA-78, 7.50x12.00, 0.80 pitch",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-2933 21-21-21",
    "Operation Temperature": "Quasi Industrial (-40C~105C)"
  }
});

assertDram("NT5FF2048M8EK-WEU", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "BGA-78",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "EK",
    "Config Code": "2048M8",
    "DRAM Speed": "DDR5-8000",
    "Operation Temperature": "Industrial (-40C~105C)"
  }
});

assertDram("NT5FF2048M8DK-UB", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "BGA-78",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "DK",
    "Config Code": "2048M8",
    "DRAM Speed": "DDR5-7200",
    "Operation Temperature": "Commercial (0C~95C)"
  }
});

assertDram("NT6TL128M32BA-G0", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-134",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BA",
    "Config Code": "128M32",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "Commercial (-25C~85C)"
  }
});

assertDram("NT6CL256M32AM-H0", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Speed": "LPDDR3-2133",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 1,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 16,
    "Speed Grade": "H0 2133Mbps @ RL=16"
  }
});

assertDram("NT6CL512T32AM-H1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-1866",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 2,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 14,
    "Speed Grade": "H1 1866Mbps @ RL=14"
  }
});

assertDram("NT6CL1024F32AP-H0", {
  vendor: "nanya",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x1.05, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-2133",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 2,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 16,
    "Speed Grade": "H0 2133Mbps @ RL=16"
  }
});

assertDram("NT6CL128M32DM-H1", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Speed": "LPDDR3-1866",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 1,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "4th version",
    "CAS Latency": 14,
    "Speed Grade": "H1 1866Mbps @ RL=14"
  }
});

assertDram("NT6CL256M16DM-H0", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Speed": "LPDDR3-2133",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 1,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "4th version",
    "CAS Latency": 16,
    "Speed Grade": "H0 2133Mbps @ RL=16"
  }
});

assertDram("NT6CL128M32BQ-H2", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "BGA-168, 12.00x12.00, 0.50 pitch PoP",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Speed": "LPDDR3-1600",
    "Operation Temperature": "Commercial (-25C~85C)",
    "CS Count": 1,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "2nd version",
    "CAS Latency": 12,
    "Speed Grade": "H2 1600Mbps @ RL=12"
  }
});

assertDram("NT6CL256T32BM-H2", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-178, 10.50x11.50x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-1600",
    "Operation Temperature": "Commercial (-25C~85C)",
    "CS Count": 2,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "2nd version",
    "CAS Latency": 12,
    "Speed Grade": "H2 1600Mbps @ RL=12"
  }
});

assertDram("NT6CL128T64DR-H1", {
  vendor: "nanya",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "PoP-FBGA-216, 12.00x12.00x0.83, 0.40 pitch 2-CH",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-1866",
    "Operation Temperature": "Commercial (-30C~105C)",
    "CS Count": 2,
    "Channel Count": 2,
    "Interface Type": "HSUL_12",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "4th version",
    "CAS Latency": 14,
    "Speed Grade": "H1 1866Mbps @ RL=14"
  }
});

assertDram("NT6AN128M16AV-J3", {
  vendor: "nanya",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200, 10.00x15.00x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 1,
    "Package Code": "AV",
    "Config Code": "128M16",
    "DRAM Speed": "LPDDR4-3200",
    "Operation Temperature": "Commercial (-30C~105C)",
    "Channel Count": 1,
    "Interface Type": "LVSTL",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 28,
    "Speed Grade": "J3 0.625ns @ RL=28"
  }
});

assertDram("NT6AN128T32AV-J2", {
  vendor: "nanya",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200, 10.00x15.00x0.83, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 2,
    "Package Code": "AV",
    "Config Code": "128T32",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "Commercial (-30C~105C)",
    "Channel Count": 2,
    "Interface Type": "LVSTL",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 32,
    "Speed Grade": "J2 0.535ns @ RL=32"
  }
});

assertDram("NT6AN512T32AV-J2", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200, 10.00x15.00x1.00, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 2,
    "Package Code": "AV",
    "Config Code": "512T32",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "Commercial (-30C~105C)",
    "Channel Count": 2,
    "Interface Type": "LVSTL",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 32,
    "Speed Grade": "J2 0.535ns @ RL=32"
  }
});

assertDram("NT6AN1024F32AV-J2", {
  vendor: "nanya",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200, 10.00x15.00x1.20, 0.65/0.80 mixed pitch",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 4,
    "Package Code": "AV",
    "Config Code": "1024F32",
    "DRAM Speed": "LPDDR4-3733",
    "Operation Temperature": "Commercial (-30C~105C)",
    "Channel Count": 2,
    "Interface Type": "LVSTL",
    "Bank Count": 8,
    "Solder Type": "Lead-free RoHS compliant and Halogen-free",
    "Die Revision": "1st version",
    "CAS Latency": 32,
    "Speed Grade": "J2 0.535ns @ RL=32"
  }
});
assertDecodedFieldAbsent("NT6AN256M16AV-J3", "dram_speed");

assertDram("NT6AP256F64BN-J1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-376, PoP",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Package Code": "BN",
    "Config Code": "256F64",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6AP512T32AV-J1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "BGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "AV",
    "Config Code": "512T32",
    "DRAM Speed": "LPDDR4X-4267",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K2", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "BGA-315",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5-7500",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024M16A3-K1", {
  vendor: "nanya",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "BGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "A3",
    "Config Code": "1024M16",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});

assertDram("NT6BR1024F64AT-K3", {
  vendor: "nanya",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "BGA-441",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "Commercial (-30C~105C)"
  }
});
