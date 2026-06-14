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

assertDram("K4A8G085WB-BCRC", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "5WB",
    "Config Code": "8G08",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "B-die"
  }
});

assertDram("K4A8G085WB", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "5WB",
    "Config Code": "8G08",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("K4A4G085WE-BITD", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "5WE",
    "Config Code": "4G08",
    "DRAM Speed": "DDR4-2666 19-19-19",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Die Revision": "E-die"
  }
});

assertDram("K4A4G045WD-BCPB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "5WD",
    "Config Code": "4G04",
    "DRAM Speed": "DDR4-2133 15-15-15",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "D-die"
  }
});

assertDram("K4A4G165WE-BIPB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "5WE",
    "Config Code": "4G16",
    "DRAM Speed": "DDR4-2133 15-15-15",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Die Revision": "E-die"
  }
});

assertDram("K4AAG085WB-MCRC", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "AG08",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Bank Count": 16,
    "Interface Type": "POD (1.2V VDD/VDDQ)",
    "Solder Type": "Lead-Free and Halogen-Free",
    "Special Option": "DDP",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4AAG085WB-MCRC", "dram_die_count", 2);
assertDecodedFieldAbsent("K4AAG085WB-MCRC", "cs_count");
assertDecodedField("K4A8G085WB-2CRC", "dram_die_count", 2);
assertDecodedField("K4A8G085WB-2CRC", "special_option", "2H TSV");
assertDecodedField("K4A8G085WB-3CRC", "dram_die_count", 2);
assertDecodedField("K4A8G085WB-3CRC", "special_option", "2H 3DS");
assertDecodedField("K4A8G085WB-4CRC", "dram_die_count", 4);
assertDecodedField("K4A8G085WB-4CRC", "special_option", "4H TSV");
assertDecodedField("K4A8G085WB-5CRC", "dram_die_count", 4);
assertDecodedField("K4A8G085WB-5CRC", "special_option", "4H 3DS");

assertDram("K4AAG165WB-MCRC", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "AG16",
    "DRAM Speed": "DDR4-2400 17-17-17",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4AAG165WB-MCRC", "dram_die_count", 2);
assertDecodedFieldAbsent("K4AAG165WB-MCRC", "cs_count");

assertDram("K4ABG085WA-MCWE", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WA",
    "Config Code": "BG08",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "A-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4ABG085WA-MCWE", "dram_die_count", 2);
assertDecodedFieldAbsent("K4ABG085WA-MCWE", "cs_count");

assertDram("K4ABG165WB-MCWE", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "5WB",
    "Config Code": "BG16",
    "DRAM Speed": "DDR4-3200 22-22-22",
    "Operation Temperature": "Commercial (0C~85C)",
    "Die Revision": "B-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4ABG165WB-MCWE", "dram_die_count", 2);
assertDecodedFieldAbsent("K4ABG165WB-MCWE", "cs_count");

assertDecodedField("K4A8G085WB-BCRB", "dram_speed", "DDR4-2133 17-15-15");
assertDecodedField("K4A8G085WB-BCRB", "operation_temperature", "Commercial (0C~85C)");
assertDecodedField("K4A8G085WC-BCAE", "dram_speed", "DDR4-3200 26-22-22");

assertDram("K4S511632D-UC75", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "TSOP-II-54",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "U",
    "Config Code": "5116",
    "DRAM Speed": "SDR-133",
    "Operation Temperature": "Commercial",
    "Die Revision": "D-die"
  }
});

assertDram("K4H510838F-HCCC", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x8",
  voltage: "2.5V VDD",
  package: "FBGA-60",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "H",
    "Config Code": "5108",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Commercial",
    "Die Revision": "F-die"
  }
});

assertDram("K4T56163QI-ZCE6", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Z",
    "Config Code": "5616",
    "DRAM Speed": "DDR2-667",
    "Operation Temperature": "Commercial",
    "Die Revision": "I-die"
  }
});

assertDram("K4B1G0846D-HCF7", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "H",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-800 6-6-6",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  }
});

assertDram("K4B1G0846I-BCNB", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "I-die"
  }
});

assertDram("K4B1G0846I-MCMA", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "M",
    "Config Code": "1G08",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "I-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4B1G0846I-MCMA", "dram_die_count", 2);
assertDecodedFieldAbsent("K4B1G0846I-MCMA", "cs_count");

assertDram("K4B2G1646F-BCNB", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "F-die"
  }
});

assertDram("K4B2G1646F-BYMA", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "F-die"
  }
});

assertDram("K4B4G0846D-ECMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "E",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4B4G0846D-ECMA", "dram_die_count", 4);
assertDecodedFieldAbsent("K4B4G0846D-ECMA", "cs_count");

assertDram("K4B4G0446E-BYK0", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "4G04",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G0846E-BMMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Industrial (-40C~95C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G0846E-BCNB", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "4G08",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "E-die"
  }
});

assertDram("K4B4G1646Q-HYF8", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "H",
    "Config Code": "4G16",
    "DRAM Speed": "DDR3L-1066 7-7-7",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "Q-die"
  }
});

assertDram("K4B4G1646D-BYMA", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "B",
    "Config Code": "4G16",
    "DRAM Speed": "DDR3L-1866 13-13-13",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "D-die"
  }
});

assertDram("K4BAG0846B-HCK0", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "H",
    "Config Code": "AG08",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "B-die"
  }
});

assertDram("K4B2G1646B-HKK0", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "H",
    "Config Code": "2G16",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), reduced standby",
    "Special Option": "Reduced Standby",
    "Die Revision": "B-die"
  }
});

assertDram("K4B8G1646Q-MCK0", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "M",
    "Config Code": "8G16",
    "DRAM Speed": "DDR3-1600 11-11-11",
    "Operation Temperature": "Commercial (0C~85C), normal power",
    "Die Revision": "Q-die"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4B8G1646Q-MCK0", "dram_die_count", 2);
assertDecodedField("K4B8G1646Q-MCMA", "dram_speed", "DDR3-1866 13-13-13");
assert.notEqual(detect("K4G8G1646D-MCK0").type, "DDR3", "K4G rows in the 2017 table must not override the GDDR5 family rule");
