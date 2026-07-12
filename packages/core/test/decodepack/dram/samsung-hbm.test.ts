import assert from "node:assert/strict";
import {
  assertDecodedFieldAbsent,
  assertDram,
  assertSearchPnIncludes,
  detect,
  dramPnJson
} from "./_helpers";

for (const [partNumber, densityMbit, density, dieDensity, dieCount, speed, series] of [
  ["KHA843801B-MC12", 32768, "32Gb", "8Gb", 4, "2.0Gbps/pin", "Flarebolt"],
  ["KHA884901X-MN13", 65536, "64Gb", "8Gb", 8, "2.4Gbps/pin", "Aquabolt"]
] as const) {
  assertDram(partNumber, {
    vendor: "samsung",
    densityMbit,
    density,
    widthField: "x1024",
    voltage: "Unknown",
    package: "MPGA",
    extra: {
      "DRAM Type": "HBM2",
      "DRAM Die Density": dieDensity,
      "DRAM Die Count": dieCount,
      "DRAM Speed": speed,
      Series: series
    }
  });
}

for (const [partNumber, densityMbit, density, dieCount, speed] of [
  ["KHAA44801B-MC16", 65536, "64Gb", 4, "3.2Gbps/pin"],
  ["KHAA84901B-JC17", 131072, "128Gb", 8, "3.6Gbps/pin"]
] as const) {
  assertDram(partNumber, {
    vendor: "samsung",
    densityMbit,
    density,
    widthField: "x1024",
    voltage: "Unknown",
    package: "MPGA",
    extra: {
      "DRAM Type": "HBM2E",
      "DRAM Die Density": "16Gb",
      "DRAM Die Count": dieCount,
      "DRAM Speed": speed,
      Series: "Flashbolt"
    }
  });
}

for (const [partNumber, densityMbit, density, dieCount] of [
  ["KHBA84A03C-MC1H", 131072, "128Gb", 8],
  ["KHBAC4A03D-MC1H", 196608, "192Gb", 12]
] as const) {
  assertDram(partNumber, {
    vendor: "samsung",
    densityMbit,
    density,
    widthField: "x1024",
    voltage: "Unknown",
    package: "MPGA",
    extra: {
      "DRAM Type": "HBM3",
      "DRAM Die Density": "16Gb",
      "DRAM Die Count": dieCount,
      "DRAM Speed": "6.4Gbps/pin",
      Series: "Icebolt"
    }
  });
}

assertDram("KHBB84A03B-MC1J", {
  vendor: "samsung",
  densityMbit: 196608,
  density: "192Gb",
  widthField: "x1024",
  voltage: "Unknown",
  package: "MPGA",
  extra: {
    "DRAM Type": "HBM3E",
    "DRAM Die Density": "24Gb",
    "DRAM Die Count": 8
  }
});
assertDecodedFieldAbsent("KHBB84A03B-MC1J", "dram_speed");

assertDram("KHBBC4B03C-MC1K", {
  vendor: "samsung",
  densityMbit: 294912,
  density: "288Gb",
  widthField: "x1024",
  voltage: "Unknown",
  package: "MPGA",
  extra: {
    "DRAM Type": "HBM3E",
    "DRAM Die Density": "24Gb",
    "DRAM Die Count": 12,
    "DRAM Speed": "9.2Gbps/pin"
  }
});

// The decoder matches token structure, while invalid stack/product
// combinations degrade without inventing a package density.
assert.equal(detect("KHA884801X-MC13").type, "HBM2");
assert.equal(detect("KHA884801X-MC13").densityMbit, undefined);

const officialSamsungHbmParts = [
  ["KHA843801B-MC12", "HBM2", 32768],
  ["KHA883901B-MC12", "HBM2", 65536],
  ["KHA844801X-MC12", "HBM2", 32768],
  ["KHA844801X-MC13", "HBM2", 32768],
  ["KHA844801X-MN12", "HBM2", 32768],
  ["KHA844801X-MN13", "HBM2", 32768],
  ["KHA884901X-MC12", "HBM2", 65536],
  ["KHA884901X-MC13", "HBM2", 65536],
  ["KHA884901X-MN12", "HBM2", 65536],
  ["KHA884901X-MN13", "HBM2", 65536],
  ["KHAA44801B-MC16", "HBM2E", 65536],
  ["KHAA44801B-MC17", "HBM2E", 65536],
  ["KHAA84901B-JC16", "HBM2E", 131072],
  ["KHAA84901B-JC17", "HBM2E", 131072],
  ["KHAA84901B-MC16", "HBM2E", 131072],
  ["KHAA84901B-MC17", "HBM2E", 131072],
  ["KHBA84A03C-MC1H", "HBM3", 131072],
  ["KHBA84A03D-MC1H", "HBM3", 131072],
  ["KHBAC4A03C-MC1H", "HBM3", 196608],
  ["KHBAC4A03D-MC1H", "HBM3", 196608],
  ["KHBB84A03B-MC1J", "HBM3E", 196608],
  ["KHBBC4B03C-MC1K", "HBM3E", 294912]
] as const;

for (const [partNumber, type, densityMbit] of officialSamsungHbmParts) {
  assert.ok(
    dramPnJson.some((entry) => entry.vendor === "samsung" && entry.pn === partNumber),
    `${partNumber} should remain in the Samsung HBM search resources`
  );
  assert.equal(detect(partNumber).vendor, "samsung", `${partNumber} should decode as Samsung`);
  assert.equal(detect(partNumber).type, type, `${partNumber} should decode the HBM generation`);
  assert.equal(detect(partNumber).densityMbit, densityMbit, `${partNumber} should decode package density`);
  assertSearchPnIncludes(partNumber, `Samsung ${partNumber}`);
}
