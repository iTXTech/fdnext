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

assertDram("H9CCNNNBLTBLAR-NTD", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "FBGA-178",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 1,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-1600",
    "DRAM Generation": "3rd Gen",
    "Operation Temperature": "Commercial (0 to 85C)",
    "Interface Type": "HSUL_12",
    "Solder Type": "Lead and Halogen Free"
  }
});
assertDecodedField("H9CCNNNBLTBLAR-NTD", "dram_die_count", 4);
assertDecodedField("H9CCNNNBLTBLAR-NTD", "cs_count", 2);
assertDecodedFieldAbsent("H9CCNNNBLTBLAR-NTD", "ce_count");
assertFieldBlock("H9CCNNNBLTBLAR-NTD", "dram_die_count", "geometry");
assertFieldBlock("H9CCNNNBLTBLAR-NTD", "cs_count", "geometry");

assertDram("H9CCNNNBLTBLAR-NUD", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDCA/VDDQ",
  package: "FBGA-178",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 1,
    "CS Count": 2,
    "DRAM Speed": "LPDDR3-1866",
    "DRAM Generation": "3rd Gen",
    "Operation Temperature": "Commercial (0 to 85C)",
    "Interface Type": "HSUL_12",
    "Solder Type": "Lead and Halogen Free"
  }
});
assertDecodedField("H9CCNNNBLTBLAR-NUD", "dram_die_count", 4);

assertDram("H9HCNNN8KUMLHR-NME", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200",
  topology: { ce: 1, die: 2 },
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4-3733",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNN8KUMLHR-NLE", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4-3200",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNCPUMLXR-NEE", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4-4266",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNCPMMLXR-NEE", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNCPMMLHR-NMI", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-3733",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-40°C ~ 95°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNBKMMLXR-NEI", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-40°C ~ 95°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNBKMALHR-NEE", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNFAMMLXR-NEE", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x8",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 8,
    "CS Count": 2,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});
assertDecodedField("H9HCNNNFAMMLXR-NEE", "dram_die_count", 8);

assertDram("H9HCNNNFAMALTR-NME", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  voltage: "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 8,
    "CS Count": 2,
    "Channel Count": 2,
    "DRAM Speed": "LPDDR4X-3733",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9HCNNNBPUMLHR-NME", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Speed": "LPDDR4-3733",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

for (const pn of [
  "H9HCNNNFAMALTR-NME",
  "H9HCNNNCPMALHR-NEE",
  "H9HCNNNBKMMLHR-NME",
  "H9HCNNNBKMMLHR-NMI",
  "H9HCNNNBKMMLHR-NMN",
  "H9HCNNNBKMMLHR-NMO",
  "H9HCNNNCPMMLHR-NMN",
  "H9HCNNNCPMMLHR-NMO",
  "H9HCNNN4KMMLHR-NME",
  "H9HCNNN4KMMLHR-NMN",
  "H9HCNNN4KMMLHR-NMO",
  "H9HCNNN4KMMLHR-NMP"
]) {
  assertSearchPnIncludes(pn, `SKhynix ${pn}`);
}

assertDram("H9HKNNNBTUMUBR-NLH", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.1V VDD2/VDDQ",
  package: "FBGA-366, 15x15",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 4,
    "CS Count": 1,
    "DRAM Speed": "LPDDR4-3200",
    "DRAM Generation": "1st Gen",
    "Operation Temperature": "-25°C ~ 105°C",
    "Solder Type": "Lead and Halogen Free"
  }
});
assertDecodedField("H9HKNNNBTUMUBR-NLH", "dram_die_count", 2);

assertDram("HY57V561620FTP-H", {
  vendor: "skhynix",
  densityMbit: 256,
  density: "256Mb",
  widthField: "x16",
  voltage: "3.3V VDD",
  package: "TSOP-II-54",
  extra: {
    "DRAM Type": "SDR",
    "Package Code": "FTP",
    "Config Code": "561620",
    "DRAM Speed": "SDR-H"
  }
});

assertDram("HY5DU121622DTP-D43", {
  vendor: "skhynix",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "2.6V VDD",
  package: "TSOP-II-66",
  extra: {
    "DRAM Type": "DDR",
    "Package Code": "DTP",
    "Config Code": "121622",
    "DRAM Speed": "DDR-400B (3-3-3)"
  }
});

assertDram("HY5PS121621CFP-Y5", {
  vendor: "skhynix",
  densityMbit: 512,
  density: "512Mb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "FBGA-84",
  extra: {
    "DRAM Type": "DDR2",
    "Package Code": "CFP",
    "Config Code": "121621",
    "DRAM Speed": "DDR2-Y5"
  }
});

assertDram("H9JCNNNCP3MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Package Code": "MLYR",
    "Config Code": "CP3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNBK3MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "MLYR",
    "Config Code": "BK3",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JCNNNFA5MLYR-N6E", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 8,
    "CS Count": 2,
    "Package Code": "MLYR",
    "Config Code": "FA5",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25°C ~ 85°C"
  }
});

assertDram("H9JKNNNFB3AECR-N6H", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  voltage: "1.8V/1.05V/0.5V",
  package: "FBGA-496",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-30°C ~ 105°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H9JKNNNHA3MVJR-N6H", {
  vendor: "skhynix",
  densityMbit: 98304,
  density: "96Gb",
  voltage: "1.8V/1.05V/0.5V",
  package: "FBGA-436",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-30°C ~ 105°C",
    "Solder Type": "Lead and Halogen Free"
  }
});
