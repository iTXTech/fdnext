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
    "DRAM Die Stack": "2 dies, 1 CS",
    "Channel Count": 2,
    "CS Count": 1,
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "4th generation",
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
    "DRAM Die Stack": "4 dies, 2 CS",
    "Channel Count": 2,
    "CS Count": 2,
    "DRAM Speed": "LPDDR5X-8533",
    "DRAM Generation": "4th generation",
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
    "DRAM Generation": "4th generation",
    "Operation Temperature": "-25°C ~ 85°C",
    "Solder Type": "Lead and Halogen Free"
  }
});

assertDecodedFieldAbsent("H58G78CK8BX185", "die_count");

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
