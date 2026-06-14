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

assertDram("K4RAH086VB-BCQK", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "AH08",
    "Bank Count": 32,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RAH046VB-BCQK", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x4",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "AH04",
    "Bank Count": 32,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RAH165VB-BCQK", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "AH16",
    "Bank Count": 16,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-4800 40-39-39",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RAH165VB-BCWM", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "AH16",
    "Bank Count": 16,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RHE086VB-BCWM", {
  vendor: "samsung",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-82",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "HE08",
    "Bank Count": 32,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RHE165VB-BCWM", {
  vendor: "samsung",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-106",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "HE16",
    "Bank Count": 16,
    "Die Revision": "B-die",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDram("K4RBH046VM-BCWM", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x4",
  voltage: "VDD/VDDQ = 1.1V; VPP = 1.8V",
  package: "FBGA-78",
  extra: {
    "DRAM Type": "DDR5",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Config Code": "BH04",
    "Bank Count": 32,
    "Die Revision": "M-die",
    "DRAM Speed": "DDR5-5600 46-45-45",
    "Operation Temperature": "Commercial (0C~85C)"
  }
});

assertDecodedField("K4RHE086VB-BIWM", "operation_temperature", "Industrial (-40C~95C)");
assertDecodedField("K4RHE086VB-BIWM", "dram_speed", "DDR5-5600 46-45-45");
