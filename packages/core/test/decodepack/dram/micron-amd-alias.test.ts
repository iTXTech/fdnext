import assert from "node:assert/strict";
import {
  assertDecodedFieldAbsent,
  assertDram,
  assertSearchMarkingRelation,
  assertSearchPnIncludes,
  assertUnknown,
  detect,
  engine
} from "./_helpers";

const samples = [
  {
    pn: "AMD41J64M16JT-125G D:G",
    densityMbit: 1024,
    density: "1Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1600 CL11",
    revision: "Rev G"
  },
  {
    pn: "AMD41J64M16JT-107G D:G",
    densityMbit: 1024,
    density: "1Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev G"
  },
  {
    pn: "AMD41J128M16HA-125G D:D",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 9x14",
    speed: "DDR3-1600 CL11",
    revision: "Rev D"
  },
  {
    pn: "AMD41J128M16HA-107G D:D",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 9x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev D"
  },
  {
    pn: "AMDJ128M16JT-107G P:K",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev K"
  },
  {
    pn: "AMDJ128M16JT-107G C:K",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev K"
  },
  {
    pn: "AMD15V128X16JT-107G C:K",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev K"
  },
  {
    pn: "AMD15V128X16JT-107G P:K",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1866 CL13",
    revision: "Rev K"
  },
  {
    pn: "AMD15V128X16JT-125G C:K",
    densityMbit: 2048,
    density: "2Gb",
    package: "FBGA-96, 8x14",
    speed: "DDR3-1600 CL11",
    revision: "Rev K"
  }
] as const;

for (const sample of samples) {
  assertDram(sample.pn, {
    densityMbit: sample.densityMbit,
    density: sample.density,
    widthField: "x16",
    voltage: "1.5V VDD",
    package: sample.package,
    extra: {
      "DRAM Type": "DDR3",
      "DRAM Speed": sample.speed,
      "DRAM Die Count": 1,
      "CS Count": 1,
      "Die Revision": sample.revision
    },
    absentExtra: ["Speed Grade", "Operation Temperature", "Special Option"]
  });

  const result = engine.decodePart({ query: sample.pn, lang: "eng" });
  assert.equal(result.device?.partNumber?.startsWith("AMD"), true, `${sample.pn} should retain its AMD alias namespace`);
}

const unknownPackage = "AMD41J128M16ZZ-107G:K";
const partial = detect(unknownPackage);
assert.equal(partial.vendor, "micron", `${unknownPackage} should retain Micron identity`);
assert.equal(partial.type, "DDR3", `${unknownPackage} should retain the confirmed DRAM family`);
assert.equal(partial.densityMbit, 2048, `${unknownPackage} should retain token-derived density`);
assert.equal(partial.widthField, "x16", `${unknownPackage} should retain token-derived width`);
assertDecodedFieldAbsent(unknownPackage, "package");
assertDecodedFieldAbsent(unknownPackage, "dram_die_count");
assertDecodedFieldAbsent(unknownPackage, "cs_count");

const unknownSpeed = "AMD41J256M8JT-999Z:Q";
const degraded = detect(unknownSpeed);
assert.equal(degraded.vendor, "micron", `${unknownSpeed} should match the structured alias grammar`);
assert.equal(degraded.densityMbit, 2048, `${unknownSpeed} should derive density without a PN whitelist`);
assert.equal(degraded.widthField, "x8", `${unknownSpeed} should derive width without a PN whitelist`);
assertDecodedFieldAbsent(unknownSpeed, "dram_speed");
assertDecodedFieldAbsent(unknownSpeed, "die_revision");

assertUnknown("AMD29F040B-90PC");
assertUnknown("AMD41J128M16");

assertSearchPnIncludes("AMD41J64M16JT-125G D:G", "Micron AMD41J64M16JT-125GD:G");
assertSearchMarkingRelation("D9PLL", "AMD41J64M16JT-125GD:G");
