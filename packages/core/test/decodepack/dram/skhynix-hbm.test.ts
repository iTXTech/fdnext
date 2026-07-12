import assert from "node:assert/strict";
import { assertDram, assertDecodedFieldAbsent, detect } from "./_helpers";

for (const [partNumber, speed] of [
  ["H5UG7HME03X020R", "6.0Gbps/pin"],
  ["H5UG7HMD83X020R", "5.6Gbps/pin"]
] as const) {
  assertDram(partNumber, {
    vendor: "skhynix",
    densityMbit: 131072,
    density: "128Gb",
    widthField: "Unknown",
    voltage: "Unknown",
    package: "Unknown",
    extra: {
      "DRAM Type": "HBM3",
      "DRAM Die Density": "16Gb",
      "DRAM Die Count": 8,
      "DRAM Speed": speed
    }
  });
  assertDecodedFieldAbsent(partNumber, "package");
}

for (const [partNumber, densityMbit, density, dieCount, speed] of [
  ["H5WRAGESM8W-N8L", 131072, "128Gb", 8, "3.6Gbps/pin"],
  ["H5WRAGESM8W-N6L", 131072, "128Gb", 8, "3.2Gbps/pin"],
  ["H5WR64ESM4W-N8L", 65536, "64Gb", 4, "3.6Gbps/pin"],
  ["H5WR64ESM4W-N6L", 65536, "64Gb", 4, "3.2Gbps/pin"]
] as const) {
  assertDram(partNumber, {
    vendor: "skhynix",
    densityMbit,
    density,
    widthField: "Unknown",
    voltage: "Unknown",
    package: "Unknown",
    extra: {
      "DRAM Type": "HBM2E",
      "DRAM Die Density": "16Gb",
      "DRAM Die Count": dieCount,
      "DRAM Speed": speed
    }
  });
  assertDecodedFieldAbsent(partNumber, "package");
}

// Unknown serials retain the token-derived stack and speed fields; the rules
// do not use a complete-PN whitelist.
assertDram("H5UG7HME03X999R", {
  vendor: "skhynix",
  densityMbit: 131072,
  density: "128Gb",
  widthField: "Unknown",
  voltage: "Unknown",
  package: "Unknown",
  extra: {
    "DRAM Type": "HBM3",
    "DRAM Die Density": "16Gb",
    "DRAM Die Count": 8,
    "DRAM Speed": "6.0Gbps/pin"
  }
});

// Do not combine a 128Gb density token with the 4Hi stack token, or vice
// versa, just because both tokens are individually known.
assert.equal(detect("H5WRAGESM4W-N8L").type, "HBM2E");
assert.equal(detect("H5WRAGESM4W-N8L").densityMbit, undefined);
assert.equal(detect("H5WR64ESM8W-N6L").type, "HBM2E");
assert.equal(detect("H5WR64ESM8W-N6L").densityMbit, undefined);
