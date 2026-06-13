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

assertDram("MT62F1G32D4DS", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.05V VDD / 0.5V VDDQ",
  package: "WFBGA-200, 10x14.5",
  extra: {
    "DRAM Type": "LPDDR5",
    "Package Code": "DS",
    "Config Code": "1G32",
    "Operation Temperature": "Commercial"
  },
  absentExtra: ["DRAM Speed", "Die Revision"]
});

assertDram("MT41K512M8DA-107:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41K512M8DA-125E:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1600 CL10",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41K1G4DA-107:P", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "DA",
    "Config Code": "1G4",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("MT41J1G4THD-15E:D", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x4",
  voltage: "1.5V VDD",
  package: "FBGA-78, 9x11.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "THD",
    "Config Code": "1G4",
    "DRAM Speed": "DDR3-1333 CL9",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev D"
  }
});

assertDram("MT41J1G8TRF-107:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.5V VDD",
  package: "FBGA-78, 9.5x11.5x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "1G8",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT41K512M8THV-125:M", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78, 8x11.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "THV",
    "Config Code": "512M8",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev M"
  }
});

assertDram("MT41K2G4RKB-107:P", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 8x10.5",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "RKB",
    "Config Code": "2G4",
    "DRAM Speed": "DDR3-1866 CL13",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev P"
  }
});

assertDram("MT41K512M16TNA-125:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 10x14x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TNA",
    "Config Code": "512M16",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});
assertDecodedField("MT41K512M16TNA-125:E", "die_count", 2);

assertDram("MT41K512M16TNA-125 M:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 10x14x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TNA",
    "Config Code": "512M16",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Special Option": "TCSR power saving",
    "Die Revision": "Rev E"
  }
});

assertDram("MT41K4G4SMA-125:E", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9.5x11.5x1.45",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "4 dies, 4 CS",
    "Package Code": "SMA",
    "Config Code": "4G4",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});
assertDecodedField("MT41K4G4SMA-125:E", "die_count", 4);

assertDram("MT41K2G4THA-187E:D", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 10x11.5x1.45",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "4 dies, 4 CS",
    "Package Code": "THA",
    "Config Code": "2G4",
    "DRAM Speed": "DDR3-1066 CL7",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev D"
  }
});
assertDecodedField("MT41K2G4THA-187E:D", "die_count", 4);

assertDram("MT41K256M32SLD-125 M:E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-136, 10x14x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "SLD",
    "Config Code": "256M32",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Special Option": "TCSR power saving",
    "Die Revision": "Rev E"
  }
});
assertDecodedField("MT41K256M32SLD-125 M:E", "die_count", 2);

assertDram("MT41K4G4KJR-125:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9.5x13",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "KJR",
    "Config Code": "4G4",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT41K1G16DGA-125:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96, 9.5x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "DGA",
    "Config Code": "1G16",
    "DRAM Speed": "DDR3-1600 CL11",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});
assertDecodedField("MT41J128M16JT-093", "dram_speed", "DDR3-2133 CL14");

assertDram("MT41K2G4TRF", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.35V VDD",
  package: "FBGA-78, 9.5x11.5x1.2",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "2G4",
    "Operation Temperature": "Commercial"
  },
  absentExtra: ["DRAM Speed", "Die Revision"]
});

assertDram("MT47H128M16RT-25E:C", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-84, 9x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "RT",
    "Config Code": "128M16",
    "DRAM Speed": "DDR2-800",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT47H128M16RT-3:C", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-84, 9x12.5",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "RT",
    "Config Code": "128M16",
    "DRAM Speed": "DDR2-666 CL5",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev C"
  }
});

assertDram("MT46V32M16P-5B-IT-J", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-66",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "P",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-400",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev J"
  }
});

assertDram("MT46V32M16P-6T:J", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "TSOP-66",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "P",
    "Config Code": "32M16",
    "DRAM Speed": "DDR-332 CL2.5",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev J"
  }
});

assertDram("MT46H32M32LFB5-5 IT:B", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "VFBGA-90, 8x13",
  extra: {
    "DRAM Type": "LPDDR",
    "Package Code": "B5",
    "Config Code": "32M32",
    "DRAM Speed": "200MHz",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT48LC16M8A2P-6A:L", {
  densityMbit: 128,
  density: "128Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "TSOP-II-54",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "P",
    "Config Code": "16M8",
    "DRAM Speed": "166MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev L"
  }
});

assertDram("MT48LC16M8A2P-7E:L", {
  densityMbit: 128,
  density: "128Mb",
  widthField: "x8",
  voltage: "3.3V VDD",
  package: "TSOP-II-54",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "P",
    "Config Code": "16M8",
    "DRAM Speed": "SDR-133 CL2",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev L"
  }
});

