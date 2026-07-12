import { assertDecodedFieldAbsent, assertDram } from "./_helpers";

for (const [partNumber, width] of [
  ["H5ANBG6NAMR-XNC", "x16"],
  ["H5ANBG8NABR-XNC", "x8"]
] as const) {
  assertDram(partNumber, {
    vendor: "skhynix",
    densityMbit: 32768,
    density: "32Gb",
    widthField: width,
    voltage: "1.2V VDD",
    package: "Unknown",
    extra: {
      "DRAM Type": "DDR4",
      "DRAM Speed": "DDR4-3200 CL22",
      "Operation Temperature": "Commercial"
    }
  });
  assertDecodedFieldAbsent(partNumber, "package");
}

// Unknown body/config tokens do not block fields proven by the H5ANBG head,
// width, speed and temperature tokens.
assertDram("H5ANBG8ZZZZ-XNC", {
  vendor: "skhynix",
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial"
  }
});
