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

assertDram("MT40A1G8SA-075-E", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "DDR4-2666 CL19",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
});

assertDram("MT40A2G4TRF-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x4",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (9.5x11.5)",
  topology: { ce: 2, die: 2 },
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "TRF",
    "Config Code": "2G4",
    "DRAM Speed": "DDR4-2133 CL15",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT40A2G8NRE-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (8x12)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "NRE",
    "Config Code": "2G8",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A4G8NEA-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 2 CS",
    "Package Code": "NEA",
    "Config Code": "4G8",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

assertDram("MT40A1G16WBU-083E:B", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA (8x14)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "WBU",
    "Config Code": "1G16",
    "DRAM Speed": "DDR4-2400 CL16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT40A2G16TBB-062E:F", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "96-ball FBGA (7.5x13)",
  extra: {
    "DRAM Type": "DDR4",
    "DRAM Die Stack": "2 dies, 1 CS",
    "Package Code": "TBB",
    "Config Code": "2G16",
    "DRAM Speed": "DDR4-3200 CL22",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev F"
  }
});

const crucialDdr4Expected = {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x8",
  voltage: "1.2V VDD",
  package: "78-ball FBGA (7.5x11)",
  extra: {
    "DRAM Type": "DDR4",
    "Package Code": "SA",
    "Config Code": "1G8",
    "DRAM Speed": "Crucial DDR4-62M",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev E"
  }
};

assertDram("CT40A1G8SA-62M:E", crucialDdr4Expected);
assertDram("CT40A1G8SA-062M:E", crucialDdr4Expected);
assertDram("C9BJZ", {
  ...crucialDdr4Expected,
  extra: {
    ...crucialDdr4Expected.extra,
    "Marking Code": "C9BJZ"
  }
});
assert.deepEqual(searchFbgaParts("C9BJZ"), ["CT40A1G8SA-62M:E"]);
assert.deepEqual(searchFbgaParts("FX454"), []);
assertDram("EDB2432B4MA-1DAAT-F-D", {
  vendor: "elpida",
  densityMbit: 2048,
  density: "2Gb",
  widthField: "x32",
  voltage: "1.8V VDD1 / 1.2V VDD2/VDDQ",
  package: "Unknown",
  extra: {
    "DRAM Type": "LPDDR2",
    "DRAM Die Stack": "1 die, 1 CS",
    "Package Code": "B4MA",
    "Config Code": "2432",
    "DRAM Speed": "LPDDR2-1066"
  }
});
assertDram("EE40A512M16HA-093E:A", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x16",
  voltage: "1.2V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR4",
    "Config Code": "512M16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H"
  }
});
assertDram("EE51K256M32HF-60:B", {
  densityMbit: 8192,
  density: "8Gb",
  widthField: "x32",
  voltage: "1.35V VDD",
  package: "170-ball FBGA (12x14)",
  extra: {
    "DRAM Type": "GDDR5",
    "Package Code": "HF",
    "Config Code": "256M32",
    "Operation Temperature": "Commercial"
  }
});
assert.deepEqual(searchFbgaParts("B9DHG"), ["MT47H32M16BT-3E"]);
assertUnknown("AMD41J128M16HA-107G:D");
assertDram("79JMM", {
  densityMbit: 1024,
  density: "1Gb",
  widthField: "x16",
  voltage: "1.55V VDD",
  package: "Unknown",
  extra: {
    "DRAM Type": "DDR2",
    "Config Code": "64M16",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev H",
    "Marking Code": "79JMM"
  }
});

const ddr5Expected = {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4800B",
    "Operation Temperature": "Industrial (-40°C ~ 85°C)",
    "Die Revision": "Rev A"
  }
};

assertDram("MT60B2G8HB-48B-IT-A", ddr5Expected);
assertDram("MT60B2G8HB-48B IT:A", ddr5Expected);

assertDram("MT60B2G8HB-32B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-3200B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B2G8HB-44B:A", {
  densityMbit: 16384,
  density: "16Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "82-ball VFBGA (9x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "HB",
    "Config Code": "2G8",
    "DRAM Speed": "DDR5-4400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev A"
  }
});

assertDram("MT60B3G8RW-64B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78-ball VFBGA (8x11)",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RW",
    "Config Code": "3G8",
    "DRAM Speed": "DDR5-6400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B1536M16RV-56B:B", {
  densityMbit: 24576,
  density: "24Gb",
  widthField: "x16",
  voltage: "1.1V VDD",
  package: "102/153-ball VFBGA",
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "RV",
    "Config Code": "1536M16",
    "DRAM Speed": "DDR5-5600B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});

assertDram("MT60B4G8AT-64B:B", {
  densityMbit: 32768,
  density: "32Gb",
  widthField: "x8",
  voltage: "1.1V VDD",
  package: "78/117-ball VFBGA",
  topology: { ce: 1, die: 1 },
  extra: {
    "DRAM Type": "DDR5",
    "Package Code": "AT",
    "Config Code": "4G8",
    "DRAM Speed": "DDR5-6400B",
    "Operation Temperature": "Commercial",
    "Die Revision": "Rev B"
  }
});
