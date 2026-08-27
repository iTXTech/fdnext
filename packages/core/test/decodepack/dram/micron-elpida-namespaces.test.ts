import assert from "node:assert/strict";
import { assertDecodedFieldAbsent, assertDram, engine } from "./_helpers";

assertDram("NT41J128M16HA-15E:D", {
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x16",
  voltage: "1.5V VDD",
  package: "FBGA-96, 9x14",
  extra: {
    "DRAM Type": "DDR3",
    "DRAM Speed": "DDR3-1333 CL9",
    "DRAM Die Count": 1,
    "CS Count": 1,
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev D"
  }
});

assertDram("NT47H64M16HR-25:H", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.8V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR2",
    "DRAM Speed": "400MHz",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H"
  }
});

assertDram("CT1G8Z21ED8VA-062E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4"
  },
  absentExtra: ["DRAM Speed", "DRAM Die Count", "CS Count"]
});

assertDram("CT2G8Z32DD8JC-075E", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4"
  },
  absentExtra: ["DRAM Speed", "DRAM Die Count", "CS Count"]
});

assertDram("EMBA164B1PH-1D-F-R", {
  vendor: "elpida",
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x64",
  voltage: "VDD1 1.8V; VDD2/VDDCA/VDDQ 1.2V",
  package: "BGA-216, PoP",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Speed": "LPDDR2-1066",
    "CS Count": 4,
    "Channel Count": 2,
    "Special Option": "Daisy chain sample"
  }
});

assertDram("EMF8132A3PB-DV-F-D", {
  vendor: "elpida",
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "VDD1 1.8V; VDD2/VDDCA/VDDQ 1.2V",
  package: "WFBGA-216, 12x12x0.70",
  extra: {
    "DRAM Type": "LPDDR3",
    "CS Count": 2,
    "Special Option": "Daisy chain sample"
  },
  absentExtra: ["DRAM Speed"]
});

assertDecodedFieldAbsent("EMF8132A3PB-DV-F-D", "dram_speed");

const elpida = engine.decodePart({ query: "EDBA164B2PR-1D-F-D", lang: "eng" });
assert.equal(elpida.status, "ok", "ED namespace should continue to decode");
assert.equal(elpida.device.vendor.id, "elpida", "the bounded EM alias must not steal Elpida ED ownership");
