import assert from "node:assert/strict";
import { detect } from "./_helpers";

for (const [partNumber, densityMbit, density, expectedPackage] of [
  ["H54GG6AYRHX263", 98304, "96Gb", "FBGA-556"],
  ["H54G66CYRHX258", 65536, "64Gb", "FBGA-556"],
  ["H54GE6AYRHX270", 49152, "48Gb", "FBGA-556"],
  ["H54G56BYYJX089", 32768, "32Gb", "FBGA-200"],
  ["H54G66AYZQX106", 65536, "64Gb", "FBGA-556"],
  ["H54G38AYRPX264", 8192, "8Gb", "FBGA-200"],
  ["H54G36AYRBX257", 8192, "8Gb", "FBGA-200"],
  ["H54G36AYRJX246", 8192, "8Gb", "FBGA-200"],
  ["H54G26AYRVX066", 4096, "4Gb", "FBGA-200"]
] as const) {
  const info = detect(partNumber);
  assert.equal(info.vendor, "skhynix", partNumber);
  assert.equal(info.type, "LPDDR4X", partNumber);
  assert.equal(info.densityMbit, densityMbit, partNumber);
  assert.equal(info.density, density, partNumber);
  assert.equal(info.voltage, "1.8V VDD1 / 1.1V VDD2 / 0.6V VDDQ", partNumber);
  assert.equal(info.package, expectedPackage, partNumber);
  assert.equal(info.detailFields["DRAM Speed"], "LPDDR4X-4266", partNumber);
}

// The public table assigns BYY:Q to different ball counts in different rows.
// Do not turn that conflicting local token into a package guess.
assert.equal(detect("H54G56BYYQX089").package, undefined);

for (const [partNumber, densityMbit, density] of [
  ["H9HKNNNFBMAVAR-NEH", 65536, "64Gb"],
  ["H9HKNNNEBMAVAR-NEH", 49152, "48Gb"],
  ["H9HKNNNCRMBVAR-NEH", 32768, "32Gb"]
] as const) {
  const info = detect(partNumber);
  assert.equal(info.vendor, "skhynix", partNumber);
  assert.equal(info.type, "LPDDR4X", partNumber);
  assert.equal(info.densityMbit, densityMbit, partNumber);
  assert.equal(info.density, density, partNumber);
  assert.equal(info.package, "FBGA-556", partNumber);
  assert.equal(info.detailFields["DRAM Speed"], "LPDDR4X-4266", partNumber);
}

// Serial is not a lookup key.
assert.equal(detect("H54GG6AYRHX999").densityMbit, 98304);
const unknownFeature = detect("H54G56ZZZAX999");
assert.equal(unknownFeature.type, "LPDDR4X");
assert.equal(unknownFeature.densityMbit, 32768);
assert.equal(unknownFeature.package, undefined);

for (const [partNumber, densityMbit, density] of [
  ["H9HCNNNFBMBLPR-NEE", 65536, "64Gb"],
  ["H9HCNNNFBMALPR-NEE", 65536, "64Gb"],
  ["H9HCNNNCRMBLPR-NEE", 32768, "32Gb"],
  ["H9HCNNNCRMALPR-NEE", 32768, "32Gb"]
] as const) {
  const info = detect(partNumber);
  assert.equal(info.type, "LPDDR4X", partNumber);
  assert.equal(info.densityMbit, densityMbit, partNumber);
  assert.equal(info.density, density, partNumber);
  assert.equal(info.package, "FBGA-432", partNumber);
  assert.equal(info.detailFields["DRAM Speed"], "LPDDR4X-4266", partNumber);
}

// An unknown package-position token preserves density/type/speed but does not
// inherit the package from a neighboring exact catalog row.
const unknownH9hcPackage = detect("H9HCNNNFBMZLZR-NEE");
assert.equal(unknownH9hcPackage.type, "LPDDR4X");
assert.equal(unknownH9hcPackage.package, undefined);
