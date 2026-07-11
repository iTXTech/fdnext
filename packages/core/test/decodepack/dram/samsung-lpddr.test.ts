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

assertDram("K3PE7E700M-XGC1", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "FBGA-216",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Count": 2,
    "CS Count": 2,
    "Package Code": "E700M",
    "Config Code": "3PE7",
    "DRAM Speed": "LPDDR2-1066",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3QF1F10DM-AGCE", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x64",
  voltage: "1.8V / 1.2V / 1.2V",
  package: "FBGA-253",
  extra: {
    "DRAM Type": "LPDDR3",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "F10DM",
    "Config Code": "3QF1",
    "DRAM Speed": "LPDDR3-1600",
    "Operation Temperature": "-25C~70C"
  }
});

assertDram("K4F6E304HB-MGCJ", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 1.1V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "Package Code": "E304HB",
    "Config Code": "4F6E30",
    "DRAM Speed": "LPDDR4-3733",
    "DRAM Generation": "3rd Gen",
    "CS Count": 2,
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTL_11",
    "Special Option": "2 CKE",
    "Operation Temperature": "-25C~85C"
  },
  absentExtra: ["DRAM Die Stack"]
});

assertDram("K4F8E3S4HD-MGCL", {
  vendor: "samsung",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 1.1V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "M",
    "Config Code": "4F8E3S",
    "DRAM Speed": "LPDDR4-4266",
    "DRAM Generation": "5th Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTL_11",
    "Operation Temperature": "-25C~85C"
  }
});
assertDecodedField("K4F8E3S4HD-MGCL", "dram_die_count", 1);

assertDram("K4F6E3S4HM-MGCJ", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 1.1V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "M",
    "Config Code": "4F6E3S",
    "DRAM Speed": "LPDDR4-3733",
    "DRAM Generation": "1st Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTL_11",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3LKBKB0BM-MGCP", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5",
    "DRAM Die Count": 2,
    "CS Count": 1,
    "Package Code": "KB0BM",
    "Config Code": "3LKB",
    "DRAM Speed": "LPDDR5-6400",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3KL3L30CM-JGCT", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "FBGA-441",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "L30CM",
    "Config Code": "3KL3",
    "DRAM Speed": "LPDDR5X-7500",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K3KL3L30CM-BGCU", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x16",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "FBGA-496",
  extra: {
    "DRAM Type": "LPDDR5X",
    "Package Code": "L30CM",
    "Config Code": "3KL3",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-25C~85C"
  }
});

assertDecodedField("K3KL3L30CM-EUCV", "package", "FBGA-561");
assertDecodedField("K3KL3L30CM-EUCV", "dram_width", "x64");
assertDecodedField("K3KL3L30CM-EUCV", "dram_speed", "LPDDR5X-9600");
assertDecodedField("K3KL3L30CM-EUCV", "operation_temperature", "-40C~125C");

assertDram("K3KL7L70EM-MUCU", {
  vendor: "samsung",
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x32",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "FBGA-315",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40C~125C"
  }
});

assertDram("K3KL3L30DM-EFCU", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x64",
  voltage: "1.8V / 1.05V / 0.9V / 0.5V",
  package: "FBGA-561",
  extra: {
    "DRAM Type": "LPDDR5X",
    "DRAM Speed": "LPDDR5X-8533",
    "Operation Temperature": "-40C~95C"
  }
});

assertDram("K4U6E3S4AA-MGCL", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "M",
    "Config Code": "4U6E3S",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "2nd Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTLE_06",
    "Operation Temperature": "-25C~85C"
  }
});
assertDecodedField("K4U6E3S4AA-MGCL", "dram_die_count", 1);

assertDram("K4U6E3S4AB-MGCL", {
  vendor: "samsung",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Package Code": "M",
    "Config Code": "4U6E3S",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "3rd Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTLE_06",
    "Operation Temperature": "-25C~85C"
  }
});

assertDram("K4UBE3D4AA-MGCL", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "M",
    "Config Code": "4UBE3D",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "2nd Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTLE_06",
    "Special Option": "DDP",
    "Operation Temperature": "-25C~85C"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4UBE3D4AA-MGCL", "dram_die_count", 2);

assertDram("K4UBE3D4AB-MGCL", {
  vendor: "samsung",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "M",
    "Config Code": "4UBE3D",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "3rd Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTLE_06",
    "Special Option": "DDP",
    "Operation Temperature": "-25C~85C"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4UBE3D4AB-MGCL", "dram_die_count", 2);

assertDram("K4UCE3Q4AB-MGCL", {
  vendor: "samsung",
  densityMbit: 65536,
  density: "64Gb",
  widthField: "x32",
  voltage: "1.8V / 1.1V / 0.6V",
  package: "FBGA-200",
  extra: {
    "DRAM Type": "LPDDR4X",
    "Package Code": "M",
    "Config Code": "4UCE3Q",
    "DRAM Speed": "LPDDR4X-4266",
    "DRAM Generation": "3rd Gen",
    "Channel Count": 2,
    "Bank Count": 8,
    "Interface Type": "LVSTLE_06",
    "Special Option": "QDP",
    "Operation Temperature": "-25C~85C"
  },
  absentExtra: ["DRAM Die Stack"]
});
assertDecodedField("K4UCE3Q4AB-MGCL", "dram_die_count", 4);
assert.notEqual(detect("K4UCE3Q4AB-MGCL").type, "GDDR4", "K4U LPDDR4X ordering should outrank the legacy K4U GDDR4 rule");