assertDram("MT48H16M32LFB5-75:A", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "VFBGA-90, 8x13",
  extra: {
    "DRAM Type": "LPSDR",
    "Package Code": "B5",
    "Config Code": "16M32",
    "DRAM Speed": "133MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT48H16M32LGB5-75:A", {
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "VFBGA-90, 8x13",
  extra: {
    "DRAM Type": "LPSDR",
    "Package Code": "B5",
    "Config Code": "16M32",
    "DRAM Speed": "133MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "Special Option": "Reduced page-size addressing"
  }
});

assertDram("MT42L128M32D1LF-25 WT:A", {
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "WFBGA-168, 12x12",
  extra: {
    "DRAM Type": "LPDDR2",
    "Package Code": "LF",
    "Config Code": "128M32",
    "DRAM Speed": "400MHz",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
});

assertDram("MT52L512M32D2PF-107 WT:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "FBGA-178, 11.5x11",
  extra: {
    "DRAM Type": "LPDDR3",
    "Package Code": "PF",
    "Config Code": "512M32",
    "DRAM Speed": "933MHz (DDR-1866)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT52K512M32PF-107-WT:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-178, 11.5x11",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "PF",
    "Config Code": "512M32",
    "DRAM Speed": "933MHz (DDR-1866)",
    "Operation Temperature": "Wireless (-25°C ~ 85°C)",
    "Die Revision": "Rev B"
  }
});

assertDram("MT51J256M32HF-80:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.5V VDD",
  package: "FBGA-170, 12x14",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5-8Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT51J256M32HF-50:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.5V VDD",
  package: "FBGA-170, 12x14",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5-5Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT58K256M32JA-100:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-190, 10x14",
  extra: {
    "DRAM Type": "GDDR5X",
    "Package Code": "JA",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5X-10Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT58K256M32JA-120:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-190, 10x14",
  extra: {
    "DRAM Type": "GDDR5X",
    "Package Code": "JA",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR5X-12Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61A256M32JE-10:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "FBGA-180, 12x14",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-10Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K256M32JE-14:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180, 12x14",
  topology: { ce: "Unknown", die: 1 },
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-14Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K256M32JE-15:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180, 12x14",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "JE",
    "Config Code": "256M32",
    "DRAM Speed": "GDDR6-15Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT61K512M32KPA-24-U", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180, 12x14",
  extra: {
    "DRAM Type": "GDDR6X",
    "Package Code": "KPA",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR6X-24Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev U"
  }
});

assertDram("MT61K512M32KPA-22:U", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180, 12x14",
  extra: {
    "DRAM Type": "GDDR6X",
    "Package Code": "KPA",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR6X-22Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev U"
  }
});

assertDram("MT68A512M32DF-32:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "FBGA-266, 12x14x1.1",
  extra: {
    "DRAM Type": "GDDR7",
    "Package Code": "DF",
    "Config Code": "512M32",
    "DRAM Speed": "GDDR7-32Gbps",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertStackedDram("MT54A16G8080A00AC-28:A-B006", {
  type: "HBM2E",
  densityMbit: 131072,
  density: "128Gb",
  voltage: "1.2V",
  fields: {
    channel_count: 8,
    die_count: 8
  },
  extra: {
    "Channel Count": 8,
    "DRAM Speed": "2.8 Gb/s",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "ECC enabled": true
  }
});

assertStackedDram("MT54A8G8040A00BF-32:A", {
  type: "HBM2E",
  densityMbit: 65536,
  density: "64Gb",
  voltage: "1.2V",
  fields: {
    channel_count: 8,
    die_count: 4
  },
  extra: {
    "Channel Count": 8,
    "DRAM Speed": "3.2 Gb/s",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "ECC enabled": true
  }
});

assertStackedDram("MT54A8G8040A00BF32:A", {
  type: "HBM2E",
  densityMbit: 65536,
  density: "64Gb",
  voltage: "1.2V",
  fields: {
    channel_count: 8,
    die_count: 4
  },
  extra: {
    "Channel Count": 8,
    "DRAM Speed": "3.2 Gb/s",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A",
    "ECC enabled": true
  }
});

assertStackedDram("MT43A4G40100NFA-S15:A", {
  type: "HMC",
  densityMbit: 16384,
  density: "16Gb",
  voltage: "VDDM 1.2V / VCCP 2.5V",
  package: "BGA-896, 31x31, 4-link 2GB",
  fields: {
    die_count: 4
  },
  extra: {
    "DRAM Die Density": "4Gb",
    "Revision": "Logic design revision 1",
    "DRAM Speed": "15 Gb/s SerDes",
    "Interface Type": "HMC Gen2 PHY",
    "Operation Temperature": "DRAM 0C to 105C / Logic 0C to 110C",
    "Die Revision": "Rev A"
  }
});

assertStackedDram("MT43A4G40200NFA-S15:A", {
  type: "HMC",
  densityMbit: 16384,
  density: "16Gb",
  voltage: "VDDM 1.2V / VCCP 2.5V",
  package: "BGA-896, 31x31, 4-link 2GB",
  fields: {
    die_count: 4
  },
  extra: {
    "DRAM Die Density": "4Gb",
    "Revision": "Logic design revision 2",
    "DRAM Speed": "15 Gb/s SerDes",
    "Interface Type": "HMC Gen2 PHY",
    "Operation Temperature": "DRAM 0C to 105C / Logic 0C to 110C",
    "Die Revision": "Rev A"
  }
});
