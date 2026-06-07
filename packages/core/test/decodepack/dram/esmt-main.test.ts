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

assertDram("M16U4G16256A(2Z)", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4 1333/1600MHz"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T1G1664A-EFBIG2S", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T1G1664A-DEBG2S", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-1866 (933MHz, 13-13-13)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T4G16256A-EFBG2G", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T4G16256A-EFBG2S", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M13S64164A-4TVAG2Y", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-500 (250MHz)",
    "Operation Temperature": "Automotive VA (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M13S64164A-4TG2Y", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-500 (250MHz)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M13S64164A-5TG2C", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-400 (200MHz)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M13D64322A-4.5BG2S", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x32",
  voltage: "1.8V VDD",
  package: "144-ball FBGA",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Speed": "LPDDR-450 (222MHz)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M13S128168A-4.5BG2S", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "60-ball BGA",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-450 (225MHz)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M13S128168A-4TVAG2N", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-500 (250MHz)",
    "Operation Temperature": "Automotive VA (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M13S128168A-5BIG2N", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "60-ball BGA",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-400 (200MHz)",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M13S2561616A-4BG2T", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "60-ball BGA",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-500 (250MHz)",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M13S5121632A-5TG2T", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.5V VDD",
  package: "66-pin TSOP II",
  extra: {
    "DRAM Type": "DDR",
    "DRAM Speed": "DDR-400 (200MHz)",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L128168A-5TIG2S", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L32321A-5BG2G", {
  vendor: "esmt",
  densityMbit: 32,
  density: "32Mb",
  widthField: "x32",
  voltage: "3.3V VDD",
  package: "90-ball FBGA",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M14D5121632A-1.5BG2A", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA (A(max) = 1.2mm)",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1333 (667MHz, 7-10-10)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M14D5121632A-1.5BIG2M", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA (A(max) = 1.2mm)",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1333 (667MHz, 7-10-10)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M14D1G1664A-1.5BIG2P", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1333 (667MHz, 7-9-9)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M14D1G1664A-1.8BVG2S", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 (533MHz, 6-6-6)",
    "Operation Temperature": "Automotive V (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M14D2561616A-1.5BG2S", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1333 (667MHz, 9-10-10)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T2G16128A-EFBIG2P", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T2G16128A-BDBIG2B", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-1600 (800MHz, 11-11-11)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T8G16512A-BDBIG2S", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-1600 (800MHz, 11-11-11)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T8G16512A-EFBG2S", {
  vendor: "esmt",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M14D1G1664A-1.8BIG2S", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "84-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1066 (533MHz, 6-6-6)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M14D1G8128A-1.5BG2P", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x8",
  voltage: "1.8V VDD",
  package: "60-ball BGA",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "DDR2-1333 (667MHz, 7-9-9)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15F1G1664A-GHBG2S", {
  vendor: "esmt",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2400 (1200MHz, 16-16-16)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15F2G16128A-DEBIG2B", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 (933MHz, 13-13-13)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15F2G16128A-BDBIG2B", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1600 (800MHz, 11-11-11)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15F4G16256A-GHBG2S", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-2400 (1200MHz, 16-16-16)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15F4G16256A-DEBIG2R", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1866 (933MHz, 13-13-13)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M55D4G16256A-GFBG2R", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "178-ball BGA",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Speed": "LPDDR3-2133 (1066MHz, RL16/WL8)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T4G8512A-EFBG2S", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V / 1.5V VDD",
  package: "78-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T4G16256A-EFBIG2C", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Operation Temperature": "Industrial (-40C~95C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M16U4G16256A-QLBIG", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 (1600MHz, 24-24-24)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M16U4G16256A-QLBIAG2Z", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 (1600MHz, 24-24-24)",
    "Operation Temperature": "Industrial Plus (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T2G16128A-EFBVAG2R", {
  vendor: "esmt",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Operation Temperature": "Automotive VA (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T4G16256A-DEBIAG2G", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-1866 (933MHz, 13-13-13)",
    "Operation Temperature": "Industrial Plus (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M15T5121632A-DEBG", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-1866 (933MHz, 13-13-13)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});

assertDram("M15T4G16256A-EFBIAG2S", {
  vendor: "esmt",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V / 1.5V VDD",
  package: "96-ball BGA",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3(L)-2133 (1066MHz, 14-14-14)",
    "Operation Temperature": "Industrial Plus (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L2561616A-5TVAG2S", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Automotive VA (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L2561616A-5TVG2T", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Automotive V (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L2561616A-7BVAG2T", {
  vendor: "esmt",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 143MHz",
    "Operation Temperature": "Automotive VA (-40C~105C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L64164A-5BIG2Y", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-ball VBGA",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L64164A-5BIG2C", {
  vendor: "esmt",
  densityMbit: 64,
  density: "64Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-ball VBGA",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L5121632A-5BIG2T", {
  vendor: "esmt",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "BGA",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Operation Temperature": "Industrial (-40C~85C)",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("M12L128168A-5TG2N", {
  vendor: "esmt",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "54-pin TSOP II",
  extra: {
    "DRAM Type": "SDR",
    "DRAM Speed": "SDR 200MHz",
    "Solder Type": "Pb-free"
  },
  absentExtra: ["DRAM Die Stack", "Operation Temperature"]
});
