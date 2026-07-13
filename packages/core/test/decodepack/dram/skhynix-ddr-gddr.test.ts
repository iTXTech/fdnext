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

assertDram("H5TQ4G63AFR-TEC", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G63",
    "DRAM Speed": "DDR3-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5TC4G83CFR-PBA", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "CFR"
  }
});

assertDram("H5TC4G83CFR-TEA", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Solder Type": "Lead Free and Halogen Free (RoHS compliant)",
    "Die Revision": "CFR"
  }
});

assertDram("H5TC4G83CFRTEA", {
  vendor: "skhynix",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "4G83",
    "DRAM Speed": "DDR3L-2133 14-14-14",
    "Operation Temperature": "Commercial",
    "Solder Type": "Lead Free and Halogen Free (RoHS compliant)",
    "Die Revision": "CFR"
  }
});

assertDram("H5TQ2G63BFK-H9K", {
  vendor: "skhynix",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "Package Code": "F",
    "Config Code": "2G63",
    "DRAM Speed": "DDR3-1333 9-9-9",
    "Operation Temperature": "Automotive",
    "Die Revision": "BFK"
  }
});

assertDram("H5TC8G83AMR-PBA", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.35V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "M",
    "Config Code": "8G83",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "AMR"
  }
});

assertDram("H5TC8G63AMR-PBA", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.35V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "M",
    "Config Code": "8G63",
    "DRAM Speed": "DDR3L-1600 11-11-11",
    "Operation Temperature": "Commercial",
    "Die Revision": "AMR"
  }
});

assertDram("H5AN8G8NAFR-UHC", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "F",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-2400T 17-17-17",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});

assertDram("H5AN8G8NCJR-XNC", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "J",
    "Config Code": "8G8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CJR"
  }
});

assertDram("H5ANAG8NCMR-XNC", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "M",
    "Config Code": "AG8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CMR"
  }
});

assertDram("H5ANAG8NCMRXNC", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "M",
    "Config Code": "AG8N",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "CMR"
  }
});

assertDram("H5ANAG6NCMR-UHC", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "M",
    "Config Code": "AG6N",
    "DRAM Speed": "DDR4-2400T 17-17-17",
    "Operation Temperature": "Commercial",
    "Die Revision": "CMR"
  }
});

assertDram("H5CG48AGBD-X018", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "DRAM Generation": "Gen2",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG48AGBD-X018", "dram_die_count", 1);

assertDram("H5CGD8MHBD-X021", {
  vendor: "skhynix",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "24Gb",
    "DRAM Speed": "DDR5-6400 52-52-52",
    "DRAM Generation": "Gen1",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "M-die"
  }
});
assertDecodedField("H5CGD8MHBD-X021", "dram_die_count", 1);

assertDram("H5CG44AEBD", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "DRAM Generation": "Gen2",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "A-die"
  },
  absentExtra: ["DRAM Die Density", "Special Option"]
});

assertDram("H5CG44AGBJX018N", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "1.1V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "DRAM Generation": "Gen2",
    "Operation Temperature": "Industrial (-40 to 95C)",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG44AGBJX018N", "dram_die_count", 1);

assertDram("H5CG48AGEDX013", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "16Gb",
    "DRAM Speed": "DDR5-5600 52-45-45 (for 3DS)",
    "DRAM Generation": "Gen2",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Special Option": "TSV",
    "Die Revision": "A-die"
  }
});
assertDecodedField("H5CG48AGEDX013", "dram_die_count", 4);

assertDram("H5CG56MMBDX052", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "FBGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Density": "32Gb",
    "DRAM Speed": "DDR5-8000 64-64-64",
    "DRAM Generation": "Gen1",
    "Operation Temperature": "Commercial (0 to 95C)",
    "Die Revision": "M-die"
  }
});
assertDecodedField("H5CG56MMBDX052", "dram_die_count", 1);

assertDram("H5AN8G8NAFR", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "F",
    "Config Code": "8G8N",
    "Die Revision": "AFR"
  },
  absentExtra: ["DRAM Speed", "Operation Temperature"]
});

assertDram("H5GQ2H24AFR-R0C", {
  vendor: "skhynix",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "BGA-170",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "F",
    "Config Code": "2H24",
    "DRAM Speed": "GDDR5-6Gbps/pin",
    "Operation Temperature": "Commercial",
    "Die Revision": "AFR"
  }
});
