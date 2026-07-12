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

assertDram("H58G56CK8BX146", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "4th Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H58G66CK8BX147", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "4th Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H58G78CK8BX185", {
  vendor: "skhynix",
  densityMbit: 131072,
  density: "128Gb",
  widthField: "x8",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "4th Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDecodedFieldAbsent("H58G78CK8BX185", "dram_die_count");

for (const [partNumber, densityMbit, density, generation, csCount] of [
  ["H58G66BK8HX096", 65536, "64Gb", "3rd Gen", 1],
  ["H58GG6AK8HX094", 98304, "96Gb", "2nd Gen", 2],
  ["H58G76BK8HX095", 131072, "128Gb", "3rd Gen", 2]
] as const) {
  assertDram(partNumber, {
    vendor: "skhynix",
    densityMbit,
    density,
    widthField: "x16",
    voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
    package: "FBGA-496, 14x12.4, PoP",
    extra: {
      "DRAM Type": "LPDDR5X",
      "CS Count": csCount,
      "Channel Count": 4,
      "DRAM Speed": "LPDDR5X-8533",
      "DRAM Generation": generation,
      "Operation Temperature": "-25°C ~ 105°C",
      "Solder Type": "Lead and Halogen Free"
    }
  });
}

assertDecodedFieldAbsent("H58G76BK8HX095", "dram_die_count");

assertDram("H58G56DK9BX068", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Channel Count": 2,
    "DRAM Speed": "LPDDR5X-9600",
    "DRAM Generation": "5th Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H58G66DK9BX067", {
  vendor: "skhynix",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Die Count": 4,
    "CS Count": 2,
    "Channel Count": 2,
    "DRAM Speed": "LPDDR5X-9600",
    "DRAM Generation": "5th Gen",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H58GG6MK6GX037", {
  vendor: "skhynix",
  densityMbit: 98304,
  density: "96Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-496",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Speed": "LPDDR5-6400"
  }
});

assertDram("H58GE6AK8PX168N", {
  vendor: "skhynix",
  densityMbit: 49152,
  density: "48Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-561",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "2nd Gen",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H58GD6AK8QX091N", {
  vendor: "skhynix",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.8V VDD1 / 1.05V VDD2 / 0.5V VDDQ",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "2nd Gen",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDram("H56C8H24MJR-S2C", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V / 1.35V / 1.35V",
  package: "FBGA-180",
  extra: {
    "DRAM Type": "GDDR6",
    "Package Code": "FBGA-180",
    "Config Code": "C8H24",
    "DRAM Speed": "GDDR6-S2",
    "Operation Temperature": "Commercial",
    "Die Revision": "MJR"
  }
});

assertDram("H56G42AS8DX014", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VPP; 1.35V / 1.25V / 1.20V VDD/VDDQ",
  package: "BGA-180",
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Speed": "GDDR6-20Gbps/pin max (10.0GHz WCK)",
    "Interface Type": "POD_135 / POD_125",
    "Solder Type": "Lead-Free and Halogen-Free (RoHS compliant)",
    "Die Revision": "A"
  }
});

assertDram("H56G42AS2DX014", {
  vendor: "skhynix",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V VPP; 1.35V / 1.25V / 1.20V VDD/VDDQ",
  package: "BGA-180",
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Speed": "GDDR6-14Gbps/pin max (7.0GHz WCK)",
    "Interface Type": "POD_135 / POD_125",
    "Solder Type": "Lead-Free and Halogen-Free (RoHS compliant)",
    "Die Revision": "A"
  }
});

assertDram("H56G32CS4DX005", {
  vendor: "skhynix",
  densityMbit: 8192,
  density: "8Gb",
  voltage: "1.35V VDD/VDDQ",
  package: "FCBGA",
  extra: {
    "DRAM Type": "GDDR6",
    "DRAM Speed": "GDDR6-16Gbps/pin max (8.0GHz WCK)",
    "Die Revision": "C"
  }
});

for (const [pn, speed] of [
  ["H57G42MP4AX004N", undefined],
  ["H57G42MP2AX004", "GDDR7-28Gbps/pin"],
  ["H57G42MP2AX006", "GDDR7-28Gbps/pin"]
] as const) {
  assertDram(pn, {
    vendor: "skhynix",
    densityMbit: 16384,
    density: "16Gb",
    widthField: "x32",
    voltage: "1.2V VDD/VDDQ",
    package: "Unknown",
    extra: {
      "DRAM Type": "GDDR7",
      ...(speed ? { "DRAM Speed": speed } : {})
    },
    absentExtra: speed ? [] : ["DRAM Speed"]
  });
}

for (const pn of [
  "H5ANAG6NCMR-XNI",
  "H5TC4G63EFR-RDA",
  "H5CG48MEBDX014N",
  "H9HCNNNBPUMLHR-NME",
  "H54G36AYRBX257",
  "H58GG6MK6GX037",
  "H58GE6AK8PX168N",
  "H57G42MP4AX004N",
  "H57G42MP2AX004",
  "H57G42MP2AX006",
  "H56G32CS4DX005",
  "H5WG6HMN6QX038R"
]) {
  assertSearchPnIncludes(pn, `SKhynix ${pn}`);
}
