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

assertDram("K4X51163PC", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-60, 11.5x10x1.0",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "51163"
  },
  absentExtra: ["Package Code", "DRAM Speed", "Operation Temperature"]
});

assertDram("K4X51163PC-FGC3", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-60, 11.5x10x1.0",
  extra: {
    "DRAM Type": "LPDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "F",
    "Config Code": "51163",
    "DRAM Speed": "Mobile DDR-133 CL3",
    "Operation Temperature": "Extended, low power, i-TCSR, PASR, DS"
  }
});

assertDecodedField("K4X51263PC", "special_option", "JEDEC stacked layout");
assertDecodedFieldAbsent("K4X51263PC", "dram_die_count");
assertDecodedField("K4X51303PC", "cs_count", 2);
assertDecodedFieldAbsent("K4X51303PC", "ce_count");
assertFieldBlock("K4X51303PC", "cs_count", "geometry");
assertDecodedField("K4X51303PC", "special_option", "2 CKE");
assertDecodedFieldAbsent("K4X51303PC", "dram_die_count");

assertDram("K4U52324Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-136",
  extra: {
    "DRAM Type": "GDDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Q",
    "Config Code": "52324"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4J52324Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-136",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Q",
    "Config Code": "52324"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4J55323Q", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-136",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Q",
    "Config Code": "55323"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4N51163Q", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Q",
    "Config Code": "51163"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4N56163Q", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "Q",
    "Config Code": "56163"
  },
  absentExtra: ["DRAM Speed"]
});

assertDram("K4D551638", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "2.5V VDD/VDDQ",
  package: "TSOP-II-66",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "551638"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D263238", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x32",
  voltage: "2.5V VDD/VDDQ",
  package: "FBGA-144",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "263238"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D261638", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x16",
  voltage: "2.5V VDD/VDDQ",
  package: "TSOP-II-66",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "261638"
  },
  absentExtra: ["Package Code", "DRAM Speed"]
});

assertDram("K4D263238E-GC33", {
  vendor: "samsung",
  densityMbit: 128,
  density: "128Mb",
  widthField: "x32",
  voltage: "2.5V VDD/VDDQ",
  package: "FBGA-144",
  extra: {
    "DRAM Type": "GDDR",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "E",
    "Config Code": "263238",
    "DRAM Speed": "GDDR-GC33"
  }
});

assertDram("K4N56163QF-GC37", {
  vendor: "samsung",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "GDDR2",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "QF",
    "Config Code": "56163",
    "DRAM Speed": "GDDR2-533Mbps/pin"
  }
});

assertDram("K4J52324QC-BC14", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-136",
  extra: {
    "DRAM Type": "GDDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "QC",
    "Config Code": "52324",
    "DRAM Speed": "GDDR3-1.4Gbps/pin"
  }
});

assertDram("K4U52324QE-BC08", {
  vendor: "samsung",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x32",
  voltage: "1.8V VDD/VDDQ",
  package: "FBGA-136",
  extra: {
    "DRAM Type": "GDDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "QE",
    "Config Code": "52324",
    "DRAM Speed": "GDDR4-BC08"
  }
});

assertDram("K4W1G1646E-HC12", {
  vendor: "samsung",
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.5V VDD/VDDQ",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "E",
    "Config Code": "1G1646",
    "DRAM Speed": "gDDR3-1600Mbps/pin"
  }
});

assertDram("K4W2G1646Q-BC1A", {
  vendor: "samsung",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD/VDDQ",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "Q",
    "Config Code": "2G1646",
    "DRAM Speed": "gDDR3-2133Mbps/pin"
  }
});

assertDram("K4W4G1646D-BY12", {
  vendor: "samsung",
  densityMbit: 4096,
  density: "4Gb",
  widthField: "x16",
  voltage: "1.35V VDD/VDDQ",
  package: "FBGA-96",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "DRAM Generation": "Samsung graphics gDDR3/SDDR3",
    "Package Code": "D",
    "Config Code": "4G1646",
    "DRAM Speed": "gDDR3-1600Mbps/pin"
  }
});

assertDram("K4G80325FB-HC25", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V/1.5V/1.6V VDD/VDDQ",
  package: "FBGA-170",
  extra: {
    "DRAM Type": "GDDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "FB",
    "Config Code": "80325",
    "DRAM Speed": "GDDR5-8Gbps"
  }
});

assertDram("K4Z80325BC-HC14", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BC",
    "Config Code": "80325",
    "DRAM Speed": "GDDR6-14Gbps"
  }
});

assertDram("K4ZAF325BC-SC24", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "FBGA-180",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "BC",
    "Config Code": "AF325",
    "DRAM Speed": "GDDR6-24Gbps"
  }
});
assertDecodedField("K4ZAF325BC-SC20", "dram_speed", "GDDR6-20Gbps");
assertDecodedField("K4ZAF325BM-HC18", "dram_speed", "GDDR6-18Gbps");

assertDram("K4VAF325ZC-SC32", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.2V VDD",
  package: "FBGA-266",
  extra: {
    "DRAM Type": "GDDR7",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "ZC",
    "Config Code": "AF325",
    "DRAM Speed": "GDDR7-32Gbps"
  }
});
assertDecodedField("K4VAF325ZC-SC36", "dram_speed", "GDDR7-36Gbps");
assertDecodedField("K4VAF325ZC-SC28", "dram_speed", "GDDR7-28Gbps");
